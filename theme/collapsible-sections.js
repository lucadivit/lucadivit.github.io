(function () {
    "use strict";

    function normalizeHeadingText(heading) {
        var clone = heading.cloneNode(true);
        var headerLink = clone.querySelector("a.headerlink");
        var caretButton = clone.querySelector(".article-section-caret");
        var titleLink = clone.querySelector(".article-section-titlelink");
        var titleText = clone.querySelector(".article-section-titletext");

        if (headerLink) {
            headerLink.remove();
        }

        if (caretButton) {
            caretButton.remove();
        }

        if (titleLink) {
            titleLink.remove();
        }

        if (titleText) {
            titleText.remove();
        }

        return (clone.textContent || "").replace(/\s+/g, " ").trim();
    }

    function createUniqueId(baseId, documentRef) {
        var safeBase = (baseId || "article-section").replace(/[^a-zA-Z0-9\-_:.]/g, "-");
        var candidate = safeBase;
        var index = 2;

        while (documentRef.getElementById(candidate)) {
            candidate = safeBase + "-" + index;
            index += 1;
        }

        return candidate;
    }

    function setExpandedState(heading, panel, button, isExpanded) {
        button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
        heading.classList.toggle("is-collapsed", !isExpanded);
        panel.hidden = !isExpanded;
    }

    function resolveHeadingAnchorHref(heading) {
        var containerWithId;

        if (heading.id) {
            return "#" + heading.id;
        }

        containerWithId = heading.closest("aside[id], section[id]");
        if (containerWithId && containerWithId.id) {
            return "#" + containerWithId.id;
        }

        return null;
    }

    function wrapHeadingTitle(heading) {
        var titleNodes = [];
        var childNodes = Array.prototype.slice.call(heading.childNodes);
        var titleHref;
        var titleNode;

        Array.prototype.forEach.call(childNodes, function (node) {
            if (
                node.nodeType === 1 &&
                node.matches &&
                (node.matches("a.headerlink") || node.matches(".article-section-caret"))
            ) {
                if (node.matches("a.headerlink")) {
                    node.remove();
                }
                return;
            }

            titleNodes.push(node);
        });

        if (!titleNodes.length) {
            return null;
        }

        titleHref = resolveHeadingAnchorHref(heading);

        if (titleHref) {
            titleNode = document.createElement("a");
            titleNode.className = "article-section-titlelink";
            titleNode.href = titleHref;
        } else {
            titleNode = document.createElement("span");
            titleNode.className = "article-section-titletext";
        }

        Array.prototype.forEach.call(titleNodes, function (node) {
            titleNode.appendChild(node);
        });

        heading.appendChild(titleNode);
        return titleNode;
    }

    function getEventElementTarget(event) {
        if (!event || !event.target) {
            return null;
        }

        if (event.target.nodeType === 1) {
            return event.target;
        }

        return event.target.parentElement || null;
    }

    function preventPointerFocus(event) {
        if (typeof event.button === "number" && event.button !== 0) {
            return;
        }

        event.preventDefault();
    }

    function initCollapsibleHeading(heading, panel) {
        var button;
        var headingText;

        heading.dataset.collapsibleReady = "true";
        heading.classList.add("article-section-heading");

        button = document.createElement("button");
        headingText = normalizeHeadingText(heading) || "section";
        button.type = "button";
        button.className = "article-section-caret";
        button.setAttribute("aria-controls", panel.id);
        button.setAttribute("aria-label", "Toggle section: " + headingText);

        wrapHeadingTitle(heading);
        heading.appendChild(button);
        setExpandedState(heading, panel, button, true);

        if (window.PointerEvent) {
            button.addEventListener("pointerdown", preventPointerFocus);
        } else {
            button.addEventListener("mousedown", preventPointerFocus);
            button.addEventListener("touchstart", preventPointerFocus, { passive: false });
        }

        button.addEventListener("click", function (event) {
            var currentlyExpanded = button.getAttribute("aria-expanded") === "true";
            event.preventDefault();
            event.stopPropagation();
            setExpandedState(heading, panel, button, !currentlyExpanded);
        });

        heading.addEventListener("click", function (event) {
            var targetElement = getEventElementTarget(event);
            var currentlyExpanded;

            if (!targetElement) {
                return;
            }

            if (
                targetElement.closest(".article-section-caret") ||
                targetElement.closest(".article-section-titlelink") ||
                targetElement.closest(".article-section-titletext")
            ) {
                return;
            }

            currentlyExpanded = button.getAttribute("aria-expanded") === "true";
            setExpandedState(heading, panel, button, !currentlyExpanded);
        });
    }

    function buildSectionPanel(heading, index, levelStopTags) {
        var nextNode;
        var panel;
        var headingBaseId;

        if (!heading.parentNode) {
            return null;
        }

        panel = document.createElement("div");
        panel.className = "article-section-panel";

        headingBaseId = heading.id ? heading.id + "-panel" : "article-section-panel-" + (index + 1);
        panel.id = createUniqueId(headingBaseId, document);

        nextNode = heading.nextSibling;
        while (
            nextNode &&
            !(
                nextNode.nodeType === 1 &&
                levelStopTags.indexOf(nextNode.tagName) !== -1
            )
        ) {
            var nodeToMove = nextNode;
            nextNode = nodeToMove.nextSibling;
            panel.appendChild(nodeToMove);
        }

        heading.parentNode.insertBefore(panel, nextNode);

        if (!panel.hasChildNodes()) {
            panel.remove();
            return null;
        }

        return panel;
    }

    function initHeadingLevel(container, headingTagName, stopTags, skipWhenInsidePanel) {
        var headings = container.querySelectorAll(headingTagName);

        Array.prototype.forEach.call(headings, function (heading, index) {
            var panel;

            if (heading.dataset.collapsibleReady === "true") {
                return;
            }

            if (skipWhenInsidePanel && heading.closest(".article-section-panel")) {
                return;
            }

            panel = buildSectionPanel(heading, index, stopTags);
            if (!panel) {
                return;
            }

            initCollapsibleHeading(heading, panel);
        });
    }

    function ensureHeadingExpanded(heading) {
        var panel;
        var button;

        if (!heading || !heading.classList || !heading.classList.contains("article-section-heading")) {
            return;
        }

        panel = heading.nextElementSibling;
        button = heading.querySelector(".article-section-caret");

        if (!panel || !panel.classList || !panel.classList.contains("article-section-panel") || !button) {
            return;
        }

        setExpandedState(heading, panel, button, true);
    }

    function openForTarget(targetEl) {
        var headingTarget = null;
        var node;
        var panel;
        var heading;

        if (!targetEl) {
            return;
        }

        if (targetEl.matches && targetEl.matches(":is(h3,h4).article-section-heading")) {
            headingTarget = targetEl;
        } else if (targetEl.closest) {
            headingTarget = targetEl.closest(":is(h3,h4).article-section-heading");
        }

        if (headingTarget) {
            ensureHeadingExpanded(headingTarget);
        }

        node = headingTarget || targetEl;

        while (node) {
            panel = node.closest(".article-section-panel");
            if (!panel) {
                break;
            }

            heading = panel.previousElementSibling;
            ensureHeadingExpanded(heading);
            node = panel.parentElement;
        }

        if (targetEl.scrollIntoView) {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    targetEl.scrollIntoView({ block: "start" });
                });
            });
        }
    }

    function resolveTargetElementFromHash(hashValue) {
        var decodedHash;

        if (!hashValue || hashValue.length < 2 || hashValue.charAt(0) !== "#") {
            return null;
        }

        decodedHash = decodeURIComponent(hashValue.slice(1));
        return document.getElementById(decodedHash);
    }

    function revealTargetInCollapsedPanel() {
        var target = resolveTargetElementFromHash(window.location.hash);
        openForTarget(target);
    }

    document.addEventListener("click", function (event) {
        var targetElement = getEventElementTarget(event);
        var tocLink;
        var href;
        var target;

        if (!targetElement || !targetElement.closest) {
            return;
        }

        tocLink = targetElement.closest('.toc a[href^="#"]');
        if (!tocLink) {
            return;
        }

        href = tocLink.getAttribute("href");
        target = resolveTargetElementFromHash(href);

        event.preventDefault();
        openForTarget(target);

        if (href && href.charAt(0) === "#") {
            history.pushState(null, "", href);
        }
    });

    var articleSections = document.querySelectorAll(".article-sections");

    Array.prototype.forEach.call(articleSections, function (sectionRoot) {
        var h3Panels;
        var articleBodies;

        initHeadingLevel(sectionRoot, "h3", ["H3"], true);

        h3Panels = sectionRoot.querySelectorAll(".article-section-panel");
        Array.prototype.forEach.call(h3Panels, function (panel) {
            initHeadingLevel(panel, "h4", ["H4", "H3"], false);
        });

        articleBodies = sectionRoot.querySelectorAll(".article-body");
        Array.prototype.forEach.call(articleBodies, function (articleBody) {
            initHeadingLevel(articleBody, "h4", ["H4", "H3"], true);
        });
    });

    revealTargetInCollapsedPanel();
    window.addEventListener("hashchange", revealTargetInCollapsedPanel);
})();
