#!/usr/bin/env python3
import subprocess, os, pathlib

NAVY = "#11213d"; BLUE = "#4D6E9E"; SILVER = "#aab2c0"
OUT = "Aevum Plus/Logos"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
pathlib.Path(OUT).mkdir(parents=True, exist_ok=True)

# Each concept: an inner SVG drawn in a 600x600 viewBox.
def svg(inner):
    return f'<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'

concepts = {}

# 1 — Chevron A with a superscript "+" (the Aevum+ plus), clean and minimal
concepts["v2-1-superscript"] = svg(f'''
  <g fill="none" stroke="{NAVY}" stroke-width="42" stroke-linecap="round" stroke-linejoin="round">
    <path d="M180 452 L300 168 L420 452"/>
    <line x1="240" y1="320" x2="360" y2="320"/>
  </g>
  <g stroke="{BLUE}" stroke-width="22" stroke-linecap="round">
    <line x1="470" y1="150" x2="470" y2="210"/>
    <line x1="440" y1="180" x2="500" y2="180"/>
  </g>''')

# 2 — A whose crossbar IS a medical plus (blue +), navy legs
concepts["v2-2-plus-crossbar"] = svg(f'''
  <g fill="none" stroke="{NAVY}" stroke-width="42" stroke-linecap="round" stroke-linejoin="round">
    <path d="M175 452 L300 165 L425 452"/>
  </g>
  <g stroke="{BLUE}" stroke-width="34" stroke-linecap="round">
    <line x1="240" y1="332" x2="360" y2="332"/>
    <line x1="300" y1="290" x2="300" y2="374"/>
  </g>''')

# 3 — Plus crowns the apex; legs stop short, "+" bridges the top
concepts["v2-3-apex-plus"] = svg(f'''
  <g fill="none" stroke="{NAVY}" stroke-width="42" stroke-linecap="round" stroke-linejoin="round">
    <line x1="180" y1="452" x2="278" y2="232"/>
    <line x1="420" y1="452" x2="322" y2="232"/>
    <line x1="238" y1="372" x2="362" y2="372"/>
  </g>
  <g stroke="{BLUE}" stroke-width="32" stroke-linecap="round">
    <line x1="300" y1="150" x2="300" y2="226"/>
    <line x1="262" y1="188" x2="338" y2="188"/>
  </g>''')

# 4 — Negative-space "+" cut into a solid rounded-triangle A
concepts["v2-4-negative-plus"] = svg(f'''
  <defs>
    <mask id="m">
      <rect width="600" height="600" fill="white"/>
      <!-- A counter (triangular hole) -->
      <path d="M300 250 L362 392 L238 392 Z" fill="black"/>
      <!-- plus knockout, sitting above the counter -->
      <rect x="282" y="150" width="36" height="150" rx="8" fill="black"/>
      <rect x="245" y="207" width="110" height="36" rx="8" fill="black"/>
    </mask>
  </defs>
  <path d="M300 120 L470 470 Q478 488 458 488 L142 488 Q122 488 130 470 Z"
        fill="{BLUE}" mask="url(#m)"/>''')

def render(name, inner_svg, wordmark=False):
    html = f'''<!doctype html><html><head><meta charset="utf-8">
    <style>
      html,body{{margin:0;padding:0;background:#ffffff;}}
      .wrap{{width:800px;height:800px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:20px;}}
      .mark{{width:{"460" if wordmark else "560"}px;height:{"460" if wordmark else "560"}px;}}
      .wm{{font-family:"Helvetica Neue",Arial,sans-serif;font-weight:600;
        font-size:64px;letter-spacing:6px;color:{NAVY};}}
      .wm .p{{color:{BLUE};}}
    </style></head><body><div class="wrap">
      <div class="mark">{inner_svg}</div>
      {'<div class="wm">Aevum<span class="p">+</span></div>' if wordmark else ''}
    </div></body></html>'''
    hp = f"/tmp/aevum_{name}.html"; open(hp, "w").write(html)
    out = f"{OUT}/aevum-{name}.png"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    f"--screenshot={out}", "--window-size=800,800",
                    f"file://{hp}"], capture_output=True)
    print("rendered", out, "exists:", os.path.exists(out))
    return out

outs = []
for name, s in concepts.items():
    outs.append(render(name, s, wordmark=False))
# also a wordmark lockup of concept 2
outs.append(render("v2-2-lockup", concepts["v2-2-plus-crossbar"], wordmark=True))
print("\n".join(outs))
