(() => {
  const current = location.pathname.match(/^\/app\/(\d+)/);
  const here = current ? Number(current[1]) : 0;
  const sent = new Set();

  document.addEventListener("pointerdown", (e) => {
    const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    const m = a.href.match(/^https:\/\/store\.steampowered\.com\/app\/(\d+)/);
    if (!m) return;
    const appId = Number(m[1]);
    if (appId === here || sent.has(appId)) return;
    sent.add(appId);
    chrome.runtime.sendMessage({ type: "prefetch", appId }, () => void chrome.runtime.lastError);
  }, true);
})();
