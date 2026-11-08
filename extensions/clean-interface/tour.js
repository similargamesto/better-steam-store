const BSCI_TOUR = (() => {
  let active = null;

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function button(className, text, onClick) {
    const b = element("button", className);
    b.type = "button";
    if (className.includes("btnv6")) b.appendChild(element("span", "", text));
    else b.textContent = text;
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return b;
  }

  function start(steps, onEnd) {
    if (active || steps.length === 0) return;
    const ring = element("div", "bsci-tour-ring");
    const bubble = element("div", "bsci-tour-bubble");
    document.body.appendChild(ring);
    document.body.appendChild(bubble);

    let index = -1;
    let target = null;
    let frame = 0;
    let waiting = 0;
    let lostSince = 0;
    let unhook = null;

    const BLOCK = ["click", "auxclick", "dblclick", "pointerdown", "mousedown", "pointerup", "mouseup"];

    function allowed(node) {
      if (node === document.documentElement) return true;
      if (!node || !node.closest) return false;
      if (bubble.contains(node)) return true;
      if (target && target.isConnected && target.contains(node)) return true;
      const step = steps[index];
      return !!(step && step.allow && node.closest(step.allow));
    }

    function block(e) {
      if (allowed(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    function hush(e) {
      if (e.target && e.target.tagName === "VIDEO") e.target.pause();
    }

    function finish() {
      if (!active) return;
      document.removeEventListener("play", hush, true);
      for (const type of BLOCK) window.removeEventListener(type, block, true);
      cancelAnimationFrame(frame);
      clearTimeout(waiting);
      if (unhook) unhook();
      ring.remove();
      bubble.remove();
      document.removeEventListener("keydown", onKey, true);
      active = null;
      if (onEnd) onEnd();
    }

    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        confirmSkip();
      }
    }

    function stopEvents(el) {
      for (const type of ["pointerdown", "mousedown", "click"]) el.addEventListener(type, (e) => e.stopPropagation());
    }

    function confirmSkip() {
      bubble.textContent = "";
      bubble.appendChild(element("div", "bsci-tour-title", "Skip the tour?"));
      bubble.appendChild(element("p", "bsci-tour-text", "Everything is still under the Clean Interface button."));
      const foot = element("div", "bsci-tour-foot");
      foot.appendChild(element("span", "bsci-tour-count", ""));
      foot.appendChild(button("bsci-tour-skip", "Back", () => show(index)));
      foot.appendChild(button("btnv6_blue_hoverfade btn_medium bsci-tour-next", "Skip tour", finish));
      bubble.appendChild(foot);
    }

    function render(step) {
      bubble.textContent = "";
      bubble.appendChild(element("div", "bsci-tour-title", step.title));
      bubble.appendChild(element("p", "bsci-tour-text", step.text));
      const foot = element("div", "bsci-tour-foot");
      foot.appendChild(element("span", "bsci-tour-count", index + 1 + " / " + steps.length));
      if (!step.done) foot.appendChild(button("bsci-tour-skip", "Skip", confirmSkip));
      if (step.done) foot.appendChild(button("btnv6_blue_hoverfade btn_medium bsci-tour-next", step.done, finish));
      bubble.appendChild(foot);
    }

    function show(i, tries) {
      clearTimeout(waiting);
      if (unhook) {
        unhook();
        unhook = null;
      }
      index = Math.max(0, i);
      if (index >= steps.length) {
        finish();
        return;
      }
      const step = steps[index];
      target = step.target();
      if (!target) {
        bubble.style.visibility = "hidden";
        ring.style.visibility = "hidden";
        if ((tries || 0) < 30) waiting = setTimeout(() => show(index, (tries || 0) + 1), 100);
        else finish();
        return;
      }
      bubble.style.visibility = "";
      ring.style.visibility = "";
      lostSince = 0;
      if (step.scroll) step.scroll(target);
      render(step);
      if (step.clickToContinue) {
        const clicked = target;
        const onClick = () => setTimeout(() => show(index + 1), 50);
        clicked.addEventListener("click", onClick, true);
        unhook = () => clicked.removeEventListener("click", onClick, true);
      }
    }

    function place() {
      if (target && !target.isConnected && steps[index] && steps[index].backIfGone) {
        if (!lostSince) lostSince = Date.now();
        if (Date.now() - lostSince > 300) show(index - 1);
      }
      if (target && target.isConnected) {
        const r = target.getBoundingClientRect();
        const pad = 6;
        ring.style.top = r.top - pad + "px";
        ring.style.left = r.left - pad + "px";
        ring.style.width = r.width + pad * 2 + "px";
        ring.style.height = r.height + pad * 2 + "px";

        const bw = bubble.offsetWidth;
        const bh = bubble.offsetHeight;
        const gap = 18;
        const below = r.bottom + pad + gap + bh <= window.innerHeight - 8 || r.top - pad - gap - bh < 8;
        const top = below ? r.bottom + pad + gap : r.top - pad - gap - bh;
        const center = r.left + r.width / 2;
        const left = Math.max(12, Math.min(center - bw / 2, document.documentElement.clientWidth - bw - 12));
        bubble.style.top = Math.max(8, top) + "px";
        bubble.style.left = left + "px";
        bubble.classList.toggle("is-below", below);
        bubble.classList.toggle("is-above", !below);
        bubble.style.setProperty("--bsci-arrow", Math.max(18, Math.min(center - left, bw - 18)) + "px");
      }
      frame = requestAnimationFrame(place);
    }

    stopEvents(bubble);
    for (const type of BLOCK) window.addEventListener(type, block, true);
    document.addEventListener("play", hush, true);
    for (const video of document.querySelectorAll("video")) video.pause();
    active = { finish };
    document.addEventListener("keydown", onKey, true);
    show(0);
    place();
  }

  return { start, isActive: () => !!active, stop: () => active && active.finish() };
})();
