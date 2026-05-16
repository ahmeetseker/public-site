export const THEME_STORAGE_KEY = 'arsam.theme.v1'

export const themeInitScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var v=s==='light'||s==='dark'||s==='system'?s:'system';var d=v==='dark'||(v==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=v;}catch(e){}})();`
