/* Zikra — Taqdimot navigatsiyasi
   ← → Space PageUp/Down Home End F | sichqoncha, g'ildirak, swipe, dots, URL hash */
(function () {
    'use strict';

    var deck = document.getElementById('deck');
    var slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
    var total = slides.length;

    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    var fsBtn = document.getElementById('fsBtn');
    var curNum = document.getElementById('curNum');
    var totalNum = document.getElementById('totalNum');
    var progressBar = document.getElementById('progressBar');
    var dotsWrap = document.getElementById('dots');
    var hint = document.getElementById('hint');
    var current = 0;

    totalNum.textContent = total;

    /* Slayd raqami va kirish animatsiyasi uchun indekslar */
    var staggerSel = '.slide__inner > *, .grid > *, .steps > *, .feat-grid > *, .tech > *, .roadmap > *, .exchange > *';
    slides.forEach(function (s, i) {
        s.dataset.n = String(i + 1).padStart(2, '0');
        s.setAttribute('aria-label', s.dataset.title || ('Slayd ' + (i + 1)));
        var k = 0;
        s.querySelectorAll(staggerSel).forEach(function (el) {
            el.classList.add('st');
            el.style.setProperty('--i', k++);
        });
    });

    /* Dots */
    slides.forEach(function (s, i) {
        var b = document.createElement('button');
        var t = s.dataset.title || ('Slayd ' + (i + 1));
        b.setAttribute('aria-label', t);
        b.title = t;
        b.addEventListener('click', function () { go(i); });
        dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function render() {
        slides.forEach(function (s, i) {
            s.classList.toggle('is-active', i === current);
            s.classList.toggle('is-past', i < current);
            s.setAttribute('aria-hidden', i === current ? 'false' : 'true');
            s.inert = i !== current;
        });
        dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
        curNum.textContent = current + 1;
        progressBar.style.width = ((current + 1) / total * 100) + '%';
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === total - 1;
        if (history.replaceState) history.replaceState(null, '', '#' + (current + 1));
    }

    function go(i) {
        var n = Math.max(0, Math.min(total - 1, i));
        if (n === current) return;
        current = n;
        render();
    }
    function next() { go(current + 1); }
    function prev() { go(current - 1); }

    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

    function toggleFs() {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    fsBtn.addEventListener('click', toggleFs);

    /* Klaviatura */
    document.addEventListener('keydown', function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        switch (e.key) {
            case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
                e.preventDefault(); next(); break;
            case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
                e.preventDefault(); prev(); break;
            case 'Home': e.preventDefault(); go(0); break;
            case 'End': e.preventDefault(); go(total - 1); break;
            case 'f': case 'F': toggleFs(); break;
        }
    });

    /* Bosib o'tish (chap 28% — orqaga) */
    deck.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;
        if (e.clientX < window.innerWidth * 0.28) prev(); else next();
    });

    /* Sichqoncha g'ildiragi */
    var wheelLock = false;
    window.addEventListener('wheel', function (e) {
        var inner = e.target.closest && e.target.closest('.slide__inner');
        if (inner && inner.scrollHeight > inner.clientHeight + 4) return;
        if (wheelLock || Math.abs(e.deltaY) < 30) return;
        wheelLock = true;
        if (e.deltaY > 0) next(); else prev();
        setTimeout(function () { wheelLock = false; }, 700);
    }, { passive: true });

    /* Swipe */
    var sx = 0, sy = 0;
    deck.addEventListener('touchstart', function (e) {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    deck.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - sx;
        var dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); }
    }, { passive: true });

    /* Fon parallaksi */
    window.addEventListener('pointermove', function (e) {
        var r = document.documentElement.style;
        r.setProperty('--mx', (e.clientX / window.innerWidth - .5).toFixed(3));
        r.setProperty('--my', (e.clientY / window.innerHeight - .5).toFixed(3));
    });

    /* Harakatsiz bo'lsa boshqaruv yashirinadi */
    var idleTimer;
    function wake() {
        document.body.classList.remove('idle');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function () { document.body.classList.add('idle'); }, 3500);
    }
    ['pointermove', 'keydown', 'touchstart'].forEach(function (ev) {
        window.addEventListener(ev, wake, { passive: true });
    });
    wake();

    setTimeout(function () { if (hint) hint.style.opacity = '0'; }, 4500);

    /* URL hash va tashqi o'zgarishlar */
    function fromHash() {
        var h = parseInt((location.hash || '').replace('#', ''), 10);
        if (h >= 1 && h <= total) { current = h - 1; }
    }
    window.addEventListener('hashchange', function () {
        var prevIdx = current;
        fromHash();
        if (prevIdx !== current) render();
    });

    fromHash();
    render();
})();
