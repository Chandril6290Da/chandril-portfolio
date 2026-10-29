/**
 * ANTI-GRAVITY & HIGH-TECH MOTION SYSTEM
 * Principal Motion Graphics & Creative Front-End Engine
 * Specializing in WebGL/Canvas, GSAP-level physics, and 60 FPS GPU interactions.
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. TWEAK PARAMETERS & GLOBAL CONFIGURATION
     Exposed on window.AntiGravityConfig for instant fine-tuning
     ========================================================================== */
  window.AntiGravityConfig = {
    // Canvas weightless particle field
    particles: {
      count: window.innerWidth < 768 ? 22 : 55,
      speedYMin: -0.25,
      speedYMax: -0.75,
      driftSpread: 0.8,
      repulsionRadius: 120,
      repulsionStrength: 0.35,
      connectionDistance: 95,
      nodeGlyphs: ['01', 'λ', '∫', '∇', '0x7F', 'σ', 'W·x+b', 'AI', '●', '✦', '< />']
    },
    // 3D Card tilt physics
    tilt: {
      maxAngle: 10,           // Maximum tilt rotation in degrees
      perspective: 1000,       // 3D perspective depth in px
      scale: 1.02,             // Hover scale multiplier
      speed: 350,              // Return transition speed in ms
      innerParallaxZ: 20       // Depth translation in px
    },
    // Magnetic attraction & repulsion
    magnetic: {
      radius: 95,              // Proximity trigger distance in px
      strength: 0.32,          // Magnetic pull intensity
      repelRadius: 85,         // Repel proximity trigger distance in px
      repelStrength: 0.28,     // Repel push intensity
      springDamping: 0.16      // Lerp interpolation factor
    },
    // Parallax scrolling
    parallax: {
      intensity: 0.14,         // Content parallax buoyancy factor
      canvasBuoyancy: 0.08     // Background canvas parallax factor
    },
    // Floating idle parameters
    floating: {
      amplitude: 12,           // Maximum vertical float drift in px
      rotationSpread: 1.5      // Maximum angular drift in degrees
    }
  };

  const CFG = window.AntiGravityConfig;

  // Environment & capability checks
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const prefersReducedMotion = true;

  // Global mouse coordinates
  const mouse = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    trailX: -1000,
    trailY: -1000,
    isDown: false,
    isActive: false
  };

  // Scroll state
  let scrollY = window.pageYOffset || document.documentElement.scrollTop;
  let targetScrollY = scrollY;

  /* ==========================================================================
     2. THEME-AWARE COLOR PALETTE HELPER
     ========================================================================== */
  function getThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    const secondaryStr = styles.getPropertyValue('--secondary').trim() || '173 78% 38%';
    const accentStr = styles.getPropertyValue('--accent').trim() || '71 83% 61%';
    const borderStr = styles.getPropertyValue('--border').trim() || '219 22% 84%';
    
    return {
      secondary: `hsl(${secondaryStr})`,
      secondaryAlpha: (a) => `hsla(${secondaryStr} / ${a})`,
      accent: `hsl(${accentStr})`,
      accentAlpha: (a) => `hsla(${accentStr} / ${a})`,
      border: `hsl(${borderStr})`,
      borderAlpha: (a) => `hsla(${borderStr} / ${a})`
    };
  }

  /* ==========================================================================
     3. LOW-OVERHEAD CANVAS: ZERO-GRAVITY PARTICLES & NODES
     ========================================================================== */
  function initParticleCanvas() {
    if (prefersReducedMotion) return;

    let canvas = document.getElementById('antigravity-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'antigravity-canvas';
      canvas.className = 'antigravity-canvas';
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrameId = null;
    let isVisible = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-initialize particles
      createParticles();
    }

    function createParticles() {
      particles = [];
      const count = isTouchDevice ? 18 : CFG.particles.count;
      for (let i = 0; i < count; i++) {
        const isGlyph = i % 4 === 0;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * CFG.particles.driftSpread,
          vy: CFG.particles.speedYMin + Math.random() * (CFG.particles.speedYMax - CFG.particles.speedYMin),
          radius: isGlyph ? 0 : 1.2 + Math.random() * 2.2,
          alpha: 0.2 + Math.random() * 0.65,
          glyph: isGlyph ? CFG.particles.nodeGlyphs[Math.floor(Math.random() * CFG.particles.nodeGlyphs.length)] : null,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.025,
          colorType: Math.random() > 0.35 ? 'secondary' : 'accent'
        });
      }
    }

    function render(timestamp) {
      if (!isVisible) return;

      const colors = getThemeColors();
      ctx.clearRect(0, 0, width, height);

      // Subtle parallax shift based on scroll
      const canvasScrollOffset = (scrollY * CFG.parallax.canvasBuoyancy) % height;

      // Draw constellation connection lines
      if (!isTouchDevice) {
        ctx.lineWidth = 0.75;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.hypot(dx, dy);

            if (dist < CFG.particles.connectionDistance) {
              const alpha = (1 - dist / CFG.particles.connectionDistance) * 0.18;
              ctx.strokeStyle = colors.secondaryAlpha(alpha);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw and update each particle
      particles.forEach((p) => {
        p.phase += p.pulseSpeed;

        // Upward anti-gravity drift + gentle horizontal sine oscillation
        p.y += p.vy;
        p.x += Math.sin(p.phase) * 0.45;

        // Interactive mouse repulsion field
        if (mouse.isActive && !isTouchDevice) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < CFG.particles.repulsionRadius && dist > 1) {
            const force = (1 - dist / CFG.particles.repulsionRadius) * CFG.particles.repulsionStrength;
            p.x += (dx / dist) * force * 12;
            p.y += (dy / dist) * force * 12;
          }
        }

        // Screen wrap-around for infinite zero-gravity floating
        if (p.y < -30) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -30) p.x = width + 20;
        if (p.x > width + 30) p.x = -20;

        const currentAlpha = p.alpha * (0.65 + Math.sin(p.phase) * 0.35);

        if (p.glyph) {
          // Floating high-tech code glyph node
          ctx.font = '10px "DM Mono", monospace';
          ctx.fillStyle = p.colorType === 'accent' ? colors.accentAlpha(currentAlpha) : colors.secondaryAlpha(currentAlpha);
          ctx.fillText(p.glyph, p.x, p.y);
        } else {
          // Weightless luminescent particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.colorType === 'accent' ? colors.accentAlpha(currentAlpha) : colors.secondaryAlpha(currentAlpha);
          ctx.shadowColor = p.colorType === 'accent' ? colors.accent : colors.secondary;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    }

    // Page visibility handling to preserve battery & CPU
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible) {
        animationFrameId = requestAnimationFrame(render);
      } else if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });

    window.addEventListener('resize', resize, { passive: true });
    resize();
    animationFrameId = requestAnimationFrame(render);
  }

  /* ==========================================================================
     4. DUAL-RING HIGH-TECH HUD CURSOR WITH PARTICLE TRAIL
     ========================================================================== */
  function initHudCursor() {
    if (isTouchDevice || prefersReducedMotion) return;

    // Check or inject cursor markup
    let wrap = document.querySelector('.ag-cursor-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'ag-cursor-wrap';
      wrap.innerHTML = `
        <div class="ag-cursor-dot"></div>
        <div class="ag-cursor-ring"></div>
      `;
      document.body.appendChild(wrap);
    }

    const dot = wrap.querySelector('.ag-cursor-dot');
    const ring = wrap.querySelector('.ag-cursor-ring');

    let ringX = -100;
    let ringY = -100;
    let particlesPool = [];
    const maxParticles = 6;

    // Create particle trail elements in DOM
    for (let i = 0; i < maxParticles; i++) {
      const part = document.createElement('div');
      part.className = 'ag-cursor-particle';
      part.style.display = 'none';
      wrap.appendChild(part);
      particlesPool.push({
        el: part,
        x: -100,
        y: -100,
        vx: 0,
        vy: -0.8,
        life: 0,
        active: false
      });
    }

    let spawnTimer = 0;

    function updateCursor() {
      if (mouse.isActive) {
        // Dot tracks cursor instantly
        dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;

        // Ring follows with spring lerp
        ringX += (mouse.x - ringX) * 0.18;
        ringY += (mouse.y - ringY) * 0.18;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

        // Emit particle trail when mouse is moving
        const velocity = Math.hypot(mouse.x - ringX, mouse.y - ringY);
        spawnTimer++;
        if (velocity > 3 && spawnTimer % 3 === 0) {
          const p = particlesPool.find((item) => !item.active) || particlesPool[0];
          p.x = mouse.x + (Math.random() - 0.5) * 8;
          p.y = mouse.y + (Math.random() - 0.5) * 8;
          p.vx = (Math.random() - 0.5) * 0.8;
          p.vy = -0.6 - Math.random() * 0.8;
          p.life = 1.0;
          p.active = true;
          p.el.style.display = 'block';
          p.el.style.width = `${3 + Math.random() * 3}px`;
          p.el.style.height = p.el.style.width;
        }

        // Animate trailing particles
        particlesPool.forEach((p) => {
          if (p.active) {
            p.x += p.vx;
            p.y += p.vy; // Anti-gravity upward drift
            p.life -= 0.055;

            if (p.life <= 0) {
              p.active = false;
              p.el.style.display = 'none';
            } else {
              p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
              p.el.style.opacity = p.life * 0.7;
            }
          }
        });
      }

      requestAnimationFrame(updateCursor);
    }

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      wrap.classList.add('is-down');
    });

    window.addEventListener('mouseup', () => {
      wrap.classList.remove('is-down');
    });

    document.addEventListener('mouseleave', () => {
      mouse.isActive = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      mouse.isActive = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    });

    // Detect clickable interactive hover targets
    const interactiveSelectors = 'a, button, input, textarea, select, .system-node, [role="button"], [tabindex="0"]';
    
    document.addEventListener('mouseover', (e) => {
      const target = e.target;
      if (target.closest('.ag-tilt-card')) {
        wrap.classList.add('is-card-lock');
      } else {
        wrap.classList.remove('is-card-lock');
      }

      if (target.closest(interactiveSelectors)) {
        wrap.classList.add('is-hovering');
      } else {
        wrap.classList.remove('is-hovering');
      }
    });

    requestAnimationFrame(updateCursor);
  }

  /* ==========================================================================
     5. 3D ANTI-GRAVITY TILT CARDS & CURSOR-FOLLOWING SPOTLIGHT
     ========================================================================== */
  /* Card motion: scroll-triggered reveal + CSS scan sweep; no idle floating or 3D tilt. */
  function initCardScanMotion() {
    const cards = document.querySelectorAll('.fact-card, .work-card, .micro-card, .capability, .credential, .hero-metrics > div, .build-log-card');
    if (prefersReducedMotion || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    cards.forEach((card, index) => {
      if (card.dataset.cardMotionReady === 'true') return;
      card.dataset.cardMotionReady = 'true';
      gsap.fromTo(card,
        { autoAlpha: 0, y: 18, clipPath: 'inset(0 0 8% 0 round 14px)' },
        { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0 round 14px)', duration: .58, delay: (index % 4) * .055, ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 91%', once: true } }
      );
    });
  }

  function initTiltCards() {
    if (isTouchDevice || prefersReducedMotion) return;

    const cards = document.querySelectorAll(`
      .work-card,
      .fact-card,
      .neural-card,
      .highlight-card,
      .micro-card,
      .contact-card,
      .match-panel,
      [data-ag-tilt]
    `);

    cards.forEach((card) => {
      card.classList.add('ag-tilt-card');
      card.classList.add('ag-hud-bracket');
      card.classList.add('ag-border-glow-wrap');

      // Inject spotlight layer if not already present
      if (!card.querySelector('.ag-spotlight-layer')) {
        const spot = document.createElement('div');
        spot.className = 'ag-spotlight-layer';
        card.appendChild(spot);
      }

      let bounds = null;

      function onMouseEnter() {
        bounds = card.getBoundingClientRect();
      }

      function onMouseMove(e) {
        if (!bounds) bounds = card.getBoundingClientRect();

        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        // Normalized relative coordinates: -1 to +1
        const normX = (mouseX / bounds.width - 0.5) * 2;
        const normY = (mouseY / bounds.height - 0.5) * 2;

        const tiltX = -normY * CFG.tilt.maxAngle;
        const tiltY = normX * CFG.tilt.maxAngle;

        // Apply 3D matrix transform
        card.style.transform = `perspective(${CFG.tilt.perspective}px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(${CFG.tilt.scale}, ${CFG.tilt.scale}, ${CFG.tilt.scale})`;

        // Update spotlight position
        card.style.setProperty('--mouse-x', `${mouseX}px`);
        card.style.setProperty('--mouse-y', `${mouseY}px`);
      }

      function onMouseLeave() {
        bounds = null;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
      }

      card.addEventListener('mouseenter', onMouseEnter);
      card.addEventListener('mousemove', onMouseMove, { passive: true });
      card.addEventListener('mouseleave', onMouseLeave);
    });
  }

  /* ==========================================================================
     6. INTERACTIVE PROXIMITY: MAGNETIC ATTRACTION & REPULSION
     ========================================================================== */
  function initMagneticAndRepel() {
    if (isTouchDevice || prefersReducedMotion) return;

    // Magnetic attraction elements: Primary buttons, brand mark, system nodes
    const magnetics = document.querySelectorAll('.button, .brand-mark, .system-node, [data-ag-magnetic]');
    
    // Repulsion elements: Small tags, pills, tech badges
    const repels = document.querySelectorAll('.tag-row span, .system-stack span, .signal-pill, [data-ag-repel]');

    magnetics.forEach((el) => {
      let bounds = null;
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      let animId = null;

      function update() {
        currentX += (targetX - currentX) * CFG.magnetic.springDamping;
        currentY += (targetY - currentY) * CFG.magnetic.springDamping;

        el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

        if (Math.hypot(targetX - currentX, targetY - currentY) > 0.1 || targetX !== 0) {
          animId = requestAnimationFrame(update);
        } else {
          el.style.transform = '';
          animId = null;
        }
      }

      function onMouseMove(e) {
        bounds = el.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < CFG.magnetic.radius) {
          targetX = dx * CFG.magnetic.strength;
          targetY = dy * CFG.magnetic.strength;
          if (!animId) animId = requestAnimationFrame(update);
        } else if (targetX !== 0 || targetY !== 0) {
          targetX = 0;
          targetY = 0;
          if (!animId) animId = requestAnimationFrame(update);
        }
      }

      function onMouseLeave() {
        targetX = 0;
        targetY = 0;
        if (!animId) animId = requestAnimationFrame(update);
      }

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      el.addEventListener('mouseleave', onMouseLeave);
    });

    // Zero-g soft repulsion on floating tags
    repels.forEach((el) => {
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      let animId = null;

      function update() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;

        el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

        if (Math.hypot(targetX - currentX, targetY - currentY) > 0.1 || targetX !== 0) {
          animId = requestAnimationFrame(update);
        } else {
          el.style.transform = '';
          animId = null;
        }
      }

      function onMouseMove(e) {
        const bounds = el.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < CFG.magnetic.repelRadius && dist > 2) {
          const force = (1 - dist / CFG.magnetic.repelRadius) * 22;
          // Softly push away
          targetX = -(dx / dist) * force;
          targetY = -(dy / dist) * force;
          if (!animId) animId = requestAnimationFrame(update);
        } else if (targetX !== 0 || targetY !== 0) {
          targetX = 0;
          targetY = 0;
          if (!animId) animId = requestAnimationFrame(update);
        }
      }

      window.addEventListener('mousemove', onMouseMove, { passive: true });
    });
  }

  /* ==========================================================================
     7. HIGH-TECH SPLIT-TEXT STAGGER REVEAL
     ========================================================================== */
  function initSplitTextReveals() {
    if (prefersReducedMotion) return;

    const titles = document.querySelectorAll(`
      .hero-title,
      .section-title,
      .contact-card h2,
      [data-ag-split]
    `);

    titles.forEach((el) => {
      // Preserve accessibility: store full text in aria-label
      const originalText = el.textContent.trim();
      el.setAttribute('aria-label', originalText);
      el.classList.add('ag-split-text');

      // Helper function to recursively wrap words and characters
      function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (!text.trim()) return document.createTextNode(text);

          const fragment = document.createDocumentFragment();
          const words = text.split(/(\s+)/);

          words.forEach((word) => {
            if (/^\s+$/.test(word)) {
              fragment.appendChild(document.createTextNode(word));
            } else if (word.length > 0) {
              const wordSpan = document.createElement('span');
              wordSpan.className = 'ag-word';

              for (let i = 0; i < word.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'ag-char';
                charSpan.textContent = word[i];
                wordSpan.appendChild(charSpan);
              }
              fragment.appendChild(wordSpan);
            }
          });

          return fragment;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const clone = node.cloneNode(false);
          node.childNodes.forEach((child) => {
            clone.appendChild(processNode(child));
          });
          return clone;
        }
        return node.cloneNode(true);
      }

      // Reconstruct element contents
      const fragment = document.createDocumentFragment();
      el.childNodes.forEach((child) => {
        fragment.appendChild(processNode(child));
      });
      el.innerHTML = '';
      el.appendChild(fragment);

      // Stagger delays across all characters
      const chars = el.querySelectorAll('.ag-char');
      chars.forEach((char, idx) => {
        char.style.transitionDelay = `${idx * 22}ms`;
      });

      // Trigger reveal on intersection
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-revealed');
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.15 });

      observer.observe(el);
    });
  }

  /* ==========================================================================
     8. INTERACTIVE STAT & NUMBER COUNTERS
     ========================================================================== */
  function initStatCounters() {
    const counterElements = document.querySelectorAll(`
      .fact-number,
      .highlight-value,
      .hero-metrics strong,
      .impact,
      [data-ag-counter]
    `);

    function animateCounter(el) {
      const rawText = el.textContent.trim();
      
      // Match number components (e.g., "01", "85%", "R² 0.87", "15% fewer discrepancies")
      const match = rawText.match(/(\d+\.?\d*)/);
      if (!match) return;

      const targetNum = parseFloat(match[0]);
      const prefix = rawText.slice(0, match.index);
      const suffix = rawText.slice(match.index + match[0].length);
      const isInteger = !match[0].includes('.');
      const hasLeadingZero = match[0].length === 2 && match[0].startsWith('0');
      const duration = 1600; // ms
      const startTime = performance.now();

      function updateNumber(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // High-tech easeOutExpo easing curve
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = targetNum * ease;

        let displayNum = '';
        if (isInteger) {
          const intVal = Math.round(currentVal);
          displayNum = hasLeadingZero && intVal < 10 ? `0${intVal}` : `${intVal}`;
        } else {
          displayNum = currentVal.toFixed(2);
        }

        el.textContent = `${prefix}${displayNum}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          el.textContent = rawText; // restore exact original
        }
      }

      requestAnimationFrame(updateNumber);
    }

    if ('IntersectionObserver' in window && !prefersReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });

      counterElements.forEach((el) => observer.observe(el));
    }
  }

  /* ==========================================================================
     9. SCROLL-DRIVEN WEIGHTLESSNESS PARALLAX
     ========================================================================== */
  function initScrollParallax() {
    if (prefersReducedMotion) return;

    const parallaxItems = document.querySelectorAll('[data-ag-speed]');

    function onScroll() {
      scrollY = window.pageYOffset || document.documentElement.scrollTop;

      parallaxItems.forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-ag-speed')) || 0.1;
        const offset = scrollY * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ==========================================================================
     11. PROCEDURAL SCI-FI AUDIO ENGINE (WEB AUDIO API)
     ========================================================================== */
  const SoundEngine = {
    ctx: null,
    enabled: false,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    toggle() {
      this.init();
      this.enabled = !this.enabled;
      if (this.enabled) this.playChord();
      return this.enabled;
    },
    playBlip(freq = 900, duration = 0.04) {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.6, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    },
    playClick() {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      } catch (e) {}
    },
    playKey() {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const f = 600 + Math.random() * 320;
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
      } catch (e) {}
    },
    playChord() {
      if (!this.enabled || !this.ctx) return;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        setTimeout(() => {
          try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.22);
          } catch (e) {}
        }, idx * 45);
      });
    }
  };

  /* ==========================================================================
     12. 3D INTERACTIVE HOLOGRAPHIC SPHERE LAB
     ========================================================================== */
  function initHologramLab() {
    const canvas = document.getElementById('holo-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0;
    let mode = 'neural'; // 'neural', 'quantum', 'cyber', 'dna'
    let rotX = 0.4, rotY = 0.6;
    let velX = 0.004, velY = 0.006;
    let isDragging = false;
    let lastMouseX = 0, lastMouseY = 0;
    let points = [];
    let edges = [];
    let sphereRadius = 140;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || 500;
      height = rect.height || 450;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sphereRadius = Math.min(width, height) * 0.32;
      buildGeometry();
    }

    function buildGeometry() {
      points = [];
      edges = [];

      if (mode === 'neural') {
        // Fibonacci sphere points with synaptic edges
        const count = 95;
        const phi = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < count; i++) {
          const y = 1 - (i / (count - 1)) * 2;
          const radiusAtY = Math.sqrt(1 - y * y);
          const theta = phi * i;
          const x = Math.cos(theta) * radiusAtY;
          const z = Math.sin(theta) * radiusAtY;
          points.push({
            x: x * sphereRadius,
            y: y * sphereRadius,
            z: z * sphereRadius,
            pulse: Math.random() * Math.PI * 2,
            type: i % 5 === 0 ? 'accent' : 'cyan'
          });
        }
        // Connect close neighbors
        for (let i = 0; i < points.length; i++) {
          for (let j = i + 1; j < points.length; j++) {
            const dx = points[i].x - points[j].x;
            const dy = points[i].y - points[j].y;
            const dz = points[i].z - points[j].z;
            const dist = Math.hypot(dx, dy, dz);
            if (dist < sphereRadius * 0.45) {
              edges.push({ a: i, b: j, dist });
            }
          }
        }
      } else if (mode === 'quantum') {
        // Multi-ring orbital golden swarm
        const count = 160;
        for (let i = 0; i < count; i++) {
          const ring = i % 4;
          const angle = (i / count) * Math.PI * 8;
          const r = sphereRadius * (0.4 + (ring * 0.22));
          const tilt = (ring * Math.PI) / 4;
          const rawX = Math.cos(angle) * r;
          const rawY = Math.sin(angle) * r * Math.cos(tilt);
          const rawZ = Math.sin(angle) * r * Math.sin(tilt);
          points.push({
            x: rawX,
            y: rawY,
            z: rawZ,
            pulse: Math.random() * Math.PI * 2,
            type: ring % 2 === 0 ? 'accent' : 'cyan'
          });
        }
      } else if (mode === 'cyber') {
        // Latitude & Longitude wireframe rings
        const lats = 7;
        const lons = 12;
        for (let la = 1; la < lats; la++) {
          const theta = (la / lats) * Math.PI;
          const y = Math.cos(theta) * sphereRadius;
          const r = Math.sin(theta) * sphereRadius;
          for (let lo = 0; lo < lons; lo++) {
            const phi = (lo / lons) * Math.PI * 2;
            const x = Math.cos(phi) * r;
            const z = Math.sin(phi) * r;
            points.push({ x, y, z, pulse: Math.random() * Math.PI * 2, type: 'cyan' });
          }
        }
      } else if (mode === 'dna') {
        // Double helix structure
        const count = 50;
        const h = sphereRadius * 2.2;
        for (let i = 0; i < count; i++) {
          const t = (i / count) * Math.PI * 6;
          const y = (i / count - 0.5) * h;
          const r = sphereRadius * 0.6;
          // Strand A
          points.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r, pulse: t, type: 'cyan' });
          // Strand B (offset by PI)
          points.push({ x: Math.cos(t + Math.PI) * r, y, z: Math.sin(t + Math.PI) * r, pulse: t, type: 'accent' });
        }
      }
    }

    function render(time) {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const fov = 350;

      // Inertia & Auto-rotation
      if (!isDragging) {
        rotX += velX;
        rotY += velY;
        velX *= 0.985;
        velY *= 0.985;
        if (Math.abs(velX) < 0.003) velX = 0.003;
        if (Math.abs(velY) < 0.004) velY = 0.004;
      }

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      // Project 3D points
      const projected = points.map((p) => {
        // Rotate around Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        // Rotate around X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const scale = fov / (fov + z2);
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          z: z2,
          scale,
          type: p.type,
          pulse: p.pulse
        };
      });

      // Sort by Z for realistic depth occlusion
      projected.sort((a, b) => a.z - b.z);

      // Draw wireframe edges
      if (mode === 'neural' && edges.length > 0) {
        ctx.lineWidth = 0.75;
        edges.forEach((e) => {
          const p1 = projected[e.a];
          const p2 = projected[e.b];
          if (p1 && p2) {
            const avgZ = (p1.z + p2.z) / 2;
            const alpha = Math.max(0.04, Math.min(0.35, (avgZ + sphereRadius) / (sphereRadius * 2)));
            ctx.strokeStyle = `rgba(20, 184, 166, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      }

      // Draw points
      projected.forEach((p) => {
        const radius = Math.max(1, (p.type === 'accent' ? 3.2 : 2.2) * p.scale);
        const alpha = Math.max(0.15, Math.min(0.95, (p.z + sphereRadius) / (sphereRadius * 2) * 1.1));
        const color = p.type === 'accent' ? `rgba(198, 241, 53, ${alpha})` : `rgba(0, 240, 255, ${alpha})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = p.type === 'accent' ? '#c6f135' : '#00f0ff';
        ctx.shadowBlur = radius * 3;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(render);
    }

    // Mouse drag interactions
    const stage = canvas.closest('.holo-stage');
    if (stage) {
      stage.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        velY = dx * 0.005;
        velX = -dy * 0.005;
        rotY += velY;
        rotX += velX;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }, { passive: true });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      // Touch drag
      stage.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          lastMouseX = e.touches[0].clientX;
          lastMouseY = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - lastMouseX;
        const dy = e.touches[0].clientY - lastMouseY;
        velY = dx * 0.006;
        velX = -dy * 0.006;
        rotY += velY;
        rotX += velX;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDragging = false;
      });
    }

    // Mode buttons
    document.querySelectorAll('.holo-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.holo-mode-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        mode = btn.getAttribute('data-holo-mode') || 'neural';
        buildGeometry();
        SoundEngine.playChord();

        // Update telemetry label
        const modeLabel = document.getElementById('holo-active-mode-label');
        if (modeLabel) modeLabel.textContent = mode.toUpperCase();
      });
    });

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(render);

    // Waveform oscilloscope visualizer
    initHoloWaveform();
  }

  function initHoloWaveform() {
    const wCanvas = document.getElementById('holo-waveform-canvas');
    if (!wCanvas) return;
    const wCtx = wCanvas.getContext('2d');
    if (!wCtx) return;

    let w = 0, h = 0, phase = 0;
    function resizeWave() {
      w = wCanvas.offsetWidth || 300;
      h = wCanvas.offsetHeight || 70;
      wCanvas.width = w;
      wCanvas.height = h;
    }
    function drawWave() {
      wCtx.clearRect(0, 0, w, h);
      phase += 0.04;

      wCtx.lineWidth = 1.5;
      wCtx.strokeStyle = '#14b8a6';
      wCtx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * 0.035 + phase) * 18 + Math.sin(x * 0.08 + phase * 1.5) * 8;
        if (x === 0) wCtx.moveTo(x, y);
        else wCtx.lineTo(x, y);
      }
      wCtx.stroke();

      // Accent harmonic wave
      wCtx.lineWidth = 1;
      wCtx.strokeStyle = 'rgba(198, 241, 53, 0.45)';
      wCtx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.cos(x * 0.045 - phase * 0.8) * 12;
        if (x === 0) wCtx.moveTo(x, y);
        else wCtx.lineTo(x, y);
      }
      wCtx.stroke();

      requestAnimationFrame(drawWave);
    }
    window.addEventListener('resize', resizeWave, { passive: true });
    resizeWave();
    requestAnimationFrame(drawWave);
  }

  /* ==========================================================================
     13. INTERACTIVE CYBER COMMAND DECK TERMINAL
     ========================================================================== */
  function initCyberTerminal() {
    const termInput = document.getElementById('ag-terminal-input');
    const termLogs = document.getElementById('ag-terminal-logs');
    if (!termInput || !termLogs) return;

    const commands = {
      help: `Available commands:
  <span class="accent">skills</span>       - Inspect AI/ML, Python, and robotics core stacks
  <span class="accent">projects</span>     - Browse featured intelligent systems & experiments
  <span class="accent">stats</span>        - Review education, certifications, and benchmark metrics
  <span class="accent">diagnostics</span>  - Run simulated neural telemetry diagnostic sweep
  <span class="accent">matrix</span>       - Toggle digital matrix code rain
  <span class="accent">audio</span>        - Toggle procedural Web Audio synthesizer
  <span class="accent">whoami</span>       - Output engineer telemetry profile
  <span class="accent">clear</span>        - Clear terminal log output
  <span class="accent">contact</span>      - Open direct communication channels`,
      skills: `<span class="cyan">CORE PROFICIENCIES:</span>
  • Machine Learning: scikit-learn, Regression, Classification, Random Forest, XGBoost
  • Python Core: Data wrangling (pandas, NumPy), Automation, APIs, Fast feedback loops
  • GenAI / LLMs: RAG pipelines, Prompt engineering, Autonomous tool-use agents
  • Hardware & IoT: Arduino, Embedded sensors, Motor controllers, Actuation logic`,
      projects: `<span class="cyan">FEATURED INTELLIGENT SYSTEMS:</span>
  [01] Intelligent Systems & Predictive Models: Real-world decision models (R² 0.87)
  [02] Hardware Meets Code: IoT robotics experiments turning logic into physical movement
  [03] Data → Insight → Decision: Analytics dashboards revealing signal in messy data
  [04] Signal Sprint Mission: Interactive canvas arcade game exploring technology shards`,
      stats: `<span class="cyan">SYSTEM TELEMETRY & CREDENTIALS:</span>
  • Degree: BCA (Honours) — Machine Learning (EIILM Kolkata / RGU)
  • Certifications: Generative AI for Beginners (Simplilearn 2024), GenAI Studio (Google 2024)
  • Experience: SOP Operations & Data Tracking (Apollo Pharmacy, 15% fewer discrepancies)
  • Problem Solving: Regular algorithmic training on LeetCode`,
      whoami: `<span class="cyan">IDENTITY:</span> Chandril Goswami — AI/ML Engineer, Builder & Explorer.
<span class="sys">LOCATION:</span> Kolkata, India | Open to internships, collaborations & junior AI/ML roles.`,
      contact: `Direct channels ready:
  • Email: <a href="mailto:chandrilgoswamiofficial6290@gmail.com" class="accent">chandrilgoswamiofficial6290@gmail.com</a>
  • GitHub: <a href="https://github.com/Chandril6290Da" target="_blank" class="cyan">github.com/Chandril6290Da</a>
  • LinkedIn: <a href="https://linkedin.com/in/chandrilgoswami" target="_blank" class="accent">linkedin.com/in/chandrilgoswami</a>`,
      audio: () => {
        const on = SoundEngine.toggle();
        const btn = document.getElementById('ag-audio-toggle');
        if (btn) btn.classList.toggle('is-sound-on', on);
        return `<span class="cyan">Web Audio Synthesizer:</span> <span class="accent">${on ? 'ENABLED (Audio ON)' : 'MUTED (Audio OFF)'}</span>`;
      },
      matrix: () => {
        toggleMatrixRain();
        return '<span class="accent">Matrix digital stream toggled.</span>';
      },
      clear: () => {
        termLogs.innerHTML = '';
        return null;
      },
      diagnostics: () => {
        runDiagnostics();
        return '<span class="cyan">Initiating full neural diagnostics sweep...</span>';
      }
    };

    function logOutput(html) {
      if (html === null) return;
      const div = document.createElement('div');
      div.className = 'ag-terminal-log';
      div.innerHTML = html;
      termLogs.appendChild(div);
      termLogs.scrollTop = termLogs.scrollHeight;
    }

    function executeCommand(cmdStr) {
      const cleanCmd = cmdStr.trim().toLowerCase();
      if (!cleanCmd) return;

      SoundEngine.playClick();

      // Echo input
      logOutput(`<span class="sys">guest@chandril-ai:~$</span> <strong>${escapeHtml(cmdStr)}</strong>`);

      if (commands[cleanCmd]) {
        const res = typeof commands[cleanCmd] === 'function' ? commands[cleanCmd]() : commands[cleanCmd];
        if (res) logOutput(res);
      } else {
        SoundEngine.playBlip(320, 0.08);
        logOutput(`<span class="warn">Command not recognized: '${escapeHtml(cleanCmd)}'. Type <span class="accent">help</span> for a list of commands.</span>`);
      }
    }

    function runDiagnostics() {
      const steps = [
        'Checking neural weights and latent vectors... [OK]',
        'Verifying WebGL GPU shaders & 60fps buffers... [OK]',
        'Pinging Anti-Gravity orbital mechanics... [COHERENCE 99.8%]',
        'Synthesizing procedural audio oscillators... [ONLINE]',
        'All intelligent subsystems fully operational.'
      ];
      steps.forEach((step, idx) => {
        setTimeout(() => {
          logOutput(`<span class="sys">[DIAG 0${idx + 1}]</span> <span class="accent">${step}</span>`);
          SoundEngine.playBlip(600 + idx * 80, 0.03);
        }, (idx + 1) * 350);
      });
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    termInput.addEventListener('keydown', (e) => {
      SoundEngine.playKey();
      if (e.key === 'Enter') {
        const val = termInput.value;
        termInput.value = '';
        executeCommand(val);
      }
    });

    // Quick command chip buttons
    document.querySelectorAll('.ag-cmd-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        if (cmd) executeCommand(cmd);
      });
    });
  }

  // Matrix Digital Rain background inside terminal / screen
  let matrixAnimId = null;
  function toggleMatrixRain() {
    const mCanvas = document.getElementById('ag-matrix-canvas');
    if (!mCanvas) return;

    const isActive = mCanvas.classList.toggle('is-active');
    if (!isActive) {
      if (matrixAnimId) cancelAnimationFrame(matrixAnimId);
      return;
    }

    const mCtx = mCanvas.getContext('2d');
    let mw = mCanvas.offsetWidth || 600;
    let mh = mCanvas.offsetHeight || 400;
    mCanvas.width = mw;
    mCanvas.height = mh;

    const chars = '0123456789ABCDEF01アイウエオカキクケコサシスセソタチツテト';
    const fontSize = 14;
    const columns = Math.floor(mw / fontSize);
    const drops = Array(columns).fill(1);

    function drawMatrix() {
      mCtx.fillStyle = 'rgba(9, 13, 20, 0.12)';
      mCtx.fillRect(0, 0, mw, mh);

      mCtx.fillStyle = '#00f0ff';
      mCtx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        mCtx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > mh && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      matrixAnimId = requestAnimationFrame(drawMatrix);
    }
    drawMatrix();
  }

  /* ==========================================================================
     14. ZERO-G CLICK SHOCKWAVE EFFECT
     ========================================================================== */
  function initClickShockwave() {
    if (isTouchDevice || prefersReducedMotion) return;

    window.addEventListener('click', (e) => {
      // Don't trigger when clicking input or terminal
      if (e.target.closest('input, textarea, .ag-terminal')) return;

      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.width = '10px';
      ripple.style.height = '10px';
      ripple.style.margin = '-5px 0 0 -5px';
      ripple.style.borderRadius = '50%';
      ripple.style.border = '2px solid rgba(20, 184, 166, 0.75)';
      ripple.style.boxShadow = '0 0 15px rgba(198, 241, 53, 0.6)';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '999990';
      ripple.style.transform = 'scale(1)';
      ripple.style.opacity = '1';
      ripple.style.transition = 'transform 0.65s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.65s ease';

      document.body.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(24)';
        ripple.style.opacity = '0';
      });

      setTimeout(() => ripple.remove(), 700);
    });
  }

  /* ==========================================================================
     16. INITIALIZATION LIFECYCLE
     ========================================================================== */
  function init() {
    // 1. Ambient HUD Grid
    if (!document.querySelector('.ag-hud-grid')) {
      const hudGrid = document.createElement('div');
      hudGrid.className = 'ag-hud-grid';
      document.body.prepend(hudGrid);
    }

    // 2. Canvas particle field
    initParticleCanvas();

    // 3. Custom HUD cursor
    initHudCursor();

    // 4. Replace idle floating cards with subtle scroll reveals and scan-sweep hover.
    initCardScanMotion();

    // 6. Magnetic & repel proximity
    initMagneticAndRepel();

    // 7. Split-text stagger reveals
    initSplitTextReveals();

    // 8. Animated statistics counters
    initStatCounters();

    // 9. Scroll-driven parallax
    initScrollParallax();

    // 10. 3D Holographic Neural Sphere Lab
    initHologramLab();

    // 11. Interactive Cyber Command Deck Terminal
    initCyberTerminal();

    // 12. Zero-G Click Shockwave
    initClickShockwave();
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
