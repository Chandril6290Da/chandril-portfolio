

(() => {
  'use strict';

  const root = document.getElementById('know-me-game');
  if (!root) return;
  const canvas = document.getElementById('km-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const map = document.getElementById('km-map');
  const mctx = map.getContext('2d');

  const checkpoints = [
    {id:'start', label:'START', title:'Welcome to My World', text:'A curious builder who moved from commerce into technology — now exploring AI/ML, data, web development, IoT and robotics.', tags:['Curiosity','Builder mindset','AI × Data × Robotics']},
    {id:'about', label:'ABOUT ME', title:'The person behind the code', text:'I enjoy understanding how things work, then turning that curiosity into practical experiments, products and machines that actually do something.', tags:['Problem solving','Experimentation','Continuous learning']},
    {id:'education', label:'EDUCATION', title:'BCA (Honours) — Machine Learning', text:'Currently building a computer-science foundation with a Machine Learning specialization, after transitioning from a commerce background.', tags:['BCA (Honours)','Machine Learning','Rajiv Gandhi University']},
    {id:'skills', label:'SKILLS', title:'A toolkit for real-world builds', text:'Python, NumPy, Pandas, scikit-learn, TensorFlow, PyTorch, SQL, JavaScript, PHP, HTML/CSS and Git form the core development stack.', tags:['Python','Machine Learning','AI','SQL','Web Development','PHP']},
    {id:'projects', label:'PROJECTS', title:'Ideas → working experiments', text:'Explore predictive models, recommendation systems, data projects and practical builds. The portfolio keeps growing through hands-on projects.', tags:['Predictive ML','NLP','Data Science','GitHub']},
    {id:'ai', label:'AI / ML', title:'Where data becomes intelligence', text:'From preprocessing and feature engineering to training, tuning and evaluation — I like the full ML workflow, not just the final model.', stats:[['0.87','Best R²'],['~85%','Relevance'],['12%','Accuracy gain']],tags:['scikit-learn','TensorFlow','XGBoost','NLP']},
    {id:'iot', label:'IOT & ROBOTICS', title:'Code that meets the physical world', text:'I work with Arduino, ESP32, sensors, motor drivers and RC-style robotics concepts — connecting software decisions to physical movement.', tags:['ESP32','Arduino','Sensors','Robotics']},
    {id:'achievements', label:'ACHIEVEMENTS', title:'Learning that keeps stacking', text:'Generative AI, web development, business communication and computer applications certifications mark the journey from fundamentals to applied technology.', tags:['Generative AI','Google Ambassador','Web Development']},
    {id:'github', label:'GITHUB', title:'The workshop is open', text:'Public repositories, experiments and machine-learning builds live on GitHub. Follow the code and see how the ideas evolve.', link:'https://github.com/Chandril6290Da', tags:['Open source','Experiments','Repositories']},
    {id:'hire', label:'CONTACT / HIRE ME', title:'Let’s build something useful.', text:'Open to AI/ML internships, junior roles, collaborations and interesting technical projects. Reach out and start a conversation.', link:'mailto:chandrilgoswamiofficial6290@gmail.com', tags:['Internships','Collaborations','AI/ML roles']}
  ];

  const route = [
    [0.08,0.84],[0.18,0.70],[0.30,0.58],[0.42,0.66],[0.55,0.78],
    [0.68,0.65],[0.82,0.52],[0.70,0.35],[0.53,0.25],[0.34,0.30]
  ];
  const world = {w:2200,h:1400};
  const points = route.map(([x,y]) => ({x:x*world.w,y:y*world.h}));
  const roadWidth=150;
  const car={x:points[0].x,y:points[0].y,angle:0,speed:0,boost:100};
  car.angle=Math.atan2(points[1].y-points[0].y,points[1].x-points[0].x);
  let current=1, started=false, paused=false, sound=true, last=0, toastTimer=0, particles=[], collected=new Set();
  let enabled=false;
  const cssVar=(name,fallback)=>getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fallback;
  const KM_CYAN=cssVar('--secondary','#37b9ad');
  const KM_PURPLE=cssVar('--accent','#d4ef61');
  const KM_BG=cssVar('--bg','KM_BG');
  const KM_TEXT=cssVar('--text','KM_TEXT');
  const keys={forward:false,back:false,left:false,right:false,boost:false};

  const $=id=>document.getElementById(id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;

  function resize(){
    const r=canvas.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.max(1,Math.floor(r.width*d)); canvas.height=Math.max(1,Math.floor(r.height*d));
    ctx.setTransform(d,0,0,d,0,0);
  }
  new ResizeObserver(resize).observe(canvas); resize();

  function path(ctx2, offset=0){
    ctx2.beginPath();
    ctx2.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i], mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
      ctx2.quadraticCurveTo(a.x,a.y,mx,my);
      if(i===points.length-1) ctx2.quadraticCurveTo(b.x,b.y,b.x,b.y);
    }
  }
  function drawRoad(camera){
    ctx.save(); ctx.translate(-camera.x,-camera.y);
    ctx.fillStyle='KM_BG'; ctx.fillRect(camera.x,camera.y,canvas.clientWidth+100,canvas.clientHeight+100);
    // parallax grid
    ctx.strokeStyle='rgba(55,185,173,.08)';ctx.lineWidth=1;
    const step=100;
    for(let x=Math.floor(camera.x/step)*step;x<camera.x+canvas.clientWidth+step;x+=step){ctx.beginPath();ctx.moveTo(x,camera.y);ctx.lineTo(x,camera.y+canvas.clientHeight);ctx.stroke()}
    for(let y=Math.floor(camera.y/step)*step;y<camera.y+canvas.clientHeight+step;y+=step){ctx.beginPath();ctx.moveTo(camera.x,y);ctx.lineTo(camera.x+canvas.clientWidth,y);ctx.stroke()}
    // ambient city pads
    for(let i=0;i<28;i++){const x=(i*317)%world.w,y=(i*193)%world.h;ctx.fillStyle=i%2?'rgba(212,239,97,.055)':'rgba(55,185,173,.045)';ctx.fillRect(x,y,90+(i%4)*25,45+(i%3)*18)}
    // road shadow and surface
    path(ctx);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(25,38,62,.16)';ctx.lineWidth=roadWidth+34;ctx.stroke();
    path(ctx);ctx.strokeStyle='#cbd5d4';ctx.lineWidth=roadWidth;ctx.stroke();
    path(ctx);ctx.setLineDash([34,28]);ctx.strokeStyle='rgba(23,35,49,.20)';ctx.lineWidth=5;ctx.stroke();ctx.setLineDash([]);
    // neon edges
    path(ctx);ctx.strokeStyle='rgba(55,185,173,.16)';ctx.lineWidth=7;ctx.stroke();
    path(ctx);ctx.strokeStyle='rgba(212,239,97,.12)';ctx.lineWidth=3;ctx.stroke();
    // roadside lights
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
      for(let t=.18;t<.9;t+=.28){for(const side of [-1,1]){
        const x=a.x+dx*t+nx*(roadWidth*.62)*side,y=a.y+dy*t+ny*(roadWidth*.62)*side;
        ctx.fillStyle='rgba(55,185,173,.5)';ctx.shadowBlur=14;ctx.shadowColor='KM_CYAN';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      }}
    }
    // checkpoint beacons
    checkpoints.slice(1).forEach((cp,i)=>{const p=points[Math.min(i+1,points.length-1)],active=(i+1)===current;
      ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=active?.95:.35;ctx.strokeStyle=active?'KM_CYAN':'KM_PURPLE';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,38+Math.sin(performance.now()/250+i)*4,0,Math.PI*2);ctx.stroke();ctx.fillStyle='KM_TEXT';ctx.font='600 16px "Space Grotesk",sans-serif';ctx.textAlign='center';ctx.fillText(cp.label,0,-50);ctx.restore();
    });
    ctx.restore();
  }
  function drawCar(camera){
    const sx=car.x-camera.x,sy=car.y-camera.y;
    ctx.save();ctx.translate(sx,sy);ctx.rotate(car.angle);
    if(keys.boost && car.speed>2){ctx.globalAlpha=.75;ctx.fillStyle='KM_PURPLE';ctx.shadowBlur=22;ctx.shadowColor='KM_PURPLE';ctx.beginPath();ctx.moveTo(-38,-7);ctx.lineTo(-78,0);ctx.lineTo(-38,7);ctx.fill();ctx.shadowBlur=0}
    ctx.fillStyle='rgba(25,38,62,.14)';ctx.beginPath();ctx.ellipse(0,8,40,18,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='KM_CYAN';ctx.strokeStyle='#f7f5ed';ctx.lineWidth=2;roundRect(ctx,-30,-17,60,34,10);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f7f5ed';roundRect(ctx,-12,-12,25,24,7);ctx.fill();
    ctx.fillStyle='#d4ef61';ctx.fillRect(25,-10,5,7);ctx.fillRect(25,3,5,7);
    ctx.fillStyle='#b84a4a';ctx.fillRect(-30,-10,4,7);ctx.fillRect(-30,3,4,7);
    ctx.fillStyle='#cbd5d4';ctx.fillRect(-17,-20,11,5);ctx.fillRect(6,-20,11,5);ctx.fillRect(-17,15,11,5);ctx.fillRect(6,15,11,5);
    ctx.restore();
  }
  function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function spawnParticle(){if(Math.abs(car.speed)<2)return;const a=car.angle+Math.PI+(Math.random()-.5)*.7;particles.push({x:car.x+Math.cos(a)*30,y:car.y+Math.sin(a)*30,vx:Math.cos(a)*30,vy:Math.sin(a)*30,life:.35,size:2+Math.random()*4})}
  function drawParticles(camera,dt){
    particles=particles.filter(p=>(p.life-=dt)>0);ctx.save();ctx.translate(-camera.x,-camera.y);
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=p.life/.35;ctx.fillStyle='KM_CYAN';ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()});ctx.restore();
  }
  function update(dt){
    if(!started||paused)return;
    const boost=keys.boost&&car.boost>1;
    if(keys.forward)car.speed+=boost?900*dt:600*dt;
    if(keys.back)car.speed-=850*dt;
    if(!keys.forward&&!keys.back)car.speed*=Math.pow(.88,dt*60);
    car.speed=clamp(car.speed,-250,boost?650:430);
    if(boost&&car.speed>20)car.boost=clamp(car.boost-38*dt,0,100);else car.boost=clamp(car.boost+18*dt,0,100);
    const steer=(keys.right?1:0)-(keys.left?1:0);
    car.angle+=steer*(.9+Math.abs(car.speed)/300)*dt*(car.speed>=0?1:-1);
    car.x+=Math.cos(car.angle)*car.speed*dt;car.y+=Math.sin(car.angle)*car.speed*dt;
    car.x=clamp(car.x,70,world.w-70);car.y=clamp(car.y,70,world.h-70);
    if(Math.random()<.8)spawnParticle();
    const target=points[current],dist=Math.hypot(car.x-target.x,car.y-target.y);
    if(dist<75){
      unlock(current); current++;
      if(current>=checkpoints.length){current=checkpoints.length-1; finish();}
    }
    updateHUD();
  }
  function unlock(i){
    const cp=checkpoints[i];collected.add(cp.id);sessionStorage.setItem('km_unlocked',JSON.stringify([...collected]));
    showToast(`CHECKPOINT UNLOCKED · ${cp.label}`); beep(660,.09); openInfo(cp);
  }
  function finish(){showToast('ROUTE COMPLETE · YOU KNOW ME');beep(880,.16);current=checkpoints.length-1;setTimeout(()=>openInfo(checkpoints.at(-1)),300)}
  function openInfo(cp){
    $('km-info-eyebrow').textContent=cp.label;$('km-info-title').textContent=cp.title;
    let html=`<p>${cp.text}</p>`;
    if(cp.stats)html+=`<div class="km-stats">${cp.stats.map(s=>`<div class="km-stat"><strong>${s[0]}</strong><small>${s[1]}</small></div>`).join('')}</div>`;
    if(cp.tags)html+=`<div class="km-tags">${cp.tags.map(t=>`<span>${t}</span>`).join('')}</div>`;
    if(cp.link)html+=`<p style="margin-top:14px"><a href="${cp.link}" target="_blank" rel="noopener" class="text-link">${cp.id==='github'?'Open GitHub ↗':'Email Chandril ↗'}</a></p>`;
    $('km-info-body').innerHTML=html;$('km-info').classList.add('show');paused=true;
  }
  function closeInfo(){ $('km-info').classList.remove('show'); if(started)paused=false; }
  function showToast(t){const el=$('km-toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1900)}
  function updateHUD(){
    $('km-speed').textContent=Math.round(Math.abs(car.speed)*.27);
    $('km-boost-fill').style.width=car.boost+'%';
    $('km-checkpoint').textContent=checkpoints[current]?.label||'FINISH';
    $('km-progress').textContent=`${Math.max(0,collected.size)} / ${checkpoints.length} unlocked`;
    $('km-hint').textContent=current<checkpoints.length?`Drive to ${checkpoints[current].label}`:'Route complete — explore the portfolio';
  }
  function camera(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    return {x:clamp(car.x-w/2,0,world.w-w),y:clamp(car.y-h/2,0,world.h-h)};
  }
  function drawMap(){
    const w=map.width,h=map.height;mctx.clearRect(0,0,w,h);mctx.fillStyle='#172331';mctx.fillRect(0,0,w,h);
    mctx.save();mctx.scale(w/world.w,h/world.h);path(mctx);mctx.lineCap='round';mctx.strokeStyle='#cbd5d4';mctx.lineWidth=roadWidth+18;mctx.stroke();path(mctx);mctx.strokeStyle='KM_CYAN';mctx.lineWidth=5;mctx.stroke();
    points.forEach((p,i)=>{mctx.fillStyle=i<current?'#37b9ad':i===current?'#d4ef61':'#6f7b78';mctx.beginPath();mctx.arc(p.x,p.y,i===current?18:11,0,Math.PI*2);mctx.fill()});mctx.fillStyle='#fff';mctx.beginPath();mctx.arc(car.x,car.y,16,0,Math.PI*2);mctx.fill();mctx.restore()
  }
  function frame(t){
    if(!enabled)return;
    const dt=Math.min(.035,(t-last)/1000||0);last=t;update(dt);
    const c=camera();drawRoad(c);drawParticles(c,dt);drawCar(c);drawMap();
    requestAnimationFrame(frame);
  }

  function start(){started=true;paused=false;collected.add('start');sessionStorage.setItem('km_unlocked',JSON.stringify([...collected]));updateHUD();$('km-start').style.display='none';beep(520,.1);showToast('GO · DRIVE TO THE FIRST CHECKPOINT');}
  function restart(){car.x=points[0].x;car.y=points[0].y;car.speed=0;car.angle=Math.atan2(points[1].y-points[0].y,points[1].x-points[0].x);car.boost=100;current=1;collected=new Set();sessionStorage.removeItem('km_unlocked');closeInfo();paused=false;showToast('ROUTE RESET');updateHUD()}
  function togglePause(){if(!started||$('km-info').classList.contains('show'))return;paused=!paused;$('km-pause-overlay').classList.toggle('show',paused)}
  function beep(freq,duration){if(!sound)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!window._kmAudio)window._kmAudio=new A();const o=window._kmAudio.createOscillator(),g=window._kmAudio.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=.025;o.connect(g);g.connect(window._kmAudio.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,window._kmAudio.currentTime+duration);o.stop(window._kmAudio.currentTime+duration)}catch(e){}}

  $('km-start-btn').addEventListener('click',start);$('km-pause').addEventListener('click',togglePause);$('km-resume').addEventListener('click',togglePause);$('km-restart').addEventListener('click',restart);
  $('km-info-close').addEventListener('click',closeInfo);$('km-next').addEventListener('click',closeInfo);
  $('km-sound').addEventListener('click',()=>{sound=!sound;$('km-sound').textContent=sound?'♫':'×';if(sound)beep(600,.08)});
  window.addEventListener('keydown',e=>{
    if(!enabled)return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
    if(e.code==='KeyP'){togglePause();return}
    if(e.code==='KeyW'||e.code==='ArrowUp')keys.forward=true;
    if(e.code==='KeyS'||e.code==='ArrowDown')keys.back=true;
    if(e.code==='KeyA'||e.code==='ArrowLeft')keys.left=true;
    if(e.code==='KeyD'||e.code==='ArrowRight')keys.right=true;
    if(e.code==='Space')keys.boost=true;
  },{passive:false});
  window.addEventListener('keyup',e=>{
    if(!enabled)return;
    if(e.code==='KeyW'||e.code==='ArrowUp')keys.forward=false;if(e.code==='KeyS'||e.code==='ArrowDown')keys.back=false;
    if(e.code==='KeyA'||e.code==='ArrowLeft')keys.left=false;if(e.code==='KeyD'||e.code==='ArrowRight')keys.right=false;if(e.code==='Space')keys.boost=false;
  });
  document.querySelectorAll('[data-km-control]').forEach(btn=>{
    const control=btn.dataset.kmControl;const down=e=>{e.preventDefault();btn.classList.add('pressed');if(control==='left')keys.left=true;if(control==='right')keys.right=true;if(control==='accelerate')keys.forward=true;if(control==='brake')keys.back=true;if(control==='boost')keys.boost=true};
    const up=e=>{e&&e.preventDefault();btn.classList.remove('pressed');if(control==='left')keys.left=false;if(control==='right')keys.right=false;if(control==='accelerate')keys.forward=false;if(control==='brake')keys.back=false;if(control==='boost')keys.boost=false};
    btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('pointerleave',up);
  });
  // Restore unlocked progress without forcing the user into a popup.
  try{collected=new Set(JSON.parse(sessionStorage.getItem('km_unlocked')||'[]'))}catch(e){}
  updateHUD();
  window.initKnowMeProfile=()=>{ if(enabled)return; enabled=true; paused=false; resize(); last=performance.now(); requestAnimationFrame(frame); };
  window.disableKnowMeProfile=()=>{ enabled=false; paused=true; Object.keys(keys).forEach(k=>keys[k]=false); };
})();


