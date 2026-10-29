(() => {
  'use strict';
  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  const clear = document.getElementById('terminal-clear');
  if (!form || !input || !output) return;
  const commands = ['help', 'about', 'systems', 'robotics', 'skills', 'education', 'projects', 'match', 'experience', 'builds', 'contact', 'clear'];
  const responses = {
    help: 'Available commands: help, about, systems, robotics, skills, education, projects, match, experience, builds, contact, clear',
    about: 'Chandril Goswami · AI/ML learner and builder based in Kolkata, India. Focus: machine learning, data science, robotics and web development.',
    systems: 'Opening technical systems architecture and constellation…',
    robotics: 'Opening autonomous robotics maze navigation lab…',
    skills: 'Opening technical skills: Python, ML, NLP, Web Dev, Data Science, and Robotics…',
    education: 'Opening academic pathway: BCA Honours in Machine Learning…',
    projects: 'Opening selected work and capstone projects…',
    match: 'Opening Job Match Recruiter Analyzer…',
    experience: 'Opening internships, completion letters, and credentials…',
    builds: 'Opening live GitHub engineering lab repositories…',
    contact: 'Opening contact and collaboration channel…',
    clear: ''
  };
  const append = (text, className = '') => {
    const p = document.createElement('p'); p.className = `terminal-line ${className}`.trim(); p.textContent = text;
    output.appendChild(p); output.scrollTop = output.scrollHeight;
  };
  const go = id => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  function run(raw) {
    const command = raw.trim().toLowerCase(); if (!command) return;
    append(`visitor@portfolio:~$ ${command}`, 'terminal-command-echo');
    if (command === 'clear') { output.replaceChildren(); append('Terminal cleared. Type help to see available commands.', 'terminal-muted'); return; }
    if (!commands.includes(command)) { append(`Command not found: ${command}. Type help to list available commands.`, 'terminal-error'); return; }
    append(responses[command], command === 'help' ? 'terminal-muted' : '');
    const destinations = {
      about: 'about',
      systems: 'systems',
      robotics: 'robotics',
      skills: 'technical-skills',
      education: 'education',
      projects: 'projects',
      match: 'job-match',
      experience: 'experience',
      builds: 'build-log',
      contact: 'contact'
    };
    if (destinations[command]) go(destinations[command]);
  }
  form.addEventListener('submit', event => { event.preventDefault(); run(input.value); input.value = ''; });
  clear?.addEventListener('click', () => { output.replaceChildren(); append('Terminal cleared. Type help to see available commands.', 'terminal-muted'); input.focus(); });
  document.querySelectorAll('[data-terminal-command]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.terminalCommand || ''; run(input.value); input.value = ''; input.focus(); }));
})();
