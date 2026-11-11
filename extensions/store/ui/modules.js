const BSS_MODULES = [
  {
    id: "recommendations",
    name: "Better similar games",
    short: "Better picks in the \"More like this\" row",
    long: "Steam's \"More like this\" row shows the Games like list from SimilarGames.To, in Steam's own design. Hover a card to vote on whether it's really similar."
  },
  {
    id: "alsoPlay",
    name: "Players also play",
    short: "A new row with what the same players play",
    long: "A new row under \"More like this\" with the games the same players also play."
  },
  {
    id: "cleanInterface",
    name: "Clean Interface",
    short: "Hide what you don't need on store pages",
    long: "Hide the parts of the store page you don't need and make the rows you keep smaller."
  }
];

const BSS_SITE = "https://similargames.to/";

function bssFeatures() {
  return typeof BSCI_FEATURES === "undefined" ? [] : BSCI_FEATURES;
}

function bssLoad() {
  return chrome.storage.sync.get(["bss", "bsci"]).then((stored) => {
    const flags = stored.bss && typeof stored.bss === "object" ? stored.bss : {};
    const clean = stored.bsci && typeof stored.bsci === "object" ? stored.bsci : {};
    return { flags: { ...flags }, clean: { settings: { ...(clean.settings || {}) }, setupDone: !!clean.setupDone } };
  }, () => ({ flags: {}, clean: { settings: {}, setupDone: false } }));
}

function bssModuleOn(flags, id) {
  return flags[id] !== false;
}

function bssFeatureOn(clean, feature) {
  const value = clean.settings[feature.id];
  return typeof value === "boolean" ? value : feature.default !== false;
}

function bssCleanSummary(clean) {
  const features = bssFeatures();
  const on = features.filter((f) => bssFeatureOn(clean, f)).length;
  if (on === 0) return "Nothing hidden yet";
  return on + " of " + features.length + " options on";
}

function bssEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function bssSwitch(checked, label) {
  const input = bssEl("input", "switch");
  input.type = "checkbox";
  input.checked = checked;
  input.setAttribute("role", "switch");
  if (label) input.setAttribute("aria-label", label);
  return input;
}
