(function () {
    "use strict";

    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");

    if (!input || !results) {
        return;
    }

    var items = results.getElementsByTagName("li");

    function normalize(value) {
        return (value || "").toLowerCase().trim();
    }

    function applyFilter() {
        var query = normalize(input.value);
        var i = 0;

        if (!query) {
            for (i = 0; i < items.length; i += 1) {
                var item = items[i];
                item.hidden = true;

                var emptyPreview = item.querySelector("p");
                if (emptyPreview) {
                    emptyPreview.hidden = true;
                }
            }

            return;
        }

        for (i = 0; i < items.length; i += 1) {
            var item = items[i];
            var title = item.getAttribute("data-title") || "";
            var summary = item.getAttribute("data-summary") || "";
            var visible = title.indexOf(query) !== -1 || summary.indexOf(query) !== -1;
            item.hidden = !visible;

            var preview = item.querySelector("p");
            if (preview) {
                preview.hidden = !visible;
            }
        }
    }

    input.addEventListener("input", applyFilter);
    input.addEventListener("search", applyFilter);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyFilter);
    } else {
        applyFilter();
    }
})();
