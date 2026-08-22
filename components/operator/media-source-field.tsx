"use client";

import { useState } from "react";
import styles from "@/app/operator/operator.module.css";

export type MediaSourceChoice = {
  id: string;
  url: string;
  label: string;
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
  const [value, setValue] = useState(defaultValue);

  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div className={styles.mediaSourcePicker}>
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="/media/... or https://..."
        />
        {choices.length ? (
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) setValue(event.target.value);
            }}
            aria-label={`Choose ${label.toLowerCase()} from media library`}
          >
            <option value="">Choose from media library…</option>
            {choices.map((choice) => (
              <option value={choice.url} key={choice.id}>{choice.label}</option>
            ))}
          </select>
        ) : null}
      </div>
    </label>
  );
}
