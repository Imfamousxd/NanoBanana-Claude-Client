// Style presets: the kinds of still content the team asks for, each with the routing, the size for the
// channel, the references it needs from the library, the prompt scaffold, and the three named variation
// hypotheses that make candidates experiments instead of re-rolls.
//
// The rules encoded here are the measured ones from the studio's image laws and this repo's own
// rejections: gpt-image-2 sets small type and renders a whole creative; Nano Banana holds a
// reference's likeness at hero scale but garbles small type; gpt-image-1 is the only transparent
// background; negatives summon (say what belongs on a surface, never "no logo"); a flyer is a phone
// snapshot, not an AI poster; grain is a post step; never hand-composite to fake fidelity.

export const CHANNELS = {
  "ig-feed":     { aspectRatio: "4:5",  imageSize: "2K", note: "Instagram / Facebook feed" },
  "ig-story":    { aspectRatio: "9:16", imageSize: "2K", note: "Instagram story / reel cover" },
  "tiktok":      { aspectRatio: "9:16", imageSize: "2K", note: "TikTok still / cover" },
  "square":      { aspectRatio: "1:1",  imageSize: "2K", note: "square post, profile grid, marketplace tile" },
  "web-hero":    { aspectRatio: "16:9", imageSize: "2K", note: "website hero / banner" },
  "web-banner":  { aspectRatio: "21:9", imageSize: "2K", note: "wide site banner" },
  "amazon":      { aspectRatio: "1:1",  imageSize: "2K", note: "marketplace main image: product on pure white" },
  "print":       { aspectRatio: "2:3",  imageSize: "4K", note: "poster / print collateral at full resolution" },
  "email":       { aspectRatio: "3:2",  imageSize: "2K", note: "email header" },
};

const GPT = { id: "openai-image", model: "gpt-image-2", quality: "medium" }; // quality:high dies at the ~60 s connection cap
const NANO = { id: "gemini-image", model: "gemini-3-pro-image" };
const GPT_TRANSPARENT = { id: "openai-image", model: "gpt-image-1", quality: "high", background: "transparent", outputFormat: "png" };

export const STYLE_PRESETS = {
  "product-hero": {
    title: "Product hero — the product large, on a considered surface, dramatic but true",
    mode: "product-image", provider: GPT, channel: "ig-feed", candidates: 3,
    refs: { wants: ["identity", "device", "angle:three-quarter", "angle:front"], intent: "product hero, the product as sold, large in frame" },
    scaffold: {
      scene: "A single product at hero scale on a real surface that suits the brand, filling most of the frame so every printed string on it is legible.",
      camera: "Straight-on to slight three-quarter, at product height, a modest telephoto look with shallow depth that keeps the whole product sharp.",
      lighting: "One key light with a soft, believable falloff and a controlled reflection on the product's surfaces; a quiet gradient ground, never a flat cutout.",
      style: "A photograph of the real object: exact label geometry, exact colours, exact proportions from the references; no invented marks, no added type.",
    },
    variations: ["key light from the left with a warm rim", "key light from above with a cool ground reflection", "tighter crop with the product turned a few degrees further"],
    mustInclude: ["The product exactly as in the references: same label, same colours, same proportions."],
  },
  "packshot-white": {
    title: "Packshot — the product clean on white, every string legible",
    mode: "product-image", provider: GPT, channel: "amazon", candidates: 3,
    refs: { wants: ["identity", "device", "angle:front", "label"], intent: "packshot, product alone on white, every string legible" },
    scaffold: {
      scene: "The product alone, centred on a seamless pure-white ground with a faint contact shadow; nothing else in frame.",
      camera: "Straight-on at product height, the product filling about 80 percent of the frame height.",
      lighting: "Even, soft, colour-neutral studio light from two sides with a soft top fill; whites stay white, blacks keep detail.",
      style: "Catalogue-accurate: every printed word on the product legible and spelled as on the references, true colours, true proportions.",
    },
    variations: ["straight-on front", "front turned 15 degrees to the left", "front turned 15 degrees to the right"],
    mustInclude: ["Every printed string on the product legible and exactly as printed on the references."],
  },
  "transparent-cutout": {
    title: "Transparent cutout — the product on a transparent background for web and compositing",
    mode: "product-image", provider: GPT_TRANSPARENT, channel: "square", candidates: 2,
    refs: { wants: ["cutout", "device", "identity"], intent: "transparent cutout of the product alone" },
    scaffold: {
      scene: "The product alone on a fully transparent background, nothing else in frame, no shadow, no ground.",
      camera: "Straight-on at product height, the product filling most of the frame with a small margin on every side.",
      lighting: "Even, soft, neutral light; no coloured spill on the edges.",
      style: "Photoreal, clean edges, exact label and colours from the references.",
    },
    variations: ["straight-on front", "front turned 20 degrees"],
    mustInclude: ["A fully transparent background."],
  },
  "lifestyle-in-hand": {
    title: "Lifestyle, in hand — a real person holding the product in a real place",
    mode: "product-image", provider: GPT, channel: "ig-feed", candidates: 3,
    refs: { wants: ["device", "identity"], intent: "product held in hand in a real setting, product large enough that its label reads" },
    scaffold: {
      scene: "An adult holding the product naturally in a real setting that suits the brand; the product is close to camera and large enough that its label reads, the hand and setting are secondary.",
      camera: "Phone-camera perspective at arm's length, slight downward angle, the product sharp and the background softly falling away.",
      lighting: "The setting's own light: window light or open shade, with natural exposure and a little highlight roll-off.",
      style: "A believable phone photograph: real skin, real fabric, ordinary background detail, no glow, no gradient, no presentation pose with open palms.",
    },
    variations: ["window light indoors, product held at chest height", "outdoors in open shade, product held toward the lens", "a kitchen or desk setting with the product set down and one hand resting on it"],
    mustInclude: ["The product large in frame with its label legible and exactly as in the references."],
    people: true,
  },
  "lifestyle-scene": {
    title: "Lifestyle scene — the product placed in a real environment, no people",
    mode: "product-image", provider: GPT, channel: "ig-feed", candidates: 3,
    refs: { wants: ["identity", "device"], intent: "product in a real environment without people" },
    scaffold: {
      scene: "The product placed in a real environment that suits how it is used, sharing the frame with ordinary objects that belong there.",
      camera: "Eye level or slightly above, a natural focal length, the product the clear subject in the near third of the frame.",
      lighting: "The environment's own light with believable direction and shadows.",
      style: "An editorial photograph of a real place: authentic materials, ordinary background entropy, exact product from the references.",
    },
    variations: ["morning window light", "late-afternoon warm light with long shadows", "overcast even light"],
    mustInclude: ["The product exactly as in the references, placed in the scene rather than floating."],
  },
  "ugc-still": {
    title: "UGC still — a creator's own phone photo with the product",
    mode: "ugc-image", provider: GPT, channel: "ig-story", candidates: 3,
    refs: { wants: ["device", "identity"], intent: "creator selfie or phone photo with the product, casual" },
    scaffold: {
      scene: "A creator's own photo in their real space, the product in hand or beside them, taken to show a friend rather than to advertise.",
      camera: "Handheld phone at arm's length or propped on a surface, slightly off-centre framing that reacts to the moment.",
      lighting: "Whatever the room gives: mixed light, a little auto-exposure recovery, natural shadows.",
      style: "Platform-native phone rendering with coherent imperfections: ordinary clutter, real fabric, no retouching, the product exactly as in the references.",
    },
    variations: ["bathroom-mirror-free bedroom selfie, product held up", "kitchen counter, product set down, hand in frame", "car interior, product held toward the lens"],
    mustInclude: ["The product legible and exactly as in the references."],
    people: true,
  },
  "flyer-snapshot": {
    title: "Flyer or in-hand creative — a photoreal phone snapshot with quiet type",
    mode: "campaign-image", provider: GPT, channel: "ig-story", candidates: 3,
    refs: { wants: ["identity", "device", "logo"], intent: "promotional flyer built on a real photo of the product" },
    scaffold: {
      scene: "A real photograph of the product in a real setting, with a small amount of exact copy set quietly in one clear area of the frame.",
      camera: "Phone-camera perspective, the product large and sharp, a clean area reserved for the copy.",
      lighting: "Natural light from the setting.",
      style: "A photo first and a flyer second: few words, a quiet typeface, real materials, no glow, no gradient washes, no script lettering.",
    },
    variations: ["copy at the top, product below", "copy at the bottom, product above", "copy in the left third, product on the right"],
    mustInclude: ["The exact copy supplied, spelled exactly, set in one clear area."],
  },
  "social-ad-copy": {
    title: "Static social ad — the whole creative with headline and copy rendered in one pass",
    mode: "campaign-image", provider: GPT, channel: "ig-feed", candidates: 3,
    refs: { wants: ["identity", "device", "logo"], intent: "static ad creative with headline, the product as hero" },
    scaffold: {
      scene: "A finished ad layout: the product as the hero, the headline set large and exactly as supplied, supporting copy small, the logo placed once where the brand puts it.",
      camera: "Product photographed straight-on or three-quarter at hero scale, the layout built around it.",
      lighting: "Clean directional light that flatters the product's materials.",
      style: "A designed ad with real typography: consistent type family, generous margins, one accent colour from the brand palette, the product exact to the references.",
    },
    variations: ["headline above the product on a solid brand-colour ground", "headline beside the product on a photographic ground", "headline overlapping the product's lower edge on a dark ground"],
    mustInclude: ["The headline and copy exactly as supplied, spelled exactly.", "The logo once, exactly as the reference."],
  },
  "web-hero": {
    title: "Website hero — product on one side, a clean area for copy on the other",
    mode: "campaign-image", provider: GPT, channel: "web-hero", candidates: 3,
    refs: { wants: ["identity", "device", "cutout"], intent: "website hero image with the product on one side and open space for copy" },
    scaffold: {
      scene: "The product in the right half of a wide frame on a brand-coloured or photographic ground; the left half is a calm, uncluttered area of the same ground where headline copy will sit.",
      camera: "Straight-on or slight three-quarter, the product large and sharp.",
      lighting: "Soft directional light with a gentle ground reflection.",
      style: "Premium and quiet: one ground colour, one product, true references, no added type.",
    },
    variations: ["product on the right, saturated brand-colour ground", "product on the right, soft photographic ground", "product on the left, copy area on the right"],
    mustInclude: ["A clean, uncluttered half of the frame for copy.", "The product exactly as in the references."],
  },
  "packaging-mockup": {
    title: "Packaging as the subject — the box, bag or jar rendered true to its dieline",
    mode: "product-image", provider: GPT, channel: "square", candidates: 3,
    refs: { wants: ["packaging", "label", "identity"], intent: "packaging hero, box or bag as the subject, printed artwork exact" },
    scaffold: {
      scene: "The packaging as the subject on a simple studio ground, printed artwork exact to the references, panels in correct proportion.",
      camera: "Three-quarter view showing the front and one side panel, at packaging height.",
      lighting: "Soft studio light with a slight gradient and a contact shadow.",
      style: "True to the print: exact colours, exact artwork placement, exact text, matte or gloss finish as the references show.",
    },
    variations: ["three-quarter from the left", "three-quarter from the right", "straight-on front with a slight downward angle"],
    mustInclude: ["The printed artwork exactly as on the references, including every string."],
  },
  "lineup-range": {
    title: "Range lineup — several flavours or SKUs standing together",
    mode: "product-image", provider: GPT, channel: "web-hero", candidates: 3,
    refs: { wants: ["lineup", "identity"], intent: "several flavours side by side, range shot" },
    scaffold: {
      scene: "The named products standing together in one row on a simple ground, each one distinct and fully visible, evenly spaced, nothing duplicated.",
      camera: "Straight-on at product height, the row filling the frame width.",
      lighting: "Even studio light across the whole row.",
      style: "Catalogue-accurate: each product exact to its reference, labels legible, consistent scale.",
    },
    variations: ["straight row on white", "gentle arc with the centre product nearest", "straight row on a dark ground"],
    mustInclude: ["Exactly the products named, each once, each exact to its reference."],
  },
  "character-scene": {
    title: "Brand character scene — a canonical character in a new situation (Nano Banana for likeness)",
    mode: "campaign-image", provider: NANO, channel: "ig-feed", candidates: 3,
    refs: { wants: ["identity", "device"], intent: "brand character with the product", characterCanon: true },
    scaffold: {
      scene: "The canonical character from the references in a new situation with the product, in the character's established rendering style.",
      camera: "Medium shot that keeps the character's face and the product both readable.",
      lighting: "Consistent with the character's established look.",
      style: "One unified rendering style across character, product and setting; the character's face, proportions and outfit exactly as the references.",
    },
    variations: ["character holding the product toward camera", "character beside the product on a surface", "character mid-action with the product in the scene"],
    mustInclude: ["The character exactly as the reference.", "The product exactly as the reference."],
  },
  "meme-card": {
    title: "Meme card — caption format, 4:5",
    mode: "campaign-image", provider: GPT, channel: "ig-feed", candidates: 3,
    refs: { wants: ["device", "identity"], intent: "meme with the product as the character" },
    scaffold: {
      scene: "A recognisable meme composition with the product playing the role a person or object usually plays; the caption set exactly as supplied in a clear band.",
      camera: "As the meme format dictates.",
      lighting: "As the meme format dictates.",
      style: "The meme's native look, not polished advertising; the product exact to the references; caption text exact.",
    },
    variations: ["caption band at the top", "caption band at the bottom", "two-panel format"],
    mustInclude: ["The caption exactly as supplied."],
  },
};

export const STYLE_IDS = Object.keys(STYLE_PRESETS);

export function getPreset(id) {
  return id ? STYLE_PRESETS[id] || null : null;
}

/** Fill a job's empty fields from its preset and channel. Explicit job values always win. */
export function applyPreset(job) {
  const preset = getPreset(job.creative?.style);
  if (!preset) return job;
  job.mode ||= preset.mode;
  const channel = CHANNELS[job.deliverable?.channel || preset.channel];
  job.deliverable ??= {};
  job.deliverable.channel ||= preset.channel;
  if (channel) {
    job.deliverable.aspectRatio ||= channel.aspectRatio;
    job.deliverable.imageSize ||= channel.imageSize;
  }
  job.deliverable.candidates ??= preset.candidates;
  job.provider ??= {};
  job.provider.id ||= preset.provider.id;
  job.provider.model ||= preset.provider.model;
  if (preset.provider.quality && !job.deliverable.quality) job.deliverable.quality = preset.provider.quality;
  if (preset.provider.background && !job.provider.background) job.provider.background = preset.provider.background;
  if (preset.provider.outputFormat && !job.provider.outputFormat) job.provider.outputFormat = preset.provider.outputFormat;
  job.creative ??= {};
  for (const key of ["scene", "camera", "lighting"]) job.creative[key] ||= preset.scaffold[key];
  job.creative.styleNotes ||= preset.scaffold.style;
  job.creative.action ||= job.creative.concept || preset.title;
  job.creative.mustInclude = [...new Set([...(job.creative.mustInclude || []), ...(preset.mustInclude || [])])];
  job.references ??= {};
  job.references.auto ??= true;
  job.references.intent ||= preset.refs.intent;
  return job;
}

/** The prompt block a preset contributes. Positive statements only: an unspecified surface gets filled. */
export function presetPromptBlock(preset) {
  if (!preset) return "";
  return ["STYLE", `${preset.title}.`, `Finish: ${preset.scaffold.style}`].join("\n");
}

/** One named hypothesis per candidate, so candidates are experiments rather than re-rolls. */
export function variationHypotheses(preset, count) {
  const pool = preset?.variations || [];
  return Array.from({ length: count }, (_, index) => pool[index % Math.max(pool.length, 1)] || null);
}
