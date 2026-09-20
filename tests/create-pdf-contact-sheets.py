from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
render_root = ROOT / "tmp" / "pdfs"

for folder in render_root.iterdir():
    if not folder.is_dir():
        continue
    pages = sorted(folder.glob("page-*.png"))
    if not pages:
        continue
    thumbs = []
    for path in pages:
        image = Image.open(path).convert("RGB")
        image.thumbnail((360, 510))
        thumbs.append((path.name, image.copy()))
    columns = min(4, len(thumbs))
    rows = (len(thumbs) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * 390, rows * 550), "#d9ddd8")
    draw = ImageDraw.Draw(sheet)
    for index, (name, image) in enumerate(thumbs):
        x = (index % columns) * 390 + 15
        y = (index // columns) * 550 + 28
        sheet.paste(image, (x, y))
        draw.text((x, 6 + (index // columns) * 550), name, fill="#183c36")
    sheet.save(render_root / f"contact-{folder.name}.jpg", quality=90)

preview_dir = ROOT / "product-output" / "RoomFeng-Moving-New-Home-OS-v1.0" / "07-Preview-Images"
previews = sorted(preview_dir.glob("*.png"))
if previews:
    sheet = Image.new("RGB", (1040, 5 * 350), "#d9ddd8")
    for index, path in enumerate(previews):
        image = Image.open(path).convert("RGB")
        image.thumbnail((500, 313))
        x = 15 + (index % 2) * 515
        y = 25 + (index // 2) * 350
        sheet.paste(image, (x, y))
    sheet.save(render_root / "contact-previews.jpg", quality=90)
