document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  if (window.lucide) lucide.createIcons();

  // Mobile navigation
  const nav = $('.nav'), menuBtn = $('.menu-btn');
  const closeMenu = () => {
    nav?.classList.remove('menu-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    menuBtn?.setAttribute('aria-label', 'Open navigation menu');
  };
  menuBtn?.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  $$('.nav-links a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (nav?.classList.contains('menu-open') && !nav.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) closeMenu();
  }, { passive: true });

  // Scroll reveal
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, {threshold:.12});
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('visible'));

  // Systems V2 interaction is handled by js/systems-v2.js

  // Job Match Analyzer
  const sampleJob='We are looking for a junior AI/ML engineer with Python, machine learning, data analysis and scikit-learn experience. You will build predictive models, work with data, explore NLP and collaborate on practical software projects.';
  const groups={
    skills:['python','machine learning','data science','data analysis','scikit-learn','python','nlp','iot','robotics','arduino','genai','generative ai','web development'],
    technical:['api','sql','regression','random forest','xgboost','neural network','computer vision','dashboard'],
    context:['internship','junior','bca','commerce','recommendation','predictive','software','automation']
  };
  const ta=$('#job-description'), status=$('#match-status'), results=$('#match-results');
  function analyze(){
    const normalized=ta.value.toLowerCase();
    if(!normalized.trim()){status.textContent='Paste a job description first.';results.innerHTML=`<div class="empty-state"><i data-lucide="scan-line"></i><strong>Your analysis will appear here.</strong><p>Matched, partial and missing signals stay explainable.</p></div>`;lucide.createIcons();return;}
    const all=[...groups.skills,...groups.technical,...groups.context];
    const matched=[...new Set(all.filter(s=>normalized.includes(s)))];
    const partial=['python','machine learning','data science','scikit-learn','nlp'].filter(s=>!matched.includes(s)&&normalized.includes(s.split(' ')[0]));
    const missing=['python','machine learning','data science','scikit-learn','nlp'].filter(s=>!matched.includes(s)&&!partial.includes(s));
    const score=Math.min(98,Math.max(18,Math.round(35*matched.filter(x=>groups.skills.includes(x)).length/7+25*matched.filter(x=>groups.technical.includes(x)).length/4+20*matched.filter(x=>groups.context.includes(x)).length/4+20)));
    status.textContent='Analysis complete · runs locally in this browser';
    results.innerHTML=`<div class="match-score"><div class="score-ring" style="--score:${score}%"><strong>${score}%</strong></div><div><h4>Strong signal overlap</h4><p>Explainable portfolio-to-role comparison.</p></div></div>
    <div class="signal-columns"><div class="matched"><h5>MATCHED SIGNALS</h5><ul>${matched.slice(0,8).map(x=>`<li>✓ ${x}</li>`).join('')}</ul></div><div class="partial"><h5>PARTIAL SIGNALS</h5><ul>${partial.slice(0,5).map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="missing"><h5>NOT FOUND</h5><ul>${missing.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>
    <p class="score-note">Skills 35% · Technical keywords 20% · Project relevance 20% · Experience relevance 15% · Education relevance 10%</p>`;
  }
  $('#analyze-match')?.addEventListener('click',analyze);
  $('#clear-match')?.addEventListener('click',()=>{ta.value='';status.textContent='';results.innerHTML=`<div class="empty-state"><i data-lucide="scan-line"></i><strong>Your analysis will appear here.</strong><p>Matched, partial and missing signals stay explainable.</p></div>`;lucide.createIcons();});
  $('#load-sample')?.addEventListener('click',()=>{ta.value=sampleJob; status.textContent='Example loaded.';});

  // Contact form -> mail client
  $('#contact-form')?.addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('#contact-name').value.trim(), message=$('#contact-message').value.trim(), note=$('#form-note');
    if(!name||!message){note.textContent='Please enter your name and message first.';return;}
    window.location.href=`mailto:chandrilgoswamiofficial6290@gmail.com?subject=${encodeURIComponent('Hello Chandril — '+name)}&body=${encodeURIComponent(message)}`;
    note.textContent='Email draft opened — see you there.';
  });

  // Keep icon rendering correct after dynamic DOM updates
  if(window.lucide) lucide.createIcons();
});

// Neural network canvas is handled by js/systems-v2.js (sv2-neural-canvas)