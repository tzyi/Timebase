from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

BG = (59, 130, 246, 255)  # blue-500
FG = (255, 255, 255, 255)


def draw_mark(draw, size, padding_ratio=0.0):
    pad = int(size * padding_ratio)
    inner = size - pad * 2
    # Simple clock-ish mark: circle + hands, reflects "Timebase"
    draw.ellipse(
        [pad + inner * 0.12, pad + inner * 0.12, pad + inner * 0.88, pad + inner * 0.88],
        outline=FG,
        width=max(2, int(inner * 0.06)),
    )
    cx, cy = pad + inner / 2, pad + inner / 2
    draw.line([cx, cy, cx, cy - inner * 0.28], fill=FG, width=max(2, int(inner * 0.06)))
    draw.line([cx, cy, cx + inner * 0.2, cy], fill=FG, width=max(2, int(inner * 0.06)))


def make_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    padding_ratio = 0.18 if maskable else 0.08
    draw_mark(draw, size, padding_ratio)
    return img


sizes = [192, 512]
for s in sizes:
    make_icon(s).save(os.path.join(OUT_DIR, f"icon-{s}.png"))
    make_icon(s, maskable=True).save(os.path.join(OUT_DIR, f"icon-maskable-{s}.png"))

# favicon
make_icon(32).save(os.path.join(OUT_DIR, "icon-32.png"))

print("icons generated in", OUT_DIR)
