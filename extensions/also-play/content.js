(() => {
  const match = location.pathname.match(/^\/app\/(\d+)/);
  if (!match) return;
  if (document.documentElement.hasAttribute("data-bsa-owner")) return;
  document.documentElement.setAttribute("data-bsa-owner", "");

  const appId = Number(match[1]);
  const SITE = "https://similargames.to/";
  const TARGET = "storeitems-carousel";
  const HOLD = "bsa-hold";
  const ANCHOR = '[data-featuretarget][data-props*="more_like_this_carousel"]';
  const MIN_GAMES = 4;
  const MAX_GAMES = 20;
  const CACHE_TTL_MS = 60 * 60 * 1000;

  let data = null;
  let settled = false;
  let tooLate = false;
  let held = null;
  let done = false;

  function usable() {
    return !!data && data.appIds.length >= MIN_GAMES;
  }

  function makeBox(anchor) {
    let props;
    try {
      props = JSON.parse(anchor.getAttribute("data-props"));
    } catch {
      return null;
    }
    const box = anchor.cloneNode(false);
    box.removeAttribute("data-bsr");
    box.setAttribute("data-bsa", "1");
    box.setAttribute("data-props", JSON.stringify(props));
    return box;
  }

  function fill(box) {
    const props = JSON.parse(box.getAttribute("data-props"));
    props.title = data.name + " players also play";
    props.appIDs = data.appIds.slice(0, MAX_GAMES);
    props.sortOrder = "none";
    props.navKey = "bsa_also_play_carousel";
    props.seeAllLink = SITE + data.slug + "#also-play";
    box.setAttribute("data-props", JSON.stringify(props));
    box.setAttribute("data-featuretarget", TARGET);
  }

  function drop() {
    if (held) held.remove();
    held = null;
  }

  function found(anchor) {
    if (done) return;
    done = true;
    observer.disconnect();
    if (settled && !usable()) return;
    const box = makeBox(anchor);
    if (!box) return;
    if (settled) {
      fill(box);
      anchor.insertAdjacentElement("afterend", box);
      return;
    }
    box.setAttribute("data-featuretarget", HOLD);
    box.addEventListener("bsa-mounting", () => {
      tooLate = true;
      drop();
    }, { once: true });
    held = box;
    anchor.insertAdjacentElement("afterend", box);
  }

  function scan(root) {
    if (done || !root.querySelector) return;
    const el = root.matches && root.matches(ANCHOR) ? root : root.querySelector(ANCHOR);
    if (el) found(el);
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) scan(node);
        if (done) return;
      }
    }
  });
  observer.observe(document.documentElement || document, { childList: true, subtree: true });

  document.addEventListener("DOMContentLoaded", () => {
    scan(document);
    observer.disconnect();
    if (document.documentElement.getAttribute("data-bsa-hook") !== "1") {
      tooLate = true;
      drop();
    }
  }, { once: true });

  window.addEventListener("load", () => {
    if (held) {
      tooLate = true;
      drop();
    }
  }, { once: true });

  function settle(res) {
    if (settled) return;
    data = res && Array.isArray(res.appIds) && typeof res.name === "string" ? res : null;
    settled = true;
    if (held && !tooLate) {
      if (usable()) {
        fill(held);
        held = null;
      } else {
        drop();
      }
    }
  }

  function askWorker() {
    chrome.runtime.sendMessage({ type: "also", appId }, (res) => {
      void chrome.runtime.lastError;
      settle(res);
    });
  }

  const cacheKey = "also:" + appId;
  function load() {
    chrome.storage.local.get(cacheKey).then((stored) => {
      const cached = stored[cacheKey];
      if (cached && Date.now() - cached.t < CACHE_TTL_MS) settle(cached.v);
      else askWorker();
    }, askWorker);
  }

  chrome.storage.sync.get("bss").then((stored) => {
    if (stored.bss && stored.bss.alsoPlay === false) settle(null);
    else load();
  }, load);
})();
