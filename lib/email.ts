import tls from "node:tls";
import { randomBytes } from "node:crypto";

function numberFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function cleanHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(cleanHeader(value), "utf8").toString("base64")}?=`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const emailConfig = {
  host: process.env.SMTP_HOST?.trim() ?? "",
  port: numberFromEnv(process.env.SMTP_PORT, 465),
  user: process.env.SMTP_USER?.trim() ?? "",
  password: process.env.SMTP_PASSWORD ?? "",
  fromEmail: process.env.SMTP_FROM_EMAIL?.trim() || process.env.SMTP_USER?.trim() || "",
  fromName: process.env.SMTP_FROM_NAME?.trim() || "Kairoseth Travel",
  publicUrl: (process.env.KTRAVEL_PUBLIC_URL?.trim() || "https://travel.kairoseth.com").replace(/\/$/, "")
};

export function isEmailDeliveryConfigured() {
  return Boolean(
    emailConfig.host &&
    emailConfig.port &&
    emailConfig.user &&
    emailConfig.password &&
    emailConfig.fromEmail
  );
}

type SmtpResponse = {
  code: number;
  text: string;
};

function readResponse(socket: tls.TLSSocket, timeoutMs = 15000): Promise<SmtpResponse> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP response timed out."));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    }

    function onError(error: Error) {
      cleanup();
      reject(error);
    }

    function onClose() {
      cleanup();
      reject(new Error("SMTP connection closed unexpectedly."));
    }

    function onData(chunk: Buffer) {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return;

      const first = /^(\d{3})([ -])/.exec(lines[0]);
      if (!first) return;
      const code = Number(first[1]);
      const complete = first[2] === " " || lines.some((line, index) => index > 0 && line.startsWith(`${code} `));
      if (!complete) return;

      cleanup();
      resolve({ code, text: lines.join("\n") });
    }

    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("close", onClose);
  });
}

async function command(socket: tls.TLSSocket, value: string, accepted: number[]) {
  socket.write(`${value}\r\n`);
  const response = await readResponse(socket);
  if (!accepted.includes(response.code)) {
    throw new Error(`SMTP command failed with status ${response.code}.`);
  }
  return response;
}

async function connectSmtp() {
  if (!isEmailDeliveryConfigured()) {
    throw new Error("SMTP email delivery is not configured.");
  }

  const socket = tls.connect({
    host: emailConfig.host,
    port: emailConfig.port,
    servername: emailConfig.host,
    rejectUnauthorized: true
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("SMTP connection timed out."));
    }, 15000);

    socket.once("secureConnect", () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

  const greeting = await readResponse(socket);
  if (greeting.code !== 220) {
    socket.destroy();
    throw new Error(`SMTP server returned status ${greeting.code}.`);
  }

  await command(socket, "EHLO travel.kairoseth.com", [250]);
  await command(socket, "AUTH LOGIN", [334]);
  await command(socket, Buffer.from(emailConfig.user, "utf8").toString("base64"), [334]);
  await command(socket, Buffer.from(emailConfig.password, "utf8").toString("base64"), [235]);

  return socket;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const to = cleanHeader(input.to);
  if (!to) throw new Error("Email recipient is required.");

  const socket = await connectSmtp();
  try {
    await command(socket, `MAIL FROM:<${emailConfig.fromEmail}>`, [250]);
    await command(socket, `RCPT TO:<${to}>`, [250, 251]);
    await command(socket, "DATA", [354]);

    const boundary = `ktravel-${randomBytes(12).toString("hex")}`;
    const fromName = encodeHeader(emailConfig.fromName);
    const subject = encodeHeader(input.subject);
    const body = [
      `From: ${fromName} <${emailConfig.fromEmail}>`,
      `To: <${to}>`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      input.text,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      input.html,
      "",
      `--${boundary}--`,
      ""
    ].join("\r\n").replace(/(^|\r\n)\./g, "$1..");

    socket.write(`${body}\r\n.\r\n`);
    const sent = await readResponse(socket);
    if (sent.code !== 250) {
      throw new Error(`SMTP message delivery failed with status ${sent.code}.`);
    }
    await command(socket, "QUIT", [221]).catch(() => undefined);
  } finally {
    socket.end();
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  displayName: string;
  resetUrl: string;
  scope: "customer" | "staff";
  locale?: "en" | "es";
}) {
  const isEs = input.locale === "es" && input.scope === "customer";
  const displayName = escapeHtml(input.displayName || (isEs ? "viajero" : "traveller"));
  const resetUrl = escapeHtml(input.resetUrl);
  const subject = isEs
    ? "Restablece tu contraseña de Kairoseth Travel"
    : input.scope === "staff"
      ? "Reset your Kairoseth Travel staff password"
      : "Reset your Kairoseth Travel password";

  const text = isEs
    ? `Hola ${input.displayName},\n\nHemos recibido una solicitud para restablecer tu contraseña de Kairoseth Travel.\n\nAbre este enlace durante los próximos 30 minutos:\n${input.resetUrl}\n\nSi no solicitaste este cambio, puedes ignorar este correo.`
    : `Hello ${input.displayName},\n\nWe received a request to reset your ${input.scope === "staff" ? "Kairoseth Travel staff " : "Kairoseth Travel "}password.\n\nOpen this link within the next 30 minutes:\n${input.resetUrl}\n\nIf you did not request this change, you can ignore this email.`;

  const html = isEs
    ? `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1728"><h2>Kairoseth Travel</h2><p>Hola ${displayName},</p><p>Hemos recibido una solicitud para restablecer tu contraseña.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#4fd1bd;color:#07111f;text-decoration:none;border-radius:8px;font-weight:700">Restablecer contraseña</a></p><p>El enlace caduca en 30 minutos y solo puede utilizarse una vez.</p><p>Si no solicitaste este cambio, puedes ignorar este correo.</p></div>`
    : `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1728"><h2>Kairoseth Travel</h2><p>Hello ${displayName},</p><p>We received a request to reset your ${input.scope === "staff" ? "staff " : ""}password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#4fd1bd;color:#07111f;text-decoration:none;border-radius:8px;font-weight:700">Reset password</a></p><p>The link expires in 30 minutes and can only be used once.</p><p>If you did not request this change, you can ignore this email.</p></div>`;

  await sendEmail({ to: input.to, subject, text, html });
}
