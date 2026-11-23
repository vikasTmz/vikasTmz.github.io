(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('shape-editing-theme'); } catch {}
  const configured = root.dataset.defaultTheme;
  const initial = ['light', 'dark'].includes(saved) ? saved : configured === 'system' ? (preference.matches ? 'dark' : 'light') : configured;
  const apply = (theme) => {
    root.dataset.theme = theme;
    const button = document.querySelector('.theme-toggle');
    if (button) {
      const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
      button.setAttribute('aria-label', label);
      button.title = label;
    }
  };
  apply(initial);
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.querySelector('.theme-toggle').addEventListener('click', () => {
      saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(saved);
      try { localStorage.setItem('shape-editing-theme', saved); } catch {}
    });
  });
  preference.addEventListener('change', () => {
    if (!saved && configured === 'system') apply(preference.matches ? 'dark' : 'light');
  });
})();
