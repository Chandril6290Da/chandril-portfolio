/* Small, accessible GSAP pass for sections not animated by the existing modules. */
(() => {
  'use strict';

  const initPortfolioMotion = () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !window.gsap || !window.ScrollTrigger) return;

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    const heroItems = [...document.querySelectorAll('.hero-copy, .hero-visual')];
    if (heroItems.length) {
      heroItems.forEach(item => item.classList.add('visible'));
      gsap.fromTo(heroItems,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: .85,
          stagger: .14,
          ease: 'power3.out',
          clearProps: 'transform,opacity,visibility'
        }
      );
    }

    const revealGroups = [
      { selector: '.profile-modules .module-card', trigger: '.profile-modules' },
      { selector: '.sv2-cap-grid .sv2-cap-card', trigger: '.sv2-cap-grid' },
      { selector: '.sv2-pipeline-flow .sv2-pipe-step', trigger: '.sv2-pipeline-flow' }
    ];

    revealGroups.forEach(({ selector, trigger }) => {
      const cards = gsap.utils.toArray(selector);
      const triggerElement = document.querySelector(trigger);
      if (!cards.length || !triggerElement) return;

      gsap.fromTo(cards,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: .62,
          stagger: .1,
          ease: 'power2.out',
          clearProps: 'transform,opacity,visibility',
          scrollTrigger: {
            trigger: triggerElement,
            start: 'top 84%',
            once: true
          }
        }
      );
    });

    const refresh = () => ScrollTrigger.refresh();
    if (document.readyState === 'complete') refresh();
    else window.addEventListener('load', refresh, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortfolioMotion, { once: true });
  } else {
    initPortfolioMotion();
  }
})();
