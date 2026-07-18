#!/usr/bin/env node
// MUHA — EURO SUMMER GIVEAWAY hype clips. Seedance 2.0, 9:16, 1080p, audio.
// usage: node eurosummer-clips.mjs <slug|all> [slug...]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = "bytedance/seedance-2.0";
const REFS = "Muha Euro Summer/refs";
const OUT = "Muha Euro Summer/Clips";
fs.mkdirSync(OUT, { recursive: true });

const CLIPS = [
  {
    slug: "01_ticket",
    ref: "ticket.jpg",
    prompt: `Suspenseful cinematic macro product shot, shot on an ARRI Alexa with a 50mm macro lens, shallow depth of field, moody near-dark room, one warm shaft of light across a dark walnut table, fine dust motes drifting in the beam. A hand slowly slides a vintage travel raffle card out of the darkness into the light — the card is EXACTLY the referenced "$25,000 Europe Summer Trip" postcard with the antique Europe map, dashed flight routes between landmarks, and the black-and-gold encrypted QR ticket panel on the right. As it crosses into the beam the gold foil QR and gold lettering catch the light and glint. The camera slowly pushes in tighter on the card, ending framed on "$25,000 Europe Summer Trip" and the glinting gold panel. Keep every printed word on the card exactly as in the reference, sharp and legible; do not invent new text. Real-time pacing, subtle handheld micro-shake, gentle lens halation. Audio: a low tense cinematic bass drone building, one soft ticking pulse, the quiet slide of card stock on wood.`,
  },
  {
    slug: "02_monaco",
    ref: "monaco.jpg",
    prompt: `A painted vintage travel postcard comes to life, in the exact rich storybook-painting style of the reference image — Monaco: sun-drenched Riviera harbor packed with white yachts, cream belle-époque buildings and the casino climbing the green mountainside, palms and pink flowers in the foreground. The camera glides forward INTO the painting over the marina: water begins to sparkle and ripple, yachts sway and drift gently leaving small wakes, palm fronds move in the breeze, tiny cars roll along the corniche road, clouds crawl slowly, sun flares off the sea. Keep the exact painterly brushwork, colors and composition of the reference throughout — a living painting, not photorealism. Smooth confident real-time dolly-in, no text anywhere. Audio: uplifting Mediterranean summer house groove building with seagulls, marina water lapping and distant harbor ambience.`,
  },
  {
    slug: "03_ibiza",
    ref: "ibiza.jpg",
    prompt: `A painted vintage travel postcard comes to life, in the exact rich storybook-painting style of the reference image — Ibiza at golden hour: a blazing orange sun melting into the sea, whitewashed old town stacked on the hillside, boats scattered across glittering water, pink bougainvillea framing the foreground. The camera sweeps forward INTO the painting across the water toward the hill town as the scene animates: the sun dips lower and its reflection shimmers as a warm path on the waves, boats rock gently with lights flickering on one by one, birds cross the sky, bougainvillea sways. The whole scene pulses subtly with festival energy as dusk builds. Keep the exact painterly brushwork, colors and composition of the reference throughout — a living painting, not photorealism. Smooth real-time push-in, no text anywhere. Audio: a euphoric melodic house build with soft beach crowd energy in the distance, waves, the drop teasing as the sun touches the horizon.`,
  },
];

const DARK = `Suspenseful cinematic macro shot on an ARRI Alexa with a 50mm macro lens, shallow depth of field, moody near-dark room, one warm shaft of light across a dark walnut table, fine dust motes drifting in the beam, subtle handheld micro-shake, gentle lens halation, real-time pacing.`;

CLIPS.push(
  {
    slug: "04_fan",
    refs: ["front_monaco.jpg", "front_ibiza.jpg", "front_santorini.jpg"],
    prompt: `${DARK} A hand slowly fans out THREE wide LANDSCAPE-format collectible cards across the table into the shaft of light like a winning poker hand. The three cards are EXACTLY the three referenced cards, reproduced 1:1 — wide horizontal rounded-corner cards, each fully covered edge-to-edge by its painted city scene (Monaco harbor / Ibiza sunset / Santorini blue domes) with the big letters "EURO SUMMER" across the middle, the letters filled with tiny scenery. Do NOT redesign the cards: no white borders, no portrait/vertical cards, no re-arranged layouts — each card looks identical to its reference image, just printed on card stock. As each card slides into the beam its colors ignite against the darkness. The camera slowly pushes in over the fanned cards, ending close enough to read "EURO SUMMER". No new text. Audio: low tense cinematic drone building, soft card-stock slides, one deep heartbeat pulse.`,
  },
  {
    slug: "05_flip",
    refs: ["front_ibiza.jpg", "ticket.jpg"],
    prompt: `${DARK} A single vintage travel postcard lies face-up in the pool of light — the referenced "EURO SUMMER" Ibiza sunset card. Two fingers enter frame, pause on its corner… then flip the card over in one clean motion, revealing the back: the referenced "$25,000 Europe Summer Trip" antique Europe map card with the black-and-gold encrypted QR ticket panel. The gold foil catches the light and glints as the camera pushes in on the "$25,000" lettering and the gold QR. Keep both card faces exactly as referenced, every printed word sharp and legible, clean card edges with no red guide lines, no invented text. Audio: tense ticking drone, the snap of the card flip, a deep bass hit as the gold is revealed.`,
  },
  {
    slug: "06_qr",
    refs: ["ticket.jpg"],
    prompt: `${DARK} Extreme macro: the camera tracks slowly across the black-and-gold encrypted QR ticket panel of the referenced "$25,000 Europe Summer Trip" card lying on the dark table — gold foil QR code modules catching a moving edge of warm light one row at a time, micro-glints and specular sparkle traveling across the gold, the embossed gold border of the panel shimmering, "Your Encrypted Raffle Entry Ticket." lettering grazing the light. The move ends with the whole gold QR softly glowing out of the darkness. Keep all printed text exactly as in the reference, sharp; no invented text. Audio: low sub-bass drone rising, delicate metallic shimmer accents, a muffled heartbeat quickening.`,
  },
  {
    slug: "07_stack",
    refs: ["front_london.jpg", "front_cannes.jpg", "front_mykonos.jpg"],
    prompt: `${DARK} Cards are dealt into the shaft of light one at a time: a hand deals the referenced "EURO SUMMER" London card onto the dark table with a snap — then the Cannes card lands on top slightly offset — then the Mykonos card lands on top of the pile, each landing kicking a tiny puff of dust through the beam. The camera slowly pushes in on the growing stack of glowing postcards surrounded by darkness. Keep each card's printed artwork exactly as referenced, sharp; clean card edges with no red guide lines; no new text. Audio: tense drone, three crisp card snaps in rhythm like a dealer, bass pulse building after each.`,
  },
  {
    slug: "08_ticket_flat",
    refs: ["ticket.jpg"],
    prompt: `${DARK} A hand slowly slides the referenced "$25,000 Europe Summer Trip" raffle card out of the darkness into the shaft of light, the card lying almost flat and square to the camera looking straight down, so the full design stays perfectly readable: the antique Europe map with dashed flight routes between landmarks, the "$25,000 Europe Summer Trip" lettering, and the black-and-gold encrypted QR ticket panel glinting as it crosses into the beam. The camera pushes straight down toward the card, ending framed tight on the "$25,000" lettering and the gold QR panel. Reproduce every printed word on the card exactly as in the reference, sharp and legible the entire time; do not invent, warp or replace any text. Audio: a low tense cinematic bass drone building, one soft ticking pulse, the quiet slide of card stock on wood.`,
  },
);

// ---- 12-second cleaned-up suite ----
CLIPS.push(
  {
    slug: "09_ticket_12",
    refs: ["ticket.jpg"],
    dur: 12,
    prompt: `${DARK} A 12-second single continuous shot in three beats. Beat 1 (0-3s): the table sits in darkness under the shaft of light; a hand slides the referenced "$25,000 Europe Summer Trip" raffle card flat into the pool of light, square to the camera looking straight down, then the hand withdraws into the dark. Beat 2 (3-6s): the card rests perfectly still while the warm light slowly blooms across it — the gold "$25,000" lettering and the black-and-gold encrypted QR panel ignite with traveling glints. Beat 3 (6-12s): the camera pushes straight down slowly and steadily toward the card, ending framed tight on the "$25,000 Europe Summer Trip" lettering and the glowing gold QR panel. The card design is reproduced 1:1 from the reference — antique Europe map, dashed flight routes, landmark icons, gold QR panel — every printed word stays sharp, correct and legible the entire time; do not invent, warp or replace any text; no extra props. Audio: a low tense cinematic bass drone slowly building for 12 seconds, one soft ticking pulse, the quiet slide of card stock, a subtle shimmer as the gold ignites.`,
  },
  {
    slug: "10_dealfan_12",
    refs: ["front_monaco.jpg", "front_ibiza.jpg", "front_santorini.jpg"],
    dur: 12,
    prompt: `${DARK} A 12-second single continuous shot in three beats. The three cards are EXACTLY the three referenced wide LANDSCAPE rounded-corner collectible cards, reproduced 1:1 — full-bleed painted city scenes (Monaco harbor / Ibiza sunset / Santorini blue domes) with the big letters "EURO SUMMER" across the middle filled with tiny scenery; no white borders, no portrait cards, no redesign. Beat 1 (0-5s): a hand deals the three cards into the shaft of light one at a time with crisp snaps, each landing kicking a tiny puff of dust through the beam. Beat 2 (5-8s): the hand spreads them into a clean fan like a winning poker hand, then withdraws into the dark. Beat 3 (8-12s): the camera pushes in slowly over the fanned cards, ending close enough to read "EURO SUMMER" sharp on the top card. No new text. Audio: low tense drone building, three crisp dealer snaps in rhythm, a card-stock fan slide, one deep heartbeat pulse at the end.`,
  },
  {
    slug: "11_flip_12",
    refs: ["front_ibiza.jpg", "ticket.jpg"],
    dur: 12,
    prompt: `${DARK} A 12-second single continuous shot in three beats. Beat 1 (0-4s): a single card lies face-up and perfectly still in the pool of light — EXACTLY the referenced wide landscape "EURO SUMMER" Ibiza sunset card, reproduced 1:1, no white border, no redesign; a hand calmly enters frame and pauses at the card's corner. Beat 2 (4-6s): the hand flips the card over in one clean unhurried motion and withdraws. Beat 3 (6-12s): the back now faces up — EXACTLY the referenced "$25,000 Europe Summer Trip" antique-map card with the black-and-gold encrypted QR panel, reproduced 1:1 — and the camera pushes in slowly as a glint of warm light travels across the gold foil, ending framed tight on "$25,000" and the gold QR. Every printed word on both faces stays sharp, correct and legible; do not invent, warp or replace any text. Audio: tense ticking drone, the crisp snap of the flip at the 5-second mark, then a deep bass swell as the gold is revealed.`,
  },
  {
    slug: "12_qrglow_12",
    refs: ["ticket.jpg"],
    dur: 12,
    prompt: `${DARK} A 12-second single continuous macro shot in two beats. The subject is the black-and-gold encrypted QR ticket panel of the referenced "$25,000 Europe Summer Trip" card lying on the dark table — framed so the ENTIRE panel is always visible: the gold QR code, "Your Encrypted Raffle Entry Ticket." above it and the gold "Raffle ID: G2T6A03" bar below it; never framed tighter than the panel. Beat 1 (0-6s): an edge of warm light sweeps slowly across the panel, gold foil QR modules catching micro-glints row by row, the embossed gold border shimmering against the darkness. Beat 2 (6-12s): the sweep settles and the gold QR itself begins to softly glow and pulse from within, like a charged golden ember floating in the dark, glow breathing twice, camera drifting in very slightly. Reproduce the panel design and all its text 1:1 from the reference, sharp and correct; the three text lines must read EXACTLY, spelled letter-perfect: "Your Encrypted Raffle Entry Ticket." — "Scan In Members App. To Redeem 10 Entries!" (REDEEM spelled R-E-D-E-E-M) — "Raffle ID: G2T6A03" — "No Purchase Necessary". No other text, no misspellings, do not invent, warp or replace any text. Audio: low sub-bass drone rising across 12 seconds, delicate metallic shimmer accents on the glints, a muffled heartbeat that syncs with the two glow pulses.`,
  },
);

// ---- 09-anchor sequels: connectable 12s beats in the same film language ----
CLIPS.push(
  {
    slug: "13_mapalive_12",
    refs: ["ticket.jpg"],
    dur: 12,
    prompt: `${DARK} A 12-second single continuous shot that begins EXACTLY where the previous shot ended: camera looking straight down, framed tight on the antique Europe map region of the referenced "$25,000 Europe Summer Trip" raffle card lying flat on the dark walnut table in the warm shaft of light. Beat 1 (0-3s): the printed map holds still, dust motes drifting — then the tiny painted airliner on the card begins to MOVE, gliding along the dashed flight-route line like a living illustration on the paper. Beat 2 (3-9s): the camera tracks the little plane across the map as it hops city to city, each tiny landmark illustration lighting up with a soft golden glow as the plane passes it, the dashed line drawing itself gold behind the plane. Beat 3 (9-12s): the plane banks toward the right edge of the card and the black-and-gold encrypted QR panel pulses with warm golden light as the camera drifts onto it, ending framed on the glowing gold QR. Everything stays on the flat printed card — a magical living print, the card and table never move. Reproduce the card design 1:1 from the reference; keep all printed text sharp and correct; do not invent, warp or replace any text. Audio: the same low tense bass drone continuing to build, a faint whoosh as the plane moves, soft chimes as each landmark lights, a deep warm pulse when the QR glows.`,
  },
  {
    slug: "14_scan_12",
    refs: ["ticket.jpg"],
    dur: 12,
    prompt: `${DARK} A 12-second single continuous shot, the payoff beat of the sequence. The referenced "$25,000 Europe Summer Trip" raffle card lies flat in the pool of warm light on the dark walnut table, reproduced 1:1, every printed word sharp and correct. Beat 1 (0-4s): a hand slowly brings a modern smartphone into frame above the card, camera lens facing down at the black-and-gold encrypted QR panel. Beat 2 (4-8s): on the phone screen we see the live camera view of the gold QR code centered in a simple scanning frame — no readable interface text, just the gold QR on the dark panel filling the screen — and the gold foil below the phone glints in the light. Beat 3 (8-12s): the phone screen flashes with a soft golden glow and a glowing golden checkmark appears on screen; the hand lifts the phone away as the card's gold QR panel keeps softly shimmering in the beam. No readable text on the phone screen anywhere, only the QR and the glowing checkmark; keep every printed word on the card exactly as in the reference. Audio: the tense drone resolving into a warm satisfying swell, a soft digital scan blip at the 8-second mark, a gentle golden chime with the checkmark.`,
  },
  {
    slug: "15_stacktoticket_12",
    refs: ["front_monaco.jpg", "front_ibiza.jpg", "ticket.jpg"],
    dur: 12,
    prompt: `${DARK} A 12-second single continuous shot in three beats. Beat 1 (0-4s): a hand deals two wide LANDSCAPE rounded-corner collectible cards into the shaft of light one at a time with crisp snaps — EXACTLY the referenced "EURO SUMMER" Monaco harbor card and Ibiza sunset card, reproduced 1:1, full-bleed painted scenes with the big letters "EURO SUMMER", no redesign — landing slightly fanned. Beat 2 (4-8s): a pause… then the hand places a third card slowly and deliberately on top: EXACTLY the referenced "$25,000 Europe Summer Trip" antique-map card with the black-and-gold encrypted QR panel — the winning ticket crowning the pile — and withdraws into the dark. Beat 3 (8-12s): the warm light blooms across the pile and the gold "$25,000" lettering and gold QR ignite with traveling glints as the camera pushes in slowly, ending framed tight on the glowing gold panel. Every printed word on every card stays sharp, correct and legible; do not invent, warp or replace any text. Audio: low tense drone, two crisp dealer snaps, a slower reverent third placement, then a deep bass swell as the gold ignites.`,
  },
);

// ---- the plane transition: map zoom → POV landing in a flavor-badge city ----
CLIPS.push(
  {
    slug: "16_planepov_ibiza_12",
    refs: ["ticket.jpg", "ibiza.jpg"],
    dur: 12,
    prompt: `A 12-second single continuous shot with NO cuts — one unbroken suspenseful zoom that transforms. Beat 1 (0-3s): suspenseful cinematic macro, moody near-dark room, one warm shaft of light, fine dust motes — camera looking straight down at the antique printed Europe map of the referenced "$25,000 Europe Summer Trip" raffle card (reference image 1) lying flat on a dark walnut table. The camera pushes in slowly and steadily toward the small painted airliner illustration on the map, tension building, the plane growing until it fills the frame. Beat 2 (3-6s): as the push continues, the printed paper comes alive — the flat map texture below the plane dissolves into REAL glittering Mediterranean sea seen from high altitude, the painted airliner becomes a real airliner photographed from behind in golden-hour light, thin clouds streaming past — without a cut we are now flying with the plane. Beat 3 (6-12s): the camera sweeps forward past the airliner into a smooth aerial POV descent toward the island from reference image 2 — Ibiza at golden hour: a blazing low sun over the water, whitewashed old town stacked on the hillside, beach coves, boats scattered in the glittering bay — the coastline rising to meet us as we descend through the last wisps of cloud, ending in a low glide over the water toward the beach like a landing approach, the town lights beginning to twinkle. Filmed like an ARRI Alexa aerial plate, gentle lens halation, real-time pacing, no slow motion. No text anywhere in the entire shot. Audio: the low tense bass drone from the macro building continuously, transforming into wind rush and a deep jet hum at the transition, then resolving into warm Mediterranean evening ambience — waves, distant gulls, a soft euphoric synth swell as the island opens up.`,
  },
);

// ---- the passenger-window transition: card plane → cabin POV → Eiffel Tower reveal ----
CLIPS.push(
  {
    slug: "17_ticket_to_paris_12",
    refs: ["ticket.jpg"],
    dur: 12,
    prompt: `A 12-second single continuous shot with NO cuts — one unbroken cinematic transition that transforms, designed to begin EXACTLY where the previous shot ended: camera looking straight down in a moody near-dark room, one warm shaft of light across a dark walnut table, fine dust motes drifting, framed tight on the referenced "$25,000 Europe Summer Trip" raffle card lying flat in the pool of light — the antique Europe map with its dashed flight routes, the tiny painted airliner, and the black-and-gold encrypted QR panel. Beat 1 (0-3s): the camera pushes in slowly and steadily toward the small painted airliner illustration on the map, tension building, the plane growing until it fills the frame; while the card is visible reproduce its design and every printed word 1:1 from the reference, sharp and legible, do not invent, warp or replace any text. Beat 2 (3-6s): as the push continues straight INTO the plane, the flat printed paper dissolves without a cut into the interior of a real airliner cabin bathed in warm golden-hour light — we become a passenger seated in a window seat, an oval airplane window and the seat-back forming around us, point-of-view. Beat 3 (6-12s): passenger POV seated by the window, looking out through the oval airplane window; the camera pushes slowly toward and into the window; outside, far below in golden-hour light, PARIS comes into view — the Eiffel Tower standing tall over the city with the winding Seine river, amber rooftops and boulevards, the plane on a gentle approach — and the camera keeps zooming into the window until the Eiffel Tower and Paris fill the frame. Filmed like an ARRI Alexa, shallow depth of field, gentle lens halation, real-time pacing, no slow motion. No invented text anywhere, no airline logos, no captions. Audio: the low tense bass drone from the macro building continuously, transforming into soft cabin ambience and a gentle jet hum at the transition, then resolving into a warm euphoric orchestral swell as Paris and the Eiffel Tower are revealed.`,
  },
);

// ---- GoPro-POV sequel: seeded from the LIKED clip's END frame (image-to-video) ----
// Drop the liked plane-zoom clip in Clips/, extract its last frame to _liked_endframe.jpg,
// then this begins on that exact frame. startFrame => image-to-video (no reference_images).
CLIPS.push(
  {
    slug: "18_gopro_window_eiffel_12",
    startFrame: "Muha Euro Summer/Clips/_liked_endframe.jpg",
    dur: 12,
    prompt: `A 12-second single continuous shot with NO cuts, beginning EXACTLY on the provided first frame and flowing on with no jump. The first frame is a cinematic macro: a small toy-like airliner flying low over an antique printed Europe map on a dark table, warm light, shallow depth of field, a black-and-gold ticket panel at the top-right edge. Beat 1 (0-3s): the camera pushes in toward the little airliner as — without a cut — the printed map and miniature plane dissolve and scale up into reality, and we are now INSIDE a real airliner cabin in warm golden-hour light. Beat 2 (3-7s): the shot is now a first-person passenger point of view, filmed as if a GoPro action camera is strapped to the passenger's head — a wide field of view with slight action-cam lens distortion and subtle natural head-bob — and the head turns SLOWLY and smoothly from facing forward toward the passenger's oval window at the side, the seat-back and window frame sweeping naturally across the wide frame. Beat 3 (7-12s): the head settles looking straight out through the bright oval airplane window and we look straight DOWN — a top-down aerial view of PARIS far below, the Eiffel Tower seen directly from above at the center of frame with its four splayed iron legs and long shadow, the winding Seine river and Haussmann boulevards radiating outward in golden-hour light; the camera drifts slowly toward the window until the top-down Eiffel Tower fills it. First-person realism, real airplane cabin, real-time pacing, no slow motion. No text, no captions, no airline logos anywhere. Audio: a smooth transition from the low tense drone into steady muffled airliner cabin hum and airflow, a soft seatbelt-sign chime, then a warm euphoric orchestral swell as the top-down Eiffel Tower is revealed below.`,
  },
);

// ---- city variations of the GoPro-window reveal: same seed frame + same treatment, new destinations ----
CLIPS.push(
  {
    slug: "19_gopro_window_vienna_12",
    startFrame: "Muha Euro Summer/Clips/_liked_endframe.jpg",
    dur: 12,
    prompt: `A 12-second single continuous shot with NO cuts, beginning EXACTLY on the provided first frame and flowing on with no jump. The first frame is a cinematic macro: a small toy-like airliner flying low over an antique printed Europe map on a dark table, warm light, shallow depth of field, a black-and-gold ticket panel at the top-right edge. Beat 1 (0-3s): the camera pushes in toward the little airliner as — without a cut — the printed map and miniature plane dissolve and scale up into reality, and we are now INSIDE a real airliner cabin in warm golden-hour light. Beat 2 (3-7s): the shot is now a first-person passenger point of view, filmed as if a GoPro action camera is strapped to the passenger's head — a wide field of view with slight action-cam lens distortion and subtle natural head-bob — and the head turns SLOWLY and smoothly from facing forward toward the passenger's oval window at the side, the seat-back and window frame sweeping naturally across the wide frame. Beat 3 (7-12s): the head settles looking out through the bright oval airplane window and VIENNA opens up far below in golden-hour light — St. Stephen's Cathedral (Stephansdom) with its steep multicolored patterned tiled roof and tall gothic spire rising above the dense historic old town, baroque domes and rooftops, the Danube catching the low sun in the distance; the camera drifts slowly toward and through the window until the cathedral and the city fill the frame. First-person realism, real airplane cabin, real-time pacing, no slow motion. No text, no captions, no airline logos anywhere. Audio: a smooth transition from the low tense drone into steady muffled airliner cabin hum and airflow, a soft seatbelt-sign chime, then a warm euphoric orchestral swell as Vienna and St. Stephen's Cathedral are revealed below.`,
  },
  {
    slug: "20_gopro_window_berlin_12",
    startFrame: "Muha Euro Summer/Clips/_liked_endframe.jpg",
    dur: 12,
    prompt: `A 12-second single continuous shot with NO cuts, beginning EXACTLY on the provided first frame and flowing on with no jump. The first frame is a cinematic macro: a small toy-like airliner flying low over an antique printed Europe map on a dark table, warm light, shallow depth of field, a black-and-gold ticket panel at the top-right edge. Beat 1 (0-3s): the camera pushes in toward the little airliner as — without a cut — the printed map and miniature plane dissolve and scale up into reality, and we are now INSIDE a real airliner cabin in warm golden-hour light. Beat 2 (3-7s): the shot is now a first-person passenger point of view, filmed as if a GoPro action camera is strapped to the passenger's head — a wide field of view with slight action-cam lens distortion and subtle natural head-bob — and the head turns SLOWLY and smoothly from facing forward toward the passenger's oval window at the side, the seat-back and window frame sweeping naturally across the wide frame. Beat 3 (7-12s): the head settles looking out through the bright oval airplane window and BERLIN opens up far below in golden-hour light — the neoclassical Brandenburg Gate with the quadriga statue on top and the long tree-lined Unter den Linden boulevard leading away from it, the tall Fernsehturm TV tower spiking above the skyline and the glass dome of the Reichstag nearby, the low sun flaring across the city; the camera drifts slowly toward and through the window until the Brandenburg Gate and the city fill the frame. First-person realism, real airplane cabin, real-time pacing, no slow motion. No text, no captions, no airline logos anywhere. Audio: a smooth transition from the low tense drone into steady muffled airliner cabin hum and airflow, a soft seatbelt-sign chime, then a warm euphoric orchestral swell as Berlin and the Brandenburg Gate are revealed below.`,
  },
);

// ---- end-card: test whether Seedance renders the raffle-card text + Muha Members logo NATIVELY ----
CLIPS.push(
  {
    slug: "21_endcard_members_6",
    refs: ["card_front.jpg", "muha_members_logo.jpg"],
    dur: 6,
    prompt: `${DARK} A cinematic end-card, held almost still. On the dark walnut table in the warm shaft of light lies the referenced "$25,000 Europe Summer Trip" travel raffle card (reference image 1), reproduced 1:1 — the vintage Europe map with tiny landmark illustrations and dashed flight routes, the bold gold "$25,000" numerals, the gold script word "Europe", and the "SUMMER TRIP" banner beneath it. The warm light slowly blooms across the card and the gold lettering glints. Centered above the card, the referenced Muha "Members" logo (reference image 2) — a blue circular check-badge beside the ornate gold "Members" wordmark — fades and glows softly into frame, reproduced exactly. Every piece of text must be reproduced 1:1, letter-perfect and sharp: "$25,000", "Europe", "SUMMER TRIP", and "Members"; do not invent, warp, misspell, duplicate or replace any text, letters or numbers; no other text anywhere. Fine dust motes drift in the beam, gentle lens halation, real-time pacing. Audio: a warm cinematic resolve — a soft rising orchestral swell and a gentle golden shimmer as the logo settles into place.`,
  },
  {
    slug: "22_endcard_members_v2_6",
    refs: ["card_front.jpg", "muha_members_logo.jpg"],
    dur: 6,
    prompt: `${DARK} A cinematic end-card, held almost still and tightly composed. Centered in the warm shaft of light on the dark walnut table is the referenced "$25,000 Europe Summer Trip" travel card (reference image 1), reproduced EXACTLY as that reference — ONE clean rounded-corner landscape card showing the vintage Europe map, the bold gold "$25,000" numerals, the gold script "Europe" and the "SUMMER TRIP" banner. Reproduce ONLY what is on reference image 1 — do NOT add a tear-off ticket stub, a side panel, a perforated edge, a QR code, a barcode, or any label, panel or text that is not clearly on the reference. The framing favors the big gold "$25,000 Europe Summer Trip" lettering in sharp focus while the far edge of the map falls into soft shadow and shallow focus. Centered above the card, the referenced Muha "Members" logo (reference image 2) — a blue circular check-badge beside the ornate gold "Members" wordmark — fades and glows softly into frame, reproduced exactly and sharp. Text to reproduce 1:1, letter-perfect: "$25,000", "Europe", "SUMMER TRIP", "Members"; do not invent, warp, misspell or duplicate any letters or numbers; no other text anywhere, no gibberish. Fine dust motes, gentle halation, real-time pacing. Audio: a warm cinematic resolve — a soft rising orchestral swell and a gentle golden shimmer as the logo settles into place.`,
  },
  {
    // branded TITLE outro — plays right after clip 18's Eiffel window reveal; logo + gold title only (no map → no label garble)
    slug: "23_members_title_outro_6",
    refs: ["card_front.jpg", "muha_members_logo.jpg"],
    dur: 6,
    prompt: `A 6-second cinematic branded end-title, designed to play immediately after an aerial shot of the Eiffel Tower and Paris at golden hour. Beat 1 (0-2s): a warm golden-hour glow fills the frame with soft light, gentle lens halation and drifting dust motes — like the bright sky just past the Paris aerial — slowly settling toward a rich dark-gold cinematic backdrop. Beat 2 (2-6s): centered on screen, the Muha "Members" logo (reference image 2) — a blue circular check-badge beside the ornate gold "Members" wordmark — fades and glows softly into place, reproduced exactly and sharp; and just below it the giveaway title appears in the exact bold gold vintage lettering style of reference image 1: the "$25,000" numerals, the gold script "Europe", and the "SUMMER TRIP" banner. Render ONLY this floating title and the logo — do NOT draw the map, the travel card, any city labels, dashed routes, a ticket stub, or any other element from reference image 1; just the clean gold lettering as a title over the backdrop. All text reproduced 1:1, letter-perfect and sharp: "$25,000", "Europe", "SUMMER TRIP", "Members"; do not invent, warp, misspell or duplicate any letters, numbers or text; no other text anywhere, no gibberish. Real-time pacing. Audio: a warm cinematic resolve — a soft rising orchestral swell and a gentle golden shimmer as the logo and title settle into place.`,
  },
);

// ---- Paris continuation: seeded from 18's aerial Eiffel end frame → FPV dive into the city ----
CLIPS.push(
  {
    slug: "24_eiffel_dive_12",
    startFrame: "Muha Euro Summer/refs/startframe_paris_aerial.jpg",
    dur: 12,
    prompt: `A 12-second single continuous shot with NO cuts, beginning EXACTLY on the provided first frame and flowing on with no jump. The first frame is a high aerial view of Paris at golden hour: the Eiffel Tower centered against a blazing low sun on the horizon, the Seine river and bridges below, long formal gardens with rectangular fountain pools in the foreground, amber light washing the rooftops. Beat 1 (0-4s): the camera holds this exact view for a breath, then noses forward and commits into a smooth accelerating FPV-drone dive toward the Eiffel Tower, the sun flaring through the iron lattice as the city slides beneath, subtle wind-buffet micro-shake building with speed. Beat 2 (4-8s): the dive carries down close alongside the tower's iron latticework — golden light strobing through the beams as the structure rushes past — then the camera banks and levels out low over the gardens, the fountain pools streaking below, tiny people strolling the paths. Beat 3 (8-12s): a fast low glide straight at the base of the tower and THROUGH the great arch between its four iron legs, then the camera tilts up on the far side to face the sunburst behind the tower, ending held on the glowing golden sky. Filmed like a cinematic FPV drone with a GoPro-style wide field of view, slight action-cam lens distortion, natural sensor flare and halation, real-time speed throughout, no slow motion. Real Paris architecture that stays solid and true — no warping buildings. No text, no captions, no logos anywhere. Audio: the warm euphoric orchestral swell resolving into rushing wind and the rising build of a euphoric summer house track, city ambience flickering past below, one soaring lift as the drone bursts through the arch into the sunlight.`,
  },
);

const want = process.argv.slice(2);
const run = want.includes("all") || want.length === 0 ? CLIPS : CLIPS.filter(c => want.includes(c.slug));
const toDataUri = (p) => `data:image/jpeg;base64,${fs.readFileSync(p).toString("base64")}`;

async function gen(c, delayMs = 0) {
  if (delayMs) await new Promise(r => setTimeout(r, delayMs));
  const input = {
    prompt: c.prompt,
    duration: c.dur || 5,
    resolution: "1080p",
    aspect_ratio: "9:16",
    generate_audio: true,
  };
  // image-to-video: seed the exact first frame (can't combine with reference_images)
  if (c.startFrame) input.image = toDataUri(c.startFrame);
  else input.reference_images = (c.refs || [c.ref]).map(r => toDataUri(path.join(REFS, r)));
  console.log(`→ ${c.slug}...`);
  let create;
  for (let attempt = 1; attempt <= 8; attempt++) {
    create = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
      body: JSON.stringify({ input }),
    });
    if (create.status !== 429) break;
    const body = await create.json().catch(() => ({}));
    const wait = (body.retry_after || 15) + 5 + attempt * 5;
    console.log(`  ${c.slug} throttled (429), retrying in ${wait}s (attempt ${attempt}/8)`);
    await new Promise(r => setTimeout(r, wait * 1000));
  }
  if (!create.ok) { console.error(`  ${c.slug} create failed ${create.status}: ${(await create.text()).slice(0, 300)}`); return; }
  let pred = await create.json();
  while (!["succeeded", "failed", "canceled"].includes(pred.status)) {
    await new Promise(r => setTimeout(r, 6000));
    pred = await (await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  }
  if (pred.status !== "succeeded") { console.error(`  FAILED ${c.slug}: ${pred.error}`); return; }
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const out = path.join(OUT, `${c.slug}.mp4`);
  fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log(`  ✓ ${out}`);
}

await Promise.all(run.map((c, i) => gen(c, i * 20000)));
console.log("Done.");
