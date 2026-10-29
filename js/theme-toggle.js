/* Accessible light/dark theme switch. Preference persists locally. */
(() => {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  if (!button) return;
  const label = button.querySelector('.theme-toggle-label');
  const storageKey = 'chandril-portfolio-theme';
  const saved = (() => { try { return localStorage.getItem(storageKey); } catch (_) { return null; } })();
  const initial = saved === 'light' || saved === 'dark' ? saved : 'light';
  function apply(theme) {
    root.dataset.theme = theme;
    button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.title = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    if (label) label.textContent = theme === 'light' ? 'Dark' : 'Light';
    try { localStorage.setItem(storageKey, theme); } catch (_) {}
    if (window.lucide) window.lucide.createIcons();
    window.dispatchEvent(new CustomEvent('portfolio:themechange', { detail: { theme } }));
  }
  apply(initial);
  button.addEventListener('click', () => apply(root.dataset.theme === 'dark' ? 'light' : 'dark'));
})();
