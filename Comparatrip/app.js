/* Comparatrip — interações básicas da Home e animações. */
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

document.addEventListener('DOMContentLoaded', () => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(element => observer.observe(element));
  } else {
    $$('.reveal').forEach(element => element.classList.add('visible'));
  }

  $$('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      $$('.tab-btn').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const type = $('#tipoViagem');
      if (type) type.value = button.dataset.tipo;
    });
  });

  $$('.filtro-btn').forEach(button => {
    button.addEventListener('click', () => {
      $$('.filtro-btn').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      $$('[data-category]').forEach(item => {
        item.hidden = button.dataset.filtro !== 'todos' && item.dataset.category !== button.dataset.filtro;
      });
    });
  });
});
