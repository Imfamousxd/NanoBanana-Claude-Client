#!/bin/zsh
# Redo each color family's caps to match a chosen reference vial (CAP_REF), then de-shadow.
cd "/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client" || exit 1
export PATH="$HOME/Library/Python/3.9/bin:$PATH"

CLAUSE='TWO reference images are provided. The FIRST image is the product vial to reproduce — use it for the glass, the contents (keep the liquid clear and colorless as in the first image), the full label and ALL text (the product name, the dose, and the side text). The SECOND image is a CAP COLOR SAMPLE — make the cap color EXACTLY match the cap color in the SECOND image (the same hue, saturation, and lightness, a solid matte color). Render the cap in the standardized low matte flat-top shape described above, in that exact color.'
D="NuLumin Generated/White BG"

echo "=== YELLOW (ref GLP1_10mg) ==="
CAP_REF="$D/NuL_GLP1_10mg_white.png" ONLY="AOD_5mg,GLP1_20mg,GLP2_,GLP3_" EXTRA="$CLAUSE" node nulumin-white-bg-batch.mjs 2>&1 | grep -E '\[|Done'

echo "=== PINK (ref CFC_5mg) ==="
CAP_REF="$D/NuL_CFC_5mg_white.png" ONLY="CFC_10mg,Ipamorelin,KissPeptin,Melanotan,PT_5mg" EXTRA="$CLAUSE" node nulumin-white-bg-batch.mjs 2>&1 | grep -E '\[|Done'

echo "=== PURPLE (ref BPC_10mg) ==="
CAP_REF="$D/NuL_BPC_10mg_white.png" ONLY="BPC_20mg,BPCTB,GHK,KPV,TB_10mg" EXTRA="$CLAUSE" node nulumin-white-bg-batch.mjs 2>&1 | grep -E '\[|Done'

echo "=== GREEN (ref Semax_10mg) ==="
CAP_REF="$D/NuL_Semax_10mg_white.png" ONLY="DSIP,Selank" EXTRA="$CLAUSE" node nulumin-white-bg-batch.mjs 2>&1 | grep -E '\[|Done'

echo "=== DE-SHADOW the 22 redone vials ==="
REDONE=(AOD_5mg GLP1_20mg GLP2_10mg GLP2_20mg GLP3_12mg GLP3_6mg \
        CFC_10mg Ipamorelin_10mg Ipamorelin_5mg KissPeptin_10mg KissPeptin_5mg Melanotan_10mg Melanotan_3mg PT_5mg \
        BPC_20mg BPCTB_10mg GHK_50mg KPV_10mg KPV_5mg TB_10mg \
        DSIP_5mg Selank_5mg)
for n in $REDONE; do
  FIXED_BG="245,245,245" python3 nulumin-deshadow.py "$D/_raw/NuL_${n}.png" "$D/NuL_${n}_white.png" >/dev/null 2>&1 && echo "  deshadowed $n"
done
echo "ALL DONE"
