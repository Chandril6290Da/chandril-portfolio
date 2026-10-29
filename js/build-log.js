(() => {
  'use strict';
  const cards = document.querySelectorAll('.build-log-card');
  if (!cards.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.gsap && window.ScrollTrigger && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    cards.forEach((card, index) => {
      gsap.fromTo(card, { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, duration: .62, delay: index * .07, ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 88%', once: true }
      });
    });
    document.querySelectorAll('#build-log [data-gsap-reveal]').forEach(el => {
      gsap.fromTo(el, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .58, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }
})();
