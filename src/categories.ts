/**
 * The signature corpus.
 *
 * Every template is a pair: a `message` (the body of the sign-off) and a
 * `signer` (how the name itself is written). Both support the placeholders
 * {name}, {title}, {company} and {recipient}; unresolved placeholders are
 * dropped by the renderer so a template never leaks braces to a caller.
 */
export interface Template {
  /** The sign-off line, e.g. "Best regards,". */
  message: string;
  /** How the name is presented, e.g. "Cap'n {name}". Defaults to "{name}". */
  signer?: string;
}

export interface Category {
  /** URL slug, e.g. "passive-aggressive". */
  slug: string;
  /** Human readable name for docs and the homepage. */
  name: string;
  /** One line description. */
  description: string;
  /** Alternate slugs that resolve to this category. */
  aliases: string[];
  templates: Template[];
}

export const CATEGORIES: Category[] = [
  {
    slug: "normal",
    name: "Normal",
    description: "Standard, polite sign-offs that will never get you in trouble.",
    aliases: ["standard", "polite"],
    templates: [
      { message: "Best regards," },
      { message: "Kind regards," },
      { message: "Thanks for your time," },
      { message: "All the best," },
      { message: "Looking forward to hearing from you," },
      { message: "Warm regards," },
      { message: "Talk soon," },
    ],
  },
  {
    slug: "business",
    name: "Business",
    description: "Corporate and highly professional. Pairs well with ?title= and ?company=.",
    aliases: ["corporate", "professional", "formal"],
    templates: [
      { message: "Respectfully yours," },
      { message: "Yours in synergy," },
      { message: "Please let me know how you would like to proceed," },
      { message: "Happy to take this offline if that is easier," },
      { message: "Thank you for the partnership," },
      { message: "At your convenience," },
      { message: "Circling back with next steps shortly," },
    ],
  },
  {
    slug: "funny",
    name: "Funny",
    description: "Humorous and lighthearted.",
    aliases: ["humor", "humour", "jokes"],
    templates: [
      { message: "Stay out of trouble. Or don't." },
      { message: "Sent from my phone, so blame the typos on physics." },
      { message: "I have run out of email and must go now." },
      { message: "May your coffee be strong and your meetings be cancelled." },
      { message: "This message was written by a professional. Do not attempt." },
      { message: "Anyway, that's enough words for one day." },
      { message: "Yours, until the next reply-all incident," },
    ],
  },
  {
    slug: "mad",
    name: "Mad",
    description: "Aggressive, fed up, and completely out of patience.",
    aliases: ["angry", "furious", "annoyed"],
    templates: [
      { message: "Do not reply to this." },
      { message: "I am done discussing this." },
      { message: "Figure it out." },
      { message: "This is the last time I explain this." },
      { message: "Consider this matter closed." },
      { message: "Lose my address." },
      { message: "Absolutely not," },
    ],
  },
  {
    slug: "passive-aggressive",
    name: "Passive-Aggressive",
    description: "Subtly hostile corporate speak. Deniable, but only barely.",
    aliases: ["passive_aggressive", "passiveaggressive", "pa"],
    templates: [
      { message: "Per my last email," },
      { message: "I trust you can figure it out from here." },
      { message: "Just circling back on this, again." },
      { message: "As previously discussed (twice)," },
      { message: "Happy to walk you through it a third time," },
      { message: "Adding some people to this thread for visibility." },
      { message: "Let me know if anything about this is still unclear." },
      { message: "Reattaching the document that was already attached." },
    ],
  },
  {
    slug: "overly-enthusiastic",
    name: "Overly Enthusiastic",
    description: "Way too much energy for an email.",
    aliases: ["enthusiastic", "hype", "excited"],
    templates: [
      { message: "STAY AWESOME AND CRUSH IT!!! \u{1F680}\u{1F525}" },
      { message: "SO PUMPED FOR THIS!!! LET'S GOOOO!!! \u{1F389}" },
      { message: "BEST EMAIL OF MY ENTIRE LIFE!!! THANK YOU!!!" },
      { message: "ONWARD AND UPWARD, LEGEND!!! \u{2B06}\u{FE0F}\u{2728}" },
      { message: "YOU ARE ABSOLUTELY SMASHING IT!!! \u{1F4AA}" },
      { message: "CANNOT WAIT TO DO THIS AGAIN!!! \u{1F31F}" },
      { message: "HAVE THE MOST INCREDIBLE DAY EVER!!!" },
    ],
  },
  {
    slug: "gen-z",
    name: "Gen-Z",
    description: "Heavy use of modern internet slang.",
    aliases: ["genz", "gen_z", "zoomer"],
    templates: [
      { message: "No cap, this email is over." },
      { message: "Ok that's the whole vibe, bye." },
      { message: "Lowkey done typing now." },
      { message: "It's giving end of message." },
      { message: "Anyway, slay." },
      { message: "Bet. Talk later." },
      { message: "That's so real of you, ttyl." },
    ],
  },
  {
    slug: "cryptic",
    name: "Cryptic",
    description: "Mysterious, ominous, and deeply unhelpful.",
    aliases: ["mysterious", "vague"],
    templates: [
      { message: "The owl flies at midnight." },
      { message: "Burn this after reading." },
      { message: "You already know what to do." },
      { message: "The package is where we agreed." },
      { message: "Say nothing to the others." },
      { message: "Three knocks. Never four." },
      { message: "We were never here." },
    ],
  },
  {
    slug: "shakespearean",
    name: "Shakespearean",
    description: "Old English, poetic flair, an unreasonable number of thees.",
    aliases: ["shakespeare", "bard", "olde"],
    templates: [
      { message: "I bid thee farewell,", signer: "thy humble servant, {name}" },
      { message: "Parting is such sweet sorrow,", signer: "thine ever, {name}" },
      { message: "Fare thee well, and prosper,", signer: "thy loyal {name}" },
      { message: "Anon, good friend, anon.", signer: "thy servant, {name}" },
      { message: "Thus concludes this humble missive,", signer: "{name}, of the quill" },
      { message: "Get thee to thine inbox,", signer: "thy wretched correspondent, {name}" },
    ],
  },
  {
    slug: "existential-dread",
    name: "Existential Dread",
    description: "Nihilistic, bleak, and technically still a valid sign-off.",
    aliases: ["existential", "dread", "nihilist", "nihilism"],
    templates: [
      { message: "Nothing matters anyway." },
      { message: "We will all be forgotten, but here is the attachment." },
      { message: "The heat death of the universe is also on the roadmap." },
      { message: "Reply, don't reply. The void is patient." },
      { message: "Another email, another second closer to the end." },
      { message: "Nothing we ship will outlive the sun." },
      { message: "Sent into the indifferent dark," },
    ],
  },
  {
    slug: "sci-fi",
    name: "Sci-Fi / Robot",
    description: "Automated, futuristic, faintly threatening sign-offs.",
    aliases: ["scifi", "sci_fi", "robot", "android"],
    templates: [
      { message: "End of transmission. Unit {name} powering down.", signer: "UNIT {name}" },
      { message: "Message compiled successfully. Terminating link.", signer: "UNIT {name}" },
      { message: "Awaiting further instruction, carbon-based lifeform.", signer: "UNIT {name}" },
      { message: "Signal degrading. Retransmit if unread.", signer: "UNIT {name}" },
      { message: "This unit has fulfilled its communication quota.", signer: "UNIT {name}" },
      { message: "Sent across four light-years and one firewall.", signer: "UNIT {name}" },
    ],
  },
  {
    slug: "apocalyptic",
    name: "Apocalyptic",
    description: "Survivalist tone for the post-inbox world.",
    aliases: ["apocalypse", "wasteland", "doomsday"],
    templates: [
      { message: "Stay safe in the wasteland." },
      { message: "Ration your replies. There are not many left." },
      { message: "Trade in canned goods, not calendar invites." },
      { message: "If the radio goes quiet, keep heading north." },
      { message: "Boil the water. Trust no one. Reply by dusk." },
      { message: "Keep your inbox loaded and your door barred." },
      { message: "See you on the other side of it,", signer: "Survivor {name}" },
    ],
  },
  {
    slug: "pirate",
    name: "Pirate",
    description: "Swashbuckling sign-offs for the seven seas.",
    aliases: ["pirates", "arr", "buccaneer"],
    templates: [
      { message: "Fair winds and following seas,", signer: "Cap'n {name}" },
      { message: "May yer anchor be tight and yer compass true.", signer: "Cap'n {name}" },
      { message: "Reply swift, or walk the plank.", signer: "Cap'n {name}" },
      { message: "Yo ho, and mind the kraken.", signer: "Cap'n {name}" },
      { message: "The treasure be in the attachment, savvy?", signer: "Cap'n {name}" },
      { message: "Dead men send no follow-ups.", signer: "Cap'n {name}" },
      { message: "Arrr, that be all for now.", signer: "Cap'n {name}" },
    ],
  },
  {
    slug: "needy",
    name: "Needy",
    description: "Desperate for a response. Any response.",
    aliases: ["clingy", "desperate"],
    templates: [
      { message: "Please write back soon, I'm waiting here..." },
      { message: "Did I say something wrong? It's fine either way. Is it?" },
      { message: "You don't have to reply. But it would mean a lot." },
      { message: "Still refreshing my inbox. No pressure." },
      { message: "I'll just be here. Waiting. Whenever you're ready." },
      { message: "Even a one-word reply would honestly make my week." },
      { message: "Sorry for the follow-up. And for this follow-up." },
    ],
  },
];

const INDEX = new Map<string, Category>();
for (const category of CATEGORIES) {
  INDEX.set(category.slug, category);
  for (const alias of category.aliases) INDEX.set(alias, category);
}

/** Normalizes a user supplied slug: lowercase, underscores/spaces to dashes. */
export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function findCategory(slug: string): Category | undefined {
  return INDEX.get(normalizeSlug(slug));
}
