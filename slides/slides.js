/* ============================================================
   Zikra — Taqdimot navigatsiyasi
   Klaviatura (← →, Space, Home/End), sichqoncha, swipe, dots,
   progress bar, to'liq ekran. URL hash bilan slayd holati saqlanadi.
   ============================================================ */
(function () {
    'use strict';

    const deck = document.getElementById('deck');
    const slides = Array.from(deck.querySelectorAll('.slide'));
    const total = slides.length;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const fsBtn = document.getElementById('fsBtn');
    const curNum = document.getElementById('curNum');
    const totalNum = document.getElementById('totalNum');
    const progressBar = document.getElementById('progressBar');
    const dotsWrap = document.getElementById('dots');
    const hint = document.getElementById('hint');

    let current = 0;

    totalNum.textContent = total;

    /* ----- Build dots ----- */
    slides.forEach(function (s, i) {
        const b = document.createElement('button');
        b.setAttribute('aria-label', (s.dataset.title || ('Slayd ' + (i + 1))));
        b.title = s.dataset.title || ('Slayd ' + (i + 1));
        b.addEventListener('click', function () { go(i); });
        dotsWrap.appendChild(b);
    });
    const dots = Array.from(dotsWrap.children);

    /* ----- Core navigation ----- */
    function render() {
        slides.forEach(function (s, i) {
            s.classList.toggle('is-active', i === current);
        });
        dots.forEach(function (d, i) {
            d.classList.toggle('active', i === current);
        });
        curNum.textContent = current + 1;
        progressBar.style.width = ((current + 1) / total * 100) + '%';
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === total - 1;
        prevBtn.style.opacity = current === 0 ? .4 : 1;
        nextBtn.style.opacity = current === total - 1 ? .4 : 1;
        if (history.replaceState) {
            history.replaceState(null, '', '#' + (current + 1));
        }
    }

    function go(i) {
        current = Math.max(0, Math.min(total - 1, i));
        render();
    }

    function next() { if (current < total - 1) go(current + 1); }
    function prev() { if (current > 0) go(current - 1); }

    /* ----- Controls ----- */
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

    fsBtn.addEventListener('click', function () {
        if (!document.fullscreenElement) {
            (document.documentElement.requestFullscreen || function () { })
                .call(document.documentElement);
        } else {
            (document.exitFullscreen || function () { }).call(document);
        }
    });

    /* ----- Keyboard ----- */
    document.addEventListener('keydown', function (e) {
        switch (e.key) {
            case 'ArrowRight':
            case 'PageDown':
            case ' ':
                e.preventDefault();
                next();
                break;
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                prev();
                break;
            case 'Home':
                e.preventDefault();
                go(0);
                break;
            case 'End':
                e.preventDefault();
                go(total - 1);
                break;
            case 'f':
            case 'F':
                fsBtn.click();
                break;
        }
    });

    /* ----- Click to advance (ignore controls/links) ----- */
    deck.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;
        const x = e.clientX;
        if (x < window.innerWidth * 0.28) {
            prev();
        } else {
            next();
        }
    });

    /* ----- Touch swipe ----- */
    let startX = 0, startY = 0;
    deck.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    deck.addEventListener('touchend', function (e) {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) next(); else prev();
        }
    }, { passive: true });

    /* ----- Hide hint after a moment ----- */
    setTimeout(function () { if (hint) hint.style.opacity = '0'; }, 4500);

    /* ----- Restore from hash ----- */
    const fromHash = parseInt((location.hash || '').replace('#', ''), 10);
    if (fromHash && fromHash >= 1 && fromHash <= total) {
        current = fromHash - 1;
    }

    render();
})();
