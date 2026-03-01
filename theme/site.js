(function () {
    "use strict";

    function normalizePathname(pathname) {
        if (!pathname) {
            return "/";
        }

        if (pathname.length > 1 && pathname.charAt(pathname.length - 1) === "/") {
            return pathname.slice(0, -1);
        }

        return pathname;
    }

    function ensureNoopenerNoreferrer(link) {
        var relValue = link.getAttribute("rel") || "";
        var relTokens = relValue.split(/\s+/).filter(Boolean);

        if (relTokens.indexOf("noopener") === -1) {
            relTokens.push("noopener");
        }

        if (relTokens.indexOf("noreferrer") === -1) {
            relTokens.push("noreferrer");
        }

        link.setAttribute("rel", relTokens.join(" "));
    }

    function applyArticleLinkPolicy() {
        var articleLinks = document.querySelectorAll("article a[href]");
        var currentUrl = new URL(window.location.href);
        var currentPathname = normalizePathname(currentUrl.pathname);
        var skipProtocolPattern = /^(mailto:|tel:|javascript:|data:)/i;

        Array.prototype.forEach.call(articleLinks, function (link) {
            var href = link.getAttribute("href");

            if (!href) {
                return;
            }

            href = href.trim();

            if (!href) {
                return;
            }

            if (link.closest(".toc") || link.classList.contains("headerlink")) {
                return;
            }

            if (link.hasAttribute("download")) {
                return;
            }

            if (href.charAt(0) === "#" || skipProtocolPattern.test(href)) {
                return;
            }

            var destination;

            try {
                destination = new URL(href, currentUrl.href);
            } catch (error) {
                return;
            }

            var destinationPathname = normalizePathname(destination.pathname);
            var isSamePageAnchor = destination.origin === currentUrl.origin && destinationPathname === currentPathname && !!destination.hash;

            if (isSamePageAnchor) {
                return;
            }

            if (link.hasAttribute("target")) {
                var targetValue = (link.getAttribute("target") || "").trim().toLowerCase();

                if (targetValue === "_blank") {
                    ensureNoopenerNoreferrer(link);
                }

                return;
            }

            link.setAttribute("target", "_blank");
            ensureNoopenerNoreferrer(link);
        });
    }

    function shouldOptOutFromInstantPage(link) {
        var href = link.getAttribute("href");

        if (!href) {
            return false;
        }

        href = href.trim();

        if (!href) {
            return false;
        }

        if (link.hasAttribute("download")) {
            return true;
        }

        var targetValue = (link.getAttribute("target") || "").trim().toLowerCase();

        if (targetValue === "_blank") {
            return true;
        }

        return href.indexOf("#") !== -1;
    }

    function applyInstantPageOptOut() {
        var links = document.querySelectorAll("a[href]");

        Array.prototype.forEach.call(links, function (link) {
            if (shouldOptOutFromInstantPage(link)) {
                link.setAttribute("data-no-instant", "");
            }
        });
    }

    applyArticleLinkPolicy();
    applyInstantPageOptOut();

    var root = document.documentElement;
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".site-nav-toggle");
    var backdrop = document.querySelector(".site-nav-backdrop");
    var panel = document.querySelector(".site-nav-panel-drawer");

    if (!header || !toggle || !panel || !backdrop) {
        return;
    }

    var SWIPE_START_THRESHOLD = 40;
    var SWIPE_CLOSE_THRESHOLD = 80;
    var HEADER_HIDE_THRESHOLD = 80;
    var swipeState = null;
    var lastScrollY = window.scrollY;
    var ticking = false;

    function resetPanelTransform() {
        panel.style.transform = "";
        panel.style.transition = "";
    }

    function setOpen(isOpen) {
        if (!isOpen) {
            swipeState = null;
        }

        resetPanelTransform();
        backdrop.hidden = !isOpen;
        root.classList.toggle("site-nav-open", isOpen);
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

        if (isOpen) {
            header.classList.remove("site-header-hidden");
        }

        lastScrollY = window.scrollY;
    }

    function updateHeaderVisibility() {
        var currentScrollY = window.scrollY;

        if (root.classList.contains("site-nav-open")) {
            header.classList.remove("site-header-hidden");
            lastScrollY = currentScrollY;
            ticking = false;
            return;
        }

        if (currentScrollY <= HEADER_HIDE_THRESHOLD) {
            header.classList.remove("site-header-hidden");
        } else if (currentScrollY > lastScrollY) {
            header.classList.add("site-header-hidden");
        } else if (currentScrollY < lastScrollY) {
            header.classList.remove("site-header-hidden");
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    toggle.addEventListener("click", function () {
        setOpen(!root.classList.contains("site-nav-open"));
    });

    panel.addEventListener("click", function (event) {
        var target = event.target;
        if (target && target.closest("a")) {
            setOpen(false);
        }
    });

    backdrop.addEventListener("click", function () {
        setOpen(false);
    });

    panel.addEventListener("pointerdown", function (event) {
        if (!root.classList.contains("site-nav-open")) {
            return;
        }

        swipeState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            dx: 0,
            swiping: false,
            decided: false,
            captured: false
        };
    });

    panel.addEventListener("pointermove", function (event) {
        if (!swipeState || swipeState.pointerId !== event.pointerId || !root.classList.contains("site-nav-open")) {
            return;
        }

        var dx = event.clientX - swipeState.startX;
        var dy = event.clientY - swipeState.startY;
        var absDx = Math.abs(dx);
        var absDy = Math.abs(dy);

        if (!swipeState.decided) {
            if (dx > SWIPE_START_THRESHOLD && absDx > absDy * 1.2) {
                swipeState.swiping = true;
                swipeState.decided = true;

                if (!swipeState.captured && panel.setPointerCapture) {
                    try {
                        panel.setPointerCapture(event.pointerId);
                        swipeState.captured = true;
                    } catch (error) {}
                }
            } else if (absDy > SWIPE_START_THRESHOLD || dx < -SWIPE_START_THRESHOLD) {
                swipeState.decided = true;
                swipeState.swiping = false;
            }
        }

        if (!swipeState.swiping) {
            return;
        }

        event.preventDefault();
        swipeState.dx = Math.max(0, dx);
        panel.style.transition = "none";
        panel.style.transform = "translateX(" + swipeState.dx + "px)";
    }, { passive: false });

    function endSwipe(event) {
        if (!swipeState || swipeState.pointerId !== event.pointerId) {
            return;
        }

        if (swipeState.captured && panel.releasePointerCapture && panel.hasPointerCapture && panel.hasPointerCapture(event.pointerId)) {
            try {
                panel.releasePointerCapture(event.pointerId);
            } catch (error) {}
        }

        var didSwipe = swipeState.swiping;
        var swipeDistance = swipeState.dx;
        swipeState = null;

        if (!didSwipe) {
            resetPanelTransform();
            return;
        }

        var widthThreshold = panel.offsetWidth * 0.25;
        var closeThreshold = Math.max(SWIPE_CLOSE_THRESHOLD, widthThreshold);

        if (swipeDistance > closeThreshold) {
            setOpen(false);
            return;
        }

        panel.style.transition = "transform 160ms ease";
        panel.style.transform = "";
        window.setTimeout(resetPanelTransform, 180);
    }

    document.addEventListener("pointerup", endSwipe);
    document.addEventListener("pointercancel", endSwipe);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            setOpen(false);
        }
    });

    window.addEventListener("scroll", function () {
        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(updateHeaderVisibility);
    }, { passive: true });

    var desktopQuery = window.matchMedia("(min-width: 45.0625rem)");

    function closeOnDesktop(event) {
        if (event.matches) {
            setOpen(false);
        }
    }

    if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener("change", closeOnDesktop);
    } else {
        desktopQuery.addListener(closeOnDesktop);
    }

    closeOnDesktop(desktopQuery);
    updateHeaderVisibility();

    window.requestAnimationFrame(function () {
        root.classList.add("js-ready");
    });
})();
