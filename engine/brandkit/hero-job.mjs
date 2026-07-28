import { EngineError } from "../core/errors.mjs";
import { dataKeys } from "./kit.mjs";

// Build a schema-valid content job for a NuLumin hero scene from the pack's prompt blocks, so the
// scene half of an ad goes through the same plan/preflight/manifest path as everything else.

const RATIO_SIZE = { "9:16": "2K", "4:5": "2K", "1:1": "2K" };

function fill(template, compound, catalog) {
  return template
    .replaceAll("{name}", compound.name)
    .replaceAll("{dose}", compound.dose)
    .replaceAll("{rules}", compound.labelRules)
    .replaceAll("{cap}", catalog.capColors[compound.cap])
    .replaceAll("{cake}", catalog.cakeColors[compound.cake]);
}

export function buildHeroJob(kit, {
  compound = "ghkcu",
  style = "cryo",
  ratio = "9:16",
  empty = false,
  candidates = 2,
  labelCrop = null,
} = {}) {
  const { catalog, heroPrompts, design } = kit;
  const entry = catalog.compounds[compound];
  if (!entry) throw new EngineError("UNKNOWN_COMPOUND", `No compound "${compound}".`, { available: dataKeys(catalog.compounds) });
  const styleEntry = heroPrompts.styles[style];
  if (!styleEntry) {
    const dropped = heroPrompts.dropped[style];
    throw new EngineError("UNKNOWN_STYLE", dropped
      ? `Style "${style}" was dropped: ${dropped}`
      : `No style "${style}".`, { available: dataKeys(heroPrompts.styles) });
  }
  const composition = heroPrompts.composition[ratio];
  if (!composition) throw new EngineError("UNKNOWN_RATIO", `hero-prompts.json has no composition block for ${ratio}.`, { available: dataKeys(heroPrompts.composition) });

  const assets = [];
  if (!empty) {
    if (!entry.vial) throw new EngineError("NO_PRODUCT_CANON", `No vial asset declared for "${compound}". Text-only prompting is not a fidelity strategy — add one to catalog.json first.`);
    assets.push({
      path: entry.vial,
      role: "product-canon",
      required: true,
      instructions: "Reference 1: the whole vial. Preserve label geometry, glass proportions, cap and crimp collar exactly.",
    });
    if (labelCrop) {
      assets.push({
        path: labelCrop,
        role: "reference-image",
        required: true,
        instructions: "Reference 2: a high-resolution crop of the label. This is the authority on the typography — copy it letterform for letterform.",
      });
    }
  }

  const id = `nulumin-hero-${compound}-${style}-${ratio.replace(":", "x")}`.toLowerCase();

  return {
    $schema: "../schemas/content-job.schema.json",
    version: 1,
    id,
    brand: "nulumin",
    mode: "product-image",
    objective: `Generate a ${style} hero scene for ${entry.name} ${entry.dose} with the upper half of the frame reserved for ad copy.`,
    deliverable: {
      aspectRatio: ratio,
      imageSize: RATIO_SIZE[ratio] || "2K",
      quality: "high",
      candidates,
    },
    provider: { id: heroPrompts.provider.id, model: heroPrompts.provider.model },
    assets,
    creative: {
      concept: styleEntry.why || `An ownable ${style} set built to carry NuLumin ad copy above the product.`,
      scene: styleEntry.prompt,
      action: composition,
      style: "Photoreal flagship product photography. Ultra-high-resolution. No added text, words, logos or watermarks anywhere.",
      contract: empty ? heroPrompts.blocks.empty : fill(heroPrompts.blocks.product, entry, catalog),
      mustInclude: empty
        ? ["a completely empty set with a clean pool of light where the product will be composited"]
        : [
          "the entire vial, cap to base, inside the frame and never cropped",
          "a lyophilized cake occupying only the bottom third of the vial",
          "the label pin-sharp, frontally lit, and unobstructed",
        ],
      mustAvoid: [
        ...design.prohibited,
        "loose or heaped powder in place of a solid lyophilized cake",
        "a bare silver cap",
        "any vapour, glow or element crossing the label",
        "re-lettered, re-typeset or invented label text",
      ],
    },
    compliance: {
      profile: "regulated-health-ruo",
      requiredDisclosures: [design.disclosures.ruo],
      humanReviewRequired: true,
      claimSourceIds: [],
      note: "The scene carries no copy. The RUO line is composited deterministically by the ad generator.",
    },
    execution: { approved: false },
    output: { directory: `generations/${id}`, basename: id },
  };
}
