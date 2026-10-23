// Compatibilidade com links de confirmação antigos que ainda retornem à raiz.
const hash = new URLSearchParams(window.location.hash.slice(1));
const query = new URLSearchParams(window.location.search);
if (hash.has('access_token') || query.has('code') || hash.has('error_description')) {
  window.location.replace('/app' + window.location.search + window.location.hash);
}

const menuButton = document.querySelector('#menu-button');
const mobileNav = document.querySelector('#mobile-nav');
function fecharMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
}
menuButton.addEventListener('click', () => {
  const abrir = mobileNav.hidden;
  mobileNav.hidden = !abrir;
  menuButton.setAttribute('aria-expanded', String(abrir));
  menuButton.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', fecharMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.hidden) {
    fecharMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 851px)').addEventListener('change', (event) => {
  if (event.matches) fecharMenu();
});

const tabs = [...document.querySelectorAll('[data-demo]')];
function selecionarTab(tab) {
  tabs.forEach((atual) => {
    const selecionado = atual === tab;
    atual.setAttribute('aria-selected', String(selecionado));
    atual.tabIndex = selecionado ? 0 : -1;
    document.getElementById(atual.getAttribute('aria-controls')).hidden = !selecionado;
  });
}
tabs.forEach((tab, indice) => {
  tab.addEventListener('click', () => selecionarTab(tab));
  tab.addEventListener('keydown', (event) => {
    let proximo;
    if (event.key === 'ArrowRight') proximo = tabs[(indice + 1) % tabs.length];
    if (event.key === 'ArrowLeft') proximo = tabs[(indice + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') proximo = tabs[0];
    if (event.key === 'End') proximo = tabs[tabs.length - 1];
    if (proximo) {
      event.preventDefault();
      selecionarTab(proximo);
      proximo.focus();
    }
  });
});
const tarefas = [...document.querySelectorAll('[data-task]')];
tarefas.forEach((checkbox) =>
  checkbox.addEventListener('change', () => {
    const concluidas = tarefas.filter((tarefa) => tarefa.checked).length;
    document.getElementById('demo-pending').textContent = String(
      tarefas.length - concluidas,
    ).padStart(2, '0');
    document.getElementById('demo-progress').textContent =
      concluidas === 0
        ? 'Seu dia começa com um pequeno passo.'
        : concluidas === tarefas.length
          ? 'Um passo de cada vez. Você concluiu os três!'
          : `${concluidas} de ${tarefas.length} passos concluídos. No seu ritmo.`;
  }),
);
document.querySelectorAll('a[href="#faq-equipes"]').forEach((link) =>
  link.addEventListener('click', () => {
    document.getElementById('faq-equipes').open = true;
  }),
);
