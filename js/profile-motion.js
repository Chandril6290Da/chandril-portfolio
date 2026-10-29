/* =========================================
   PROFILE MOTION
   GSAP ScrollTrigger Animation
========================================= */

(() => {
  'use strict';

  const initProfileMotion = () => {
    const section = document.querySelector('.about-section');
    if (!section || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const streamParas = section.querySelectorAll('.stream-content p');
    const quoteLines = section.querySelectorAll('.quote-line');
    const modules = section.querySelectorAll('.module-card');
    const dataStream = section.querySelector('.profile-data-stream');

    if (reduceMotion) {
      gsap.set([streamParas, quoteLines, modules], { clearProps: 'all', opacity: 1, y: 0, scale: 1 });
      return;
    }

    // Initial states
    gsap.set(streamParas, { opacity: 0, y: 15 });
    gsap.set(quoteLines, { opacity: 0, y: 10 });
    gsap.set(modules, { opacity: 0, scale: 0.95, y: 20 });
    gsap.set(dataStream, { opacity: 0, x: -30 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });

    // 1. Reveal main data stream container
    tl.to(dataStream, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

    // 2. "Decrypt" text paragraphs
    tl.to(streamParas, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power2.out'
    }, '-=0.4');

    // 3. Stagger quote lines
    tl.to(quoteLines, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'back.out(1.2)'
    }, '-=0.2');

    // 4. Pop in the biometric/data modules
    tl.to(modules, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: 'back.out(1.4)'
    }, '-=0.6');

  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileMotion, { once: true });
  } else {
    initProfileMotion();
  }
})();
