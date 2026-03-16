(function () {
  "use strict";

  var isEnabled =
    document.body && document.body.getAttribute("data-katex-enabled") === "true";
  if (!isEnabled) {
    return;
  }

  if (!window.katex || typeof window.katex.render !== "function") {
    return;
  }

  function unwrapDelimiters(value) {
    var text = (value || "").trim();
    var delimiters = [
      ["\\(", "\\)"],
      ["\\[", "\\]"],
      ["$$", "$$"],
      ["$", "$"],
    ];

    for (var i = 0; i < delimiters.length; i += 1) {
      var left = delimiters[i][0];
      var right = delimiters[i][1];

      if (text.startsWith(left) && text.endsWith(right) && text.length >= left.length + right.length) {
        return text.slice(left.length, text.length - right.length).trim();
      }
    }

    return text;
  }

  function extractSource(element) {
    var scriptNode = element.querySelector('script[type^="math/tex"]');
    if (scriptNode && scriptNode.textContent) {
      return scriptNode.textContent;
    }

    return element.textContent || "";
  }

  function isDisplayMath(element, rawSource) {
    var classList = element.classList;
    if (classList.contains("arithmatex-display") || classList.contains("math-display")) {
      return true;
    }

    if (element.tagName === "DIV") {
      return true;
    }

    var scriptNode = element.querySelector('script[type^="math/tex"]');
    if (scriptNode) {
      var scriptType = scriptNode.getAttribute("type") || "";
      if (scriptType.indexOf("mode=display") !== -1) {
        return true;
      }
    }

    var text = (rawSource || "").trim();
    return text.startsWith("\\[") || text.startsWith("$$");
  }

  var wrapperSelectors = [
    ".article-body .arithmatex",
    ".page-body .arithmatex",
    "main#content .arithmatex",
    ".article-body .arithmatex-inline",
    ".page-body .arithmatex-inline",
    "main#content .arithmatex-inline",
    ".article-body .arithmatex-display",
    ".page-body .arithmatex-display",
    "main#content .arithmatex-display",
  ];

  var nodes = document.querySelectorAll(wrapperSelectors.join(","));
  for (var i = 0; i < nodes.length; i += 1) {
    var element = nodes[i];
    if (element.getAttribute("data-katex-rendered") === "true") {
      continue;
    }

    var rawSource = extractSource(element);
    var expression = unwrapDelimiters(rawSource);
    if (!expression) {
      continue;
    }

    var displayMode = isDisplayMath(element, rawSource);

    try {
      window.katex.render(expression, element, {
        displayMode: displayMode,
        throwOnError: false,
        strict: "ignore",
      });
      element.setAttribute("data-katex-rendered", "true");
    } catch (error) {
      console.error("KaTeX render error", {
        latex: expression,
        displayMode: displayMode,
        error: error,
      });
    }
  }

  if (typeof window.renderMathInElement !== "function") {
    return;
  }

  var fallbackContainer =
    document.querySelector(".article-body") ||
    document.querySelector(".page-body") ||
    document.querySelector("main#content");

  if (!fallbackContainer) {
    return;
  }

  window.renderMathInElement(fallbackContainer, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
    strict: "ignore",
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
    ignoredClasses: ["katex", "katex-display", "katex-html", "katex-mathml"],
  });
})();
