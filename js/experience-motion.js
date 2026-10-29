/* ======================================================
   EXPERIENCE MOTION ENGINE
   Scroll reveal + timeline + statistics
====================================================== */

(() => {
  "use strict";

  const section = document.querySelector("#experience");

  if (!section) return;

  const cards = section.querySelectorAll(".exp-reveal");

  const timelineProgress = section.querySelector(
    ".exp-timeline-progress"
  );

  const counters = section.querySelectorAll("[data-exp-count]");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;


  /* ---------------------------------------
     1. SCROLL REVEAL
  --------------------------------------- */

  if ("IntersectionObserver" in window && !reduceMotion) {

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) return;

          entry.target.classList.add("exp-visible");

          observer.unobserve(entry.target);

        });

      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px"
      }
    );

    cards.forEach((card, index) => {

      card.style.transitionDelay = `${Math.min(index * 100, 300)}ms`;

      revealObserver.observe(card);

    });

  } else {

    cards.forEach((card) => {
      card.classList.add("exp-visible");
    });

  }


  /* ---------------------------------------
     2. ANIMATED STATISTICS
  --------------------------------------- */

  function animateCounter(element) {

    if (element.dataset.expAnimated === "true") return;

    element.dataset.expAnimated = "true";

    const target = Number(element.dataset.expCount);

    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      element.textContent = String(target).padStart(2, "0");
      return;
    }

    const duration = 1000;
    const startTime = performance.now();

    function updateCounter(now) {

      const progress = Math.min(
        (now - startTime) / duration,
        1
      );

      // Smooth ease-out animation
      const eased = 1 - Math.pow(1 - progress, 4);

      const current = Math.round(target * eased);

      element.textContent = String(current).padStart(2, "0");

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }

    }

    requestAnimationFrame(updateCounter);

  }


  if ("IntersectionObserver" in window && !reduceMotion) {

    const counterObserver = new IntersectionObserver(
      (entries, observer) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) return;

          animateCounter(entry.target);

          observer.unobserve(entry.target);

        });

      },
      {
        threshold: 0.6
      }
    );

    counters.forEach((counter) => {
      counterObserver.observe(counter);
    });

  } else {

    counters.forEach(animateCounter);

  }


  /* ---------------------------------------
     3. TIMELINE SCROLL PROGRESS
  --------------------------------------- */

  let ticking = false;

  function updateTimeline() {

    ticking = false;

    if (!timelineProgress) return;

    const timeline = section.querySelector(".exp-timeline");

    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();

    const viewportHeight = window.innerHeight;

    const totalHeight = rect.height;

    const travelled = Math.min(
      Math.max(viewportHeight * 0.75 - rect.top, 0),
      totalHeight
    );

    const percentage = totalHeight > 0
      ? (travelled / totalHeight) * 100
      : 0;

    timelineProgress.style.height = `${percentage}%`;

  }


  function requestTimelineUpdate() {

    if (ticking) return;

    ticking = true;

    requestAnimationFrame(updateTimeline);

  }


  if (!reduceMotion) {

    window.addEventListener(
      "scroll",
      requestTimelineUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      requestTimelineUpdate,
      { passive: true }
    );

    updateTimeline();

  } else if (timelineProgress) {

    timelineProgress.style.height = "100%";

  }

})();