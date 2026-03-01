(function () {
    "use strict";

    var links = document.querySelectorAll("a");

    links.forEach(function (link) {
        if (link.host !== window.location.host && !link.getAttribute("data-umami-event")) {
            var label = link.ariaLabel || link.textContent || link.href;
            link.setAttribute("data-umami-event", "Click " + label.trim());
            link.setAttribute("data-umami-event-element", "anchor");
            link.setAttribute("data-umami-event-event", "onclick");
            link.setAttribute("data-umami-event-id", link.id || "");
            link.setAttribute("data-umami-event-url", link.href);
        }
    });
})();
