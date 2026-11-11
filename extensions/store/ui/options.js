(() => {
  const modules = document.getElementById("modules");
  const groups = document.getElementById("groups");
  const nav = document.getElementById("nav");
  const summary = document.getElementById("clean-summary");
  const clean = document.getElementById("clean");
  const offNote = document.getElementById("clean-off");
  const toast = document.getElementById("toast");
  let state = { flags: {}, clean: { settings: {}, setupDone: false } };
  let toastTimer = 0;

  document.getElementById("version").textContent = "Version " + chrome.runtime.getManifest().version;

  function slug(text) {
    return "g-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function grouped() {
    const out = [];
    for (const feature of bssFeatures()) {
      const name = feature.group || "Other";
      let group = out.find((g) => g.name === name);
      if (!group) {
        group = { name, features: [] };
        out.push(group);
      }
      group.features.push(feature);
    }
    return out;
  }

  function saved() {
    toast.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 1200);
  }

  function saveFlags() {
    chrome.storage.sync.set({ bss: state.flags }).then(saved, () => {});
  }

  function saveClean() {
    chrome.storage.sync.set({ bsci: { settings: state.clean.settings, setupDone: true } }).then(saved, () => {});
  }

  function buildNav() {
    nav.textContent = "";
    const link = (href, text, className) => {
      const a = bssEl("a", className || "", text);
      a.href = href;
      nav.appendChild(a);
    };
    link("#features", "Features");
    link("#clean", "Clean Interface");
    for (const group of grouped()) link("#" + slug(group.name), group.name, "nav-sub");
    link("#about", "About");
  }

  function renderModules() {
    modules.textContent = "";
    for (const module of BSS_MODULES) {
      const row = bssEl("label", "row module");
      const text = bssEl("span", "row-text");
      text.appendChild(bssEl("span", "row-name", module.name));
      text.appendChild(bssEl("span", "row-desc", module.long));
      row.appendChild(text);
      const toggle = bssSwitch(bssModuleOn(state.flags, module.id), module.name);
      toggle.addEventListener("change", () => {
        state.flags[module.id] = toggle.checked;
        saveFlags();
        renderClean();
      });
      row.appendChild(toggle);
      modules.appendChild(row);
    }
  }

  function renderClean() {
    const on = bssModuleOn(state.flags, "cleanInterface");
    clean.classList.toggle("is-off", !on);
    offNote.hidden = on;
    summary.textContent = bssCleanSummary(state.clean) + ". Each switch hides or shrinks one part of the store page.";
    groups.textContent = "";
    for (const group of grouped()) {
      const box = bssEl("div", "group");
      box.id = slug(group.name);
      const title = bssEl("div", "group-title", group.name);
      const count = group.features.filter((f) => bssFeatureOn(state.clean, f)).length;
      title.appendChild(bssEl("span", "group-count", count + " / " + group.features.length));
      box.appendChild(title);
      const card = bssEl("div", "card");
      for (const feature of group.features) {
        const row = bssEl("label", "row");
        const text = bssEl("span", "row-text");
        text.appendChild(bssEl("span", "row-name", feature.name));
        if (feature.description) text.appendChild(bssEl("span", "row-desc", feature.description));
        row.appendChild(text);
        const toggle = bssSwitch(bssFeatureOn(state.clean, feature), feature.name);
        toggle.disabled = !on;
        toggle.addEventListener("change", () => {
          state.clean.settings[feature.id] = toggle.checked;
          saveClean();
          renderClean();
        });
        row.appendChild(toggle);
        card.appendChild(row);
      }
      box.appendChild(card);
      groups.appendChild(box);
    }
  }

  function render() {
    renderModules();
    renderClean();
  }

  document.getElementById("reset").addEventListener("click", () => {
    state.clean.settings = {};
    saveClean();
    renderClean();
  });

  function markCurrent() {
    let current = null;
    for (const a of nav.querySelectorAll("a")) {
      const target = document.querySelector(a.getAttribute("href"));
      if (target && target.getBoundingClientRect().top < 140) current = a;
    }
    for (const a of nav.querySelectorAll("a")) a.classList.toggle("is-current", a === current);
  }

  window.addEventListener("scroll", markCurrent, { passive: true });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || (!changes.bss && !changes.bsci)) return;
    bssLoad().then((next) => {
      state = next;
      render();
    });
  });

  buildNav();
  bssLoad().then((loaded) => {
    state = loaded;
    render();
    markCurrent();
  });
})();
