'use strict';

const byId = id => document.getElementById(id);
const { produtos, marca, demonstracao, whatsapp } = catalogo;
const productIndex = new Map(produtos.map(product => [product.id, product]));
const categories = [...new Set(produtos.map(product => product.categoria))];
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPrice = cents => money.format(cents / 100);
const normalize = text => text.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const all = '';
let category = all;
let notificationTimer;

const search = byId('search');
const filters = byId('filters');
const products = byId('products');
const detail = byId('product-dialog');
const list = byId('list-dialog');
const listItems = byId('list-items');
const openList = byId('open-list');
const prepare = byId('prepare-order');
const preview = byId('message-preview');
const message = byId('order-message');
const copyStatus = byId('copy-status');
const whatsappDemo = element('a', 'Abrir no WhatsApp', 'primary wide');
const useWhatsApp = !demonstracao && /^\d{10,15}$/.test(whatsapp);
const listKey = 'catalogo:' + marca + ':lista';

function element(tag, content = '', classes = '') {
  const node = document.createElement(tag);
  node.textContent = content;
  if (classes) node.className = classes;
  return node;
}

function action(label, classes, handler) {
  const button = element('button', label, classes);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

function imageOf(product) {
  const image = element('img');
  image.src = product.foto;
  image.alt = product.alt ?? product.nome;
  image.decoding = 'async';
  return image;
}

function loadList() {
  try {
    const saved = JSON.parse(localStorage.getItem(listKey) ?? '{}');
    const valid = Object.entries(saved).filter(([id, quantity]) =>
      productIndex.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99
    );
    return new Map(valid);
  } catch {
    return new Map();
  }
}

const order = loadList();
const filterButtons = new Map();

function applyBrand() {
  document.title = marca + ' | Catálogo';
  for (const brand of document.querySelectorAll('[data-brand]')) {
    const dot = element('span', '.');
    dot.setAttribute('aria-hidden', 'true');
    brand.replaceChildren(marca, dot);
  }
  const [first, ...remaining] = catalogo.chamada.split('\n');
  const title = byId('hero-title');
  title.replaceChildren(first);
  for (const line of remaining) title.append(element('br'), line);
  byId('hero-kicker').textContent = catalogo.segmento;
  byId('hero-description').textContent = catalogo.descricao;
  byId('catalog-kicker').textContent = 'A seleção ' + marca;
  byId('hero-image').src = catalogo.fotoCapa;
  byId('hero-image').alt = catalogo.textoAlternativoCapa;
  byId('demo-footer').hidden = !demonstracao;
  prepare.textContent = useWhatsApp ? 'Enviar pelo WhatsApp' : demonstracao ? 'Simular pedido' : 'Montar mensagem de pedido';
  if (demonstracao) {
    preview.querySelector('p').textContent = 'Você escolhe a conversa no WhatsApp. O catálogo não envia a mensagem automaticamente.';
    whatsappDemo.target = '_blank';
    whatsappDemo.rel = 'noopener noreferrer';
    whatsappDemo.style.marginBottom = '10px';
    message.after(whatsappDemo);
  } else if (!useWhatsApp) {
    preview.querySelector('p').textContent = 'Copie a mensagem para enviar pelo canal de atendimento da loja.';
  }
}

function productCard(product) {
  const card = element('article', '', 'product');
  const img = imageOf(product);
  img.loading = 'lazy';
  const info = element('div', '', 'product-info');
  const button = action('Ver detalhes', 'outline', () => showProduct(product));
  button.setAttribute('aria-label', 'Ver detalhes de ' + product.nome);
  info.append(
    element('p', product.categoria, 'product-category'),
    element('h3', product.nome),
    element('strong', formatPrice(product.preco)),
    button,
  );
  card.append(img, info);
  return card;
}

function renderCatalog() {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  const visible = produtos.filter(product => {
    const searchable = normalize([product.nome, product.categoria, product.descricao, product.detalhes].join(' '));
    return (category === all || product.categoria === category) && terms.every(term => searchable.includes(term));
  });
  products.replaceChildren(...visible.map(productCard));
  byId('result-count').textContent = visible.length + (visible.length === 1 ? ' produto' : ' produtos');
  byId('empty').hidden = visible.length > 0;
  for (const [key, button] of filterButtons) button.setAttribute('aria-pressed', String(key === category));
}

function showProduct(product) {
  const layout = element('div', '', 'detail-layout');
  const content = element('div', '', 'detail-copy');
  const title = element('h2', product.nome);
  title.id = 'detail-title';
  const add = action('Adicionar à lista', 'primary wide', () => {
    const added = changeQuantity(product.id, 1);
    detail.close();
    notify(added ? product.nome + ' adicionado à lista.' : 'Limite de 99 unidades por item.');
  });
  content.append(
    element('p', product.categoria, 'product-category'), title, element('p', product.descricao),
    element('p', product.detalhes, 'muted'), element('p', formatPrice(product.preco), 'detail-price'), add,
  );
  layout.append(imageOf(product), content);
  byId('product-detail').replaceChildren(layout);
  detail.showModal();
  detail.scrollTop = 0;
}

function notify(text) {
  const box = byId('notification');
  box.textContent = text;
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => { box.textContent = ''; }, 3500);
}

function updateCount() {
  const quantity = [...order.values()].reduce((sum, value) => sum + value, 0);
  byId('list-count').textContent = quantity;
  openList.setAttribute('aria-label', 'Minha lista, ' + quantity + (quantity === 1 ? ' item' : ' itens'));
}

function changeQuantity(id, difference) {
  const quantity = (order.get(id) ?? 0) + difference;
  if (quantity > 99) return false;
  if (quantity > 0) order.set(id, quantity);
  else order.delete(id);
  try {
    localStorage.setItem(listKey, JSON.stringify(Object.fromEntries(order)));
  } catch {
    // The list remains available in memory where storage is disabled.
  }
  updateCount();
  return true;
}

function changeFromList(id, difference, focusKey) {
  changeQuantity(id, difference);
  renderList();
  const next = Array.from(listItems.querySelectorAll('button')).find(button => button.dataset.focusKey === focusKey && !button.disabled);
  const other = Array.from(listItems.querySelectorAll('button')).find(button => button.dataset.product === id && !button.disabled);
  (next ?? other ?? listItems.querySelector('button:not(:disabled)') ?? list.querySelector('.close')).focus();
}

function renderList() {
  listItems.replaceChildren();
  byId('order-actions').hidden = order.size === 0;
  preview.hidden = true;
  copyStatus.textContent = '';
  let subtotal = 0;
  for (const [id, quantity] of order) {
    const product = productIndex.get(id);
    const row = element('div', '', 'list-row');
    const description = element('div');
    const price = product.preco * quantity;
    subtotal += price;
    description.append(element('strong', product.nome), element('div', formatPrice(price), 'muted'));
    const controls = element('div', '', 'quantity');
    const controlsConfig = [
      { symbol: '−', amount: -1, label: quantity === 1 ? 'Remover ' : 'Diminuir quantidade de ' },
      { symbol: '+', amount: 1, label: 'Aumentar quantidade de ' },
    ];
    for (const [index, config] of controlsConfig.entries()) {
      const focusKey = id + ':' + config.amount;
      const button = action(config.symbol, '', () => changeFromList(id, config.amount, focusKey));
      button.dataset.focusKey = focusKey;
      button.dataset.product = id;
      button.disabled = quantity === 99 && config.amount === 1;
      button.setAttribute('aria-label', config.label + product.nome);
      if (index === 1) controls.append(element('span', String(quantity)));
      controls.append(button);
    }
    row.append(description, controls);
    listItems.append(row);
  }
  if (!order.size) listItems.append(element('p', 'Sua lista está vazia. Abra os detalhes de um produto para adicioná-lo.', 'muted'));
  byId('subtotal-value').textContent = formatPrice(subtotal);
}

function prepareOrder() {
  const lines = [...order].map(([id, quantity]) => {
    const product = productIndex.get(id);
    return quantity + ' × ' + product.nome + ' — ' + formatPrice(product.preco * quantity);
  });
  const text = [
    'Olá! Vi o catálogo da ' + marca + ' e gostaria de consultar estes itens:',
    '', ...lines, '', 'Subtotal dos itens: ' + byId('subtotal-value').textContent,
    'Podem confirmar a disponibilidade e as opções de entrega ou retirada?',
  ].join('\n');
  const encodedText = encodeURIComponent(text);
  if (useWhatsApp) {
    window.location.href = 'https://wa.me/' + whatsapp + '?text=' + encodedText;
    return;
  }
  if (demonstracao) whatsappDemo.href = 'https://wa.me/?text=' + encodedText;
  message.value = text;
  preview.hidden = false;
  message.focus();
}

async function copyMessage() {
  try {
    await navigator.clipboard.writeText(message.value);
    copyStatus.textContent = 'Mensagem copiada.';
  } catch {
    message.focus();
    message.select();
    copyStatus.textContent = document.execCommand('copy') ? 'Mensagem copiada.' : 'Mensagem selecionada. Use a opção de copiar do seu dispositivo.';
  }
}

for (const item of [all, ...categories]) {
  const button = action(item || 'Todos', 'filter', () => {
    category = item;
    renderCatalog();
  });
  filters.append(button);
  filterButtons.set(item, button);
}
search.addEventListener('input', renderCatalog);
byId('reset').addEventListener('click', () => {
  search.value = '';
  category = all;
  renderCatalog();
  search.focus();
});
openList.addEventListener('click', () => {
  renderList();
  list.showModal();
  list.scrollTop = 0;
});
prepare.addEventListener('click', prepareOrder);
byId('copy-message').addEventListener('click', copyMessage);
applyBrand();
updateCount();
renderCatalog();
