/* Comparatrip — somente interações visuais. Dados e envios pertencem ao PHP. */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function toast(message) {
    let element = $('#toast');
    if (!element) {
      element = document.createElement('div');
      element.id = 'toast';
      element.className = 'toast';
      document.body.append(element);
    }
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 2600);
  }

  function setupMenu() {
    const button = $('#menuBtn');
    const links = $('#navLinks');
    if (!button || !links) return;
    button.addEventListener('click', () => {
      const open = links.classList.toggle('aberto');
      button.setAttribute('aria-expanded', String(open));
    });
  }

  function setupFavorites() {
    $$('[data-fav]').forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = 'true';
      button.addEventListener('click', event => {
        event.preventDefault();
        const active = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(active));
        const icon = $('i', button);
        if (icon) icon.className = `fa-${active ? 'solid' : 'regular'} fa-heart`;
        toast(active ? 'Favorito marcado nesta tela' : 'Favorito desmarcado nesta tela');
      });
    });
  }

  function setupPackageFilters() {
    const list = $('#lista');
    const price = $('#fPreco');
    if (!list || !price) return;

    const grid = $('.grid-3', list);
    const cards = () => $$('.pkg-card', list);
    const output = $('#fPrecoV');
    const count = $('#count');
    const order = $('#ordem');
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nenhum pacote encontrado.';
    empty.hidden = true;
    list.append(empty);

    const checked = name => $$(`input[name="${name}"]:checked`).map(input => input.value);

    function sortCards() {
      if (!grid) return;
      const mode = order?.value || 'pop';
      [...cards()].sort((a, b) => {
        if (mode === 'menor') return Number(a.dataset.price) - Number(b.dataset.price);
        if (mode === 'maior') return Number(b.dataset.price) - Number(a.dataset.price);
        if (mode === 'dur') return Number(a.dataset.days) - Number(b.dataset.days);
        return Number(b.dataset.sold) - Number(a.dataset.sold);
      }).forEach(card => grid.append(card));
    }

    function applyFilters() {
      const maximum = Number(price.value);
      const durations = checked('dur');
      const transports = checked('tr');
      const boards = checked('pe');
      const categories = checked('ca');
      let visible = 0;

      if (output) output.textContent = money(maximum);
      cards().forEach(card => {
        const days = Number(card.dataset.days);
        const durationMatches = !durations.length || durations.some(range => {
          const [minimum, limit] = range.split('-').map(Number);
          return days >= minimum && days <= limit;
        });
        const show = Number(card.dataset.price) <= maximum && durationMatches
          && (!transports.length || transports.includes(card.dataset.transport))
          && (!boards.length || boards.includes(card.dataset.board))
          && (!categories.length || categories.includes(card.dataset.category));
        card.hidden = !show;
        if (show) visible += 1;
      });

      sortCards();
      empty.hidden = visible !== 0;
      if (count) count.innerHTML = `<b>${visible}</b> pacote(s)`;
    }

    $$('.filters input').forEach(input => input.addEventListener('input', applyFilters));
    order?.addEventListener('change', applyFilters);
    $('#limpar')?.addEventListener('click', () => {
      $$('.filters input[type="checkbox"]').forEach(input => { input.checked = false; });
      price.value = '12000';
      if (order) order.value = 'pop';
      applyFilters();
    });
    list.applyPackageFilters = applyFilters;
    applyFilters();
  }

  function setupDateChips() {
    $$('#datas .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('#datas .chip').forEach(item => item.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  }

  function setupCountdown() {
    const element = $('#cd');
    if (!element) return;
    const duration = Number(element.dataset.duration || 0);
    const end = Date.now() + duration * 1000;
    const timer = setInterval(update, 1000);

    function update() {
      const seconds = Math.max(0, Math.floor((end - Date.now()) / 1000));
      element.textContent = [seconds / 3600, seconds / 60 % 60, seconds % 60]
        .map(value => String(Math.floor(value)).padStart(2, '0')).join(':');
      if (!seconds) clearInterval(timer);
    }
    update();
  }

  function setupCart() {
    const main = $('main[data-unit-price]');
    if (!main) return;
    const adults = $('#ad');
    const children = $('#cr');
    const summary = $('#sum');
    const coupon = $('#cupom');
    const message = $('#cupMsg');
    let discount = 0;

    function calculate() {
      const adultCount = Math.max(1, Math.min(9, Number(adults.value) || 1));
      const childCount = Math.max(0, Math.min(9, Number(children.value) || 0));
      adults.value = String(adultCount);
      children.value = String(childCount);
      const unit = Number(main.dataset.unitPrice);
      const extras = $$('.ex:checked').reduce((total, input) =>
        total + Number(input.dataset.price) * (adultCount + childCount), 0);
      const subtotal = unit * adultCount + unit * 0.5 * childCount + extras;
      const discountValue = subtotal * discount;
      const total = subtotal - discountValue;

      summary.innerHTML = `<h3>Total</h3>
        <div class="summary-line"><span>${adultCount} adulto(s)</span><strong>${money(unit * adultCount)}</strong></div>
        ${childCount ? `<div class="summary-line"><span>${childCount} criança(s)</span><strong>${money(unit * 0.5 * childCount)}</strong></div>` : ''}
        ${extras ? `<div class="summary-line"><span>Adicionais</span><strong>${money(extras)}</strong></div>` : ''}
        ${discountValue ? `<div class="summary-line"><span>Desconto</span><strong>- ${money(discountValue)}</strong></div>` : ''}
        <div class="summary-line summary-total"><span>Total</span><strong>${money(total)}</strong></div>
        <p class="form-note">ou 10x de ${money(total / 10)} sem juros</p>
        <a href="checkout.html" class="btn-primario" style="width:100%;margin-top:12px">Continuar para pagamento</a>`;
    }

    $$('#ad, #cr, .ex').forEach(input => input.addEventListener('input', calculate));
    $('#aplicar')?.addEventListener('click', () => {
      const valid = coupon.value.trim().toUpperCase() === coupon.dataset.validCoupon;
      discount = valid ? Number(coupon.dataset.discount) : 0;
      message.textContent = valid ? 'Desconto aplicado nesta prévia.' : 'Cupom inválido nesta prévia.';
      calculate();
    });
    calculate();
  }

  function setupPaymentTabs() {
    const chips = $$('#forma [data-payment]');
    if (!chips.length) return;
    const panels = $$('[data-payment-panel]');
    const hiddenInput = $('#formaPagamento');

    function selectPayment(chip) {
      const payment = chip.dataset.payment;
      chips.forEach(item => item.classList.toggle('active', item === chip));
      panels.forEach(panel => {
        const visible = panel.dataset.paymentPanel === payment;
        panel.hidden = !visible;
        $$('input, select', panel).forEach(field => { field.disabled = !visible; });
      });
      if (hiddenInput) hiddenInput.value = payment;
    }

    chips.forEach(chip => chip.addEventListener('click', () => selectPayment(chip)));
    selectPayment(chips[0]);
  }

  function setupPackageAdmin() {
    const form = $('#apf');
    if (!form) return;
    $$('[data-e]').forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = 'true';
      button.addEventListener('click', () => {
        const row = button.closest('tr');
        form.elements.nome.value = row.dataset.name;
        form.elements.regiao.value = row.dataset.region;
        form.elements.preco.value = row.dataset.price;
        form.elements.vagas.value = row.dataset.vacancies;
        $('#apt').textContent = `Editar: ${row.dataset.name}`;
        scrollTo(0, 0);
      });
    });
    $$('[data-x]').forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = 'true';
      button.addEventListener('click', () => {
        if (confirm('Remover esta linha da tela? A exclusão definitiva será feita pelo PHP.')) {
          button.closest('tr').remove();
        }
      });
    });
    const newButton = $('#novo');
    if (newButton && !newButton.dataset.bound) {
      newButton.dataset.bound = 'true';
      newButton.addEventListener('click', () => {
        form.reset();
        $('#apt').textContent = 'Novo pacote';
      });
    }
  }

  function setupReservationFilters() {
    const chips = $$('[data-s]');
    if (!chips.length) return;
    chips.forEach(chip => {
      if (chip.dataset.bound) return;
      chip.dataset.bound = 'true';
      chip.addEventListener('click', () => {
        chips.forEach(item => item.classList.toggle('active', item === chip));
        $$('.table tr[data-status]').forEach(row => {
          row.hidden = chip.dataset.s !== 'todos' && row.dataset.status !== chip.dataset.s;
        });
      });
    });
    $$('select[data-c]').forEach(select => {
      if (select.dataset.bound) return;
      select.dataset.bound = 'true';
      select.dataset.previous = select.value;
      select.addEventListener('change', () => { select.closest('tr').dataset.status = select.value; });
    });
  }

  document.addEventListener('comparatrip:pacotes', () => {
    setupFavorites();
    $('#lista')?.applyPackageFilters?.();
    setupPackageAdmin();
  });
  document.addEventListener('comparatrip:reservas', setupReservationFilters);

  document.addEventListener('DOMContentLoaded', () => {
    setupMenu();
    setupFavorites();
    setupPackageFilters();
    setupDateChips();
    setupCountdown();
    setupCart();
    setupPaymentTabs();
    setupPackageAdmin();
    setupReservationFilters();
  });
})();
