/* ============================================================
   Zikra — Taqdimot navigatsiyasi
   Klaviatura, touch swipe, dots, progress, fullscreen, URL hash.
   ============================================================ */

(() => {
    'use strict';

    const deck = document.getElementById('deck');
    if (!deck) return;

    const slides = [...deck.querySelectorAll('.slide')];
    const total = slides.length;
    if (!total) return;

    const $ = (id) => document.getElementById(id);

    const prevBtn = $('prevBtn');
    const nextBtn = $('nextBtn');
    const fsBtn = $('fsBtn');
    const curNum = $('curNum');
    const totalNum = $('totalNum');
    const progress = document.querySelector('.progress');
    const progressBar = $('progressBar');
    const dotsWrap = $('dots');
    const hint = $('hint');

    const reducedMotion = matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let current = 0;
    let touchStart = null;

    totalNum.textContent = String(total);

    // Accessible slide index shortcuts
    slides.forEach((slide, index) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slayd');

        slide.setAttribute(
            'aria-label',
            `${index + 1} / ${total}: ${slide.dataset.title || 'Slayd'}`
        );

        const dot = document.createElement('button');

        dot.type = 'button';

        dot.setAttribute(
            'aria-label',
            `${index + 1}-slayd: ${slide.dataset.title || 'Slayd'}`
        );

        dot.title = slide.dataset.title || `Slayd ${index + 1}`;

        dot.addEventListener('click', () => go(index));

        dotsWrap.appendChild(dot);
    });

    const dots = [...dotsWrap.children];

    function render(updateHash = true) {
        slides.forEach((slide, index) => {
            const active = index === current;

            slide.classList.toggle('is-active', active);

            slide.setAttribute(
                'aria-hidden',
                String(!active)
            );

            if ('inert' in slide) {
                slide.inert = !active;
            }
        });

        dots.forEach((dot, index) => {
            const active = index === current;

            dot.classList.toggle('active', active);

            if (active) {
                dot.setAttribute('aria-current', 'step');
            } else {
                dot.removeAttribute('aria-current');
            }
        });

        curNum.textContent = String(current + 1);

        const pct = ((current + 1) / total) * 100;

        progressBar.style.width = `${pct}%`;

        progress?.setAttribute(
            'aria-valuenow',
            String(current + 1)
        );

        progress?.setAttribute(
            'aria-valuemax',
            String(total)
        );

        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === total - 1;

        prevBtn.setAttribute(
            'aria-disabled',
            String(prevBtn.disabled)
        );

        nextBtn.setAttribute(
            'aria-disabled',
            String(nextBtn.disabled)
        );

        if (updateHash && history.replaceState) {
            history.replaceState(
                null,
                '',
                `#${current + 1}`
            );
        }
    }

    function go(index) {
        const target = Math.max(
            0,
            Math.min(total - 1, Number(index) || 0)
        );

        if (target === current) return;

        current = target;

        render();
    }

    const next = () => go(current + 1);
    const prev = () => go(current - 1);

    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

    // Fullscreen
    async function toggleFullscreen() {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen?.();
            } else {
                await document.exitFullscreen?.();
            }
        } catch (error) {
            console.warn(
                'To‘liq ekran rejimi ishga tushmadi:',
                error
            );
        }
    }

    fsBtn.addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', () => {
        const enabled = Boolean(document.fullscreenElement);

        fsBtn.setAttribute(
            'aria-label',
            enabled
                ? 'To‘liq ekrandan chiqish'
                : 'To‘liq ekran'
        );

        fsBtn.title = enabled
            ? 'To‘liq ekrandan chiqish (F)'
            : 'To‘liq ekran (F)';
    });

    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        const target = event.target;

        if (
            target instanceof HTMLElement &&
            (
                target.isContentEditable ||
                /INPUT|TEXTAREA|SELECT/.test(target.tagName)
            )
        ) {
            return;
        }

        switch (event.key) {
            case 'ArrowRight':
            case 'PageDown':
            case ' ':
                event.preventDefault();
                next();
                break;

            case 'ArrowLeft':
            case 'PageUp':
                event.preventDefault();
                prev();
                break;

            case 'Home':
                event.preventDefault();
                go(0);
                break;

            case 'End':
                event.preventDefault();
                go(total - 1);
                break;

            case 'f':
            case 'F':
                event.preventDefault();
                toggleFullscreen();
                break;

            case 'Escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen?.();
                }
                break;
        }
    });

    // Tap navigation
    deck.addEventListener('click', (event) => {
        if (
            event.target.closest(
                'a,button,[role="button"]'
            )
        ) {
            return;
        }

        if (event.detail === 0) return;

        const x = event.clientX;

        if (x < window.innerWidth * 0.28) {
            prev();
        } else {
            next();
        }
    });

    // Touch swipe
    deck.addEventListener(
        'touchstart',
        (event) => {
            const t = event.changedTouches[0];

            touchStart = {
                x: t.clientX,
                y: t.clientY
            };
        },
        { passive: true }
    );

    deck.addEventListener(
        'touchend',
        (event) => {
            if (!touchStart) return;

            const t = event.changedTouches[0];

            const dx = t.clientX - touchStart.x;
            const dy = t.clientY - touchStart.y;

            if (
                Math.abs(dx) > 48 &&
                Math.abs(dx) > Math.abs(dy) * 1.25
            ) {
                dx < 0 ? next() : prev();
            }

            touchStart = null;
        },
        { passive: true }
    );

    // Restore slide from URL hash
    function restoreHash() {
        const value = Number.parseInt(
            location.hash.slice(1),
            10
        );

        if (
            Number.isInteger(value) &&
            value >= 1 &&
            value <= total
        ) {
            current = value - 1;
        }

        render(false);
    }

    window.addEventListener(
        'hashchange',
        restoreHash
    );

    restoreHash();

    // Hint animation
    if (hint && !reducedMotion) {
        window.setTimeout(() => {
            hint.style.opacity = '0';
        }, 4500);
    } else if (hint) {
        hint.hidden = true;
    }
})();
