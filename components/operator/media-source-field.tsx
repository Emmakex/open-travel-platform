"use client";

import { useId, useRef, useState } from "react";
import styles from "@/app/operator/operator.module.css";
import type { TravelLocale } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

export type MediaSourceChoice = { id: string; url: string; label: string; alt?: string; credit?: string };
type UploadedMediaPayload = { item?: { id: string; url: string; originalName?: string; alt?: string; credit?: string }; error?: string };

export function MediaSourceField({ name, label, defaultValue = "", choices, uploadAlt = "", uploadCredit = "", locale, onMetadata }: {
  name: string;
  label: string;
  defaultValue?: string;
  choices: MediaSourceChoice[];
  uploadAlt?: string;
  uploadCredit?: string;
  locale: TravelLocale;
  onMetadata?: (metadata: { alt?: string; credit?: string }) => void;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [availableChoices, setAvailableChoices] = useState(choices);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  function selectChoice(url: string) {
    const choice = availableChoices.find((item) => item.url === url);
    setValue(url);
    if (choice) onMetadata?.({ alt: choice.alt, credit: choice.credit });
    setMessage(tr(locale, "Image selected. Save the record to apply it.", "Imagen seleccionada. Guarda el registro para aplicarla."));
  }

  async function uploadSelectedFile(file: File) {
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (uploadAlt.trim()) formData.append("alt", uploadAlt.trim());
      if (uploadCredit.trim()) formData.append("credit", uploadCredit.trim());
      const response = await fetch("/api/operator/media", { method: "POST", body: formData });
      const payload = (await response.json()) as UploadedMediaPayload;
      if (!response.ok || !payload.item) {
        setMessage(`${tr(locale, "Upload failed", "La subida ha fallado")}: ${payload.error ?? response.status}`);
        return;
      }
      const newChoice: MediaSourceChoice = {
        id: payload.item.id,
        url: payload.item.url,
        label: payload.item.alt || payload.item.originalName || file.name,
        alt: payload.item.alt,
        credit: payload.item.credit
      };
      setAvailableChoices((current) => [newChoice, ...current.filter((choice) => choice.id !== newChoice.id)]);
      setValue(newChoice.url);
      onMetadata?.({ alt: newChoice.alt, credit: newChoice.credit });
      setMessage(tr(locale, "Uploaded and selected. Save the record to apply it.", "Imagen subida y seleccionada. Guarda el registro para aplicarla."));
    } catch {
      setMessage(tr(locale, "Upload failed. Check the connection and runtime logs.", "La subida ha fallado. Revisa la conexión y los logs de ejecución."));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className={styles.mediaSourceField}>
      <input type="hidden" name={name} value={value} />
      <div className={styles.mediaSourceLabel}>{label}</div>
      <div className={styles.mediaSourceExperience}>
        <div className={styles.mediaSourcePreview}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={tr(locale, "Selected media preview", "Vista previa de la imagen seleccionada")} />
          ) : (
            <div className={styles.mediaPlaceholder}>
              <span>{tr(locale, "No image selected", "No hay imagen seleccionada")}</span>
              <small>{tr(locale, "Upload a new image or reuse one from the library.", "Sube una imagen nueva o reutiliza una de la biblioteca.")}</small>
            </div>
          )}
        </div>
        <div className={styles.mediaSourceControls}>
          <input ref={fileInputRef} className={styles.hiddenFileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadSelectedFile(file); }} />
          <div className={styles.inlineMediaActions}>
            <button className="button button-primary" type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? tr(locale, "Uploading…", "Subiendo…") : value ? tr(locale, "Replace image", "Reemplazar imagen") : tr(locale, "Upload image", "Subir imagen")}
            </button>
            {value ? (
              <button className="button button-secondary" type="button" disabled={uploading} onClick={() => { setValue(""); setMessage(tr(locale, "Image assignment cleared. Save the record to apply it.", "Asignación de imagen eliminada. Guarda el registro para aplicar el cambio.")); }}>
                {tr(locale, "Remove image", "Quitar imagen")}
              </button>
            ) : null}
          </div>
          {availableChoices.length ? (
            <label className={styles.compactField}>
              <span>{tr(locale, "Reuse from library", "Reutilizar desde la biblioteca")}</span>
              <select value="" onChange={(event) => { if (event.target.value) selectChoice(event.target.value); }} aria-label={tr(locale, `Choose ${label.toLowerCase()} from media library`, `Elegir ${label.toLowerCase()} desde la biblioteca`)}>
                <option value="">{tr(locale, "Choose an existing image…", "Elegir una imagen existente…")}</option>
                {availableChoices.map((choice) => <option value={choice.url} key={choice.id}>{choice.label}</option>)}
              </select>
            </label>
          ) : null}
          <details className={styles.advancedMediaSource}>
            <summary>{tr(locale, "Advanced · use image URL", "Avanzado · usar URL de imagen")}</summary>
            <label htmlFor={inputId} className={styles.compactField}>
              <span>{tr(locale, "Image URL", "URL de imagen")}</span>
              <input id={inputId} value={value} onChange={(event) => setValue(event.target.value)} placeholder="/media/... or https://..." />
            </label>
          </details>
          {message ? <small className={styles.inlineMediaStatus}>{message}</small> : null}
        </div>
      </div>
    </div>
  );
}
