(() => {
    const progressRoot = document.getElementById('reading-progress');
    const progressBar = progressRoot?.querySelector('.reading-progress__bar');

    if (!progressRoot || !progressBar) {
        return;
    }

    const articleElement = document.querySelector('main#content article') || document.querySelector('article');

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const updateProgress = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

        let start = 0;
        let end = 1;

        if (articleElement) {
            const articleRect = articleElement.getBoundingClientRect();
            const articleTop = articleRect.top + scrollTop;
            const articleHeight = Math.max(articleElement.offsetHeight, 1);

            start = articleTop;
            end = Math.max(articleTop + articleHeight - viewportHeight, start + 1);
        } else {
            const documentHeight = Math.max(document.documentElement.scrollHeight, 1);
            end = Math.max(documentHeight - viewportHeight, 1);
        }

        const progress = clamp((scrollTop - start) / (end - start), 0, 1);
        progressBar.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
})();
