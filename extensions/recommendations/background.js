(() => {
  const SITE = "https://similargames.to";
  const TTL_MS = 60 * 60 * 1000;

  async function fromApi(appId) {
    const res = await fetch(SITE + "/api/ext/similar/" + appId);
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
    const key = "list:" + appId;
    const cached = (await chrome.storage.local.get(key))[key];
    if (cached && Date.now() - cached.t < TTL_MS) return cached.v;

    const value = await fromApi(appId);
    await chrome.storage.local.set({ [key]: { t: Date.now(), v: value } });
    return value;
  }

  async function installId() {
    const stored = (await chrome.storage.local.get("install"))["install"];
    if (stored) return stored;
    const id = crypto.randomUUID();
    await chrome.storage.local.set({ install: id });
    return id;
  }

  async function votesFor(page) {
    const key = "myvotes:" + page;
    return (await chrome.storage.local.get(key))[key] || {};
  }

  async function adjustCachedCounts(page, app, old, value) {
    const key = "list:" + page;
    const cached = (await chrome.storage.local.get(key))[key];
    if (!cached || !cached.v) return;
    const votes = cached.v.votes || {};
    const [up, down] = Array.isArray(votes[app]) ? votes[app] : [0, 0];
    votes[app] = [up + (value === 1) - (old === 1), down + (value === -1) - (old === -1)];
    cached.v.votes = votes;
    await chrome.storage.local.set({ [key]: cached });
  }

  async function vote(page, app, value) {
    const key = "myvotes:" + page;
    const current = await votesFor(page);
    const old = current[app] || 0;
    if (value === 0) delete current[app];
    else current[app] = value;
    await chrome.storage.local.set({ [key]: current });
    await adjustCachedCounts(page, app, old, value);

    await fetch(SITE + "/api/ext/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, app, vote: value, install: await installId() })
    });
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg) return false;
    if (msg.type === "similar" && Number.isInteger(msg.appId)) {
      load(msg.appId).then(sendResponse, () => sendResponse(null));
      return true;
    }
    if (msg.type === "prefetch" && Number.isInteger(msg.appId)) {
      load(msg.appId).then(() => sendResponse(true), () => sendResponse(false));
      return true;
    }
    if (msg.type === "votes" && Number.isInteger(msg.page)) {
      votesFor(msg.page).then(sendResponse, () => sendResponse({}));
      return true;
    }
    if (msg.type === "vote" && Number.isInteger(msg.page) && Number.isInteger(msg.app) && [1, 0, -1].includes(msg.vote)) {
      vote(msg.page, msg.app, msg.vote).then(() => sendResponse(true), () => sendResponse(false));
      return true;
    }
    return false;
  });
})();
