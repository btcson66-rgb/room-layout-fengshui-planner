"""Build the PRODUCT-002 commercial package from the approved layout registry.

The package is deliberately a document-and-reference kit. It contains no Astro
runtime or executable app; the paid interactive experience remains hosted by
the preview/entitled web routes.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "product-output"
PACKAGE = OUT / "RoomFeng-Small-Space-Layout-Vault-v1.0"
ZIP_PATH = OUT / "RoomFeng-Small-Space-Layout-Vault-v1.0.zip"
DATA = ROOT / "docs/product-002/review/approved-layouts.json"
RUNTIME_DATA = ROOT / "src/small-space/approved-layouts.ts"
SVG_DIR = ROOT / "docs/product-002/review/svg"
PUBLIC = ROOT / "public/downloads"
FONT_PATH = Path(r"C:\Windows\Fonts\NotoSansTC-VF.ttf")
FONT = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
if FONT_PATH.exists():
    try:
        pdfmetrics.registerFont(TTFont("RoomFengNoto", str(FONT_PATH)))
        FONT = FONT_BOLD = "RoomFengNoto"
    except Exception:
        pass

def load_layouts() -> list[dict]:
    """Load the approved registry without requiring private review artifacts.

    Local Phase 1 review exports are preferred when present. CI and production
    builds intentionally do not carry review screenshots or purchase-test
    records, so fall back to the canonical runtime registry instead.
    """
    if DATA.exists():
        return json.loads(DATA.read_text(encoding="utf-8"))
    source = RUNTIME_DATA.read_text(encoding="utf-8")
    start = source.index("export const approvedLayouts = [") + len("export const approvedLayouts = ")
    end = source.index("] as unknown as LayoutRecord[];", start) + 1
    return json.loads(source[start:end])

layouts = load_layouts()
by_id = {item["id"]: item for item in layouts}
SAMPLES = ["BR-SQ-001", "BR-1012-001", "BR-MN-001", "BR-N-001", "ST-MICRO-001", "ST-SMALL-001"]

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def clean() -> None:
    if PACKAGE.exists():
        shutil.rmtree(PACKAGE)
    PACKAGE.mkdir(parents=True)
    OUT.mkdir(parents=True, exist_ok=True)

def write_text(rel: str, text: str) -> Path:
    path = PACKAGE / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")
    return path

def wrap(c: canvas.Canvas, text: str, x: float, y: float, width: float, leading: float = 13, font: str = FONT, size: float = 9) -> float:
    c.setFont(font, size)
    words = text.split()
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if c.stringWidth(candidate, font, size) > width and line:
            c.drawString(x, y, line)
            y -= leading
            line = word
        else:
            line = candidate
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y

def draw_plan(c: canvas.Canvas, item: dict, x: float, y: float, width: float, height: float, label_size: float = 6) -> None:
    scale = min((width - 20) / item["roomWidthMm"], (height - 28) / item["roomLengthMm"])
    ox, oy = x + 10, y + 16
    rw, rh = item["roomWidthMm"] * scale, item["roomLengthMm"] * scale
    c.setStrokeColor(colors.HexColor("#26352f")); c.setLineWidth(1.2); c.rect(ox, oy, rw, rh, stroke=1, fill=0)
    c.setStrokeColor(colors.HexColor("#e6e2d8")); c.setDash(2, 2); c.line(ox, oy + rh / 2, ox + rw, oy + rh / 2); c.setDash()
    fills = {"bed": "#c9d9ce", "desk": "#ead3bd", "wardrobe": "#d9cfbb", "dresser": "#dfd0c4", "shelving": "#d8d2c0", "nightstand": "#d8d2c0", "sofa": "#cbdbe1", "loveseat": "#cbdbe1", "chair": "#ead9c7", "dining-table": "#e6d9ae"}
    labels = {"bed": "Bed", "desk": "Desk", "wardrobe": "Wardrobe", "dresser": "Dresser", "shelving": "Storage", "nightstand": "Nightstand", "sofa": "Sofa", "loveseat": "Loveseat", "chair": "Chair", "dining-table": "Dining"}
    for furniture in item.get("furniture", []):
        typ = furniture.get("type")
        if typ in ("door", "window"):
            c.setStrokeColor(colors.HexColor("#b86b3d" if typ == "door" else "#1d5168")); c.setLineWidth(2)
            fx, fy = ox + furniture["xMm"] * scale, oy + furniture["yMm"] * scale
            c.line(fx, fy, fx + furniture["widthMm"] * scale, fy)
            continue
        fx, fy = ox + furniture["xMm"] * scale, oy + furniture["yMm"] * scale
        fw, fh = furniture["widthMm"] * scale, furniture["depthMm"] * scale
        c.setFillColor(colors.HexColor(fills.get(typ, "#deddd7"))); c.setStrokeColor(colors.HexColor("#4a554c")); c.setLineWidth(.6)
        c.rect(fx, fy, fw, fh, fill=1, stroke=1)
        if fw > 27 and fh > 10:
            c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT, label_size)
            c.drawCentredString(fx + fw / 2, fy + fh / 2 - label_size / 3, labels.get(typ, typ.title()))
    c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT_BOLD, 7)
    c.drawCentredString(ox + rw / 2, oy - 8, f"{item['roomWidthMm']} × {item['roomLengthMm']} mm")

def pdf_cover(path: Path, title: str, subtitle: str, pagesize=A4) -> None:
    c = canvas.Canvas(str(path), pagesize=pagesize); w, h = pagesize
    c.setFillColor(colors.HexColor("#26352f")); c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#d9cfbb")); c.setFont(FONT_BOLD, 11); c.drawString(52, h - 76, "ROOMFENG / PRODUCT-002")
    c.setFillColor(colors.white); c.setFont(FONT_BOLD, 28); y = h - 170
    for line in title.split("\n"):
        c.drawString(52, y, line); y -= 36
    c.setFillColor(colors.HexColor("#ead3bd")); c.setFont(FONT, 13); c.drawString(52, y - 8, subtitle)
    c.setFillColor(colors.HexColor("#fbfaf6")); c.setFont(FONT, 9); c.drawString(52, 54, "Validated against the approved v1.0 layout registry · roomfeng.win")
    c.showPage(); c.save()

def catalog(path: Path, locale: str, pagesize=A4) -> None:
    c = canvas.Canvas(str(path), pagesize=pagesize); w, h = pagesize
    title = "Small Space Layout Vault" if locale == "en" else "小空間格局庫"
    subtitle = "30 validated bedroom and studio starting points" if locale == "en" else "30 個經過尺寸驗證的臥室與套房起點"
    c.setFillColor(colors.HexColor("#26352f")); c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(colors.white); c.setFont(FONT_BOLD, 26); c.drawString(42, h - 92, title)
    c.setFillColor(colors.HexColor("#ead3bd")); c.setFont(FONT, 12); c.drawString(42, h - 120, subtitle)
    y = h - 180; c.setFillColor(colors.white); c.setFont(FONT, 10)
    intro = ("Use the catalog after matching your room. Each page states the room envelope, furniture, strategy, clearances, trade-off and fixture assumptions. Verify outside furniture dimensions and real openings before moving or buying." if locale == "en" else "配對房間後再使用本型錄。每頁列出房間範圍、家具、策略、動線、取捨與門窗假設；搬動或購買前仍要核對家具最大外框與現場開口。")
    y = wrap(c, intro, 42, y, w - 84, 15, FONT, 10)
    c.setFont(FONT_BOLD, 12); c.drawString(42, y - 16, "Print note" if locale == "en" else "列印提示")
    y = wrap(c, "A4 and Letter editions are supplied. Print at 100% / actual size; do not fit to page when transferring dimensions." if locale == "en" else "提供 A4 與 Letter 版本。轉印尺寸時請以 100%／實際大小列印，不要選擇縮放至頁面。", 42, y - 38, w - 84, 15, FONT, 10)
    c.showPage()
    for idx, item in enumerate(layouts, 1):
        c.setFillColor(colors.HexColor("#fbfaf6")); c.rect(0, 0, w, h, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT_BOLD, 17); c.drawString(38, h - 46, f"{idx:02d}  {item.get('archetype', item['id'])}")
        c.setFillColor(colors.HexColor("#b86b3d")); c.setFont(FONT, 8); c.drawRightString(w - 38, h - 42, item["id"])
        draw_plan(c, item, 38, h - 360, w * .47, 270, 5.5)
        x = w * .54; y = h - 84; c.setFillColor(colors.HexColor("#26352f"))
        fields = [
            (("Room envelope" if locale == "en" else "房間尺寸"), f"{item['roomWidthMm']} × {item['roomLengthMm']} mm"),
            (("Strategy" if locale == "en" else "策略"), item.get("strategyKey", item.get("archetype", ""))),
            (("Best for" if locale == "en" else "適合"), item.get("bestFor", "")),
            (("Furniture" if locale == "en" else "家具"), ", ".join(f["type"] for f in item.get("furniture", []) if f["type"] not in ("door", "window"))),
            (("Clearance summary" if locale == "en" else "動線摘要"), "; ".join(f"{key}: {value} mm" for key, value in item.get("clearances", {}).items()) or ("Review required" if locale == "en" else "需要複核")),
        ]
        for label, value in fields:
            c.setFont(FONT_BOLD, 8); c.drawString(x, y, label.upper()); y -= 13
            y = wrap(c, str(value), x, y, w - x - 38, 12, FONT, 9); y -= 7
        c.setStrokeColor(colors.HexColor("#d8d4c8")); c.line(x, y, w - 38, y); y -= 18
        c.setFont(FONT_BOLD, 9); c.drawString(x, y, "Trade-off" if locale == "en" else "取捨"); y -= 13
        y = wrap(c, item.get("tradeOff", "Review the actual furniture and openings."), x, y, w - x - 38, 12, FONT, 9); y -= 8
        c.setFont(FONT_BOLD, 9); c.drawString(x, y, "Assumptions" if locale == "en" else "假設"); y -= 13
        assumption = f"{item.get('doorScenario', 'Door placement follows the template record')}; {item.get('windowScenario', 'window placement follows the template record')}."
        y = wrap(c, assumption, x, y, w - x - 38, 12, FONT, 8.5)
        c.setFillColor(colors.HexColor("#69736b")); c.setFont(FONT, 7); c.drawString(38, 26, "RoomFeng v1.0 · planning reference, not a building-code drawing")
        c.showPage()
    c.save()

def printable(path: Path, locale: str, imperial: bool, pagesize) -> None:
    c = canvas.Canvas(str(path), pagesize=pagesize); w, h = pagesize
    title = ("Printable Planning Kit · Imperial" if imperial else "Printable Planning Kit · Metric") if locale == "en" else (("可列印規劃工具包・英制" if imperial else "可列印規劃工具包・公制"))
    unit_note = "Scale note: 1/4 inch = 1 foot on the imperial grid." if imperial else "Scale note: 1:50 on the metric grid; verify print scaling at 100%."
    if locale == "zh": unit_note = "比例提示：英制格紙為 1/4 英吋＝1 英尺；公制格紙以 1:50 為規劃參考，請以 100% 列印。" if imperial else "比例提示：公制格紙以 1:50 為規劃參考，請以 100% 列印。"
    c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT_BOLD, 18); c.drawString(38, h - 48, title)
    c.setFillColor(colors.HexColor("#4e5a52")); c.setFont(FONT, 9); c.drawString(38, h - 68, unit_note)
    # Page 1 graph paper
    c.setStrokeColor(colors.HexColor("#ddd9cf")); c.setLineWidth(.3)
    grid = 9 if imperial else 10
    top, bottom = h - 100, 100
    for xx in range(38, int(w - 38), grid): c.line(xx, bottom, xx, top)
    for yy in range(int(bottom), int(top), grid): c.line(38, yy, w - 38, yy)
    c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT_BOLD, 10); c.drawString(38, 72, "Draw the clear wall-to-wall envelope first." if locale == "en" else "先畫出牆到牆的實際可用範圍。")
    c.showPage()
    # Page 2 worksheet
    c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT_BOLD, 18); c.drawString(38, h - 48, "Room & furniture worksheet" if locale == "en" else "房間與家具量測工作表")
    labels = (["Room width", "Room length", "Door wall / swing", "Window wall", "Fixed obstacles", "Bed outside size", "Desk outside size", "Wardrobe outside size", "Main route", "Decision / trade-off"] if locale == "en" else ["房間寬度", "房間長度", "門牆／開門方向", "窗牆", "固定障礙物", "床架最大外框", "書桌最大外框", "衣櫃最大外框", "主要動線", "最後決定／取捨"])
    y = h - 100
    for label in labels:
        c.setFont(FONT_BOLD, 9); c.drawString(42, y, label); c.setStrokeColor(colors.HexColor("#9d9b92")); c.line(190, y - 2, w - 42, y - 2); y -= 38
    c.showPage()
    # Page 3 furniture cutouts
    c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT_BOLD, 18); c.drawString(38, h - 48, "Furniture cutouts · label actual sizes" if locale == "en" else "家具剪裁卡・請標註實際尺寸")
    cards = [("BED / 床", 150, 75), ("DESK / 書桌", 120, 60), ("WARDROBE / 衣櫃", 100, 60), ("SOFA / 沙發", 180, 85), ("TABLE / 餐桌", 120, 80), ("CUSTOM / 自訂", 130, 70)]
    x, y = 44, h - 120
    for label, cw, ch in cards:
        if x + cw > w - 44: x, y = 44, y - 140
        c.setDash(3, 2); c.setStrokeColor(colors.HexColor("#4a554c")); c.rect(x, y - ch, cw, ch, fill=0, stroke=1); c.setDash(); c.setFont(FONT_BOLD, 8); c.drawCentredString(x + cw / 2, y - ch / 2, label); c.setFont(FONT, 7); c.drawCentredString(x + cw / 2, y - ch - 12, "write W × D / 寫寬 × 深")
        x += cw + 16
    c.save()

def furniture_reference(path: Path, locale: str) -> None:
    c = canvas.Canvas(str(path), pagesize=A4); w, h = A4
    c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT_BOLD, 20); c.drawString(42, h - 54, "Furniture Reference" if locale == "en" else "家具尺寸參考")
    c.setFillColor(colors.HexColor("#4e5a52")); c.setFont(FONT, 9); c.drawString(42, h - 74, "Planning anchors only · replace with actual outside dimensions" if locale == "en" else "僅供規劃錨點・請以實際最大外框取代")
    y = h - 112; rows = [("Twin / 單人床", "990 × 1905 mm"), ("Queen / 雙人床", "1524 × 2032 mm"), ("Taiwan 5-ft / 台灣 5 尺", "1520 × 1880 mm"), ("Compact desk / 標準書桌", "1200 × 600 mm"), ("Wardrobe / 衣櫃", "1000 × 600 mm"), ("Chair operating zone / 椅子活動區", "600 mm planning clearance")]
    for name, size in rows:
        c.setFillColor(colors.HexColor("#fbfaf6")); c.setStrokeColor(colors.HexColor("#d8d4c8")); c.rect(42, y - 30, w - 84, 30, fill=1, stroke=1); c.setFillColor(colors.HexColor("#26352f")); c.setFont(FONT_BOLD, 9); c.drawString(54, y - 19, name); c.setFont(FONT, 9); c.drawRightString(w - 54, y - 19, size); y -= 38
    c.setFont(FONT, 8); wrap(c, "Mattress dimensions are not bed-frame dimensions. Include frame allowance, doors, drawers, chair pull-out and the route into the room. Clearances are planning benchmarks, not universal code requirements." if locale == "en" else "床墊尺寸不等於床架外框。請加上床架外擴、門片、抽屜、椅子拉出與進房路徑；動線數值是規劃基準，不是所有地區通用的法規要求。", 42, y - 8, w - 84, 12, FONT, 8)
    c.save()

def build_listing_graphics() -> None:
    """Create restrained architecture-board graphics from real approved plans."""
    graphics = PACKAGE / "08-Listing-Graphics"
    graphics.mkdir(parents=True, exist_ok=True)
    try:
        font = ImageFont.truetype(str(FONT_PATH), 42) if FONT_PATH.exists() else ImageFont.load_default()
        small = ImageFont.truetype(str(FONT_PATH), 24) if FONT_PATH.exists() else ImageFont.load_default()
    except Exception:
        font = small = ImageFont.load_default()
    selected = ["BR-SQ-001", "BR-SQ-002", "BR-SQ-003", "BR-1012-001", "BR-1012-002", "BR-1012-003", "BR-N-001", "BR-N-002", "ST-MICRO-001", "ST-MICRO-002", "ST-MICRO-003", "ST-SMALL-001"]
    for index, layout_id in enumerate(selected, 1):
        item = by_id[layout_id]
        image = Image.new("RGB", (1000, 1500), "#f7f5f0")
        draw = ImageDraw.Draw(image)
        draw.rectangle((0, 0, 1000, 180), fill="#26352f")
        draw.text((60, 54), "ROOMFENG / LAYOUT VAULT", fill="#fbfaf6", font=small)
        draw.text((60, 230), item.get("archetype", layout_id), fill="#26352f", font=font)
        draw.text((60, 305), f"{item['roomWidthMm']} × {item['roomLengthMm']} mm  ·  {item.get('strategyKey', 'validated strategy')}", fill="#b86b3d", font=small)
        ox, oy, pw, ph = 120, 430, 760, 760
        scale = min((pw - 20) / item['roomWidthMm'], (ph - 20) / item['roomLengthMm'])
        rw, rh = item['roomWidthMm'] * scale, item['roomLengthMm'] * scale
        ox += (pw - rw) / 2; oy += (ph - rh) / 2
        draw.rectangle((ox, oy, ox + rw, oy + rh), outline="#26352f", width=8)
        fills = {"bed": "#c9d9ce", "desk": "#ead3bd", "wardrobe": "#d9cfbb", "dresser": "#dfd0c4", "shelving": "#d8d2c0", "nightstand": "#d8d2c0", "sofa": "#cbdbe1", "loveseat": "#cbdbe1", "chair": "#ead9c7", "dining-table": "#e6d9ae"}
        for furniture in item.get("furniture", []):
            if furniture["type"] in ("door", "window"): continue
            fx, fy = ox + furniture["xMm"] * scale, oy + furniture["yMm"] * scale
            fw, fh = furniture["widthMm"] * scale, furniture["depthMm"] * scale
            draw.rectangle((fx, fy, fx + fw, fy + fh), fill=fills.get(furniture["type"], "#deddd7"), outline="#4a554c", width=3)
        draw.text((60, 1260), "Dimension-validated starting point", fill="#26352f", font=small)
        draw.text((60, 1310), "Compare the trade-off · customize in Planner", fill="#69736b", font=small)
        image.save(graphics / f"listing-{index:02d}-{layout_id}.png", optimize=True)
    pin_types = [("exact-size", i) for i in range(1, 11)] + [("problem", i) for i in range(1, 9)] + [("strategy", i) for i in range(1, 7)] + [("studio", i) for i in range(1, 7)]
    pin_layouts = selected + selected + selected
    messages = {
        "exact-size": ["10×10 bedroom layout", "10×12 Queen + desk", "3×3 m bedroom plan", "3×3.6 m room layout", "2400×3600 mm narrow room", "Queen bed clearance plan", "3000 mm square bedroom", "Taiwan 5-ft bed layout", "5600×5000 mm studio", "6100 mm studio zoning"],
        "problem": ["Will the desk chair block the route?", "A sofa that fits can still fail the doorway", "Where should the wardrobe go?", "Small-room storage without losing the centre", "Stop guessing bed-frame clearance", "The narrow-room pinch point", "Three ways to protect bed access", "Plan before buying the furniture"],
        "strategy": ["Work-first layout", "Open-centre layout", "Storage-wall strategy", "Bed-access strategy", "Sleep-privacy zoning", "Hosting-friendly studio"],
        "studio": ["Micro studio open-space plan", "Studio work zone", "Studio sleep privacy", "Studio hosting layout", "Small studio storage", "Studio furniture zoning"],
    }
    pin_rows = []
    for kind, number in pin_types:
        layout_id = pin_layouts[(number - 1) % len(pin_layouts)]
        pin_rows.append({"id": f"p2-{kind}-{number:02d}", "type": kind, "layout_id": layout_id, "image": f"listing-{((number - 1) % 12) + 1:02d}-{pin_layouts[(number - 1) % 12]}.png", "message": messages[kind][number - 1], "destination": "/en/room-layout-matcher/" if kind != "strategy" else "/en/small-space-layout-vault/", "ratio": "2:3", "size": "1000x1500", "published": False})
    (graphics / "pinterest-pins.json").write_text(json.dumps({"count": 30, "published": False, "pins": pin_rows}, indent=2), encoding="utf-8")

def build_docs() -> None:
    dirs = ["01-Quick-Start", "02-Layout-Catalog", "03-Printable-Planning-Kit", "04-Furniture-Reference", "05-Free-Sample-Layouts", "06-Access-and-Backup", "08-Listing-Graphics"]
    for directory in dirs: (PACKAGE / directory).mkdir(parents=True, exist_ok=True)
    write_text("README.md", """# RoomFeng Small Space Layout Vault v1.0\n\nA curated, dimension-validated starting point for bedroom and studio planning. This ZIP is a document and reference kit; it does not contain the interactive RoomFeng app.\n\nStart with `01-Quick-Start/`, use the free six-layout sample pack, then open the entitled Layout Vault web experience for matching, comparison, and Planner handoff. Verify actual furniture outside dimensions, openings, fixed elements, delivery route, and local requirements.\n\nProduct: RoomFeng Small Space Layout Vault\nPrice: US$17.99 one-time purchase\nVersion: 1.0.0\n""")
    write_text("LICENSE", "RoomFeng Small Space Layout Vault v1.0\n\nCopyright (c) 2026 RoomFeng. Licensed to the purchaser for personal planning use. Do not redistribute, resell, publish, or use the catalog as a construction or building-code document.\n")
    write_text("06-Access-and-Backup/ACCESS-AND-BACKUP.md", """# Access and backup\n\n1. Open the RoomFeng Layout Vault URL supplied by the marketplace receipt.\n2. Verify the license with the provider shown on your receipt.\n3. Save favorites locally and export/backup only your own planning data.\n4. Use `Clear my layout data` when sharing a browser profile.\n\nRoomFeng does not place room dimensions, furniture, notes, or buyer email in analytics. A license revalidation needs an internet connection; the local planning project remains on your device.\n""")
    write_text("06-Access-and-Backup/RESTORE-CHECKLIST.txt", "RoomFeng backup checklist\n- Keep a copy of your own Planner export\n- Confirm room units before import\n- Recheck door, window, frame and delivery route\n- Never share a license key in screenshots or public posts")
    write_text("01-Quick-Start/QUICK-START-EN.txt", """ROOMFENG LAYOUT VAULT / QUICK START\n1. Enter clear room width and length.\n2. Choose your regional bed preset, then use actual bed-frame dimensions when known.\n3. Select only the furniture that must fit and choose two priorities.\n4. Review Top 3 strategies, why each fits, and the trade-off.\n5. Compare up to three, then hand one off to a new free Planner project.\nA preset is not a promise: verify openings, fixed elements, furniture outside dimensions and route into the room.\n""")
    write_text("01-Quick-Start/QUICK-START-ZH.txt", """ROOMFENG 小空間格局庫／快速開始\n1. 輸入牆到牆的可用寬度與長度。\n2. 選擇地區床型；知道實際床架尺寸時請改用最大外框。\n3. 只勾選一定要放下的家具，再選兩個最重要的優先順序。\n4. 閱讀 Top 3 策略、符合原因與取捨。\n5. 最多比較三個，再交接到新的免費 Planner 專案。\n範本不是保證；請再次核對門窗、固定物、家具外框與進房路徑。\n""")
    for locale, label in [("en", "EN"), ("zh", "ZH")]:
        for page, size, suffix in [(A4, "A4", "A4"), (LETTER, "Letter", "Letter")]:
            catalog(PACKAGE / f"02-Layout-Catalog/Layout-Catalog-{label}-{suffix}.pdf", locale, page)
        for imperial, suffix in [(False, "Metric-A4"), (True, "Imperial-Letter")]:
            printable(PACKAGE / f"03-Printable-Planning-Kit/Planning-Kit-{label}-{suffix}.pdf", locale, imperial, A4 if not imperial else LETTER)
        furniture_reference(PACKAGE / f"04-Furniture-Reference/Furniture-Reference-{label}.pdf", locale)
    build_listing_graphics()
    # Sample SVGs are the real approved SVG deliverables reviewed in Phase 1.
    sample_dir = PACKAGE / "05-Free-Sample-Layouts"
    for layout_id in SAMPLES:
        source = SVG_DIR / f"{layout_id}.svg"
        if source.exists():
            shutil.copy2(source, sample_dir / source.name)
        else:
            # Review SVGs stay out of the production repository. The runtime
            # renderer remains the source of truth for the hosted experience;
            # a README-only sample section is still valid for CI packaging.
            write_text(f"05-Free-Sample-Layouts/{layout_id}-README.txt", f"{layout_id} is available in the RoomFeng free Matcher preview.\n")
    write_text("05-Free-Sample-Layouts/README.md", "Six real approved layouts: 10×10 square bedroom, 10×12 bedroom, 3×3.6 m bedroom, narrow room, micro studio and small studio. Use the free RoomFeng Matcher Preview to enter your own conditions; no email gate.\n")
    sample_zip = OUT / "RoomFeng-Small-Space-Layout-Sample-Pack-v1.0.zip"
    if sample_zip.exists(): sample_zip.unlink()
    with zipfile.ZipFile(sample_zip, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(sample_dir.rglob("*")):
            if path.is_file(): archive.write(path, Path("RoomFeng-Small-Space-Layout-Sample-Pack-v1.0") / path.relative_to(sample_dir))
    PUBLIC.mkdir(parents=True, exist_ok=True)
    shutil.copy2(sample_zip, PUBLIC / sample_zip.name)
    write_text("PRODUCT-METADATA.json", json.dumps({"product_id": "roomfeng-layout-vault-v1", "name": "RoomFeng Small Space Layout Vault", "version": "1.0.0", "price": {"amount": 17.99, "currency": "USD"}, "approved_layout_count": len(layouts), "sample_layout_ids": SAMPLES, "interactive_app_included": False}, indent=2, ensure_ascii=False))

def build_zip() -> None:
    if ZIP_PATH.exists(): ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(PACKAGE.rglob("*")):
            if path.is_file(): archive.write(path, path.relative_to(PACKAGE.parent).as_posix())

def write_manifest() -> None:
    entries = []
    for path in sorted(PACKAGE.rglob("*")):
        if path.is_file() and path.name not in {"MANIFEST.json", "checksums.sha256"}:
            entries.append({"path": path.relative_to(PACKAGE).as_posix(), "size": path.stat().st_size, "sha256": sha256(path)})
    (PACKAGE / "MANIFEST.json").write_text(json.dumps({"version": "1.0.0", "files": entries}, indent=2), encoding="utf-8")
    checksum_lines = [f"{entry['sha256']}  {entry['path']}" for entry in entries]
    (PACKAGE / "checksums.sha256").write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")

def main() -> None:
    clean(); build_docs(); write_manifest(); build_zip();
    # Include final manifest/checksum in the archive as well.
    build_zip()
    print(json.dumps({"package": str(PACKAGE), "zip": str(ZIP_PATH), "zip_sha256": sha256(ZIP_PATH), "zip_size": ZIP_PATH.stat().st_size, "layout_count": len(layouts), "sample_count": len(SAMPLES)}, indent=2))

if __name__ == "__main__": main()
