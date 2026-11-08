(() => {
  const HOLD = "bsa-hold";
  document.documentElement.setAttribute("data-bsa-hook", "1");

  function mounting() {
    for (const el of document.querySelectorAll('[data-featuretarget="' + HOLD + '"]')) {
      el.dispatchEvent(new CustomEvent("bsa-mounting"));
    }
  }

  function wrap(proto, name) {
    const original = proto[name];
    proto[name] = function (selector) {
      if (typeof selector === "string" && selector.includes("storeitems-carousel")) mounting();
      return original.call(this, selector);
    };
  }

  wrap(Document.prototype, "querySelectorAll");
  wrap(Document.prototype, "querySelector");
  wrap(Element.prototype, "querySelectorAll");
  wrap(Element.prototype, "querySelector");
})();
