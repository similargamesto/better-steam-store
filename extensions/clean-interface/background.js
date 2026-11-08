(() => {
  const WELCOME_PAGE = "https://store.steampowered.com/app/1669000/";

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") chrome.tabs.create({ url: WELCOME_PAGE });
  });
})();
