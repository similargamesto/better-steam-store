(() => {
  const match = location.pathname.match(/^\/app\/(\d+)/);
  if (!match) return;
  if (document.documentElement.hasAttribute("data-bsr-owner")) return;
  document.documentElement.setAttribute("data-bsr-owner", "");

  const appId = Number(match[1]);
  const SITE = "https://similargames.to/";
  const TARGET = "storeitems-carousel";
  const HOLD = "bsr-hold";
  const MIN_GAMES = 4;
  const MAX_GAMES = 20;
  const CACHE_TTL_MS = 60 * 60 * 1000;

  let data = null;
  let settled = false;
  let tooLate = false;
  let held = null;
  let done = false;

  function readProps(el) {
    try {
      return JSON.parse(el.getAttribute("data-props"));
    } catch {
      return null;
    }
  }

  function isMoreLike(el) {
    const props = readProps(el);
    return !!props && props.navKey === "more_like_this_carousel";
  }

  function apply(el) {
    const props = readProps(el);
    if (!props) return;
    const ids = data.appIds.slice(0, MAX_GAMES);
    if (ids.length < MIN_GAMES) return;
    props.appIDs = ids;
    props.sortOrder = "none";
    props.seeAllLink = SITE + data.slug + "#games-like";
    el.setAttribute("data-props", JSON.stringify(props));
    el.setAttribute("data-bsr", "1");
    watchCards(el, new Set(ids));
  }

  const ICON_UP = "M2 21h4V9H2v12zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6C6.2 8 6 8.5 6 9v10a2 2 0 0 0 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2z";
  const ICON_DOWN = "M22 3h-4v12h4V3zM2 14a2 2 0 0 0 2 2h6.3l-1 4.6v.3c0 .4.2.8.4 1.1l1.1 1 6.6-6.6c.4-.4.6-.9.6-1.4V5a2 2 0 0 0-2-2H7c-.8 0-1.5.5-1.8 1.2l-3 7.1c-.1.2-.2.5-.2.7v2z";
  function icon(d, box) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", box);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
    return svg;
  }

  let votes = {};

  function counts(app) {
    const c = data && data.votes && data.votes[app];
    return Array.isArray(c) ? c : [0, 0];
  }

  function paint(strip, value) {
    let [up, down] = counts(Number(strip.dataset.app));
    if (value === 1) up = Math.max(up, 1);
    if (value === -1) down = Math.max(down, 1);
    strip.querySelector(".bsr-up .bsr-count").textContent = up > 0 ? String(up) : "";
    strip.querySelector(".bsr-down .bsr-count").textContent = down > 0 ? String(down) : "";
    strip.querySelector(".bsr-up").classList.toggle("is-up", value === 1);
    strip.querySelector(".bsr-down").classList.toggle("is-down", value === -1);
    strip.querySelector(".bsr-up").setAttribute("aria-pressed", String(value === 1));
    strip.querySelector(".bsr-down").setAttribute("aria-pressed", String(value === -1));
  }

  function voteButton(className, title, d) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bsr-vote " + className;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.appendChild(icon(d, "0 0 24 24"));
    const count = document.createElement("span");
    count.className = "bsr-count";
    button.appendChild(count);
    return button;
  }

  function makeStrip(app) {
    const strip = document.createElement("div");
    strip.className = "bsr-strip";
    strip.dataset.app = String(app);
    const label = document.createElement("span");
    label.className = "bsr-label";
    label.textContent = "Similar?";
    const group = document.createElement("span");
    group.className = "bsr-votes";
    group.appendChild(voteButton("bsr-up", "Good match", ICON_UP));
    group.appendChild(voteButton("bsr-down", "Not similar", ICON_DOWN));
    strip.appendChild(label);
    strip.appendChild(group);
    for (const button of strip.querySelectorAll("button")) {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wanted = button.classList.contains("bsr-up") ? 1 : -1;
        const old = votes[app] || 0;
        const value = old === wanted ? 0 : wanted;
        votes[app] = value;
        if (data) {
          const [up, down] = counts(app);
          data.votes = data.votes || {};
          data.votes[app] = [up + (value === 1) - (old === 1), down + (value === -1) - (old === -1)];
        }
        paint(strip, value);
        chrome.runtime.sendMessage({ type: "vote", page: appId, app, vote: value }, () => void chrome.runtime.lastError);
      });
    }
    paint(strip, votes[app] || 0);
    return strip;
  }

  function decorate(el, allowed) {
    for (const popover of el.querySelectorAll("[popover]")) {
      const content = popover.firstElementChild && popover.firstElementChild.firstElementChild
        && popover.firstElementChild.firstElementChild.firstElementChild;
      if (!content || content.querySelector(":scope > .bsr-strip")) continue;
      const a = content.querySelector('a[href*="/app/"]');
      const m = a && a.href.match(/\/app\/(\d+)/);
      if (!m) continue;
      const app = Number(m[1]);
      if (!allowed.has(app)) continue;
      content.appendChild(makeStrip(app));
    }
  }

  function watchCards(el, allowed) {
    chrome.runtime.sendMessage({ type: "votes", page: appId }, (res) => {
      void chrome.runtime.lastError;
      votes = res || {};
      for (const strip of el.querySelectorAll(".bsr-strip")) paint(strip, votes[Number(strip.dataset.app)] || 0);
    });
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        decorate(el, allowed);
      });
    }).observe(el, { childList: true, subtree: true });
    decorate(el, allowed);
  }

  function release() {
    if (!held) return;
    held.setAttribute("data-featuretarget", TARGET);
    held = null;
  }

  function found(el) {
    if (done) return;
    done = true;
    observer.disconnect();
    if (settled) {
      if (data) apply(el);
      return;
    }
    held = el;
    el.addEventListener("bsr-mounting", () => {
      tooLate = true;
      held = null;
    }, { once: true });
    el.setAttribute("data-featuretarget", HOLD);
  }

  function scan(root) {
    if (done || !root.querySelectorAll) return;
    const list = root.matches && root.matches(`[data-featuretarget="${TARGET}"]`)
      ? [root]
      : root.querySelectorAll(`[data-featuretarget="${TARGET}"]`);
    for (const el of list) {
      if (isMoreLike(el)) {
        found(el);
        return;
      }
    }
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
    if (document.documentElement.getAttribute("data-bsr-hook") !== "1") {
      tooLate = true;
      release();
    }
  }, { once: true });

  window.addEventListener("load", () => {
    if (held) {
      tooLate = true;
      release();
    }
  }, { once: true });

  function settle(res) {
    if (settled) return;
    data = res && Array.isArray(res.appIds) ? res : null;
    settled = true;
    if (held && !tooLate) {
      if (data) apply(held);
      release();
    }
  }

  function askWorker() {
    chrome.runtime.sendMessage({ type: "similar", appId }, (res) => {
      void chrome.runtime.lastError;
      settle(res);
    });
  }

  const cacheKey = "list:" + appId;
  function load() {
    chrome.storage.local.get(cacheKey).then((stored) => {
      const cached = stored[cacheKey];
      if (cached && Date.now() - cached.t < CACHE_TTL_MS) settle(cached.v);
      else askWorker();
    }, askWorker);
  }

  chrome.storage.sync.get("bss").then((stored) => {
    if (stored.bss && stored.bss.recommendations === false) settle(null);
    else load();
  }, load);
})();
