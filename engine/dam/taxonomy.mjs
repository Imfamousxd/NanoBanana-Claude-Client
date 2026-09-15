// DAM taxonomy — the fixed vocabulary every asset is filed under. It is deliberately the vocabulary
// GENERATION needs, not a librarian's: every class answers "what can this file do for a brief?"
// (a canonical product truth, a style anchor, a real human UGC exemplar, a shipped ad to match…).
// Changing a class name is a schema change: bump ANALYSIS_SCHEMA_VERSION and re-analyze.

export const ANALYSIS_SCHEMA_VERSION = 1;

/** Top-level class. One per asset. */
export const CLASSES = {
  "product-ref": "A product, package, label or device shown as itself: packshot, render, cutout, label art, dieline, box. The kind of file a generation passes as a canonical reference.",
  "logo": "A brand mark, wordmark, lockup, seal or badge on its own (not a product with a logo on it).",
  "marketing-still": "A finished still creative: ad, social post, flyer, banner, poster, carousel slide, web hero, email graphic. Has layout and/or copy.",
  "marketing-video": "A finished edited promo video: montage, motion graphics, product clip, launch film, campaign piece, animated post.",
  "ugc-video": "Real human creator content: talking head, unboxing, testimonial, review, street interview, GRWM, day-in-the-life, vlog. Phone-captured or looks phone-captured. The category we learn UGC from.",
  "ugc-still": "A creator-style photo of a real person with the product: selfie, mirror shot, hand-held product, casual lifestyle.",
  "lifestyle-photo": "Photography of people or places where the product is present or implied but the frame is not an ad: events, gym, kitchen, outdoors, team.",
  "raw-footage": "Unedited or lightly edited footage: b-roll, screen recordings, event coverage, behind the scenes, drone, multiple takes.",
  "packaging-collateral": "Print and packaging production files: dielines, print-ready PDFs, labels with bleed, insert cards, mockups.",
  "document": "Text-first material: decks, one-pagers, spreadsheets, COAs, guidelines, scripts, briefs.",
  "screenshot": "A screen capture: app, website, chat, analytics, social post capture.",
  "meme": "Meme or joke format built on a template or recognizable image.",
  "other": "Does not fit above or unreadable.",
};

export const CLASS_IDS = Object.keys(CLASSES);

/** Second level, in the studio's own words. Each class lists the subclasses it allows. */
export const SUBCLASSES = {
  "product-ref": ["render-3d", "device-render", "packaging-render", "packshot-photo", "cutout-transparent", "label-art", "dieline", "product-mockup", "swatch-or-badge"],
  "logo": ["primary-logo", "wordmark", "lockup", "icon", "seal-or-badge", "co-brand-lockup"],
  "marketing-still": ["social-post", "story-or-reel-cover", "ad-static", "flyer-or-poster", "banner-or-web-hero", "email-graphic", "carousel-slide", "menu-or-price-sheet", "infographic", "presentation-slide", "signage-or-tradeshow"],
  "marketing-video": ["promo-edit", "product-clip", "montage", "motion-graphics", "launch-film", "ad-cut", "animated-post", "tutorial-or-explainer", "event-recap"],
  "ugc-video": ["talking-head", "unboxing", "testimonial", "review", "street-interview", "podcast-clip", "grwm-or-routine", "vlog", "challenge-or-trend", "reaction"],
  "ugc-still": ["selfie-with-product", "hand-held-product", "mirror-shot", "casual-lifestyle"],
  "lifestyle-photo": ["photoshoot-product", "photoshoot-model", "photoshoot-flat-lay", "lifestyle-scene", "event-photo", "team-or-bts", "location-or-venue"],
  "raw-footage": ["b-roll", "interview-raw", "event-raw", "drone", "screen-recording", "takes-or-outtakes"],
  "packaging-collateral": ["print-ready", "label-print", "insert-or-card", "box-art", "sticker-or-decal", "merch-art"],
  "document": ["deck", "one-pager", "spreadsheet", "coa-or-compliance", "guidelines", "script-or-brief", "contract-or-form"],
  "screenshot": ["app-or-web", "social-capture", "chat-or-email", "analytics"],
  "meme": ["meme"],
  "other": ["other"],
};
export const SUBCLASS_IDS = [...new Set(Object.values(SUBCLASSES).flat())];

/** What a file can do for a brief. Multiple per asset. */
export const REFERENCE_ROLES = {
  "canonical": "Product/label truth — pass whenever the product appears; drift against it is a rejection.",
  "shape": "Container/device geometry only; style comes from elsewhere.",
  "style": "An approved look, scene, lighting or grade to match.",
  "logo": "A brand mark to pass, never redraw.",
  "ugc-exemplar": "A real human piece whose capture behaviour, pacing and performance a generated UGC piece should imitate.",
  "layout-exemplar": "A shipped creative whose layout is reusable.",
  "approved-output": "A delivered piece of generated work.",
  "avoid": "Looks usable and is not: wrong product, outdated, watermarked, off-brand.",
};

export const ROLE_IDS = Object.keys(REFERENCE_ROLES);

/** Video sub-forms; mirrors the videogen MCP's form catalog so a DAM record routes to a form. */
export const VIDEO_FORMS = ["talking-head", "unboxing", "testimonial", "street-interview", "podcast-clip", "product-clip", "launch-film", "montage", "motion-graphics", "tutorial", "vlog", "event", "b-roll", "screen-recording", "meme", "other"];

export const ORIENTATIONS = ["9:16", "4:5", "1:1", "4:3", "3:4", "16:9", "other"];

/** JSON schema handed to the vision model for a STILL. Field order is the reading order of the prompt. */
export const IMAGE_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["class", "subclass", "class_confidence", "brand", "brand_confidence", "product", "product_confidence", "title", "summary", "scene", "subjects", "people", "on_image_text", "logos_present", "style", "colors", "reference_roles", "usability", "tags"],
  properties: {
    class: { type: "string", enum: CLASS_IDS },
    subclass: { type: "string", enum: SUBCLASS_IDS, description: "The second-level type; must belong to the chosen class." },
    class_confidence: { type: "number", minimum: 0, maximum: 1 },
    brand: { type: ["string", "null"], description: "Brand id from the supplied list, or null if none/unsure." },
    brand_confidence: { type: "number", minimum: 0, maximum: 1 },
    product: { type: ["string", "null"], description: "Product sku or name from the supplied list, or a free-text product description if not listed, or null." },
    product_confidence: { type: "number", minimum: 0, maximum: 1 },
    title: { type: "string", description: "6-12 word human title a colleague would recognise the file by." },
    summary: { type: "string", description: "2-4 sentences: what it is, what it shows, what it is for. Concrete nouns." },
    scene: { type: "string", description: "Setting, surface, background, lighting, time of day, camera angle and distance." },
    subjects: { type: "array", items: { type: "string" }, description: "Every distinct object/product/element visible, most prominent first." },
    people: { type: "object", additionalProperties: false, required: ["count", "framing", "visible_face", "apparent_role"], properties: {
      count: { type: "integer", minimum: 0 },
      framing: { type: ["string", "null"], description: "e.g. hands only, waist-up selfie, full body, crowd" },
      visible_face: { type: "boolean" },
      apparent_role: { type: ["string", "null"], description: "creator, model, customer, staff, athlete… never a real identity" },
    } },
    on_image_text: { type: "array", items: { type: "string" }, description: "Every piece of legible text, verbatim, largest first. Empty if none." },
    logos_present: { type: "array", items: { type: "string" } },
    style: { type: "object", additionalProperties: false, required: ["look", "finish", "is_generated", "is_photograph"], properties: {
      look: { type: "string", description: "e.g. clean white studio packshot; dark luxe; raw 35mm film; flat vector; glossy 3D render" },
      finish: { type: "string", description: "e.g. transparent PNG cutout; JPEG photo; layered mockup; low-res web crop" },
      is_generated: { type: "boolean", description: "Looks AI-generated or 3D-rendered rather than photographed." },
      is_photograph: { type: "boolean" },
    } },
    colors: { type: "array", items: { type: "string" }, description: "3-5 dominant colours as hex or plain names." },
    reference_roles: { type: "array", items: { type: "string", enum: ROLE_IDS } },
    usability: { type: "object", additionalProperties: false, required: ["quality", "watermarked", "low_resolution", "outdated_or_wrong", "notes"], properties: {
      quality: { type: "number", minimum: 0, maximum: 1, description: "Technical + craft quality; 1 = flawless deliverable." },
      watermarked: { type: "boolean" },
      low_resolution: { type: "boolean" },
      outdated_or_wrong: { type: "boolean", description: "Wrong product, old packaging, misspelling, obviously superseded." },
      notes: { type: "string" },
    } },
    tags: { type: "array", items: { type: "string" }, description: "8-20 lowercase search tags: objects, format, mood, use-case, platform." },
  },
};

/** JSON schema for the VLM read of a VIDEO (the measured part comes from ffmpeg, never the model). */
export const VIDEO_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["class", "class_confidence", "form", "brand", "brand_confidence", "product", "product_confidence", "title", "summary", "is_real_human_creator", "creator", "setting", "capture", "structure", "performance", "on_screen_text", "audio", "reference_roles", "usability", "tags"],
  properties: {
    class: { type: "string", enum: CLASS_IDS },
    class_confidence: { type: "number", minimum: 0, maximum: 1 },
    form: { type: "string", enum: VIDEO_FORMS },
    brand: { type: ["string", "null"] },
    brand_confidence: { type: "number", minimum: 0, maximum: 1 },
    product: { type: ["string", "null"] },
    product_confidence: { type: "number", minimum: 0, maximum: 1 },
    title: { type: "string" },
    summary: { type: "string", description: "3-5 sentences: what happens, in order, and what the piece is for." },
    is_real_human_creator: { type: "boolean", description: "A real person filmed (not an avatar, animation or product-only clip)." },
    creator: { type: "object", additionalProperties: false, required: ["count", "framing", "apparent_role", "energy", "wardrobe"], properties: {
      count: { type: "integer", minimum: 0 },
      framing: { type: ["string", "null"], description: "e.g. arm's-length selfie, waist-up on tripod, hands-only overhead" },
      apparent_role: { type: ["string", "null"] },
      energy: { type: ["string", "null"], description: "e.g. calm explainer, hyped, deadpan, conversational" },
      wardrobe: { type: ["string", "null"] },
    } },
    setting: { type: "string", description: "Location, surfaces, background entropy, light source and quality." },
    capture: { type: "object", additionalProperties: false, required: ["device_read", "camera_behavior", "reframing", "exposure", "imperfections"], properties: {
      device_read: { type: "string", description: "phone front camera / phone rear / mirrorless / webcam / screen…" },
      camera_behavior: { type: "string", description: "static, handheld drift, walking, whip pans, gimbal, zoom-ins…" },
      reframing: { type: "string", description: "how framing changes: none, slight late reframes, deliberate moves" },
      exposure: { type: "string", description: "auto-exposure recovery, blown windows, mixed colour temperature…" },
      imperfections: { type: "array", items: { type: "string" }, description: "the reality cues present: occlusion, motion blur, room tone, focus hunt, mess in background…" },
    } },
    structure: { type: "object", additionalProperties: false, required: ["hook", "hook_type", "beats", "cta", "product_reveal_s"], properties: {
      hook: { type: "string", description: "What the first 2 seconds do, verbatim words if spoken." },
      hook_type: { type: "string", description: "question / claim / visual reveal / problem / pattern interrupt / none" },
      beats: { type: "array", items: { type: "object", additionalProperties: false, required: ["t", "what"], properties: { t: { type: "string" }, what: { type: "string" } } }, description: "Timed beats as observed on the contact sheet, 3-8 entries." },
      cta: { type: ["string", "null"] },
      product_reveal_s: { type: ["number", "null"], description: "Seconds at which the product first appears, if it does." },
    } },
    performance: { type: "string", description: "How the person performs: pauses, gestures, eye line, pace, authenticity cues." },
    on_screen_text: { type: "array", items: { type: "object", additionalProperties: false, required: ["t", "text"], properties: { t: { type: "string" }, text: { type: "string" } } }, description: "Captions and overlays, verbatim, with approximate time." },
    audio: { type: "object", additionalProperties: false, required: ["speech", "music", "diegetic"], properties: {
      speech: { type: "string", description: "who speaks, tone; 'none' if silent" },
      music: { type: "string", description: "none / bed under speech / driving track / trending sound" },
      diegetic: { type: "array", items: { type: "string" } },
    } },
    reference_roles: { type: "array", items: { type: "string", enum: ROLE_IDS } },
    usability: { type: "object", additionalProperties: false, required: ["quality", "watermarked", "low_resolution", "outdated_or_wrong", "notes"], properties: {
      quality: { type: "number", minimum: 0, maximum: 1 },
      watermarked: { type: "boolean" },
      low_resolution: { type: "boolean" },
      outdated_or_wrong: { type: "boolean" },
      notes: { type: "string" },
    } },
    tags: { type: "array", items: { type: "string" } },
  },
};

const KIND_BY_EXTENSION = {
  png: "image", jpg: "image", jpeg: "image", webp: "image", gif: "image", tif: "image", tiff: "image", heic: "image", bmp: "image", avif: "image",
  mp4: "video", mov: "video", m4v: "video", webm: "video", mkv: "video", avi: "video",
  pdf: "document", ai: "document", psd: "document", indd: "document", key: "document", pptx: "document", docx: "document", xlsx: "document", csv: "document", txt: "document", md: "document", json: "document",
  mp3: "audio", wav: "audio", m4a: "audio", aac: "audio",
  svg: "vector", eps: "vector",
};

export function mediaKindForName(name) {
  const extension = String(name).toLowerCase().split(".").pop();
  return KIND_BY_EXTENSION[extension] || "other";
}

export function isAnalyzableKind(kind, extension = "") {
  return kind === "image" || kind === "video" || (kind === "document" && String(extension).toLowerCase() === "pdf");
}

/** Lightweight, deterministic hints from the path/filename. Hints only: the model decides. */
export function pathHints(relativePath) {
  const lower = String(relativePath).toLowerCase();
  const hints = new Set();
  const add = (pattern, hint) => { if (pattern.test(lower)) hints.add(hint); };
  add(/ugc|creator|influencer|testimonial|review|unbox|talking|selfie|tiktok|reels?\b/, "ugc");
  add(/packshot|product ?shot|render|cutout|transparent|dieline|label|mockup|3d/, "product-ref");
  add(/logo|wordmark|lockup|brandmark|seal|badge/, "logo");
  add(/ad\b|ads\b|banner|flyer|poster|creative|post|carousel|story|email|hero|web/, "marketing");
  add(/raw|b-?roll|broll|footage|takes?\b|dailies|screen ?rec/, "raw");
  add(/lifestyle|event|gym|kitchen|outdoor|team|bts|behind/, "lifestyle");
  add(/meme/, "meme");
  add(/print|cmyk|bleed|dieline|packaging|insert|box/, "packaging");
  add(/final|approved|master/, "final");
  add(/old|archive|deprecated|_v\d+|draft|wip|test/, "wip");
  return [...hints];
}

/** Validate a model record against the class/role vocabularies; returns a list of problems (empty = ok). */
export function validateAnalysis(record, { video = false } = {}) {
  const problems = [];
  if (!record || typeof record !== "object") return ["record is not an object"];
  if (!CLASS_IDS.includes(record.class)) problems.push(`class ${record.class} not in taxonomy`);
  if (video && !VIDEO_FORMS.includes(record.form)) problems.push(`form ${record.form} not in VIDEO_FORMS`);
  if (video) {
    // A video is never a still-image class. Snap to the video class the form implies.
    const stillToVideo = { "product-ref": "marketing-video", "logo": "marketing-video", "packaging-collateral": "marketing-video", "marketing-still": "marketing-video", "lifestyle-photo": "raw-footage", "ugc-still": "ugc-video", "document": "other", "screenshot": "raw-footage" };
    if (stillToVideo[record.class]) { record.class_original = record.class; record.class = stillToVideo[record.class]; }
  }
  if (!video) {
    const allowed = SUBCLASSES[record.class] || [];
    if (!record.subclass || !allowed.includes(record.subclass)) {
      // Do not fail the record for a mislabelled second level; snap it to the class's first subclass and note it.
      record.subclass_original = record.subclass || null;
      record.subclass = allowed[0] || "other";
    }
  }
  for (const role of record.reference_roles || []) if (!ROLE_IDS.includes(role)) problems.push(`reference role ${role} unknown`);
  // Roles are a contract for generation, so they are gated by class, not left to the model's generosity:
  // only a product/logo file can be canonical or shape; only creator content can be a UGC exemplar.
  if (Array.isArray(record.reference_roles)) {
    const cls = record.class;
    record.reference_roles = record.reference_roles.filter((role) => {
      if (role === "canonical" || role === "shape") return cls === "product-ref" || cls === "logo";
      if (role === "logo") return cls === "logo" || cls === "product-ref" || cls === "marketing-still";
      if (role === "ugc-exemplar") return cls === "ugc-video" || cls === "ugc-still";
      if (role === "layout-exemplar") return cls === "marketing-still" || cls === "marketing-video" || cls === "packaging-collateral";
      return true;
    });
  }
  if (typeof record.title !== "string" || !record.title.trim()) problems.push("title missing");
  if (typeof record.summary !== "string" || record.summary.length < 20) problems.push("summary too short");
  return problems;
}
