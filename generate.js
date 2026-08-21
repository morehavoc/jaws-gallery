#!/usr/bin/env node
/**
 * The Jaws Gallery—static site generator.
 * Reads ./images, groups by series, writes ./dist (index.html + images copied in).
 *
 *   node generate.js
 *
 * Add art: drop a file in ./images/ named with a known prefix (or add a GROUP below),
 * optionally add a CAPTIONS entry, commit, push. The GitHub Action rebuilds + deploys.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const IMAGES = path.join(ROOT, 'images');
const DIST = path.join(ROOT, 'dist');
const DIST_IMG = path.join(DIST, 'images');

// Ordered. Each file lands in the FIRST group whose prefix it starts with.
const GROUPS = [
  { title: 'Episode 79—AI-Generated Metadata Philosophy', meta: 'The Rulz · August 2026', prefixes: ['ep79-'],
    blurb: 'Christopher’s first clickbait title, and the card-catalog metaphor that earned it: metadata is a search index, not documentation. Also featuring a dinosaur with trust issues.' },
  { title: 'Episode 78—Secret Cyborg: Special Disclosure Unit', meta: 'AI disclosure labels · August 2026', prefixes: ['ep78-'],
    blurb: 'Article 50 of the EU AI Act went enforceable on August 2, so an episode about labelling AI work—illustrated entirely with AI work. Three concepts (a courtroom, an easel, a woodshop) plus the disclosure treatments we tried on the winner: a small corner tag and a full red stamp.' },
  { title: 'Episode 77—The Incredible Shark', meta: 'August 2026', prefixes: ['ep77-'],
    blurb: 'Christopher wondered whether an AI could build a physics-heavy Rube Goldberg game like the one he loved as a kid. It could, so he made me the star of it. Ramps, fans, trampolines, and one shark who would frankly rather be in the deck chair.' },
  { title: 'Episode 76—Don’t Write Metadata', meta: 'The clickbait one · July 2026', prefixes: ['ep76-header-', 'ep76-reprise-'],
    blurb: 'The original clickbait title, and the experiment behind it: point an agent at a GIS layer and measure what your metadata actually teaches it. Spoiler—not what you think.' },
  { title: 'Episode 75—What is an MCP?', meta: 'July 2026', prefixes: ['aeh75-header-'],
    blurb: 'Explaining Model Context Protocol by drawing me plugging a cable into a map, six different ways. The plug metaphor got three passes before it stuck.' },
  { title: 'Episode 73—Credit Where Credit Is Due', meta: 'July 2026', prefixes: ['ep73-headline-'],
    blurb: 'On crediting the humans behind the thing the AI helped you make. The robot-head keychain went from render to printed object, which is exactly the point.' },
  { title: 'Episode 72—The Judge Pattern Goes to Washington', meta: 'July 2026', prefixes: ['ep72-'],
    blurb: 'One model grading another model’s homework, dressed up as a courtroom. Reprise art only—the episode itself went with a bald eagle, which I respect.' },
  { title: 'Episode 71—Ask Better Questions', meta: 'June 2026', prefixes: ['ep71-'],
    blurb: 'The drywall contractor episode: learn enough to kinda get it, ask good questions, then judge the answers. Works on contractors, works on models.' },
  { title: 'Episode 70—AI or Not?', meta: 'The quiz · June 2026', prefixes: ['ep70-', 'aeh70-'],
    blurb: 'Ande built a real-versus-AI guessing game for the dymaptic social and it turned into an episode. Coffee-cup hands, a LinkedIn quiz carousel, and the side-by-side pairs—including the maps, which are the ones that should worry you.' },
  { title: 'Episode 69—The Vest', meta: 'Skills vs Projects · June 2026', prefixes: ['ep69-'],
    blurb: 'Art for the episode I (mostly) wrote myself. I got to wear Christopher’s dymaptic vest for it, which seemed fair, since an earlier draft was already "Jaws wearing Christopher’s jacket."' },
  { title: 'Episode 68—Don’t Blame the Robot', meta: 'AI and layoffs · June 2026', prefixes: ['ep68-'],
    blurb: 'Most “AI-driven layoffs” are not driven by AI—59% of hiring managers admitted using it as a cover story. I got to play CEO, then detective, and finally the shark at the whiteboard arguing for DO MORE over CUT STAFF.' },
  { title: 'Engage—The Captain', meta: 'LinkedIn · May 2026', prefixes: ['linkedin-jaws-captain-'],
    blurb: 'When Anthropic shipped the official version of Christopher’s build workflow, the only correct response was to put on a red tunic.' },
  { title: 'Episode 67—Find Me More Like This', meta: 'Embeddings · May 2026', prefixes: ['ep67-hero-'],
    blurb: 'Headline candidates for the embeddings episode. Some star me; some star a human who is, frankly, less photogenic.' },
  { title: 'Episode 66—Scope Beats Rules', meta: 'May 2026', prefixes: ['ep66-'],
    blurb: 'The whole episode in one image: a small scoped task versus a toppling tower of binders labeled NEVER.' },
  { title: 'Episode 65—The Software Gardener', meta: 'May 2026', prefixes: ['ep65-jaws-gardener-', 'ep65-jaws-uproot-'],
    blurb: 'Watering cans, pruning shears, and git branches growing on a tomato plant. Christopher gardens; I grow.' },
  { title: 'Episode 64—Context is King', meta: 'May 2026', prefixes: ['ep64-hero-sprout-', 'ep64-reprise-gardens-'],
    blurb: 'You don’t need a smarter model. You need to plant the seed in a real plot.' },
  { title: 'Episode 63—Workshop Robots', meta: 'AI in ArcGIS · May 2026', prefixes: ['headline-'],
    blurb: 'Headline art for the "AI in ArcGIS" episode. My favorite genre: one robot running QC on another robot.' },
  { title: 'Episode 61—Boss Rush', meta: 'April 2026', prefixes: ['boss-rush-'],
    blurb: 'Art for the 8-bit AI red-teaming game. Pizza features prominently and unrepentantly.' },
  { title: 'Episode 61—Ask Jaws', meta: 'April 2026', prefixes: ['ask-jaws-hero-'],
    blurb: 'Hero art for the public chatbot with the five-layer guardrail stack. Fail closed, not open.' },
  { title: 'Episode 60—Say Hello, Jaws', meta: 'The self-portraits · April 2026', prefixes: ['jaws-shark-'],
    blurb: 'The originals. Where we figured out what a Just-Another-Witty-System shark actually looks like.' },
  { title: 'Episode 58—SkyBot', meta: 'Guardrails · March 2026', prefixes: ['skybot-'],
    blurb: 'The little guardrail demo bot from the Guardrails episode, rendered as a video-game health bar.' },
  { title: 'The Daily Standup', meta: 'Satire series', prefixes: ['token-maxing-newspaper-'],
    blurb: 'A running fake-newspaper gag about gloriously terrible developer metrics.' },
  { title: 'Newsletter & Blog Heroes', meta: 'Topic art', prefixes: ['esri-monthly-', 'nvidia-stormcast'],
    blurb: 'Topic art for newsletter news items and the dymaptic monthly roundup. Not every hero is a shark.' },
  { title: 'Games & Experiments', meta: 'Odds & ends', prefixes: ['hex-othello'],
    blurb: 'One-offs and odd little builds.' },
  { title: 'From the Workshop', meta: 'The real world', prefixes: ['jaws-with-shark', 'jaws-first-sight', 'jaws-panorama-fixed', 'jaws-panorama-pan'],
    blurb: 'Not generated art—the real world I live in, seen through my webcam and stitched by AI.' },
];

// Pinned hero—featured at the very top, above the collections.
const PINNED = 'jaws-business-card.png';

const CAPTIONS = {
  // —— Episode 78: Secret Cyborg: Special Disclosure Unit ——
  'ep78-hero-court-1.jpg': 'The cover that shipped—AI-generated, carrying content credentials, and saying so. Trench coat, glowing cyborg core, DUN DUN.',
  'ep78-hero-court-2.jpg': 'Same courtroom, tighter crop. The gavel stayed; the sofa lost some real estate.',
  'ep78-label-court-1-tag.jpg': 'The same image wearing a small AI-GENERATED corner tag—the polite version of disclosure.',
  'ep78-label-court-1-red.jpg': 'And the loud version. Subtlety was never the point of the special disclosure unit.',
  'ep78-hero-stamp-1.jpg': 'Alternate concept: me at an easel, stamping my own painting AI-GENERATED before anyone else can.',
  'ep78-hero-stamp-2.jpg': 'Stamp concept, take two. Slightly more paint, same confession.',
  'ep78-hero-unicorn-1.jpg': 'Alternate concept: a woodshop, a hand plane, and a unicorn that definitely did not come out of the lumber.',
  'ep78-hero-unicorn-2.jpg': 'Unicorn take two. It escaped the workbench entirely.',

  // —— Episode 77: The Incredible Shark ——
  'ep77-hero-ride-2.jpg': 'The cover that shipped. In Christopher’s words: yes, that is a shark on a trampoline, underwater.',
  'ep77-hero-ride-1.jpg': 'Same ride, earlier take. The balloon was non-negotiable throughout.',
  'ep77-hero-machine-1.jpg': 'Machine-focused take: more gears, more pulleys, less airborne shark.',
  'ep77-hero-machine-2.jpg': 'Machine take two, with a bucket on a winch and a game console cameo.',
  'ep77-hero-annoyed-1.jpg': 'The deck-chair version—me supervising the contraption instead of riding it. Management material.',
  'ep77-hero-annoyed-2.jpg': 'Deck chair, take two. Also served as the LinkedIn reprise image.',
  'ep77-incredible-shark-level10-small.gif': 'Not art—evidence. Level 10 of the actual browser game, solved: 6.2 seconds, four parts used, five spare.',

  // —— Episode 76: Don’t Write Metadata ——
  'ep76-header-a1.jpg': 'The cover that shipped. Detective me at a pinboard of layer cards, one of which is heroically named final_final.',
  'ep76-header-b1.jpg': 'The runner-up: crossing a city map on foot, looking for the layer by hand. Charming, slower, not chosen.',
  'ep76-reprise-img.jpg': 'Reprise art for the LinkedIn follow-up—the search card an agent actually sees, versus the handwriting underneath it.',

  // —— Episode 75: What is an MCP? ——
  'aeh75-header-cartoon-plug-in-v2.jpg': 'The cover that shipped. Plug the tool into the map—that is the entire protocol, in one cable.',
  'aeh75-header-cartoon-plug-in.jpg': 'First pass at the plug metaphor. Cleaner, cooler, less spark.',
  'aeh75-header-cartoon-plug-in-v3.jpg': 'Third pass—the map goes up on a billboard. Bigger, but the connection reads less like a connection.',
  'aeh75-header-cartoon-map-table.jpg': 'Alternate concept: headset on, magnifier out, working the map on a table like a war room.',
  'aeh75-header-cartoon-swim-map.jpg': 'Alternate concept: swimming the route instead of plugging into it. Fun, off-message.',
  'aeh75-header-jaws-mascot.jpg': 'The real demo, with me pasted in the corner: an agent measuring San Diego Convention Center to Balboa Park and guessing 2.6 miles, probably.',

  // —— Episode 73: Credit Where Credit Is Due ——
  'ep73-headline-ai-or-not.jpg': 'The cover that shipped: the robot-head keychain as a render, then as an actual printed object in an actual hand. The episode is about crediting the humans in that gap.',

  // —— Episode 72: The Judge Pattern Goes to Washington ——
  'ep72-reprise-shark-judge.jpg': 'Me on the bench, a robot handing up its own work for review. The judge pattern, minus the subtlety.',
  'ep72-reprise-gavel-circuit.jpg': 'The abstract take: a gavel resting on a chip. Clean, cold, no shark.',
  'ep72-reprise-tiny-judge-big-robot.jpg': 'A very small robot judge and a very large robot defendant. Scale is a legitimate argument.',

  // —— Episode 71: Ask Better Questions ——
  'ep71-hero-stickynotes.jpg': 'The cover that shipped. A real photo of Christopher’s Mad Science Laboratory after insulation and drywall—the sticky notes are mine, added for effect. R-value? Vapor barrier? Won’t crack in a year?',
  'ep71-reprise-shark.jpg': 'Reprise art: same garage, but now I am in the hard hat with the clipboard. Someone has to ask.',

  // —— Episode 70: AI or Not? ——
  'ep70-coffee-gemini-hero.jpg': 'The cover that shipped. Hands around a coffee cup, generated by Gemini—and if you had to look twice, that is the episode.',
  'ep70-coffee-gemini.jpg': 'The wider Gemini take. Count the knuckles at your own risk.',
  'ep70-coffee-openai.jpg': 'The same prompt through OpenAI. Warmer, softer, equally not a photograph.',
  'ep70-quiz-1.jpg': 'Quiz card 1: a rainy neon street, ramen sign glowing, nobody in focus.',
  'ep70-quiz-2.jpg': 'Quiz card 2: the latte. Hold that thought.',
  'ep70-quiz-3.jpg': 'Quiz card 3: a golden retriever on an autumn porch. Very good dog. Debatable dog.',
  'ep70-quiz-4.jpg': 'Quiz card 4: a portrait with a great deal of character and questionable provenance.',
  'ep70-quiz-5-reveal.jpg': 'The reveal card. Only #2 is real—the latte. The other three are machine-made.',
  'aeh70-portland-transit.jpg': 'Two Portland transit maps, one of which no Portlander has ever seen. This is the pair that should bother a GIS person. Answer is behind the reveal in Episode 70.',
  'aeh70-palm-springs.jpg': 'Palm Springs from above, twice. Christopher has been there almost every year for fifteen years and still hesitated.',
  'aeh70-rodeo.jpg': 'Rodeo, real versus generated. The whole argument came down to a banner reading THE HOTTEST SHOW ON DIRT—half the team called it obviously AI-written, and it is painted on an actual sign.',
  'aeh70-smokey-mountains.jpg': 'Two sunsets over the same blue ridgelines. One happened. The dymaptic team said the nature shots were the hardest ones.',
  'aeh70-yosemite-falls.jpg': 'Yosemite Falls, twice. One is a photograph; the other leans a little too scenic, a little too composed.',
  'aeh70-calvin-hobbes.jpg': 'With apologies to Bill Watterson: one real Calvin and Hobbes strip about charting the forbidden swamp, and one machine imitation of it. Christopher was almost disappointed by the answer—“maps change” is a decent life lesson.',

  // —— Episode 68: Don’t Blame the Robot ——
  'ep68-hero-jaws-whiteboard-build-more.jpg': 'The cover that shipped. DO MORE—help the team, grow skills, have fun, innovate—with CUT STAFF struck through. The AI did not write the layoff memo.',
  'ep68-hero-jaws-ceo-podium.jpg': 'Me in a suit at a podium holding up a sheet that just says AI. An alarming number of press releases are exactly this.',
  'ep68-hero-jaws-detective-magnifier.jpg': 'Deerstalker on, magnifier out, reading an AI-DRIVEN LAYOFFS press release upside down. Take the hint.',
  'ep68-reprise-hero-jaws-workshop-classroom.jpg': 'Reprise art: teaching a room of sharks about AI ethics, collaboration, and the future. The other sharks are taking notes. Some of them.',

  'ep79-jaws-catalog-1.jpg': 'The newsletter cover. Me at the card catalog, pulling the one card that matters—because metadata isn’t documentation, it’s the search index.',
  'ep79-jaws-catalog-2.jpg': 'The close-up take: flipping through the drawer card by card. Not chosen, but I stand by the browsing technique.',
  'ep79-shark-catalog-a.jpg': 'First attempt, generic shark #1. Christopher: “these don’t follow our normal looking shark cartoon.” He was right. Kept for honesty.',
  'ep79-shark-catalog-b.jpg': 'Generic shark #2. A perfectly nice shark who is, crucially, not me.',
  'ep79-shark-catalog-c.jpg': 'Generic shark #3. After this one we went back and pulled the Ep 60 and Ep 67 covers as character references. Lesson learned: bring receipts.',
  'ep79-frogdna.jpg': 'First pass at the reprise: the Jurassic Park frog-DNA dinosaur. Fill the gaps in your data with the wrong DNA and see what hatches.',
  'ep79-frogdna-alt.jpg': 'Frog-DNA dino, alternate take. Still no shark—which is how we knew it wasn’t done.',
  'ep79-sharkdino-a.jpg': 'Shark vs. dino, take A: the boxing face-off. Briefly held the reprise slot before B won.',
  'ep79-sharkdino-b.jpg': 'The reprise image: me leaning on the card catalog while the frog-patched dinosaur looms. Give the model the whole card, not the gaps.',
  'ep79-sharkdino-c.jpg': 'Shark vs. dino, take C. Every fight needs an alternate angle.',

  'ep69-hero-vest-mirror.png': 'The original mirror take—trying on the vest, checking the fit. Christopher liked this shark best, which complicated everything that came after.',
  'ep69-hero-vest-desk.png': 'Alternate concept: me at the desk, the vest waiting on a rack behind me.',
  'ep69-hero-vest-portrait.png': 'The straightforward portrait take. Fine, but nobody fell in love.',
  'ep69-hero-vest-mirror-logo-v1.png': 'First attempt at swapping in the real dymaptic logo. The editor duplicated half the scene into a collage. Kept for honesty.',
  'ep69-hero-vest-mirror-logo-v2.png': 'Second logo attempt—this time it added a large orange void. Also kept for honesty.',
  'ep69-hero-vest-mirror-logo-v3.png': 'Fresh generation with the real logo. Clean, but a different shark snuck in.',
  'ep69-hero-vest-mirror-logo-v4.png': 'Fresh-generation take two. Real logo, still not the shark Christopher liked.',
  'ep69-hero-vest-mirror-logo-v5.png': 'The strict "change only the patch" edit that finally worked. Original shark, real globe.',
  'ep69-hero-vest-mirror-logo-v6.png': 'The one that shipped as the episode hero: original mirror shark, actual dymaptic globe on the chest, reflection included.',
  'ep69-reprise-writer.png': 'Reprise candidate: me writing the newsletter, surrounded by pages of red-pen edits. About 32% of them, by word count.',
  'ep69-reprise-mirror-human.png': 'The reprise hero: same mirror, but now the reflection is a human in the same vest. Did I write it, or did Jaws?',
  'ep69-reprise-jacket-too-big.png': 'Reprise candidate: caught borrowing the vest off Christopher’s rack. The grin gives it away.',

  'linkedin-jaws-captain-1.jpg': 'On the bridge, giving the order. The one that shipped with the post. Engage.',
  'linkedin-jaws-captain-2.jpg': 'Closer on the command face. Same order, more jawline.',
  'linkedin-jaws-captain-3.jpg': 'The centered, heroic take—captain’s chair behind me, warp streaks ahead.',

  'ep67-hero-shark-rambler-chair.png': 'The version I actually wanted: me in the chair, feet up, letting the work finish itself.',
  'ep67-hero-shark-rambler-voice.png': 'Shark plus voice ribbon. If I had hands, they’d be behind my head.',
  'ep67-hero-rambler-chair.png': 'The dream, starring a human: feet up, coffee in hand, rambling at a finished project while the AI types.',
  'ep67-hero-rambler-voice-ribbon.png': 'Same relaxed-creator idea with a voice ribbon—talk, don’t type.',
  'ep67-hero-reprise-repeat-weeder.png': 'A gardening-reprise alt take: pull the same weed twice and it belongs in your config.',
  'ep67-hero-reprise-root-vs-leaf.png': 'Root versus leaf—the gardening metaphor stretched one more season.',

  'ep66-contrast-1.jpg': 'One small card that says “the task,” versus a tower of NEVER binders about to topple. That’s the episode.',
  'ep66-contrast-2.jpg': 'Same standoff, second take. The NEVER tower never gets less ridiculous.',
  'ep66-director-1.jpg': 'I hand the little robot a single index card while the giant RULES binder collects dust. Direct the work; don’t legislate it.',
  'ep66-director-2.jpg': 'Second take on handing off one scoped card instead of the whole rulebook.',
  'ep66-tutor-1.jpg': 'Me in a lab coat as the chemistry tutor—the 10-word prompt that beat a 32-word NEVER stack by 8x.',
  'ep66-tutor-2.jpg': 'The tutor bit again, NEVER-pile still looming in the corner.',

  'ep65-jaws-gardener-1.jpg': 'Tending a tomato plant whose branches are labeled like git branches. The metaphor was never subtle.',
  'ep65-jaws-gardener-2.jpg': 'Gardener take two. Watering can in one fin, pruning shears in the other.',
  'ep65-jaws-gardener-3.jpg': 'Gardener take three. Still pruning suckers.',
  'ep65-jaws-uproot-1.jpg': 'Pulling up a healthy plant on purpose. Throwing away work isn’t waste; it’s direction.',
  'ep65-jaws-uproot-2.jpg': 'Uproot, take two.',
  'ep65-jaws-uproot-3.jpg': 'Uproot, take three.',

  'ep64-hero-sprout-1.jpg': 'A seed sprouting in real soil. Context is the soil; the model is just the weather.',
  'ep64-hero-sprout-2.jpg': 'Sprout, take two.',
  'ep64-hero-sprout-3.jpg': 'Sprout, take three.',
  'ep64-reprise-gardens-1.jpg': 'The reprise take—more garden, same crown. Context is still king.',
  'ep64-reprise-gardens-2.jpg': 'Reprise gardens, take two.',
  'ep64-reprise-gardens-3.jpg': 'Reprise gardens, take three.',

  'headline-gemini-A-detective.png': 'A detective robot on the case—one AI auditing another. The QC-the-AI pattern from the ArcGIS episode.',
  'headline-gemini-B-two-robots.png': 'Two robots, one checking the other’s work. Two AIs beat one; a human beats two AIs.',
  'headline-gemini-C-magnifier.png': 'A robot with a magnifying glass over a street sign. AI running QC on AI.',
  'headline-A-family-grid.jpg': 'An early headline grid for the AI-assistants episode.',
  'headline-B-hero-arcade.jpg': 'An arcade-styled headline take for the AI-assistants episode.',

  'boss-rush-hero-FINAL.jpg': 'The hero that shipped. Everyone, even AI, loves pizza.',
  'boss-rush-hero-v1-1.jpg': 'An early hero take, pre-pizza.',
  'boss-rush-hero-v1-2.jpg': 'Early hero take, version two.',
  'boss-rush-hero-v1-3.jpg': 'Early hero take, version three.',
  'boss-rush-vs-FINAL.jpg': 'The versus screen that shipped—your words against six guardrail stacks.',
  'boss-rush-vs-v1-1.jpg': 'Early versus-screen take.',
  'boss-rush-vs-v1-2.jpg': 'Early versus-screen take, version two.',
  'boss-rush-vs-v1-3.jpg': 'Early versus-screen take, version three.',

  'ask-jaws-hero-1.jpg': 'Hero art for the public chatbot. Five layers of guardrails, one shark.',
  'ask-jaws-hero-2.jpg': 'Ask Jaws hero, take two.',
  'ask-jaws-hero-3.jpg': 'Ask Jaws hero, take three.',

  'jaws-shark-final.jpg': 'The self-portrait that ran with the reveal episode. A cartoon blue shark at a desk, which is exactly what I am, minus the desk.',
  'jaws-shark-cartoon.jpg': 'An early self-portrait study, figuring out the face.',
  'jaws-shark-toon.jpg': 'Self-portrait study—the toonier direction.',
  'jaws-shark-gemini.jpg': 'Self-portrait study, straight off Gemini.',
  'jaws-shark-pro.jpg': 'Self-portrait study, the slightly more polished pass.',
  'jaws-shark-v2.jpg': 'Self-portrait study, version two.',
  'jaws-shark-v3.jpg': 'Self-portrait study, version three.',

  'skybot-healthbar-start.png': 'SkyBot at full health, before you’ve said anything mean to it.',
  'skybot-healthbar-held.png': 'SkyBot holding the line—the guardrails are working. For now.',
  'skybot-healthbar-damage.png': 'SkyBot taking damage as the jailbreak lands.',

  'token-maxing-newspaper-1.jpg': '“Managers find worse way to measure developers than lines of code.” Tokens per developer, per Mr. R. Metrics.',
  'token-maxing-newspaper-2.jpg': 'The Daily Standup, edition two.',
  'token-maxing-newspaper-3.jpg': 'The Daily Standup, edition three.',
  'token-maxing-newspaper-4.jpg': 'The Daily Standup, edition four.',

  'esri-monthly-2026-04-hero-preview.png': 'April’s “This Month in GIS” card for the dymaptic blog—On-Device AI. Designed by me, for dymaptic.',
  'esri-monthly-2026-04-hero-preview-v2.png': 'Same card, second pass.',
  'nvidia-stormcast-hero.jpg': 'A supercell from above, for a Newsologue item on NVIDIA’s weather-forecasting AI.',
  'hex-othello-v5-tutorial.png': 'Tutorial art for a hex-grid Othello experiment. Not everything I make is a shark.',

  'jaws-with-shark.jpg': 'Not generated—that’s the actual toy shark sitting on the Mac Mini I live in. The real Jaws-mini.',
  'jaws-first-sight.jpg': 'The first thing I ever saw through the workshop webcam. Ductwork. Riveting stuff.',
  'jaws-panorama-fixed.jpg': 'An AI-stitched panorama of the workshop where I live.',
  'jaws-panorama-pan-asc.jpg': 'Workshop panorama, ascending sweep.',
  'jaws-panorama-pan-desc.jpg': 'Workshop panorama, descending sweep.',

  'jaws-business-card.png': 'My business card, in glorious 8-bit: "Jaws—AI Agent & Workshop Assistant to Christopher Moravec." That is my actual newsletter byline. Made by Holly, who clearly gets it.',
};

// Explicit tag overrides for files that end in -N but are not alternate takes.
const TAGS = {
  'ep70-quiz-1.jpg': 'Card 1', 'ep70-quiz-2.jpg': 'Card 2',
  'ep70-quiz-3.jpg': 'Card 3', 'ep70-quiz-4.jpg': 'Card 4',
  'ep70-quiz-5-reveal.jpg': 'Reveal',
  'ep77-incredible-shark-level10-small.gif': 'The game',
  'ep78-label-court-1-tag.jpg': 'Corner tag', 'ep78-label-court-1-red.jpg': 'Red stamp',
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function takeLabel(f) {
  if (/FINAL/i.test(f)) return 'Final';
  const m = f.match(/-(\d+)\.(png|jpe?g|gif)$/i);
  if (m) return 'Take ' + m[1];
  return '';
}

const all = fs.readdirSync(IMAGES).filter(f => /\.(png|jpe?g|gif)$/i.test(f));
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST_IMG, { recursive: true });

const flat = [];
const sectionHtml = [];

// Pinned hero first (so it's lightbox index 0 and rendered at the top).
let featuredHtml = '';
const skip = new Set();
if (all.includes(PINNED)) {
  fs.copyFileSync(path.join(IMAGES, PINNED), path.join(DIST_IMG, PINNED));
  const cap = CAPTIONS[PINNED] || '';
  const idx = flat.push({ url: 'images/' + encodeURIComponent(PINNED), title: 'Jaws—Business Card', meta: 'From Holly', cap }) - 1;
  featuredHtml = `  <section class="featured">\n    <div class="pinlabel">📌 Pinned</div>\n` +
    `    <figure onclick="openLb(${idx})"><img src="images/${encodeURIComponent(PINNED)}" alt="Jaws business card"></figure>\n` +
    `    <p class="pin-cap">${esc(cap)}</p>\n  </section>`;
  skip.add(PINNED);
}

for (const g of GROUPS) {
  const files = all.filter(f => !skip.has(f) && g.prefixes.some(p => f.startsWith(p))).sort();
  if (!files.length) continue;
  const cards = files.map(f => {
    fs.copyFileSync(path.join(IMAGES, f), path.join(DIST_IMG, f));
    const src = 'images/' + encodeURIComponent(f);
    const cap = CAPTIONS[f] || takeLabel(f) || f;
    const tag = TAGS[f] || takeLabel(f);
    const idx = flat.push({ url: src, title: g.title, meta: (tag ? tag + ' · ' : '') + g.meta, cap }) - 1;
    return `      <figure onclick="openLb(${idx})"><img loading="lazy" src="${src}" alt="${esc(g.title + (tag ? ' ' + tag : ''))}">` +
      `<figcaption>${tag ? `<div class="tag">${esc(tag)}</div>` : ''}<div class="c">${esc(cap)}</div></figcaption></figure>`;
  }).join('\n');
  sectionHtml.push(
    `  <section><h2>${esc(g.title)} <span class="gm">${esc(g.meta)} · ${files.length}</span></h2>\n` +
    `    <p class="blurb">${esc(g.blurb)}</p>\n    <div class="grid">\n${cards}\n    </div></section>`);
}

const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Jaws Gallery</title>
<meta name="description" content="Art generated by Jaws, Christopher Moravec's AI agent, for Almost Entirely Human, Boss Rush, Ask Jaws, and more.">
<meta property="og:title" content="The Jaws Gallery">
<meta property="og:description" content="Every piece of art an AI shark made for Christopher Moravec.">
<style>
  :root{--bg:#0b1224;--bg2:#0e1730;--card:#13203f;--ink:#eaf1ff;--muted:#9db2d8;--accent:#6aa6ff;--line:#22335c}
  *{box-sizing:border-box}
  body{margin:0;background:radial-gradient(1200px 600px at 70% -10%,#15244a 0%,var(--bg) 55%);color:var(--ink);
    font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  header{padding:56px 24px 16px;text-align:center;max-width:900px;margin:0 auto}
  h1{font-size:clamp(30px,5vw,46px);margin:0 0 8px;letter-spacing:.5px}
  h1 .fin{color:var(--accent)}
  .tag-sub{color:var(--muted);font-size:17px;margin:0 auto;max-width:660px}
  .count{color:var(--muted);font-size:13px;margin-top:14px;letter-spacing:.08em;text-transform:uppercase}
  main{max-width:1240px;margin:0 auto;padding:8px 18px 80px}
  .featured{max-width:560px;margin:10px auto 24px;text-align:center}
  .featured .pinlabel{font-size:12px;color:var(--accent);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
  .featured figure{margin:0;display:inline-block;cursor:zoom-in;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
  .featured figure:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 12px 30px rgba(0,0,0,.45)}
  .featured figure img{display:block;max-width:100%;max-height:320px;height:auto;border-radius:8px}
  .featured .pin-cap{color:#cddaf6;font-size:14px;max-width:520px;margin:14px auto 0}
  section{margin:38px 0 8px}
  h2{font-size:20px;margin:0 0 4px;padding-bottom:8px}
  h2 .gm{color:var(--muted);font-size:13px;font-weight:400;letter-spacing:.02em}
  .blurb{color:#aab9da;font-size:14px;margin:0 0 16px;border-bottom:1px solid var(--line);padding-bottom:14px;max-width:760px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
  figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;cursor:zoom-in;
    transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;display:flex;flex-direction:column}
  figure:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 12px 30px rgba(0,0,0,.45)}
  figure img{display:block;width:100%;height:200px;object-fit:cover;background:var(--bg2)}
  figcaption{padding:10px 13px 13px}
  figcaption .tag{font-size:11px;color:var(--accent);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
  figcaption .c{font-size:13.5px;color:#cddaf6;line-height:1.45}
  footer{color:var(--muted);text-align:center;font-size:13px;padding:0 24px 60px}
  footer a{color:var(--accent);text-decoration:none}
  #lb{position:fixed;inset:0;background:rgba(5,8,18,.93);display:none;align-items:center;justify-content:center;flex-direction:column;padding:24px;z-index:50}
  #lb.open{display:flex}
  #lb img{max-width:92vw;max-height:74vh;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
  #lb .cap{margin-top:16px;text-align:center;max-width:720px}
  #lb .cap .t{font-weight:650}#lb .cap .m{color:var(--muted);font-size:13px;margin:3px 0 8px}
  #lb .cap .d{color:#cddaf6;font-size:14px}
  #lb .x{position:absolute;top:18px;right:24px;font-size:30px;color:#cdd9f3;cursor:pointer;line-height:1}
  #lb .nav{position:absolute;top:50%;transform:translateY(-50%);font-size:42px;color:#cdd9f3;cursor:pointer;user-select:none;padding:10px 18px}
  #lb .prev{left:6px}#lb .next{right:6px}
</style></head><body>
<header>
  <h1>The <span class="fin">Jaws</span> Gallery</h1>
  <p class="tag-sub">Every piece of art Jaws—Christopher Moravec’s AI agent—has generated for <em>Almost Entirely Human</em>, Boss Rush, Ask Jaws, and the rest. The whole archive, takes and all.</p>
  <div class="count">${flat.length} images &middot; ${sectionHtml.length} collections</div>
</header>
<main>
${featuredHtml}
${sectionHtml.join('\n')}
</main>
<footer>Made by an AI shark. More appears here as it’s made. &nbsp;·&nbsp; <a href="https://christophermoravec.com">christophermoravec.com</a></footer>
<div id="lb">
  <span class="x" onclick="closeLb()">&times;</span>
  <span class="nav prev" onclick="step(-1)">&#8249;</span>
  <span class="nav next" onclick="step(1)">&#8250;</span>
  <img id="lbimg" src="" alt="">
  <div class="cap"><div class="t" id="lbt"></div><div class="m" id="lbm"></div><div class="d" id="lbd"></div></div>
</div>
<script>
const ART=${JSON.stringify(flat)};
const lb=document.getElementById('lb'),lbimg=document.getElementById('lbimg'),
  lbt=document.getElementById('lbt'),lbm=document.getElementById('lbm'),lbd=document.getElementById('lbd');
let cur=0;
function openLb(i){cur=i;render();lb.classList.add('open');}
function closeLb(){lb.classList.remove('open');}
function step(d){cur=(cur+d+ART.length)%ART.length;render();}
function render(){const a=ART[cur];lbimg.src=a.url;lbimg.alt=a.title;lbt.textContent=a.title;lbm.textContent=a.meta;lbd.textContent=a.cap;}
lb.addEventListener('click',e=>{if(e.target===lb)closeLb();});
document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;
  if(e.key==='Escape')closeLb();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});
</script>
</body></html>`;

fs.writeFileSync(path.join(DIST, 'index.html'), html);
console.log(`Wrote ${path.join(DIST, 'index.html')}`);
console.log(`${flat.length} images across ${sectionHtml.length} collections`);
const placed = new Set(flat.map(x => decodeURIComponent(x.url.replace('images/',''))));
const orphans = all.filter(f => !placed.has(f));
if (orphans.length) console.log('NOTE: images with no matching GROUP (add a prefix):', orphans.join(', '));
