"use client";

import { useEffect, useRef } from "react";

export function RedsysAutoSubmitForm({
  action,
  fields,
  label
}: {
  action: string;
  fields: Record<string, string>;
  label: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} method="POST" action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input type="hidden" name={name} value={value} key={name} />
      ))}
      <button className="button button-primary" type="submit">{label}</button>
    </form>
  );
}
