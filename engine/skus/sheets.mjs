// SKU sheet parser: the team's production spreadsheets (exported as CSV) → one normalised SKU registry.
//
// Two layouts exist and both are handled:
//   "book" sheets (Muha): several column BANDS side by side (Disposables | Concentrates | Pre Rolls | …),
//     each band a stack of blocks: [title row(s)] → header row ("Flavor Name:", "I/S/H", "SKU #", …) → items.
//   "list" sheets (Dialed): one column; a header row whose first cell is the line title and whose other
//     cells are the column names ("1 Kratom Energy Drink, Product Code, Product, Packaging, SKU BAR, …").
// Nothing here guesses product facts: every value comes from a cell, and the cell's header decides the field.

export function parseCsv(text) {
  const rows = []; let row = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i += 1; } else quoted = false; } else cell += c; continue; }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i += 1; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.map((r) => r.map((value) => String(value).trim()));
}

/** Header cell → canonical field. Order matters: first match wins. */
const FIELD_RULES = [
  ["flavor", /^(flavor|flavour|product) name/i],
  ["flavor", /^name:?$/i],
  ["strain", /^(i\/s\/h|strain type)/i],
  ["packSize", /^weight/i],
  ["skuBarcode", /^(can |stick pack |individual )?sku bar(code)?:?$/i],
  ["skuBarcode", /^100ct jar sku barcode/i],
  ["displayBarcode", /display (box )?sku bar/i],
  ["displayBarcode", /^\d+ pack barcode/i],
  ["displayCode", /^\d+ ?pack display product code/i],
  ["displayCode", /sample pack product code/i],
  ["masterCaseBarcode", /master case barcode/i],
  ["sku", /^(item sku #|sku ?#:?|sku:?|product code)$/i],
  ["skuBlockRef", /^sku #/i],
  ["hardwareCode", /^hardware( sku| #| mouthpiece #)?/i],
  ["mylarCode", /^mylar/i],
  ["packagingCode", /^packaging (sku|#)/i],
  ["displayBoxCode", /^display (box )?#|^display #/i],
  ["paperInsertCode", /paper insert/i],
  ["wholesaleCaseCode", /wholesale case/i],
  ["conesCode", /^cones/i],
  ["canLidCode", /^can\/lid/i],
  ["shrinkBandCode", /shrink band/i],
  ["blankJarCode", /blank jar/i],
  ["lidsCode", /^lids/i],
  ["quote", /^quote/i],
  ["packagingLink", /^(packaging|pkg) link/i],
  ["packagingLink", /^packaging$/i],
  ["rendersLink", /^renders? link/i],
  ["websiteLink", /website link/i],
  ["productFamily", /^product$/i],
  ["manufacturer", /manufact/i],
  ["orderQty", /order qty/i],
  ["price", /^price/i],
  ["notes", /^notes/i],
];

function fieldFor(header) {
  const h = String(header || "").trim().replace(/\s+/g, " ");
  if (!h) return null;
  for (const [field, re] of FIELD_RULES) if (re.test(h)) return field;
  return null;
}

const TITLE_WORDS = /\bline\b|\bjars?\b|\bcans?\b|dispo|disposable|gumm|\bcarts?\b|cartridge|pre[- ]?roll|flower|\bbags?\b|\bsku ?#|\bct\b|mates|\bgen\b|infused|edible|shots?|seltzer|elixir|packets?|stick|powder|pills|gummies|bottles|accessor|\d+\s?(g|mg|gram)/i;

function bandTitle(rows, headerRow, from, to, prevHeaderRow) {
  // Text in the band above this header, back to the previous header of the same band (at most 3 rows).
  const parts = [];
  for (let r = headerRow - 1; r >= Math.max(0, headerRow - 3, (prevHeaderRow ?? -1) + 1); r -= 1) {
    const cells = (rows[r] || []).slice(from, to);
    const text = cells.filter(Boolean).join(" ").trim();
    if (!text) continue;
    // An item row of the block above (strain in the second cell, barcodes, part codes) is not a title.
    const itemLike = /^(indica|sativa|hybrid|i|s|h)$/i.test(cells[1] || "") || cells.some((cell) => /^\d{9,}$/.test(cell) || /^[A-Z]{2}-\d/.test(cell) || /-(HW|PKG|DISP|MY|WC|CAN|CONE)-/.test(cell));
    if (itemLike) break;
    parts.unshift(text);
  }
  return parts.join(" · ");
}

function makeItem(headers, cells, offset) {
  const item = { extra: {} };
  headers.forEach((header, index) => {
    const value = cells[offset + index];
    if (!value) return;
    const field = fieldFor(header);
    if (!field) { if (header) item.extra[header] = value; return; }
    if (field === "displayBarcode" || field === "displayCode" || field === "masterCaseBarcode") {
      const size = (String(header).match(/(\d+) ?(?:pack|pck|ct)/i) || [])[1] || null;
      (item.packs ??= []).push({ size: size ? Number(size) : null, kind: field === "masterCaseBarcode" ? "master-case" : "display", [field === "displayCode" ? "code" : "barcode"]: value, header });
      return;
    }
    if (item[field] && item[field] !== value) { item.extra[header] = value; return; }
    item[field] = value;
  });
  return item;
}

/** Parse one sheet into blocks: { title, band, headers, items[] }. */
export function parseSheet(text) {
  const rows = parseCsv(text);
  const width = Math.max(0, ...rows.map((r) => r.length));
  const blocks = [];
  // 1. Column bands = distinct columns where a header cell ("Flavor Name") appears; list sheets have one band at 0.
  const headerCols = new Set();
  rows.forEach((r) => r.forEach((cell, c) => { if (/^(flavor|flavour|product) name|^name:?$/i.test(cell)) headerCols.add(c); }));
  const listStyle = headerCols.size === 0 || rows.some((r) => r[0] && /^(product code|sku barcode|sku bar)/i.test(r[1] || ""));
  if (listStyle) headerCols.add(0);
  const bands = [...headerCols].sort((a, b) => a - b).map((from, index, all) => ({ from, to: all[index + 1] ?? width }));

  for (const band of bands) {
    let prevHeaderRow = null;
    let current = null;
    let blankRun = 0;
    for (let r = 0; r < rows.length; r += 1) {
      const cells = rows[r].slice(band.from, band.to);
      const first = cells[0] || "";
      const isHeader = /^(flavor|flavour|product) name|^name:?$/i.test(first) || (listStyle && band.from === 0 && first && cells.slice(1).some((cell) => /product code|sku bar|barcode|^packaging$/i.test(cell)) && !/^DM-|^[A-Z]{2}\d{3}$/.test(cells[1] || ""));
      if (isHeader) {
        const headers = /^(flavor|flavour|product) name|^name:?$/i.test(first) ? cells.map((cell) => cell.replace(/:$/, "")) : ["Flavor Name", ...cells.slice(1).map((cell) => cell.replace(/:$/, ""))];
        const title = /^(flavor|flavour|product) name|^name:?$/i.test(first) ? bandTitle(rows, r, band.from, band.to, prevHeaderRow) : first;
        current = { title, band: band.from, row: r, headers, items: [] };
        blocks.push(current);
        prevHeaderRow = r;
        blankRun = 0;
        continue;
      }
      if (!current) continue;
      if (!cells.some(Boolean)) { blankRun += 1; if (blankRun >= 3) current = null; continue; }
      blankRun = 0;
      // A title-only row (no codes/barcodes, title-ish words) starts a new implicit block in list sheets.
      const looksTitle = first && !cells.slice(1).some(Boolean) && (TITLE_WORDS.test(first) || /^\(new\)/i.test(first)) && !/^[A-Z][a-z]+( [A-Z][a-z]+)*$/.test(first);
      const skuBlock = cells.find((cell) => /sku ?#\s*[A-Z]{2}\d{3}/i.test(cell));
      if (skuBlock && !first.match(/^[A-Z][a-z]/) ) { current = { title: cells.filter(Boolean).join(" · "), band: band.from, row: r, headers: current.headers, items: [] }; blocks.push(current); continue; }
      if (looksTitle && listStyle) { current = { title: first, band: band.from, row: r, headers: ["Flavor Name", "Product Code"], items: [] }; blocks.push(current); continue; }
      if (!first) continue;
      current.items.push({ row: r, ...makeItem(current.headers, cells, 0) });
    }
  }
  return blocks.filter((block) => block.items.length);
}

const CATEGORY_RULES = [
  ["disposables", /dispo|disposable|all[- ]in[- ]one|aio/i],
  ["pods", /\bpods?\b/i],
  ["cartridges", /\bcarts?\b|cartridge/i],
  ["edibles", /gumm|edible|chocolate/i],
  ["pre-rolls", /pre[- ]?roll|mates|dank darts|infused|cones|joint|donut|muharillo|blunt/i],
  ["flower", /flower/i],
  ["concentrates", /concentrate|rosin|badder|diamond|sift|live resin|jar line|jars|hash|caviar|temple ball|kief/i],
  ["beverages", /energy drink|elixir|seltzer|can\b|drink|rtd|water bottle/i],
  ["shots", /shots?/i],
  ["gummies", /gumm/i],
  ["powders", /packet|stick|powder|electrolyte|hydration|creatine \+|collagen/i],
  ["capsules", /pills|capsule/i],
  ["accessories", /accessor/i],
];

export function categoryOf(title, fallback = "other") {
  for (const [category, re] of CATEGORY_RULES) if (re.test(title)) return category;
  return fallback;
}

export function formatOf(title) {
  const m = String(title).match(/(\d+(?:\.\d+)?)\s?(g|gram|grams|mg|ct|oz|ml)\b/i);
  return m ? `${m[1]}${m[2].toLowerCase().replace(/grams?/, "g")}` : null;
}

/** Sheet blocks → registry lines with clean names. */
export function normaliseBlocks(blocks, { brand, market = null, source }) {
  return blocks.map((block) => {
    const rawTitle = block.title.replace(/\s+/g, " ").trim();
    const skuBlock = (rawTitle.match(/sku ?#\s*([A-Z]{2}\d{3})/i) || [])[1] || null;
    const cleanTitle = rawTitle.replace(/sku ?#\s*[A-Z]{2}\d{3}/i, "").replace(/\bDONE\b/g, "").replace(/Notes?:.*$|PHASE \d.*$|IN PROGRESS.*$|approved packaging.*$|\(?in development\)?.*$|SKU BAR.*$|Renders? Link.*$|Display Box.*$/i, "").replace(/^\d+\s+/, "").replace(/^\((new)\)\s*/i, "").replace(/^new\s+/i, "").replace(/\s*-\s*$/, "").replace(/[·\s]+$/g, "").replace(/\s*·\s*/g, " · ").trim();
    const parts = cleanTitle.split(" · ").map((part) => part.trim()).filter(Boolean);
    const rawLine = parts[parts.length - 1] || cleanTitle;
    const section = parts.length > 1 ? parts[0] : null;
    const generation = (rawLine.match(/gen\s?(\d)/i) || [])[1] ? `Gen ${(rawLine.match(/gen\s?(\d)/i) || [])[1]}` : null;
    const line = rawLine.replace(/^(CA|MI|MO|NJ|NM|NY|OH|AZ)\s+/i, "").replace(/^new\s+/i, "").replace(/\s*gen\s?\d\b/i, "").replace(/\s*\(tech design\)/i, "").replace(/\s{2,}/g, " ").trim();
    return {
      id: `${brand}:${market || "all"}:${(skuBlock || line).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      brand, market, source,
      section, line, generation, skuBlock,
      category: categoryOf(`${section || ""} ${line}`),
      format: formatOf(line) || formatOf(section || ""),
      items: block.items.filter((item) => item.flavor && !/^(flavor|product) name/i.test(item.flavor) && !/upcoming|new flavou?rs|\bbelow\b|^-+$|combination kits$/i.test(item.flavor) && !(TITLE_WORDS.test(item.flavor) && !item.strain && !item.sku && !item.skuBarcode && !/donut|muharillo/i.test(item.flavor))).map((item) => ({
        name: item.flavor.replace(/\s+/g, " ").trim(),
        skuBarcode: item.skuBarcode || (/^\d{9,}$/.test(item.sku || "") ? item.sku : null),
        strain: item.strain || null,
        sku: item.sku && !/^\(?discontinued/i.test(item.sku) && !/^\d{9,}$/.test(item.sku) ? item.sku : null,
        discontinued: /discontinued/i.test(`${item.sku || ""} ${item.flavor} ${JSON.stringify(item.extra)}`),
        inDevelopment: /in development/i.test(JSON.stringify(item)),
        packs: item.packs || [],
        productFamily: item.productFamily || null,
        packSize: item.packSize || null,
        codes: Object.fromEntries(["hardwareCode", "mylarCode", "packagingCode", "displayBoxCode", "paperInsertCode", "wholesaleCaseCode", "conesCode", "canLidCode", "shrinkBandCode", "blankJarCode", "lidsCode"].filter((key) => item[key]).map((key) => [key.replace(/Code$/, ""), item[key]])),
        links: Object.fromEntries(["packagingLink", "rendersLink", "websiteLink"].filter((key) => item[key]).map((key) => [key.replace(/Link$/, ""), item[key]])),
        quote: item.quote || null,
        notes: item.notes || null,
        extra: Object.keys(item.extra).length ? item.extra : undefined,
      })),
    };
  }).filter((line) => line.items.length);
}
