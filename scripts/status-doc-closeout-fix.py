from pathlib import Path

path = Path("scripts/status-doc-closeout.py")
text = path.read_text()
old = "La prioridad es endurecer la superficie ya amplia del producto para operación productiva real."
new = "La prioridad es endurecer para producción la amplia superficie funcional ya construida."
count = text.count(old)
if count != 1:
    raise SystemExit(f"Expected exactly one Spanish Phase 9 phrase in updater, found {count}.")
path.write_text(text.replace(old, new))
print("Spanish Phase 9 closeout phrase patched for this run.")
