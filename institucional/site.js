const hash = new URLSearchParams(location.hash.slice(1));
const query = new URLSearchParams(location.search);
if (hash.has('access_token') || query.has('code') || hash.has('error_description'))
  location.replace('/app' + location.search + location.hash);
const menu = document.getElementById('menu-button');
const nav = document.getElementById('mobile-nav');
function fecharMenu() {
  nav.hidden = true;
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menu');
}
menu.addEventListener('click', () => {
  const abrir = nav.hidden;
  nav.hidden = !abrir;
  menu.setAttribute('aria-expanded', String(abrir));
  menu.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
});
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', fecharMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !nav.hidden) {
    fecharMenu();
    menu.focus();
  }
});
const tabs = [...document.querySelectorAll('[data-journey]')];
function selecionar(tab) {
  tabs.forEach((t) => {
    const ativo = t === tab;
    t.setAttribute('aria-selected', String(ativo));
    t.tabIndex = ativo ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !ativo;
  });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selecionar(t));
  t.addEventListener('keydown', (e) => {
    let n;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') n = (i + tabs.length - 1) % tabs.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = tabs.length - 1;
    if (n !== undefined) {
      e.preventDefault();
      selecionar(tabs[n]);
      tabs[n].focus();
    }
  });
});
const tarefas = [...document.querySelectorAll('[data-task]')];
tarefas.forEach((t) =>
  t.addEventListener('change', () => {
    const n = tarefas.filter((t) => t.checked).length;
    document.getElementById('demo-progress').textContent =
      n === 0
        ? 'Seu ritmo também importa.'
        : n === tarefas.length
          ? 'Você deu espaço ao que importa.'
          : 'Um passo dado. O próximo vem no seu tempo.';
  }),
);
