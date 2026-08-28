from pathlib import Path

replacements = {
    "ROADMAP.md": (
        "That provider-dependent validation should be inserted as soon as credentials exist, It remains an explicit external-dependency release validation and does not reopen the completed Phase 9 engineering baseline.",
        "That provider-dependent validation should be inserted as soon as credentials exist. It remains an explicit external-dependency release validation and does not reopen the completed Phase 9 engineering baseline.",
    ),
    "ROADMAP.es.md": (
        "Debe incorporarse en cuanto existan credenciales, Permanece como validación de release dependiente de proveedores y no reabre el baseline de ingeniería completado de la Fase 9.",
        "Debe incorporarse en cuanto existan credenciales. Permanece como validación de release dependiente de proveedores y no reabre el baseline de ingeniería completado de la Fase 9.",
    ),
}

for path, (old, new) in replacements.items():
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one closeout wording match, found {count}.")
    file.write_text(text.replace(old, new))

print("Phase 9D-5 closeout wording polished.")
