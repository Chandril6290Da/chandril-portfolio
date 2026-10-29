/* =========================================
   EDUCATION PATHWAY MOTION
   GSAP + ScrollTrigger Timeline
========================================= */

(() => {
  'use strict';

  const initEducationMotion = () => {
    const section = document.querySelector('.education-section');
    if (!section || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = section.querySelectorAll('.ed-node-card');
    const lineProgress = section.querySelector('.ed-line-active');

    if (reduceMotion) {
      gsap.set(cards, { clearProps: 'all', opacity: 1, y: 0 });
      if (lineProgress) lineProgress.style.width = '100%';
      return;
    }

    // Set initial states
    gsap.set(cards, { opacity: 0, y: 40 });
    if (window.innerWidth > 900) {
      gsap.set(lineProgress, { width: '0%', height: '100%' });
    } else {
      gsap.set(lineProgress, { width: '100%', height: '0%' });
    }

    // 1. Draw the horizontal (or vertical on mobile) timeline
    const drawLine = gsap.to(lineProgress, {
      width: window.innerWidth > 900 ? '100%' : '100%',
      height: window.innerWidth > 900 ? '100%' : '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.ed-pathway',
        start: 'top 70%',
        end: 'bottom 85%',
        scrub: 1,
      }
    });

    // Handle responsive line drawing on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        gsap.set(lineProgress, { height: '100%' });
        drawLine.vars.width = '100%';
      } else {
        gsap.set(lineProgress, { width: '100%' });
        drawLine.vars.height = '100%';
      }
    });

    // 2. Animate each card when it comes into view or timeline reaches it
    cards.forEach((card, index) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      });

      tl.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'back.out(1.5)',
        delay: window.innerWidth > 900 ? index * 0.2 : 0 // Stagger on desktop
      });

      // Activate node style exactly when the card appears
      ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        onEnter: () => card.classList.add('is-active'),
        onLeaveBack: () => card.classList.remove('is-active')
      });
    });
    
    // Refresh ScrollTrigger to ensure correct measurements
    ScrollTrigger.refresh();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEducationMotion, { once: true });
  } else {
    initEducationMotion();
  }
})();
