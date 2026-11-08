(() => {
  const FEATURES = typeof BSCI_FEATURES === "undefined" ? [] : BSCI_FEATURES;
  const CONTAINERS = typeof BSCI_CONTAINERS === "undefined" ? [] : BSCI_CONTAINERS;
  const KEY = "bsci";
  const MIRROR = "bsci-on";
  const root = document.documentElement;
  if (root.hasAttribute("data-bsci-owner")) return;
  root.setAttribute("data-bsci-owner", "");

  let state = { settings: {}, setupDone: false };
  let loaded = false;
  let panel = null;
  let button = null;
  let editing = false;
  let peeked = [];
  let peekTimer = 0;

  const rules = [];
  for (const feature of FEATURES) {
    const scope = "html.bsci-" + feature.id + " ";
    if (Array.isArray(feature.hide) && feature.hide.length > 0) {
      rules.push(feature.hide.map((selector) => scope + selector + ":not(.bsci-peek)").join(",\n") + " {\n  display: none !important;\n}");
    }
    for (const [selector, declarations] of feature.style || []) {
      rules.push(scope + selector + " {\n  " + declarations + "\n}");
    }
    if (feature.carousel) {
      const compact = scope + feature.carousel.target + "[data-bsci-compact] ";
      rules.push(compact + ".carousel__slider-tray {\n  width: var(--bsci-tray) !important;\n}");
      rules.push(compact + ".carousel__inner-slide > [style*=\"min-height\"] {\n  min-height: 0 !important;\n  min-width: 0 !important;\n}");
      const t = scope + feature.carousel.target;
      rules.push(scope + ".related_items_ctn:has(" + feature.carousel.target + ") {\n  padding-top: 20px !important;\n  padding-bottom: 10px !important;\n}");
      rules.push(t + " > div > .Panel {\n  padding-top: 12px !important;\n  padding-bottom: 8px !important;\n  margin-bottom: 10px !important;\n}");
      rules.push(t + " .carousel__slider {\n  padding-top: 6px !important;\n  padding-bottom: 6px !important;\n}");
      rules.push(t + " .carousel > :last-child {\n  margin-top: -6px !important;\n  margin-bottom: -10px !important;\n}");
    }
  }
  const style = document.createElement("style");
  style.textContent = rules.join("\n");
  (document.head || root).appendChild(style);

  try {
    for (const id of JSON.parse(localStorage.getItem(MIRROR) || "[]")) root.classList.add("bsci-" + id);
  } catch {}

  function suppressed(el) {
    if (el.classList.contains("bsci-peek")) return false;
    for (const feature of FEATURES) {
      if (!feature.hide || !root.classList.contains("bsci-" + feature.id)) continue;
      if (feature.hide.some((selector) => el.matches(selector))) return true;
    }
    return false;
  }

  function placeholder(el) {
    return !el.hasAttribute("data-featuretarget") && el.children.length === 0 && !el.textContent.trim();
  }

  function collapse() {
    for (const selector of CONTAINERS) {
      for (const container of document.querySelectorAll(selector)) {
        const content = container.querySelector(":scope > .page_content") || container;
        const empty = [...content.children].every((child) => suppressed(child) || placeholder(child));
        container.classList.toggle("bsci-collapsed", empty);
      }
    }
  }

  function compactCarousels() {
    for (const feature of FEATURES) {
      if (!feature.carousel) continue;
      for (const target of document.querySelectorAll(feature.carousel.target)) {
        const tray = target.querySelector(".carousel__slider-tray");
        const row = target.querySelector("[class*=\"items_in_row_\"]");
        const visible = row ? Number((row.className.match(/items_in_row_(\d+)/) || [])[1]) : 0;
        const width = tray ? parseFloat(tray.style.width) : 0;
        if (!visible || !width) continue;
        const slides = Math.round((width / 100) * visible);
        const per = feature.carousel.perRow;
        const gap = parseFloat(getComputedStyle(tray).columnGap) || 0;
        const tray2 = slides <= per
          ? "100%"
          : "calc(" + slides + " * (100% - " + (per - 1) * gap + "px) / " + per + " + " + (slides - 1) * gap + "px)";
        if (target.style.getPropertyValue("--bsci-tray") !== tray2) target.style.setProperty("--bsci-tray", tray2);
        if (!target.hasAttribute("data-bsci-compact")) target.setAttribute("data-bsci-compact", "");
      }
    }
  }

  function watchCarousels() {
    const targets = FEATURES.filter((f) => f.carousel).map((f) => f.carousel.target);
    if (targets.length === 0) return;
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        compactCarousels();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
    compactCarousels();
  }

  function watchContainers() {
    const observer = new MutationObserver(collapse);
    for (const selector of CONTAINERS) {
      for (const container of document.querySelectorAll(selector)) {
        observer.observe(container.querySelector(":scope > .page_content") || container, { childList: true });
      }
    }
    collapse();
  }

  function isOn(feature) {
    const value = state.settings[feature.id];
    return typeof value === "boolean" ? value : feature.default !== false;
  }

  function applyClasses() {
    const active = (state.setupDone || !!panel) && !editing;
    const on = [];
    for (const feature of FEATURES) {
      const enabled = active && isOn(feature);
      root.classList.toggle("bsci-" + feature.id, enabled);
      if (enabled) on.push(feature.id);
    }
    try {
      localStorage.setItem(MIRROR, JSON.stringify(on));
    } catch {}
    collapse();
  }

  function save() {
    chrome.storage.sync.set({ [KEY]: state }).catch(() => {});
  }

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  const EYE = "M8 3C4.4 3 1.7 5.4.6 7.6a.9.9 0 0 0 0 .8C1.7 10.6 4.4 13 8 13s6.3-2.4 7.4-4.6a.9.9 0 0 0 0-.8C14.3 5.4 11.6 3 8 3zm0 8.4A3.4 3.4 0 1 1 8 4.6a3.4 3.4 0 0 1 0 6.8zm0-5.3a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z";
  function icon(d, box) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", box);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
    return svg;
  }

  function endPeek() {
    clearTimeout(peekTimer);
    for (const el of peeked) el.classList.remove("bsci-peek", "bsci-peek-hidden");
    peeked = [];
    if (panel) panel.classList.remove("bsci-faded");
    collapse();
  }

  function note(row, text) {
    const desc = row.querySelector(".bsci-desc");
    if (!desc || row.classList.contains("bsci-noted")) return;
    const original = desc.textContent;
    row.classList.add("bsci-noted");
    desc.textContent = text;
    setTimeout(() => {
      desc.textContent = original;
      row.classList.remove("bsci-noted");
    }, 2000);
  }

  function peek(feature, row) {
    endPeek();
    const hidden = !!feature.hide && root.classList.contains("bsci-" + feature.id);
    const selectors = feature.hide || (feature.carousel ? [feature.carousel.target] : feature.target ? [feature.target] : []);
    const els = selectors.length ? [...document.querySelectorAll(selectors.join(","))] : [];
    for (const el of els) {
      el.classList.add("bsci-peek");
      if (hidden) el.classList.add("bsci-peek-hidden");
    }
    peeked = els;
    collapse();
    const target = els.find((el) => el.offsetHeight > 0);
    if (!target) {
      endPeek();
      note(row, "Not on this page.");
      return;
    }
    const r = target.getBoundingClientRect();
    const offset = r.height > window.innerHeight * 0.7 ? 90 : (window.innerHeight - r.height) / 2;
    window.scrollTo({ top: Math.max(0, r.top + window.scrollY - offset), behavior: "smooth" });
    if (panel) panel.classList.add("bsci-faded");
    peekTimer = setTimeout(endPeek, 2200);
  }

  function buildPanel(first) {
    const box = element("div", "bsci-panel");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Clean Interface");

    const head = element("div", "bsci-head");
    head.appendChild(element("span", "bsci-title", "Clean Interface"));
    const actions = element("span", "bsci-actions");
    const reset = element("button", "bsci-x bsci-reset");
    reset.type = "button";
    reset.title = "Reset to defaults";
    reset.setAttribute("aria-label", "Reset to defaults");
    reset.appendChild(icon("M8 2.5a5.5 5.5 0 1 1-5.4 6.6.75.75 0 1 1 1.47-.3A4 4 0 1 0 5.2 4.6H7a.75.75 0 0 1 0 1.5H3.5a.75.75 0 0 1-.75-.75V1.85a.75.75 0 0 1 1.5 0v1.5A5.48 5.48 0 0 1 8 2.5z", "0 0 16 16"));
    reset.addEventListener("click", () => {
      state.settings = {};
      applyClasses();
      refreshPanel();
      save();
    });
    actions.appendChild(reset);
    const close = element("button", "bsci-x");
    close.type = "button";
    close.title = "Close";
    close.setAttribute("aria-label", "Close");
    close.textContent = "×";
    close.addEventListener("click", closePanel);
    actions.appendChild(close);
    head.appendChild(actions);
    box.appendChild(head);

    if (first) {
      box.appendChild(element("p", "bsci-intro",
        "Choose what to clean up on Steam store pages. Use the eye to see where each one is on the page. You can change this anytime with the Clean Interface button."));
    }

    const list = element("div", "bsci-list");
    if (FEATURES.length === 0) list.appendChild(element("p", "bsci-empty", "Nothing to set up yet."));
    let group = null;
    for (const feature of FEATURES) {
      if (feature.group && feature.group !== group) {
        group = feature.group;
        list.appendChild(element("div", "bsci-group", group));
      }
      const row = element("label", "bsci-row");
      const text = element("span", "bsci-text");
      text.appendChild(element("span", "bsci-name", feature.name));
      if (feature.description) text.appendChild(element("span", "bsci-desc", feature.description));
      row.appendChild(text);
      const eye = element("button", "bsci-eye");
      eye.type = "button";
      eye.title = "Show on page";
      eye.setAttribute("aria-label", "Show on page: " + feature.name);
      eye.appendChild(icon(EYE, "0 0 16 16"));
      eye.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        peek(feature, row);
      });
      row.appendChild(eye);
      const toggle = element("input", "bsci-switch");
      toggle.type = "checkbox";
      toggle.dataset.feature = feature.id;
      toggle.checked = isOn(feature);
      toggle.addEventListener("change", () => {
        state.settings[feature.id] = toggle.checked;
        applyClasses();
        save();
      });
      row.appendChild(toggle);
      list.appendChild(row);
    }
    box.appendChild(list);

    const foot = element("div", "bsci-foot");
    const edit = element("button", "btnv6_blue_hoverfade btn_medium bsci-edit");
    edit.type = "button";
    edit.title = "Pick what to hide directly on the page";
    edit.appendChild(element("span", "", "Edit on page"));
    edit.addEventListener("click", startEdit);
    foot.appendChild(edit);
    if (first) {
      const done = element("button", "btnv6_blue_hoverfade btn_medium bsci-done");
      done.type = "button";
      done.appendChild(element("span", "", "Done"));
      done.addEventListener("click", closePanel);
      foot.appendChild(done);
    }
    box.appendChild(foot);
    return box;
  }

  function onOutside(e) {
    if (e.target.closest && e.target.closest(".bsci-tour-bubble")) return;
    if (panel && !panel.contains(e.target) && !button.contains(e.target)) closePanel();
  }

  function onKey(e) {
    if (e.key === "Escape") closePanel();
  }

  function place() {
    if (!panel) return;
    const r = button.getBoundingClientRect();
    const width = panel.offsetWidth;
    const left = Math.max(8, Math.min(r.right - width, document.documentElement.clientWidth - width - 8));
    const top = Math.max(8, Math.min(r.bottom + 8, window.innerHeight - 248));
    panel.style.top = top + "px";
    panel.style.left = left + "px";
    panel.style.maxHeight = Math.max(240, window.innerHeight - top - 16) + "px";
  }

  function openPanel() {
    if (panel || !button) return;
    panel = buildPanel(!state.setupDone);
    document.body.appendChild(panel);
    place();
    button.classList.add("bsci-active");
    applyClasses();
    document.addEventListener("pointerdown", onOutside, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
  }

  function closePanel() {
    if (!panel) return;
    endPeek();
    panel.remove();
    panel = null;
    button.classList.remove("bsci-active");
    document.removeEventListener("pointerdown", onOutside, true);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", place);
    if (!state.setupDone) {
      state.setupDone = true;
      save();
    }
    applyClasses();
  }

  function scrollNear(el, part) {
    const r = el.getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, r.top + window.scrollY - window.innerHeight * part), behavior: "smooth" });
  }

  function tourSteps() {
    const pickEye = () => {
      const boxes = [...document.querySelectorAll(".bsci-edit-box")].filter((box) => box.style.display !== "none");
      boxes.sort((x, y) => x.getBoundingClientRect().top - y.getBoundingClientRect().top);
      return boxes.length ? boxes[0].querySelector(".bsci-edit-eye") : null;
    };
    return [
      {
        title: "Welcome to " + chrome.runtime.getManifest().name,
        text: "Click the Clean Interface button to see what it can do.",
        target: () => button,
        scroll: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        clickToContinue: true
      },
      {
        title: "Edit on page",
        text: "Here's every option. The quickest way is Edit on page: click it to hide sections right on the page.",
        target: () => (panel ? panel.querySelector(".bsci-edit") : null),
        allow: ".bsci-panel",
        clickToContinue: true,
        backIfGone: true
      },
      {
        title: "Click an eye",
        text: "Every outlined section can be hidden. Click this eye to hide it.",
        target: pickEye,
        allow: ".bsci-edit-eye, .bsci-edit-bar",
        scroll: (el) => scrollNear(el, 0.3),
        clickToContinue: true
      },
      {
        title: "Save when you're done",
        text: "Hide anything else you like, then press Save. Clicking an eye again brings a section back.",
        target: () => document.querySelector(".bsci-edit-save"),
        allow: ".bsci-edit-eye, .bsci-edit-bar",
        done: "Got it"
      }
    ];
  }

  function finishSetup() {
    if (state.setupDone) return;
    state.setupDone = true;
    save();
    applyClasses();
  }

  function startEdit() {
    if (typeof BSCI_EDIT === "undefined" || BSCI_EDIT.isActive()) return;
    closePanel();
    editing = true;
    applyClasses();
    BSCI_EDIT.start({
      features: FEATURES,
      isOn,
      onSave: (draft) => {
        state.settings = draft;
        state.setupDone = true;
        save();
      },
      onEnd: () => {
        editing = false;
        if (typeof BSCI_TOUR !== "undefined") BSCI_TOUR.stop();
        finishSetup();
        applyClasses();
      }
    });
  }

  let welcomed = false;
  function welcome() {
    if (welcomed || !button || !loaded || state.setupDone) return;
    welcomed = true;
    if (typeof BSCI_TOUR === "undefined") {
      openPanel();
      return;
    }
    BSCI_TOUR.start(tourSteps(), finishSetup);
  }

  function refreshPanel() {
    if (!panel) return;
    for (const toggle of panel.querySelectorAll(".bsci-switch")) {
      const feature = FEATURES.find((f) => f.id === toggle.dataset.feature);
      if (feature) toggle.checked = isOn(feature);
    }
  }

  function addButton() {
    if (button) return;
    const hub = document.querySelector(".apphub_OtherSiteInfo");
    if (!hub) return;
    button = element("a", "btnv6_blue_hoverfade btn_medium bsci-button");
    button.href = "#";
    button.appendChild(element("span", "", "Clean Interface"));
    button.addEventListener("click", (e) => {
      e.preventDefault();
      if (editing) return;
      if (panel) closePanel();
      else openPanel();
    });
    hub.appendChild(button);
    welcome();
  }

  chrome.storage.sync.get(KEY).then((stored) => {
    const saved = stored[KEY];
    if (saved && typeof saved === "object") state = { settings: saved.settings || {}, setupDone: !!saved.setupDone };
    loaded = true;
    applyClasses();
    welcome();
  }, () => {
    loaded = true;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[KEY] || !changes[KEY].newValue) return;
    const next = changes[KEY].newValue;
    state = { settings: next.settings || {}, setupDone: !!next.setupDone };
    applyClasses();
    refreshPanel();
  });

  function ready() {
    addButton();
    watchContainers();
    watchCarousels();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
