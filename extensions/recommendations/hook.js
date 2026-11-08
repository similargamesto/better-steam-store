(() => {
  const HOLD = "bsr-hold";
  document.documentElement.setAttribute("data-bsr-hook", "1");

  function releaseHeld() {
    for (const el of document.querySelectorAll('[data-featuretarget="' + HOLD + '"]')) {
      el.setAttribute("data-featuretarget", "storeitems-carousel");
      el.dispatchEvent(new CustomEvent("bsr-mounting"));
    }
  }

  function wrap(proto, name) {
    const original = proto[name];
    proto[name] = function (selector) {
      if (typeof selector === "string" && selector.includes("storeitems-carousel")) releaseHeld();
      return original.call(this, selector);
    };
  }

  wrap(Document.prototype, "querySelectorAll");
  wrap(Document.prototype, "querySelector");
  wrap(Element.prototype, "querySelectorAll");
  wrap(Element.prototype, "querySelector");
})();
