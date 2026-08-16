"""Generate Seloma production SVG marks. Run from this folder."""
from pathlib import Path

PURPLE = "#4C3A78"
BLUE = "#2F4A73"
TEAL = "#2A7A74"
INK = "#1A1625"
WHITE = "#FFFFFF"

# Geometric S: two circular bowls, open terminals, connection at right intersection.
S = "M 56.226 18.944 A 17.5 17.5 0 1 0 49.798 40.000 A 17.5 17.5 0 1 1 23.774 61.056"
TOP = "M 56.226 18.944 A 17.5 17.5 0 1 0 52.964 37.255"
BOT = "M 52.964 42.745 A 17.5 17.5 0 1 1 23.774 61.056"
# Tighter S for 16px favicon (less open, heavier stroke)
S_SMALL = "M 55.400 19.800 A 17.2 17.2 0 1 0 49.400 40.000 A 17.2 17.2 0 1 1 24.600 60.200"

STROKE = dict(
    fill="none",
    stroke_linecap="round",
    stroke_linejoin="round",
)


def attrs(**kwargs):
    parts = []
    for k, v in kwargs.items():
        k = k.replace("_", "-")
        parts.append(f'{k}="{v}"')
    return " ".join(parts)


def svg(body: str, vb="0 0 80 80", w=80, h=80) -> str:
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}" fill="none">\n'
        f"{body}"
        f"</svg>\n"
    )


def icon_bg(fill: str) -> str:
    return f'  <rect width="80" height="80" rx="18" fill="{fill}"/>\n'


def stroke_s(d: str, color: str, width: float, extra="") -> str:
    return f'  <path d="{d}" {attrs(fill="none", stroke=color, stroke_width=width, stroke_linecap="round", stroke_linejoin="round")}{extra}/>\n'


def flow_s_transparent(color: str, mask_id: str, w_outer=11.2, w_inner=4.4) -> str:
    """Double-stroke S with a true transparent channel (works on any background)."""
    return (
        f"  <defs>\n"
        f'    <mask id="{mask_id}">\n'
        f'      <rect width="80" height="80" fill="black"/>\n'
        f'      <path d="{S}" fill="none" stroke="white" stroke-width="{w_outer}" stroke-linecap="round" stroke-linejoin="round"/>\n'
        f'      <path d="{S}" fill="none" stroke="black" stroke-width="{w_inner}" stroke-linecap="round" stroke-linejoin="round"/>\n'
        f"    </mask>\n"
        f"  </defs>\n"
        f'  <rect width="80" height="80" fill="{color}" mask="url(#{mask_id})"/>\n'
    )


def flow_s_on_fill(s_color: str, cut_color: str, w_outer=11.2, w_inner=4.4) -> str:
    """Ribbon on a matching fill (app icon): inner stroke reveals the fill color."""
    return stroke_s(S, s_color, w_outer) + stroke_s(S, cut_color, w_inner)


files: dict[str, str] = {}

# --- Direction 1: Minimal geometric S ---
files["d1-symbol-color.svg"] = svg(
    stroke_s(S, PURPLE, 11)
)
files["d1-symbol-mono.svg"] = svg(
    stroke_s(S, INK, 11)
)
files["d1-icon-color.svg"] = svg(
    icon_bg(PURPLE) + stroke_s(S, WHITE, 11)
)
files["d1-icon-mono.svg"] = svg(
    icon_bg(INK) + stroke_s(S, WHITE, 11)
)

# --- Direction 2: Negative space / intelligent gap ---
d2 = stroke_s(TOP, PURPLE, 11) + stroke_s(BOT, PURPLE, 11)
d2_w = stroke_s(TOP, WHITE, 11) + stroke_s(BOT, WHITE, 11)
d2_k = stroke_s(TOP, INK, 11) + stroke_s(BOT, INK, 11)
files["d2-symbol-color.svg"] = svg(d2)
files["d2-symbol-mono.svg"] = svg(d2_k)
files["d2-icon-color.svg"] = svg(icon_bg(PURPLE) + d2_w)
files["d2-icon-mono.svg"] = svg(icon_bg(INK) + d2_w)

# --- Direction 3: Flow / transformation (RECOMMENDED) ---
files["d3-symbol-color.svg"] = svg(flow_s_transparent(PURPLE, "m"))
files["d3-symbol-mono.svg"] = svg(flow_s_transparent(INK, "m"))
files["d3-symbol-duotone.svg"] = svg(
    stroke_s(S, PURPLE, 11.2) + stroke_s(S, BLUE, 4.4)
)
def icon_flow(bg: str, mask_id="m") -> str:
    return (
        f"  <defs>\n"
        f'    <mask id="{mask_id}">\n'
        f'      <rect width="80" height="80" fill="black"/>\n'
        f'      <path d="{S}" fill="none" stroke="white" stroke-width="11.2" stroke-linecap="round" stroke-linejoin="round"/>\n'
        f'      <path d="{S}" fill="none" stroke="black" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>\n'
        f"    </mask>\n"
        f"  </defs>\n"
        f'  <rect width="80" height="80" rx="18" fill="{bg}"/>\n'
        f'  <rect width="80" height="80" fill="{WHITE}" mask="url(#{mask_id})"/>\n'
    )


files["d3-icon-color.svg"] = svg(icon_flow(PURPLE))
files["d3-icon-gradient.svg"] = svg(
    "  <defs>\n"
    '    <linearGradient id="g" x1="8" y1="4" x2="72" y2="76" gradientUnits="userSpaceOnUse">\n'
    f'      <stop stop-color="{PURPLE}"/>\n'
    f'      <stop offset="1" stop-color="{BLUE}"/>\n'
    "    </linearGradient>\n"
    '    <mask id="m">\n'
    '      <rect width="80" height="80" fill="black"/>\n'
    f'      <path d="{S}" fill="none" stroke="white" stroke-width="11.2" stroke-linecap="round" stroke-linejoin="round"/>\n'
    f'      <path d="{S}" fill="none" stroke="black" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>\n'
    "    </mask>\n"
    "  </defs>\n"
    '  <rect width="80" height="80" rx="18" fill="url(#g)"/>\n'
    f'  <rect width="80" height="80" fill="{WHITE}" mask="url(#m)"/>\n'
)
files["d3-icon-mono.svg"] = svg(icon_flow(INK))

# --- Direction 4: Connection / intelligence ---
pill = '  <rect x="46.4" y="37.15" width="13.2" height="5.7" rx="2.85" fill="{fill}"/>\n'
d4_color = (
    stroke_s(TOP, PURPLE, 11)
    + stroke_s(BOT, PURPLE, 11)
    + pill.format(fill=TEAL)
)
d4_mono = (
    stroke_s(TOP, INK, 11)
    + stroke_s(BOT, INK, 11)
    + pill.format(fill=INK)
)
d4_white = (
    stroke_s(TOP, WHITE, 11)
    + stroke_s(BOT, WHITE, 11)
    + '  <rect x="46.4" y="37.15" width="13.2" height="5.7" rx="2.85" fill="' + TEAL + '"/>\n'
)
d4_white_mono = (
    stroke_s(TOP, WHITE, 11)
    + stroke_s(BOT, WHITE, 11)
    + '  <rect x="46.4" y="37.15" width="13.2" height="5.7" rx="2.85" fill="' + WHITE + '"/>\n'
)
files["d4-symbol-color.svg"] = svg(d4_color)
files["d4-symbol-mono.svg"] = svg(d4_mono)
files["d4-icon-color.svg"] = svg(icon_bg(PURPLE) + d4_white)
files["d4-icon-mono.svg"] = svg(icon_bg(INK) + d4_white_mono)

# --- Production: recommended icon + favicon ---
files["icon.svg"] = files["d3-icon-color.svg"]
files["icon-mono.svg"] = files["d3-icon-mono.svg"]
files["favicon.svg"] = svg(
    icon_bg(PURPLE) + stroke_s(S_SMALL, WHITE, 12.5)
)

# Lockups (symbol + wordmark). Fonts load when the SVG is opened in a browser.
LOCKUP_EN = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 80" width="430" height="80" fill="none">
  <defs>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@500&amp;display=swap");
    </style>
  </defs>
  {icon}
  <text x="96" y="53.5" font-family="Outfit, 'Segoe UI', sans-serif" font-size="36" font-weight="500" letter-spacing="0.8" fill="{text}">Seloma</text>
</svg>
"""

LOCKUP_FA = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 80" width="390" height="80" fill="none">
  <defs>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500&amp;display=swap");
    </style>
  </defs>
  {icon}
  <text x="96" y="54" font-family="Vazirmatn, Tahoma, sans-serif" font-size="34" font-weight="500" fill="{text}" direction="rtl" unicode-bidi="plaintext">سِلوما</text>
</svg>
"""


def icon_group(bg: str, mask_id: str = "iconMask") -> str:
    return (
        f"  <defs>\n"
        f'    <mask id="{mask_id}">\n'
        f'      <rect width="80" height="80" fill="black"/>\n'
        f'      <path d="{S}" fill="none" stroke="white" stroke-width="11.2" stroke-linecap="round" stroke-linejoin="round"/>\n'
        f'      <path d="{S}" fill="none" stroke="black" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>\n'
        f"    </mask>\n"
        f"  </defs>\n"
        f'  <rect width="80" height="80" rx="18" fill="{bg}"/>\n'
        f'  <rect width="80" height="80" fill="{WHITE}" mask="url(#{mask_id})"/>\n'
    )


files["lockup-en-color.svg"] = LOCKUP_EN.format(
    icon=icon_group(PURPLE), text=INK
)
files["lockup-en-mono.svg"] = LOCKUP_EN.format(
    icon=icon_group(INK), text=INK
)
files["lockup-fa-color.svg"] = LOCKUP_FA.format(
    icon=icon_group(PURPLE), text=INK
)
files["lockup-fa-mono.svg"] = LOCKUP_FA.format(
    icon=icon_group(INK), text=INK
)

# Wordmark-beside-standalone-symbol (no container) — for headers on light UI
LOCKUP_EN_MARK = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80" width="400" height="80" fill="none">
  <defs>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@500&amp;display=swap");
    </style>
  </defs>
  <g transform="translate(0,0)">
    {mark}
  </g>
  <text x="88" y="53.5" font-family="Outfit, 'Segoe UI', sans-serif" font-size="36" font-weight="500" letter-spacing="0.8" fill="{text}">Seloma</text>
</svg>
"""
files["lockup-en-mark-color.svg"] = LOCKUP_EN_MARK.format(
    mark=flow_s_transparent(PURPLE, "m"), text=INK
)
files["lockup-en-mark-mono.svg"] = LOCKUP_EN_MARK.format(
    mark=flow_s_transparent(INK, "m"), text=INK
)

out = Path(__file__).parent
for name, content in files.items():
    (out / name).write_text(content, encoding="utf-8")
    print("wrote", name)
