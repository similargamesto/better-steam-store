(() => {
  const list = document.getElementById("modules");
  const reload = document.getElementById("reload");
  const edit = document.getElementById("edit");
  const hint = document.getElementById("hint");
  let state = { flags: {}, clean: { settings: {}, setupDone: false } };
  let tab = null;
  let page = false;

  document.getElementById("version").textContent = "Version " + chrome.runtime.getManifest().version;

  function render() {
    list.textContent = "";
    for (const module of BSS_MODULES) {
      const row = bssEl("label", "row");
      const text = bssEl("span", "row-text");
      text.appendChild(bssEl("span", "row-name", module.name));
      const desc = module.id === "cleanInterface" && bssModuleOn(state.flags, module.id)
        ? bssCleanSummary(state.clean)
        : module.short;
      text.appendChild(bssEl("span", "row-desc", desc));
      row.appendChild(text);
      const toggle = bssSwitch(bssModuleOn(state.flags, module.id), module.name);
      toggle.addEventListener("change", () => {
        state.flags[module.id] = toggle.checked;
        chrome.storage.sync.set({ bss: state.flags }).catch(() => {});
        if (page && module.id !== "cleanInterface") reload.hidden = false;
        render();
      });
      row.appendChild(toggle);
      list.appendChild(row);
    }
    updateEdit();
  }

  function updateEdit() {
    const cleanOn = bssModuleOn(state.flags, "cleanInterface");
    edit.disabled = !page || !cleanOn;
    hint.hidden = !edit.disabled;
    hint.textContent = !cleanOn
      ? "Turn on Clean Interface to edit store pages."
      : "Open a game's Steam store page to edit it.";
  }

  edit.addEventListener("click", () => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { type: "bsci-edit" }, () => {
      void chrome.runtime.lastError;
      window.close();
    });
  });

  document.getElementById("settings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  document.getElementById("reload-btn").addEventListener("click", () => {
    if (tab) chrome.tabs.reload(tab.id);
    window.close();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || (!changes.bss && !changes.bsci)) return;
    bssLoad().then((next) => {
      state = next;
      render();
    });
  });

  bssLoad().then((loaded) => {
    state = loaded;
    render();
  });

  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    tab = tabs[0] || null;
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { type: "bss-page" }, (res) => {
      page = !chrome.runtime.lastError && !!res;
      updateEdit();
    });
  }, () => {});
})();
