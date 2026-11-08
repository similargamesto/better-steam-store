(() => {
  const SITE = "https://similargames.to";
  const TTL_MS = 60 * 60 * 1000;

  async function fromApi(appId) {
    const res = await fetch(SITE + "/api/ext/also/" + appId);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  const inFlight = new Map();

  function load(appId) {
    if (inFlight.has(appId)) return inFlight.get(appId);
    const p = loadOnce(appId).finally(() => inFlight.delete(appId));
    inFlight.set(appId, p);
    return p;
  }

  async function loadOnce(appId) {
    const key = "also:" + appId;
    const cached = (await chrome.storage.local.get(key))[key];
    if (cached && Date.now() - cached.t < TTL_MS) return cached.v;

    const value = await fromApi(appId);
    await chrome.storage.local.set({ [key]: { t: Date.now(), v: value } });
    return value;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || !Number.isInteger(msg.appId)) return false;
    if (msg.type === "also") {
      load(msg.appId).then(sendResponse, () => sendResponse(null));
      return true;
    }
    if (msg.type === "prefetch") {
      load(msg.appId).then(() => sendResponse(true), () => sendResponse(false));
      return true;
    }
    return false;
  });
})();
