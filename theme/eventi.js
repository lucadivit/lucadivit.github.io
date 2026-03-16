(function () {
    "use strict";

    function init() {
        function parsePageTranslations() {
            var translationsNode = document.getElementById("eventi-translations");

            if (!translationsNode) {
                return {};
            }

            var rawSource = "";

            if (translationsNode.tagName === "TEMPLATE") {
                rawSource = (translationsNode.content && translationsNode.content.textContent) || translationsNode.innerHTML || "";
            } else {
                rawSource = translationsNode.textContent || "";
            }

            var rawJson = rawSource.trim();

            if (!rawJson) {
                return {};
            }

            try {
                var parsed = JSON.parse(rawJson);
                return parsed && typeof parsed === "object" ? parsed : {};
            } catch (error) {
                return {};
            }
        }

        var pageTranslations = parsePageTranslations();
        var normalizedMap = Object.create(null);

        Object.entries(pageTranslations).forEach(function (entry) {
            normalizedMap[String(entry[0]).toLowerCase().trim()] = entry[1];
        });
        var sessionizeRoot = document.querySelector(".page-body.article-body") || document.body;
        var observerMaxMs = 12000;
        var observerStopAt = Date.now() + observerMaxMs;
        var scheduled = false;
        var observer = null;

        function mapTrimmedToken(rawToken) {
            var leading = rawToken.match(/^\s*/);
            var trailing = rawToken.match(/\s*$/);
            var prefix = leading ? leading[0] : "";
            var suffix = trailing ? trailing[0] : "";
            var token = rawToken.trim();
            var mapped = normalizedMap[token.toLowerCase()];

            if (!mapped) {
                return rawToken;
            }

            return prefix + mapped + suffix;
        }

        function translateSessionizeContent() {
            var applied = false;

            document.querySelectorAll(".sz-powered-by").forEach(function (el) {
                el.remove();
                applied = true;
            });

            var groupTitles = document.querySelectorAll(".sz-group__title");
            var captions = document.querySelectorAll(".sz-caption");
            var metas = document.querySelectorAll(".sz-item__meta");

            groupTitles.forEach(function (el) {
                var raw = el.textContent.trim();
                var match = raw.match(/^([^\d]+?)\s+(\d{4})$/);

                if (!match) {
                    return;
                }

                var month = match[1].toLowerCase().trim();
                var year = match[2];
                var translatedMonth = normalizedMap[month];

                if (translatedMonth && el.textContent !== translatedMonth + " " + year) {
                    el.textContent = translatedMonth + " " + year;
                    applied = true;
                }
            });

            if (captions[0] && normalizedMap.event && captions[0].textContent !== normalizedMap.event) {
                captions[0].textContent = normalizedMap.event;
                applied = true;
            }

            if (captions[1] && normalizedMap.talk && captions[1].textContent !== normalizedMap.talk) {
                captions[1].textContent = normalizedMap.talk;
                applied = true;
            }

            metas.forEach(function (el) {
                var translatedParts = el.textContent.split(/(,|\||\/|\u00b7)/).map(function (part) {
                    return mapTrimmedToken(part);
                });
                var translatedText = translatedParts.join("");

                if (translatedText !== el.textContent) {
                    el.textContent = translatedText;
                    applied = true;
                }
            });

            return applied;
        }

        function normalizeSessionizeContent() {
            var applied = false;

            document.querySelectorAll(".sz-group").forEach(function (group) {
                var childElements = Array.from(group.children || []);
                var titles = childElements.filter(function (el) {
                    return el.classList && el.classList.contains("sz-group__title");
                });

                if (!titles.length) {
                    if ((group.tagName === "UL" || group.tagName === "OL") && !group.dataset.linkRowsReady) {
                        group.classList.add("link-rows", "is-bulleted");
                        group.dataset.linkRowsReady = "1";
                        applied = true;
                    }

                    return;
                }

                titles.forEach(function (title) {
                    var list = title.nextElementSibling;

                    if (!(list && list.tagName === "UL" && list.classList.contains("link-rows"))) {
                        list = document.createElement("ul");
                        list.className = "link-rows is-bulleted";
                        list.dataset.sessionizeList = "1";
                        title.insertAdjacentElement("afterend", list);
                        applied = true;
                    }

                    var cursor = title.nextElementSibling;
                    while (cursor && !(cursor.classList && cursor.classList.contains("sz-group__title"))) {
                        var next = cursor.nextElementSibling;

                        if (cursor !== list && cursor.classList && cursor.classList.contains("sz-item")) {
                            if (cursor.tagName !== "LI") {
                                var replacement = document.createElement("li");
                                replacement.className = cursor.className;
                                while (cursor.firstChild) {
                                    replacement.appendChild(cursor.firstChild);
                                }
                                cursor.replaceWith(replacement);
                                cursor = replacement;
                            }

                            list.appendChild(cursor);
                            applied = true;
                        }

                        cursor = next;
                    }

                    title.dataset.linkRowsReady = "1";
                });
            });

            return applied;
        }

        function stopObserver() {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        }

        function runPass() {
            normalizeSessionizeContent();
            translateSessionizeContent();

            if (Date.now() >= observerStopAt) {
                stopObserver();
                return;
            }
        }

        runPass();

        observer = new MutationObserver(function () {
            if (scheduled) {
                return;
            }

            scheduled = true;
            window.setTimeout(function () {
                scheduled = false;
                runPass();
            }, 0);
        });

        observer.observe(sessionizeRoot, { childList: true, subtree: true });

        window.setTimeout(function () {
            stopObserver();
        }, observerMaxMs + 100);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
