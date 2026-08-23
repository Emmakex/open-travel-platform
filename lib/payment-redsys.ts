import { createCipheriv, createHmac, timingSafeEqual } from "node:crypto";
import type { CheckoutOrder } from "@/domain/payment/checkout-types";
import type { RedsysRuntimeCredentials } from "@/lib/payment-provider-config";
import { publicPaymentBaseUrl } from "@/lib/payment-checkout";
import { toMinorUnits } from "@/lib/payment-stripe";

export const REDSYS_SIGNATURE_VERSION = "HMAC_SHA512_V2";

const CURRENCY_NUMERIC: Record<string, string> = {
  EUR: "978",
  USD: "840",
  GBP: "826",
  CHF: "756",
  JPY: "392",
  PEN: "604"
};

function normalizeBase64Url(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function merchantKey(signingKey: string) {
  const key = Buffer.alloc(16, 0);
  Buffer.from(signingKey, "utf8").copy(key, 0, 0, 16);
  return key;
}

function deriveOperationKey(signingKey: string, orderNumber: string) {
  const cipher = createCipheriv("aes-128-cbc", merchantKey(signingKey), Buffer.alloc(16, 0));
  return Buffer.concat([cipher.update(orderNumber, "utf8"), cipher.final()]);
}

export function signRedsysMerchantParameters(
  merchantParameters: string,
  orderNumber: string,
  signingKey: string
) {
  const operationKey = deriveOperationKey(signingKey, orderNumber);
  return createHmac("sha512", operationKey)
    .update(merchantParameters, "utf8")
    .digest("base64url");
}

function signatureEqual(received: string, expected: string) {
  const left = Buffer.from(normalizeBase64Url(received), "utf8");
  const right = Buffer.from(normalizeBase64Url(expected), "utf8");
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

export function verifyRedsysSignature(input: {
  merchantParameters: string;
  signature: string;
  orderNumber: string;
  signingKey: string;
}) {
  return signatureEqual(
    input.signature,
    signRedsysMerchantParameters(input.merchantParameters, input.orderNumber, input.signingKey)
  );
}

export function redsysCurrencyCode(currency: string) {
  return CURRENCY_NUMERIC[currency.toUpperCase()] ?? null;
}

export function buildRedsysPaymentForm(order: CheckoutOrder, credentials: RedsysRuntimeCredentials) {
  if (!order.redsysOrder) throw new Error("Redsys checkout order number is missing.");
  const currency = redsysCurrencyCode(order.currency);
  if (!currency) throw new Error(`Redsys currency ${order.currency} is not supported by this integration.`);

  const base = publicPaymentBaseUrl();
  const parameters = {
    DS_MERCHANT_AMOUNT: String(toMinorUnits(order.amount, order.currency)),
    DS_MERCHANT_ORDER: order.redsysOrder,
    DS_MERCHANT_MERCHANTCODE: credentials.merchantCode,
    DS_MERCHANT_CURRENCY: currency,
    DS_MERCHANT_TRANSACTIONTYPE: "0",
    DS_MERCHANT_TERMINAL: credentials.terminal,
    DS_MERCHANT_MERCHANTURL: `${base}/api/payments/redsys/notify`,
    DS_MERCHANT_URLOK: `${base}/account/checkout/return?checkout=${encodeURIComponent(order.id)}&provider=redsys&result=ok`,
    DS_MERCHANT_URLKO: `${base}/account/checkout/return?checkout=${encodeURIComponent(order.id)}&provider=redsys&result=ko`,
    DS_MERCHANT_PRODUCTDESCRIPTION: order.targetLabel
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 .,_-]/g, "")
      .slice(0, 125)
  };
  const merchantParameters = Buffer.from(JSON.stringify(parameters), "utf8").toString("base64url");
  const signature = signRedsysMerchantParameters(
    merchantParameters,
    order.redsysOrder,
    credentials.signingKey
  );

  return {
    action: credentials.paymentUrl,
    fields: {
      Ds_SignatureVersion: REDSYS_SIGNATURE_VERSION,
      Ds_MerchantParameters: merchantParameters,
      Ds_Signature: signature
    }
  };
}

export type RedsysNotification = {
  order: string;
  response: string;
  amount: string;
  currency: string;
  authorizationCode?: string;
  raw: Record<string, unknown>;
};

function caseInsensitiveValue(source: Record<string, unknown>, key: string) {
  const match = Object.entries(source).find(([current]) => current.toLowerCase() === key.toLowerCase());
  return typeof match?.[1] === "string" || typeof match?.[1] === "number" ? String(match[1]) : "";
}

export function decodeRedsysNotification(merchantParameters: string): RedsysNotification | null {
  try {
    const raw = JSON.parse(Buffer.from(merchantParameters, "base64url").toString("utf8")) as Record<string, unknown>;
    const order = caseInsensitiveValue(raw, "Ds_Order");
    const response = caseInsensitiveValue(raw, "Ds_Response");
    const amount = caseInsensitiveValue(raw, "Ds_Amount");
    const currency = caseInsensitiveValue(raw, "Ds_Currency");
    if (!order || !response || !amount || !currency) return null;
    return {
      order,
      response,
      amount,
      currency,
      authorizationCode: caseInsensitiveValue(raw, "Ds_AuthorisationCode") || undefined,
      raw
    };
  } catch {
    return null;
  }
}

export function isSuccessfulRedsysResponse(response: string) {
  const code = Number(response);
  return Number.isInteger(code) && code >= 0 && code <= 99;
}
