const BSCI_EDIT = (() => {
  const EYE = "M8 3C4.4 3 1.7 5.4.6 7.6a.9.9 0 0 0 0 .8C1.7 10.6 4.4 13 8 13s6.3-2.4 7.4-4.6a.9.9 0 0 0 0-.8C14.3 5.4 11.6 3 8 3zm0 8.4A3.4 3.4 0 1 1 8 4.6a3.4 3.4 0 0 1 0 6.8zm0-5.3a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z";
  const EYE_OFF = "M2.3 1.3a.75.75 0 0 0-1.06 1.06l12.4 12.4a.75.75 0 0 0 1.06-1.06l-1.7-1.7c1.1-.85 1.9-1.9 2.4-2.9a.9.9 0 0 0 0-.8C14.3 5.4 11.6 3 8 3c-1.3 0-2.4.3-3.4.8L2.3 1.3zm4.4 4.4 3.6 3.6A3.4 3.4 0 0 0 6.7 5.7zM.6 7.6C1.2 6.4 2.1 5.3 3.3 4.4l1.6 1.6a3.4 3.4 0 0 0 4.7 4.7l1.4 1.4c-.9.6-1.9.9-3 .9-3.6 0-6.3-2.4-7.4-4.6a.9.9 0 0 1 0-.8z";
  function icon(d, box) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", box);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
    return svg;
  }

  let active = null;

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function shortName(feature) {
    const name = feature.name.replace(/^Hide /, "").replace(/^"(.*)"$/, "$1");
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function start({ features, isOn, onSave, onEnd }) {
    if (active) return;
    const draft = {};
    for (const feature of features) draft[feature.id] = isOn(feature);

    const layer = element("div", "bsci-edit-layer");
    const bar = element("div", "bsci-edit-bar");
    bar.appendChild(element("span", "bsci-edit-text", "Click the eye on a highlighted section to hide or show it."));
    const cancel = element("button", "btnv6_blue_hoverfade btn_medium bsci-edit-cancel");
    cancel.type = "button";
    cancel.appendChild(element("span", "", "Cancel"));
    const save = element("button", "btnv6_blue_hoverfade btn_medium bsci-edit-save");
    save.type = "button";
    save.appendChild(element("span", "", "Save"));
    bar.appendChild(cancel);
    bar.appendChild(save);
    document.body.appendChild(layer);
    document.body.appendChild(bar);

    const items = new Map();

    function paint(item) {
      const hidden = draft[item.feature.id];
      item.box.classList.toggle("bsci-edit-hidden", hidden);
      const name = document.createElement("span");
      name.textContent = shortName(item.feature);
      item.btn.replaceChildren(icon(hidden ? EYE_OFF : EYE, "0 0 16 16"), name);
      item.btn.title = (hidden ? "Hidden: " : "Visible: ") + shortName(item.feature) + ". Click to " + (hidden ? "show" : "hide") + ".";
    }

    function clippers(el) {
      const list = [];
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowX !== "visible" || cs.overflowY !== "visible") list.push(p);
      }
      return list;
    }

    function scan() {
      for (const feature of features) {
        if (!feature.hide || feature.hide.length === 0) continue;
        const found = [...document.querySelectorAll(feature.hide.join(","))]
          .filter((el) => !el.closest(".bsci-panel, .bsci-edit-layer, .bsci-edit-bar"));
        let item = items.get(feature.id);
        if (found.length === 0) {
          if (item) {
            item.box.remove();
            items.delete(feature.id);
          }
          continue;
        }
        if (!item) {
          const box = element("div", "bsci-edit-box");
          const btn = element("button", "bsci-edit-eye");
          btn.type = "button";
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            draft[feature.id] = !draft[feature.id];
            paint(items.get(feature.id));
          });
          box.appendChild(btn);
          layer.appendChild(box);
          item = { feature, box, btn, els: [] };
          items.set(feature.id, item);
          paint(item);
        }
        item.els = found.map((el) => ({ el, clip: clippers(el) }));
      }
    }

    function visibleRect({ el, clip }) {
      const r = el.getBoundingClientRect();
      let top = r.top;
      let left = r.left;
      let right = r.right;
      let bottom = r.bottom;
      for (const p of clip) {
        const c = p.getBoundingClientRect();
        top = Math.max(top, c.top);
        left = Math.max(left, c.left);
        right = Math.min(right, c.right);
        bottom = Math.min(bottom, c.bottom);
      }
      return right - left > 0 && bottom - top > 0 ? { top, left, right, bottom } : null;
    }

    let frame = 0;
    function place() {
      for (const item of items.values()) {
        let u = null;
        for (const entry of item.els) {
          const r = visibleRect(entry);
          if (!r) continue;
          u = u ? {
            top: Math.min(u.top, r.top),
            left: Math.min(u.left, r.left),
            right: Math.max(u.right, r.right),
            bottom: Math.max(u.bottom, r.bottom)
          } : r;
        }
        if (!u) {
          item.box.style.display = "none";
          continue;
        }
        item.box.style.display = "";
        item.box.classList.toggle("bsci-edit-small", u.bottom - u.top < 44);
        item.box.style.top = u.top + window.scrollY + "px";
        item.box.style.left = u.left + window.scrollX + "px";
        item.box.style.width = u.right - u.left + "px";
        item.box.style.height = u.bottom - u.top + "px";
      }
      frame = requestAnimationFrame(place);
    }

    function onKey(e) {
      if (e.key === "Escape") finish(false);
    }

    function finish(keep) {
      if (!active) return;
      cancelAnimationFrame(frame);
      clearInterval(timer);
      document.removeEventListener("keydown", onKey);
      layer.remove();
      bar.remove();
      active = null;
      if (keep) onSave({ ...draft });
      onEnd();
    }

    cancel.addEventListener("click", () => finish(false));
    save.addEventListener("click", () => finish(true));
    document.addEventListener("keydown", onKey);

    active = { finish };
    scan();
    const timer = setInterval(scan, 1000);
    place();
  }

  return { start, isActive: () => !!active, stop: () => active && active.finish(false) };
})();
