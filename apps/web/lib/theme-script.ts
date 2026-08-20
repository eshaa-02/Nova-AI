/**
 * Injected as a blocking inline script in the document <head>.
 * Runs before React hydrates so there is no flash of the wrong theme.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('nova-theme');
    var mode = stored || 'system';
    var isDark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('light', !isDark);
  } catch (e) {}
})();
`;
