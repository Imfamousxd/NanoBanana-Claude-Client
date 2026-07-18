#!/usr/bin/env python3
"""5 compound variants of the tilted-sticker COA graphic (coa_bpc157_hires.svg),
rendered like the original: 6x scale -> 8334x8742 PNG, transparent background.
Only the certificate data changes; design untouched."""
import pathlib, subprocess

L = pathlib.Path("/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/Noble Harbor Wholesale")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SVG = (L / "coa_bpc157_hires.svg").read_text()

MZ_TSPAN = '1419.5 [M+H]<tspan baseline-shift="super" font-size="20">+</tspan>'

COAS = [
    {"slug": "cjc1295", "name": "CJC-1295 (No-DAC)", "name_size": "56",
     "casmw": "CAS &#183; 863288-34-0&#160;&#160;&#160;&#160;MW &#183; 3367.97",
     "lot": "NH-2605-B-031", "date": "2026-05-14", "purity": "99.4%",
     "mz": '3368.9 [M+H]<tspan baseline-shift="super" font-size="20">+</tspan>', "badge": "031"},
    {"slug": "nadplus", "name": "NAD+", "name_size": "64",
     "casmw": "CAS &#183; 53-84-9&#160;&#160;&#160;&#160;MW &#183; 663.43",
     "lot": "NH-2605-C-044", "date": "2026-05-28", "purity": "99.5%",
     "mz": '664.4 [M+H]<tspan baseline-shift="super" font-size="20">+</tspan>', "badge": "044"},
    {"slug": "glow", "name": "Glow Blend", "name_size": "64", "casmw_size": "20",
     "casmw": "3-COMPONENT BLEND&#160;&#160;&#160;&#160;MW &#183; 401.9 / 1419.6 / 4963.5",
     "lot": "NH-2606-A-052", "date": "2026-06-09", "purity": "99.1% (avg)",
     "mz": "Conforms &#183; 3/3", "badge": "052"},
    {"slug": "pt141", "name": "PT-141", "name_size": "64",
     "casmw": "CAS &#183; 189691-06-3&#160;&#160;&#160;&#160;MW &#183; 1025.18",
     "lot": "NH-2606-B-057", "date": "2026-06-18", "purity": "99.3%",
     "mz": '1026.2 [M+H]<tspan baseline-shift="super" font-size="20">+</tspan>', "badge": "057"},
    {"slug": "glp3", "name": "GLP-3 (R)", "name_size": "64",
     "casmw": "CAS &#183; 2381089-83-2&#160;&#160;&#160;&#160;MW &#183; 4731.34",
     "lot": "NH-2606-C-063", "date": "2026-06-25", "purity": "99.2%",
     "mz": '4732.3 [M+H]<tspan baseline-shift="super" font-size="20">+</tspan>', "badge": "063"},
]

for c in COAS:
    s = SVG
    s = s.replace('font-size="64" font-weight="800" fill="#15151a" letter-spacing="1">BPC-157</text>',
                  f'font-size="{c["name_size"]}" font-weight="800" fill="#15151a" letter-spacing="1">{c["name"]}</text>')
    s = s.replace('y="624" font-size="26"', f'y="624" font-size="{c.get("casmw_size", "26")}"')
    s = s.replace("CAS &#183; 137525-51-0&#160;&#160;&#160;&#160;MW &#183; 1419.55", c["casmw"])
    s = s.replace("NH-2604-A-018", c["lot"])
    s = s.replace("2026-04-22", c["date"])                      # synth date + signature + green badge date
    s = s.replace('fill="#2f9e44">99.2%</text>', f'fill="#2f9e44">{c["purity"]}</text>')
    s = s.replace(MZ_TSPAN, c["mz"])
    s = s.replace("BATCH VERIFIED - LOT 018", f'BATCH VERIFIED - LOT {c["badge"]}')
    assert c["name"] in s and c["lot"] in s, c["slug"]

    svg_path = L / f'coa_{c["slug"]}_hires.svg'
    svg_path.write_text(s)
    html = L / f'_coa_{c["slug"]}_wrap.html'
    html.write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>*{{margin:0;padding:0}}</style></head>'
                    f'<body>{s}</body></html>')
    png = L / f'coa_{c["slug"]}_hires_6x.png'
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=6", "--window-size=1389,1457",
                    "--default-background-color=00000000", "--virtual-time-budget=45000",
                    f"--screenshot={png}", f"file://{html}"], check=True, capture_output=True)
    html.unlink()
    from PIL import Image
    print(f'{png.name}  {Image.open(png).size}  {c["name"]}')

print("done — 5 hires COAs")
