/* Cliente da API PHP: busca dados e atualiza o HTML, sem regras de banco. */
(() => {
  const API_BASE = window.COMPARATRIP_API_URL || 'api';
  const page = document.body.dataset.page;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
  const safeImage = value => /^https:\/\//i.test(value || '') ? value : '';
  const dateBr = value => value ? value.slice(0, 10).split('-').reverse().join('/') : '';

  async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      credentials: 'same-origin',
      ...options,
      headers: { Accept: 'application/json', ...options.headers },
    });
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('API PHP indisponível neste endereço.');
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.erro || 'Erro na API.');
      error.status = response.status;
      throw error;
    }
    return result.dados;
  }

  function discount(pkg) {
    return Number(pkg.antigo) > Number(pkg.preco)
      ? Math.round((1 - Number(pkg.preco) / Number(pkg.antigo)) * 100) : 0;
  }

  function packageCard(pkg) {
    const off = discount(pkg);
    const image = safeImage(pkg.imagens?.[0]);
    const transportIcon = pkg.transporte === 'Navio' ? 'ship' : pkg.transporte === 'Ônibus' ? 'bus' : 'plane';
    return `<article class="pkg-card reveal visible" data-package-id="${escapeHtml(pkg.id)}"
      data-price="${Number(pkg.preco)}" data-days="${Number(pkg.dias)}"
      data-transport="${escapeHtml(pkg.transporte)}" data-board="${escapeHtml(pkg.pensao)}"
      data-category="${escapeHtml(pkg.categoria)}" data-sold="${Number(pkg.vendidos)}">
      ${off ? `<span class="tag-off">-${off}%</span>` : ''}
      <button aria-label="Favoritar" aria-pressed="false" class="fav-btn" data-fav="${escapeHtml(pkg.id)}" type="button"><i class="fa-regular fa-heart"></i></button>
      <a href="detalhes-pacote.html?id=${encodeURIComponent(pkg.id)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(pkg.destino)}"></a>
      <div class="pkg-body"><h3>${escapeHtml(pkg.nome)}</h3><div class="pkg-meta">
        <span><i class="fa-regular fa-clock"></i> ${Number(pkg.dias)} dias</span>
        <span><i class="fa-solid fa-${transportIcon}"></i> ${escapeHtml(pkg.transporte)}</span>
        <span><i class="fa-solid fa-utensils"></i> ${escapeHtml(pkg.pensao)}</span></div>
      <div class="pkg-price"><div>${off ? `<s>${money(pkg.antigo)}</s>` : ''}<strong>${money(pkg.preco)}</strong><small style="color:#888"> /pessoa</small></div>
      <a class="small-btn" href="detalhes-pacote.html?id=${encodeURIComponent(pkg.id)}">Ver</a></div></div></article>`;
  }

  function renderGrid(grid, packages) {
    if (!grid) return;
    grid.innerHTML = packages.length ? packages.map(packageCard).join('') : '<p class="empty">Nenhum pacote encontrado.</p>';
  }

  function renderPackages(packages) {
    if (page === 'pacotes') {
      renderGrid($('#lista .grid-3'), packages);
    } else if (page === 'promocoes') {
      const grids = $$('main .grid-3');
      renderGrid(grids[0], packages.filter(pkg => discount(pkg)).sort((a, b) => discount(b) - discount(a)));
      renderGrid(grids[1], packages.filter(pkg => pkg.ultima));
      renderGrid(grids[2], packages.filter(pkg => pkg.feriado));
    } else if (page === 'destinos') {
      $$('.region').forEach(region => {
        const name = $('h2', region)?.textContent.trim();
        renderGrid($('.grid-3', region), packages.filter(pkg => pkg.regiao === name));
      });
    } else if (page === 'adminPacotes') {
      renderPackageRows(packages);
    } else if (page === 'detalhes') {
      updatePackageDetail(packages);
    }
    document.dispatchEvent(new CustomEvent('comparatrip:pacotes'));
  }

  function renderPackageRows(packages) {
    const table = $('.table tbody');
    if (!table) return;
    $$('tr[data-name]', table).forEach(row => row.remove());
    table.insertAdjacentHTML('beforeend', packages.map(pkg => `<tr data-name="${escapeHtml(pkg.nome)}" data-price="${Number(pkg.preco)}" data-region="${escapeHtml(pkg.regiao)}" data-vacancies="${Number(pkg.vagas)}">
      <td>${escapeHtml(pkg.nome)}</td><td>${escapeHtml(pkg.regiao)}</td><td>${money(pkg.preco)}</td><td>${Number(pkg.vagas)}</td>
      <td style="white-space:nowrap"><button class="small-btn ghost" data-e="${escapeHtml(pkg.id)}" type="button">Editar</button>
      <button class="small-btn danger" data-x="${escapeHtml(pkg.id)}" type="button">Excluir</button></td></tr>`).join(''));
  }

  function updatePackageDetail(pkg) {
    if (!pkg || !$('#datas')) return;
    document.title = `${pkg.nome} | Comparatrip`;
    const title = $('main h1');
    if (title) title.textContent = pkg.nome;
    $$('.gallery img').forEach((image, index) => {
      const source = safeImage(pkg.imagens?.[index] || pkg.imagens?.[0]);
      if (source) image.src = source;
      image.alt = pkg.destino;
    });
    const price = $('.summary-card .code');
    if (price) price.textContent = money(pkg.preco);
    const note = $('.summary-card .form-note');
    if (note) note.textContent = `por pessoa · ${pkg.dias} dias · ${pkg.vagas} vagas`;
    const off = discount(pkg);
    const tag = $('.summary-card .tag-off');
    if (tag) {
      tag.hidden = !off;
      tag.textContent = `-${off}% OFF`;
    }
    const oldPrice = $('.summary-card s');
    if (oldPrice) {
      oldPrice.textContent = money(pkg.antigo);
      oldPrice.parentElement.hidden = !off;
    }
    const breadcrumb = $('main .container > p');
    if (breadcrumb) breadcrumb.innerHTML = `<a href="pacotes.html">Pacotes</a> › ${escapeHtml(pkg.regiao)} › ${escapeHtml(pkg.destino)}`;
    const timeline = $('.timeline');
    if (timeline) {
      const activities = ['City tour pelos principais pontos turísticos.', 'Dia livre para explorar e fazer compras.', 'Passeio guiado com almoço típico.', 'Excursão de dia inteiro com paisagens incríveis.'];
      timeline.innerHTML = Array.from({ length: Number(pkg.dias) }, (_, index) => {
        const text = index === 0 ? `Chegada em ${escapeHtml(pkg.destino)}, traslado e check-in no hotel.`
          : index === Number(pkg.dias) - 1 ? 'Café da manhã, check-out e traslado de retorno.'
            : activities[index % activities.length];
        return `<li><b>Dia ${index + 1}</b> — ${text}</li>`;
      }).join('');
    }
    const included = $('.inc');
    if (included) {
      const transport = pkg.transporte === 'Navio' ? 'Cabine no navio' : pkg.transporte === 'Ônibus' ? 'Ônibus de turismo ida e volta' : 'Passagem aérea ida e volta';
      const transfer = pkg.transporte === 'Navio' ? 'Taxas portuárias' : 'Traslado aeroporto ↔ hotel';
      const items = [transport, transfer, `Hospedagem ${Number(pkg.dias) - 1} noites`, pkg.pensao, 'Passeios guiados', 'Assistência 24h'];
      included.innerHTML = items.map(item => `<li><i class="fa-solid fa-check"></i>${escapeHtml(item)}</li>`).join('');
    }
    const favorite = $('.summary-card [data-fav]');
    if (favorite) favorite.dataset.fav = pkg.id;
  }

  function reservationRow(reservation) {
    const statuses = ['pendente', 'pago', 'cancelado'];
    const traveler = reservation.viajantes?.[0]?.nome || reservation.cliente;
    return `<tr data-status="${escapeHtml(reservation.status)}"><td><b>${escapeHtml(reservation.codigo)}</b></td>
      <td>${escapeHtml(traveler)}<br><small>${escapeHtml(reservation.email)}</small></td>
      <td>${escapeHtml(reservation.pacote.nome)}</td><td>${dateBr(reservation.data)}</td>
      <td>${escapeHtml(reservation.forma)}</td><td>${money(reservation.total)}</td>
      <td><select data-c="${escapeHtml(reservation.codigo)}" name="status[${escapeHtml(reservation.codigo)}]">
      ${statuses.map(status => `<option ${status === reservation.status ? 'selected' : ''}>${status}</option>`).join('')}</select></td></tr>`;
  }

  function renderAdminReservations(reservations) {
    const body = $('.table tbody');
    if (!body) return;
    $$('tr[data-status]', body).forEach(row => row.remove());
    body.insertAdjacentHTML('beforeend', reservations.map(reservationRow).join(''));
    $$('[data-s]').forEach(chip => {
      const status = chip.dataset.s;
      const count = status === 'todos' ? reservations.length : reservations.filter(item => item.status === status).length;
      chip.textContent = `${status[0].toUpperCase() + status.slice(1)} (${count})`;
    });
    document.dispatchEvent(new CustomEvent('comparatrip:reservas'));
  }

  function travelBox(reservation) {
    const labels = { pago: 'Pago', pendente: 'Pagamento pendente', cancelado: 'Cancelado' };
    return `<div class="box" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <img alt="" src="${escapeHtml(safeImage(reservation.pacote.imagem))}" style="width:120px;height:85px;object-fit:cover;border-radius:10px">
      <div style="flex:1;min-width:200px"><h3>${escapeHtml(reservation.pacote.nome)}</h3>
      <p class="form-note">Reserva <b>${escapeHtml(reservation.codigo)}</b> · Saída ${dateBr(reservation.data)} · ${reservation.viajantes.length} viajante(s) · ${money(reservation.total)}</p>
      <span class="status ${escapeHtml(reservation.status)}">${labels[reservation.status] || reservation.status}</span></div></div>`;
  }

  function renderTravels(reservations) {
    const container = $('main .section .container');
    if (!container) return;
    const today = new Date().toISOString().slice(0, 10);
    const future = reservations.filter(item => item.data >= today && item.status !== 'cancelado');
    const past = reservations.filter(item => !(item.data >= today && item.status !== 'cancelado'));
    container.innerHTML = `<h2 style="margin-bottom:12px">Próximas viagens</h2>${future.map(travelBox).join('') || '<p class="empty">Nenhuma viagem futura.</p>'}
      <h2 style="margin:24px 0 12px">Histórico</h2>${past.map(travelBox).join('') || '<p class="empty">Sem histórico ainda.</p>'}`;
  }

  function accessMessage(error) {
    if (![401, 403].includes(error.status)) return;
    const container = $('main .section .container');
    if (container) container.innerHTML = `<p class="empty">${escapeHtml(error.message)} <a href="login.html" style="color:var(--od)">Entrar</a></p>`;
  }

  async function loadPackages() {
    try {
      const id = page === 'detalhes' ? new URLSearchParams(location.search).get('id') || 'rio' : '';
      renderPackages(await request(`pacotes.php${id ? `?id=${encodeURIComponent(id)}` : ''}`));
    } catch (error) {
      console.info(`Comparatrip: ${error.message} Mantendo o conteúdo atual.`);
    }
  }

  function setupStatusUpdates() {
    const table = $('.table');
    if (!table) return;
    table.addEventListener('change', async event => {
      const select = event.target.closest('select[data-c]');
      if (!select) return;
      const previous = select.dataset.previous || select.value;
      try {
        await request('reservas.php', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: select.dataset.c, status: select.value }),
        });
        select.dataset.previous = select.value;
      } catch (error) {
        select.value = previous;
        select.closest('tr').dataset.status = previous;
        alert(`Não foi possível atualizar a reserva: ${error.message}`);
      }
    });
  }

  async function loadReservations() {
    try {
      const reservations = await request('reservas.php');
      if (page === 'adminReservas') renderAdminReservations(reservations);
      if (page === 'viagens') renderTravels(reservations);
    } catch (error) {
      accessMessage(error);
      if (!error.status) console.info(`Comparatrip: ${error.message} Mantendo o conteúdo atual.`);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (['pacotes', 'promocoes', 'destinos', 'adminPacotes', 'detalhes'].includes(page)) loadPackages();
    if (page === 'adminReservas') setupStatusUpdates();
    if (['adminReservas', 'viagens'].includes(page)) loadReservations();
  });
})();
