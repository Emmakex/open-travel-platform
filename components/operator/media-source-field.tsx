"use client";

import { useId, useRef, useState } from "react";
import styles from "@/app/operator/operator.module.css";

export type MediaSourceChoice = {
  id: string;
  url: string;
  label: string;
};

type UploadedMediaPayload = {
  item?: {
    id: string;
    url: string;
    originalName?: string;
  };
  error?: string;
};

export function MediaSourceField({
  name,
  label,
  defaultValue = "",
  choices
}: {
  name: string;
  label: string;
  defaultValue?: string;
  choices: MediaSourceChoice[];
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [availableChoices, setAvailableChoices] = useState(choices);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadSelectedFile(file: File) {
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/operator/media", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as UploadedMediaPayload;

      if (!response.ok || !payload.item) {
        setMessage(`Upload failed: ${payload.error ?? response.status}`);
        return;
      }

      const newChoice: MediaSourceChoice = {
        id: payload.item.id,
        url: payload.item.url,
        label: payload.item.originalName || file.name
      };

      setAvailableChoices((current) => [
        newChoice,
        ...current.filter((choice) => choice.id !== newChoice.id)
      ]);
      setValue(newChoice.url);
      setMessage("Uploaded and selected. Save the record to apply it.");
    } catch {
      setMessage("Upload failed. Check the connection and runtime logs.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <div className={styles.mediaSourcePicker}>
        <input
          id={inputId}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="/media/... or https://..."
        />

        <div className={styles.inlineMediaActions}>
          <input
            ref={fileInputRef}
            className={styles.hiddenFileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadSelectedFile(file);
            }}
          />
          <button
            className="button button-secondary"
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Upload image"}
          </button>
          {value ? (
            <button
              className="button button-secondary"
              type="button"
              disabled={uploading}
              onClick={() => {
                setValue("");
                setMessage("Image assignment cleared. Save the record to apply it.");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>

        {availableChoices.length ? (
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) {
                setValue(event.target.value);
                setMessage("Media-library image selected. Save the record to apply it.");
              }
            }}
            aria-label={`Choose ${label.toLowerCase()} from media library`}
          >
            <option value="">Choose from media library…</option>
            {availableChoices.map((choice) => (
              <option value={choice.url} key={choice.id}>{choice.label}</option>
            ))}
          </select>
        ) : null}

        {value ? (
          <div className={styles.inlineMediaPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Selected media preview" />
          </div>
        ) : null}

        {message ? <small className={styles.inlineMediaStatus}>{message}</small> : null}
      </div>
    </div>
  );
}
