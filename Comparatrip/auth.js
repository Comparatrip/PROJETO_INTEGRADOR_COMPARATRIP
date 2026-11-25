/* Login, cadastro e logout: conversa com api/*.php. Senhas nunca ficam no navegador. */
(() => {
  const API_BASE = window.COMPARATRIP_API_URL || 'api';
  const $ = selector => document.querySelector(selector);

  async function call(endpoint, method = 'GET', body) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('API PHP indisponível neste endereço.');
    const result = await response.json();
    if (!response.ok) throw new Error(result.erro || 'Erro na API.');
    return result.dados;
  }

  function show(box, text, ok) {
    if (!box) return;
    box.textContent = text;
    box.className = `form-message ${ok ? 'success' : 'error'}`;
  }

  function bindForm(formId, boxId, endpoint, build, next) {
    const form = $(formId);
    if (!form) return;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const box = $(boxId);
      const button = form.querySelector('button.btn-primario');
      if (button) button.disabled = true;
      try {
        const user = await call(endpoint, 'POST', build(new FormData(form)));
        show(box, `Bem-vindo, ${user.nome}!`, true);
        setTimeout(() => { location.href = next(user); }, 600);
      } catch (error) {
        show(box, error.message, false);
        if (button) button.disabled = false;
      }
    });
  }

  bindForm('#lf', '#lm', 'login.php',
    data => ({ email: data.get('email'), senha: data.get('senha') }),
    user => (user.papel === 'admin' ? 'admin.html' : 'minhas-viagens.html'));

  bindForm('#cf', '#cm', 'cadastro.php',
    data => ({ nome: data.get('nome'), email: data.get('email'), senha: data.get('senha') }),
    () => 'minhas-viagens.html');

  $('#sair')?.addEventListener('click', async event => {
    event.preventDefault();
    try { await call('logout.php', 'POST'); } catch (error) { console.info(`Comparatrip: ${error.message}`); }
    location.href = 'login.html';
  });

  // Troca "Entrar" pelo nome do usuário logado, em qualquer página.
  document.addEventListener('DOMContentLoaded', async () => {
    const link = $('.btn-conta');
    if (!link) return;
    try {
      const user = await call('sessao.php');
      if (user) {
        link.href = 'perfil.html';
        link.replaceChildren(Object.assign(document.createElement('i'), { className: 'fa-regular fa-user' }),
          document.createTextNode(` ${user.nome.split(' ')[0]}`));
      }
    } catch (error) {
      console.info(`Comparatrip: ${error.message}`);
    }
  });
})();
