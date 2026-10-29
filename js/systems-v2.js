/* ==========================================================================
   Systems V2 — Orbital Constellation Engine
   Handles: particle canvas, node interactions, connection lines,
   detail panel updates, scroll reveals, and the mini neural-net visualizer.
   ========================================================================== */
(() => {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────── */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const section = $('#systems');
  if (!section || !section.classList.contains('systems-v2')) return;

  /* ── Data ─────────────────────────────────────────────── */
  const systems = {
    python: {
      title: 'Python is the first layer.',
      desc: 'The tool I use to turn an idea into a repeatable experiment: clean data, clear logic and small loops of feedback.',
      tags: ['Data wrangling', 'Automation', 'APIs'],
      color: '#e8aa50'
    },
    data: {
      title: 'Data makes the signal visible.',
      desc: 'I look for the useful shape inside messy information — the trend, the outlier and the question worth answering next.',
      tags: ['Analysis', 'Visualisation', 'SQL'],
      color: '#d8a452'
    },
    ml: {
      title: 'Machine learning finds patterns.',
      desc: 'From regression to classification, I focus on understanding the model and the problem together, not just chasing a score.',
      tags: ['scikit-learn', 'Feature work', 'Evaluation'],
      color: '#c9863c'
    },
    genai: {
      title: 'GenAI expands the interface.',
      desc: 'Exploring how language models, retrieval and structured prompts can make tools more helpful without making them less clear.',
      tags: ['RAG', 'Prompting', 'Agents'],
      color: '#e8aa50'
    },
    robotics: {
      title: 'Robotics makes ideas move.',
      desc: 'The most satisfying feedback loop is physical: code goes in, a sensor responds, and the system does something in the real world.',
      tags: ['IoT', 'Arduino', 'Sensors'],
      color: '#d8a452'
    }
  };
  const sysKeys = Object.keys(systems);

  /* ── Constellation Particle Canvas ───────────────────── */
  const constellationCanvas = $('#sv2-constellation-canvas');
  if (constellationCanvas) {
    const ctx = constellationCanvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles = [];
    let cW = 0, cH = 0, raf = 0;
    const PARTICLE_COUNT = 60;

    function resizeConstellation() {
      const wrap = constellationCanvas.parentElement;
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cW = r.width;
      cH = r.height;
      constellationCanvas.width = Math.floor(cW * dpr);
      constellationCanvas.height = Math.floor(cH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Init particles
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * cW,
          y: Math.random() * cH,
          r: Math.random() * 1.8 + .5,
          vx: (Math.random() - .5) * .3,
          vy: (Math.random() - .5) * .3,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * .0008 + .0003
        });
      }
    }

    function palette() {
      const s = getComputedStyle(document.documentElement);
      const secondary = s.getPropertyValue('--secondary').trim();
      const accent = s.getPropertyValue('--accent').trim();
      return {
        secondary: `hsl(${secondary})`,
        accent: `hsl(${accent})`,
        line: `hsl(${secondary} / .08)`
      };
    }

    function drawConstellation(t) {
      if (!cW) return;
      const p = palette();
      ctx.clearRect(0, 0, cW, cH);

      // Move and draw particles
      particles.forEach((pt, i) => {
        if (!reduceMotion) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          const drift = Math.sin(t * pt.speed + pt.phase) * .4;
          pt.x += drift;
          // Wrap
          if (pt.x < 0) pt.x = cW;
          if (pt.x > cW) pt.x = 0;
          if (pt.y < 0) pt.y = cH;
          if (pt.y > cH) pt.y = 0;
        }

        ctx.beginPath();
        ctx.fillStyle = i % 5 === 0 ? p.accent : p.secondary;
        ctx.globalAlpha = .15 + Math.sin(t * .001 + pt.phase) * .1;
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connection lines between nearby particles
      ctx.globalAlpha = 1;
      const maxDist = 100;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.strokeStyle = p.secondary;
            ctx.globalAlpha = .04 * (1 - dist / maxDist);
            ctx.lineWidth = .5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      if (!reduceMotion) raf = requestAnimationFrame(drawConstellation);
    }

    window.addEventListener('resize', resizeConstellation, { passive: true });
    resizeConstellation();
    if (!reduceMotion) requestAnimationFrame(drawConstellation);
    else drawConstellation(0);
  }

  /* ── SVG Connection Lines ────────────────────────────── */
  const connectionsSvg = $('#sv2-connections-svg');
  const nodes = $$('.sv2-node');
  const coreEl = $('.sv2-core');

  function updateConnections() {
    if (!connectionsSvg || !coreEl) return;
    const wrap = constellationCanvas ? constellationCanvas.parentElement : section;
    const wrapR = wrap.getBoundingClientRect();
    connectionsSvg.setAttribute('viewBox', `0 0 ${wrapR.width} ${wrapR.height}`);

    const coreR = coreEl.getBoundingClientRect();
    const cx = coreR.left - wrapR.left + coreR.width / 2;
    const cy = coreR.top - wrapR.top + coreR.height / 2;

    connectionsSvg.innerHTML = '';
    nodes.forEach(node => {
      const nR = node.getBoundingClientRect();
      const nx = nR.left - wrapR.left + nR.width / 2;
      const ny = nR.top - wrapR.top + nR.height / 2;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', nx);
      line.setAttribute('y2', ny);
      line.dataset.system = node.dataset.system;
      if (node.classList.contains('is-active')) line.classList.add('is-active');
      connectionsSvg.appendChild(line);
    });
  }

  // Delay initial draw to let layout settle
  setTimeout(updateConnections, 200);
  window.addEventListener('resize', () => requestAnimationFrame(updateConnections), { passive: true });

  /* ── Node Interaction ────────────────────────────────── */
  const detailTitle = $('#sv2-detail-title');
  const detailDesc = $('#sv2-detail-desc');
  const detailTags = $('#sv2-detail-tags');
  const detailCounter = $('#sv2-counter');
  const detailProgress = $('.sv2-progress-fill');

  function setActiveSystem(key, idx) {
    const sys = systems[key];
    if (!sys) return;

    // Update active class
    nodes.forEach(n => n.classList.remove('is-active'));
    const activeNode = nodes.find(n => n.dataset.system === key);
    if (activeNode) activeNode.classList.add('is-active');

    // Animate detail panel
    if (detailTitle) {
      detailTitle.style.opacity = '0';
      detailTitle.style.transform = 'translateY(10px)';
      setTimeout(() => {
        detailTitle.textContent = sys.title;
        detailTitle.style.opacity = '1';
        detailTitle.style.transform = 'translateY(0)';
      }, 150);
    }

    if (detailDesc) {
      detailDesc.style.opacity = '0';
      setTimeout(() => {
        detailDesc.textContent = sys.desc;
        detailDesc.style.opacity = '1';
      }, 200);
    }

    if (detailTags) {
      detailTags.style.opacity = '0';
      setTimeout(() => {
        detailTags.innerHTML = sys.tags.map(t => `<span>${t}</span>`).join('');
        detailTags.style.opacity = '1';
      }, 250);
    }

    if (detailCounter) detailCounter.textContent = `0${idx + 1} / 05`;
    if (detailProgress) detailProgress.style.width = `${(idx + 1) * 20}%`;

    // Update connection line highlights
    if (connectionsSvg) {
      connectionsSvg.querySelectorAll('line').forEach(l => {
        l.classList.toggle('is-active', l.dataset.system === key);
      });
    }

    // Update visualizer
    updateVisualizer(key);

    // Update overlay metrics based on system
    const metric1 = $('#viz-metric-1');
    const metric2 = $('#viz-metric-2');
    if (metric1 && metric2) {
       const metricLabels = {
         python: ['SYSTEM: PYTHON', 'FOCUS: EXPERIMENTS'],
         data: ['SYSTEM: DATA', 'FOCUS: ANALYSIS'],
         ml: ['SYSTEM: MACHINE LEARNING', 'FOCUS: EVALUATION'],
         genai: ['SYSTEM: GENERATIVE AI', 'FOCUS: RETRIEVAL'],
         robotics: ['SYSTEM: ROBOTICS', 'FOCUS: SENSORS']
       };
       [metric1.textContent, metric2.textContent] = metricLabels[key];
    }
  }

  nodes.forEach((node, i) => {
    node.addEventListener('click', () => {
      setActiveSystem(node.dataset.system, i);
    });
  });

  /* ── Visualizer Canvas (mini data viz per system) ────── */
  const vizCanvas = $('#sv2-visualizer-canvas');
  let vizCtx = null;
  let vizW = 0, vizH = 0;
  let vizRaf = 0;
  let currentVizKey = 'python';
  let updateVisualizer = () => {};

  if (vizCanvas) {
    vizCtx = vizCanvas.getContext('2d');

    function resizeViz() {
      const wrap = vizCanvas.parentElement;
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      vizW = r.width;
      vizH = vizCanvas.height || 280;
      vizCanvas.width = Math.floor(vizW * dpr);
      vizCanvas.height = Math.floor(vizH * dpr);
      vizCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawViz(t) {
      if (!vizW || !vizCtx) return;
      vizCtx.clearRect(0, 0, vizW, vizH);
      const sys = systems[currentVizKey];
      const color = sys ? sys.color : '#38bdf8';
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Draw grid
      vizCtx.strokeStyle = `${color}30`; // Increased from 15 to 30
      vizCtx.lineWidth = 1; // Increased from .5 to 1
      for (let x = 0; x < vizW; x += 24) {
        vizCtx.beginPath();
        vizCtx.moveTo(x, 0);
        vizCtx.lineTo(x, vizH);
        vizCtx.stroke();
      }
      for (let y = 0; y < vizH; y += 24) {
        vizCtx.beginPath();
        vizCtx.moveTo(0, y);
        vizCtx.lineTo(vizW, y);
        vizCtx.stroke();
      }

      // Draw different visualization per system
      switch (currentVizKey) {
        case 'python': drawCodeFlow(t, color, reduceMotion); break;
        case 'data': drawDataBars(t, color, reduceMotion); break;
        case 'ml': drawLearningCurve(t, color, reduceMotion); break;
        case 'genai': drawTokenStream(t, color, reduceMotion); break;
        case 'robotics': drawSensorWave(t, color, reduceMotion); break;
      }

      if (!reduceMotion) vizRaf = requestAnimationFrame(drawViz);
    }

    function drawCodeFlow(t, color, rm) {
      // Flowing code-like blocks
      const blockCount = 8;
      for (let i = 0; i < blockCount; i++) {
        const y = vizH * .15 + i * (vizH * .1);
        const w = 40 + Math.sin(i * 1.5 + (rm ? 0 : t * .001)) * 30 + 40;
        const x = vizW * .1 + (i % 2) * 20;
        const alpha = .35 + Math.sin((rm ? 0 : t * .0008) + i) * .2; // increased alpha
        vizCtx.fillStyle = color;
        vizCtx.globalAlpha = alpha;
        vizCtx.fillRect(x, y, w, 6); // thicker
        vizCtx.globalAlpha = alpha * .6;
        vizCtx.fillRect(x + w + 8, y, w * .6, 6);
      }
      vizCtx.globalAlpha = 1;
      // Moving cursor
      if (!rm) {
        const cy = vizH * .15 + ((t * .02) % (blockCount * vizH * .1));
        vizCtx.fillStyle = color;
        vizCtx.shadowColor = color;
        vizCtx.shadowBlur = 12;
        vizCtx.fillRect(vizW * .06, cy, 2, 14);
        vizCtx.shadowBlur = 0;
      }
    }

    function drawDataBars(t, color, rm) {
      const barCount = 12;
      const barW = vizW * .04;
      const gap = (vizW * .8) / barCount;
      for (let i = 0; i < barCount; i++) {
        const base = 30 + Math.sin(i * .8) * 50 + 50;
        const animate = rm ? 0 : Math.sin(t * .002 + i * .5) * 15;
        const h = base + animate;
        const x = vizW * .1 + i * gap;
        const y = vizH - 30 - h;

        vizCtx.fillStyle = color;
        vizCtx.globalAlpha = .35 + (i / barCount) * .4; // Increased alpha
        vizCtx.fillRect(x, y, barW, h);

        // Top glow
        vizCtx.shadowColor = color;
        vizCtx.shadowBlur = 12; // Increased
        vizCtx.globalAlpha = .8; // Increased
        vizCtx.fillRect(x, y, barW, 3); // Thicker top
        vizCtx.shadowBlur = 0;
      }
      vizCtx.globalAlpha = 1;
    }

    function drawLearningCurve(t, color, rm) {
      vizCtx.beginPath();
      vizCtx.strokeStyle = color;
      vizCtx.lineWidth = 3; // increased
      vizCtx.globalAlpha = .8; // increased
      const points = [];
      for (let i = 0; i <= 40; i++) {
        const x = vizW * .1 + (i / 40) * vizW * .8;
        const decay = Math.exp(-i * .08);
        const noise = rm ? 0 : Math.sin(t * .001 + i * .3) * 3;
        const y = vizH * .2 + decay * vizH * .55 + noise;
        points.push({ x, y });
        if (i === 0) vizCtx.moveTo(x, y);
        else vizCtx.lineTo(x, y);
      }
      vizCtx.stroke();

      // Glow
      vizCtx.strokeStyle = color;
      vizCtx.shadowColor = color;
      vizCtx.shadowBlur = 10;
      vizCtx.globalAlpha = .2;
      vizCtx.stroke();
      vizCtx.shadowBlur = 0;
      vizCtx.globalAlpha = 1;

      // Moving dot
      if (!rm) {
        const idx = Math.floor((t * .01) % points.length);
        const pt = points[idx];
        vizCtx.beginPath();
        vizCtx.fillStyle = color;
        vizCtx.shadowColor = color;
        vizCtx.shadowBlur = 14;
        vizCtx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        vizCtx.fill();
        vizCtx.shadowBlur = 0;
      }

      // Label
      vizCtx.fillStyle = color;
      vizCtx.globalAlpha = .4;
      vizCtx.font = '9px var(--app-font-mono), monospace';
      vizCtx.fillText('LOSS ↓', vizW * .82, vizH * .78);
      vizCtx.fillText('EPOCH →', vizW * .45, vizH - 10);
      vizCtx.globalAlpha = 1;
    }

    function drawTokenStream(t, color, rm) {
      const tokens = ['[CLS]', 'how', 'does', 'AI', 'learn', '?', '[SEP]', '[PAD]'];
      const tokenW = vizW * .08;
      const startX = vizW * .08;
      tokens.forEach((tok, i) => {
        const x = startX + i * (tokenW + 12);
        const y = vizH * .35;
        const wobble = rm ? 0 : Math.sin(t * .002 + i * .7) * 3;

        // Box
        vizCtx.strokeStyle = color;
        vizCtx.globalAlpha = .45 + (i === 3 ? .35 : 0); // increased
        vizCtx.lineWidth = 2; // increased
        vizCtx.strokeRect(x, y + wobble, tokenW, 24);

        // Text
        vizCtx.fillStyle = color;
        vizCtx.globalAlpha = .8 + (i === 3 ? .2 : 0); // increased
        vizCtx.font = 'bold 9px var(--app-font-mono), monospace'; // bold, slightly bigger
        vizCtx.textAlign = 'center';
        vizCtx.fillText(tok, x + tokenW / 2, y + 16 + wobble);
        vizCtx.textAlign = 'start';

        // Attention lines downward
        if (i < tokens.length - 1) {
          vizCtx.beginPath();
          vizCtx.strokeStyle = color;
          vizCtx.globalAlpha = .08;
          vizCtx.moveTo(x + tokenW / 2, y + 24 + wobble);
          vizCtx.lineTo(x + tokenW / 2, y + 70);
          vizCtx.stroke();
        }
      });

      // Attention heatmap row
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const x = startX + j * (tokenW + 12);
          const y = vizH * .6 + i * 14;
          const heat = Math.abs(Math.sin(i * j * .4 + (rm ? 0 : t * .001))) * .4;
          vizCtx.fillStyle = color;
          vizCtx.globalAlpha = .04 + heat * .2;
          vizCtx.fillRect(x, y, tokenW, 10);
        }
      }
      vizCtx.globalAlpha = 1;
    }

    function drawSensorWave(t, color, rm) {
      // Multiple sensor waves
      const sensors = ['ULTRASONIC', 'IR', 'ENCODER'];
      sensors.forEach((name, si) => {
        const yOff = vizH * (.2 + si * .28);
        vizCtx.beginPath();
        vizCtx.strokeStyle = color;
        vizCtx.lineWidth = 2.5; // increased
        vizCtx.globalAlpha = .4 + si * .15; // increased

        for (let x = 0; x < vizW * .85; x++) {
          const freq = 0.03 + si * .01;
          const amp = 18 - si * 4;
          const phase = rm ? 0 : t * (.001 + si * .0005);
          const y = yOff + Math.sin(x * freq + phase) * amp;
          if (x === 0) vizCtx.moveTo(vizW * .08 + x, y);
          else vizCtx.lineTo(vizW * .08 + x, y);
        }
        vizCtx.stroke();

        // Sensor label
        vizCtx.fillStyle = color;
        vizCtx.globalAlpha = .3;
        vizCtx.font = '8px var(--app-font-mono), monospace';
        vizCtx.fillText(name, vizW * .08, yOff - 22);
      });
      vizCtx.globalAlpha = 1;

      // Moving scan line
      if (!rm) {
        const scanX = vizW * .08 + ((t * .05) % (vizW * .85));
        vizCtx.strokeStyle = color;
        vizCtx.globalAlpha = .15;
        vizCtx.lineWidth = 1;
        vizCtx.beginPath();
        vizCtx.moveTo(scanX, 0);
        vizCtx.lineTo(scanX, vizH);
        vizCtx.stroke();
        vizCtx.globalAlpha = 1;
      }
    }

    updateVisualizer = function updateVisualizer(key) {
      currentVizKey = key;
      cancelAnimationFrame(vizRaf);
      resizeViz();
      requestAnimationFrame(drawViz);
    };

    window.addEventListener('resize', resizeViz, { passive: true });
    resizeViz();
    requestAnimationFrame(drawViz);
  }

  /* ── Neural Network Canvas ───────────────────────────── */
  const neuralCanvas = $('#sv2-neural-canvas');
  if (neuralCanvas) {
    const nCtx = neuralCanvas.getContext('2d');
    if (nCtx) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const layers = [3, 5, 5, 2];
      let nNodes = [], nEdges = [], nPulses = [], nW = 0, nH = 0, nRaf = 0;

      function nPalette() {
        const s = getComputedStyle(document.documentElement);
        const secondary = s.getPropertyValue('--secondary').trim();
        const accent = s.getPropertyValue('--accent').trim();
        const muted = s.getPropertyValue('--muted-foreground').trim();
        return {
          secondary: `hsl(${secondary})`,
          accent: `hsl(${accent})`,
          muted: `hsl(${muted})`,
          line: `hsl(${secondary} / .14)`
        };
      }

      function nResize() {
        const wrap = neuralCanvas.closest('.sv2-neural-visual');
        if (!wrap) return;
        const r = wrap.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio || 1, 2);
        nW = r.width; nH = r.height;
        neuralCanvas.width = Math.floor(nW * dpr);
        neuralCanvas.height = Math.floor(nH * dpr);
        nCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        nNodes = []; nEdges = [];
        layers.forEach((count, li) => {
          const x = nW * (.14 + li * .24);
          for (let i = 0; i < count; i++) {
            const spread = count === 1 ? .5 : i / (count - 1);
            nNodes.push({ li, x, y: nH * (.18 + spread * .64), phase: Math.random() * 6.28 });
          }
        });
        for (let li = 0; li < layers.length - 1; li++) {
          const a = nNodes.filter(n => n.li === li);
          const b = nNodes.filter(n => n.li === li + 1);
          a.forEach(from => b.forEach(to => nEdges.push({ from, to })));
        }
        nPulses = nEdges.filter((_, i) => i % 4 === 0).map((edge, i) => ({
          edge, p: (i / 8) % 1, s: .0015 + (i % 3) * .0004
        }));
        drawNeural(0);
      }

      function drawNeural(t) {
        if (!nW) return;
        const p = nPalette();
        nCtx.clearRect(0, 0, nW, nH);

        // Grid
        nCtx.strokeStyle = p.line;
        nCtx.lineWidth = .5;
        nCtx.globalAlpha = .3;
        for (let x = 0; x < nW; x += 24) {
          nCtx.beginPath(); nCtx.moveTo(x, 0); nCtx.lineTo(x, nH); nCtx.stroke();
        }
        for (let y = 0; y < nH; y += 24) {
          nCtx.beginPath(); nCtx.moveTo(0, y); nCtx.lineTo(nW, y); nCtx.stroke();
        }
        nCtx.globalAlpha = 1;

        // Edges
        nEdges.forEach(e => {
          nCtx.beginPath();
          nCtx.strokeStyle = p.line;
          nCtx.lineWidth = 1;
          nCtx.moveTo(e.from.x, e.from.y);
          nCtx.lineTo(e.to.x, e.to.y);
          nCtx.stroke();
        });

        // Nodes
        nNodes.forEach(n => {
          const drift = reduceMotion ? 0 : Math.sin(t * .001 + n.phase) * 2;
          const c = n.li === 3 ? p.accent : n.li > 0 ? p.secondary : p.accent;
          nCtx.beginPath();
          nCtx.fillStyle = c;
          nCtx.shadowColor = c;
          nCtx.shadowBlur = 10;
          nCtx.arc(n.x, n.y + drift, n.li === 3 ? 4.5 : 3.5, 0, Math.PI * 2);
          nCtx.fill();
          nCtx.shadowBlur = 0;
        });

        // Pulses
        nPulses.forEach(q => {
          if (!reduceMotion) q.p = (q.p + q.s * 16) % 1;
          const x = q.edge.from.x + (q.edge.to.x - q.edge.from.x) * q.p;
          const y = q.edge.from.y + (q.edge.to.y - q.edge.from.y) * q.p;
          nCtx.beginPath();
          nCtx.fillStyle = p.accent;
          nCtx.shadowColor = p.accent;
          nCtx.shadowBlur = 12;
          nCtx.arc(x, y, 2.5, 0, Math.PI * 2);
          nCtx.fill();
          nCtx.shadowBlur = 0;
        });

        // Labels
        nCtx.fillStyle = p.muted;
        nCtx.font = '9px var(--app-font-mono), monospace';
        nCtx.fillText('INPUT', 8, 14);
        nCtx.fillText('HIDDEN LAYERS', nW * .35, 14);
        nCtx.fillText('OUTPUT', nW - 52, 14);

        if (!reduceMotion) nRaf = requestAnimationFrame(drawNeural);
      }

      window.addEventListener('resize', nResize, { passive: true });
      nResize();
    }
  }

  /* ── Scroll Reveal ───────────────────────────────────── */
  const revealEls = $$('.sv2-reveal, .sv2-node');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => obs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ── Auto-cycle systems on idle ──────────────────────── */
  let cycleTimer = null;
  let currentIdx = 0;

  function startCycle() {
    clearInterval(cycleTimer);
    cycleTimer = setInterval(() => {
      currentIdx = (currentIdx + 1) % sysKeys.length;
      setActiveSystem(sysKeys[currentIdx], currentIdx);
    }, 4500);
  }

  // Pause auto-cycle on user interaction
  nodes.forEach((node, i) => {
    node.addEventListener('click', () => {
      clearInterval(cycleTimer);
      currentIdx = i;
      // Restart auto-cycle after 10 seconds of inactivity
      setTimeout(startCycle, 10000);
    });
  });

  // Start auto-cycle
  startCycle();

  /* ── Floating Particle Dots (CSS-based) ──────────────── */
  const wrap = $('.sv2-constellation-wrap');
  if (wrap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (let i = 0; i < 15; i++) {
      const dot = document.createElement('span');
      dot.className = 'sv2-particle';
      dot.style.width = dot.style.height = Math.random() * 3 + 1 + 'px';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.top = Math.random() * 100 + '%';
      dot.style.animationDuration = 8 + Math.random() * 12 + 's';
      dot.style.animationDelay = Math.random() * 5 + 's';
      if (i % 3 === 0) dot.style.background = 'hsl(var(--accent))';
      wrap.appendChild(dot);
    }
  }
})();
