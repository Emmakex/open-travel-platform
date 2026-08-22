export function scopedFormField(prefix: string, ...parts: string[]) {
  return [prefix, ...parts].join("__");
}
