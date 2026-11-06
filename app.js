/**
 * =========================================
 * Halloween Costumes Manager — app.js
 * CRUD + LocalStorage + Bot Asistente
 * =========================================
 */

'use strict';

// ─── Estado global ───────────────────────────────────────────────
let costumes = [];
let editingId = null;

// ─── Utilidades ──────────────────────────────────────────────────

/** Formatea número a pesos colombianos */
function formatCOP(value) {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) return null;
  const num = Number(value);
  if (num === 0) return null;
  return '$' + num.toLocaleString('es-CO') + ' COP';
}

/** Genera ID único tipo DSF-XXXXX */
function generateId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let id = 'DSF-';
  for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/** Muestra un toast de notificación */
function showToast(message, type = 'default') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

/** Persiste en LocalStorage */
function saveToStorage() {
  localStorage.setItem('hcm_costumes', JSON.stringify(costumes));
}

/** Carga desde LocalStorage */
function loadFromStorage() {
  try {
    const data = localStorage.getItem('hcm_costumes');
    costumes = data ? JSON.parse(data) : [];
  } catch {
    costumes = [];
  }
}

// ─── Estadísticas del header ─────────────────────────────────────
function updateStats() {
  document.getElementById('total-costumes').textContent = costumes.length;
  const total = costumes.reduce((acc, c) => acc + (Number(c.priceSale) || 0), 0);
  document.getElementById('total-value').textContent =
    total > 0 ? '$' + total.toLocaleString('es-CO') : '$0';
}

// ─── Renderizado de la tabla ──────────────────────────────────────
const typeLabels = {
  clasico: 'Clásico',
  casero: 'Casero',
  complejo: 'Complejo',
  lujo: 'Lujo',
  infantil: 'Infantil',
  pareja: 'Pareja',
};

function renderTable(list = costumes) {
  const tbody = document.getElementById('inventory-body');
  const emptyState = document.getElementById('empty-state');

  tbody.innerHTML = '';

  if (list.length === 0) {
    emptyState.classList.add('visible');
    updateStats();
    return;
  }

  emptyState.classList.remove('visible');

  list.forEach(c => {
    const priceHour = formatCOP(c.priceHour);
    const priceDay  = formatCOP(c.priceDay);
    const priceSale = formatCOP(c.priceSale);
    const stock     = Number(c.stock) || 0;
    const stockClass = stock === 0 ? 'stock-zero' : stock <= 2 ? 'stock-low' : 'stock-ok';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="id-chip">${escapeHtml(c.id)}</span></td>
      <td><strong>${escapeHtml(c.name)}</strong>${c.notes ? `<br><small style="color:var(--text-muted);font-size:0.75rem">${escapeHtml(c.notes.substring(0,50))}${c.notes.length > 50 ? '…' : ''}</small>` : ''}</td>
      <td><span class="type-badge type-${c.type}">${typeLabels[c.type] || c.type}</span></td>
      <td class="${priceHour ? 'price-cell' : 'price-empty'}">${priceHour || '—'}</td>
      <td class="${priceDay  ? 'price-cell' : 'price-empty'}">${priceDay  || '—'}</td>
      <td class="${priceSale ? 'price-cell' : 'price-empty'}">${priceSale || '—'}</td>
      <td><span class="stock-badge ${stockClass}">${stock}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" data-id="${escapeHtml(c.id)}" title="Editar">✏️</button>
          <button class="btn-delete" data-id="${escapeHtml(c.id)}" title="Eliminar">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateStats();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── CRUD Operations ─────────────────────────────────────────────

function addCostume(data) {
  // Validar ID único
  if (costumes.find(c => c.id === data.id)) {
    showToast('⚠️ Ya existe un disfraz con ese ID.', 'warn');
    return false;
  }
  costumes.unshift({ ...data, createdAt: Date.now() });
  saveToStorage();
  renderTable(getFilteredList());
  showToast('🎃 Disfraz registrado exitosamente!', 'success');
  return true;
}

function deleteCostume(id) {
  if (!confirm(`¿Eliminar el disfraz "${id}"? Esta acción no se puede deshacer.`)) return;
  costumes = costumes.filter(c => c.id !== id);
  saveToStorage();
  renderTable(getFilteredList());
  showToast('🗑️ Disfraz eliminado.', 'default');
}

function openEditModal(id) {
  const c = costumes.find(c => c.id === id);
  if (!c) return;
  editingId = id;

  document.getElementById('edit-original-id').value = c.id;
  document.getElementById('edit-id').value           = c.id;
  document.getElementById('edit-name').value         = c.name;
  document.getElementById('edit-type').value         = c.type;
  document.getElementById('edit-hour').value         = c.priceHour || '';
  document.getElementById('edit-day').value          = c.priceDay  || '';
  document.getElementById('edit-sale').value         = c.priceSale || '';
  document.getElementById('edit-stock').value        = c.stock     || 0;
  document.getElementById('edit-notes').value        = c.notes     || '';

  document.getElementById('edit-modal').hidden = false;
}

function saveEdit(formData) {
  const idx = costumes.findIndex(c => c.id === editingId);
  if (idx === -1) return;

  // Si cambiaron el ID, verificar unicidad
  if (formData.id !== editingId && costumes.find(c => c.id === formData.id)) {
    showToast('⚠️ Ese ID ya lo usa otro disfraz.', 'warn');
    return;
  }

  costumes[idx] = { ...costumes[idx], ...formData };
  saveToStorage();
  renderTable(getFilteredList());
  closeEditModal();
  showToast('💾 Cambios guardados.', 'success');
}

function closeEditModal() {
  document.getElementById('edit-modal').hidden = true;
  editingId = null;
}

// ─── Filtros y búsqueda ───────────────────────────────────────────
function getFilteredList() {
  const search = document.getElementById('search-input').value.toLowerCase().trim();
  const type   = document.getElementById('filter-type').value;

  return costumes.filter(c => {
    const matchType   = type === 'all' || c.type === type;
    const matchSearch = !search || c.name.toLowerCase().includes(search) || c.id.toLowerCase().includes(search);
    return matchType && matchSearch;
  });
}

// ─── Formulario principal ─────────────────────────────────────────
document.getElementById('costume-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const idVal = document.getElementById('costume-id').value.trim();
  const name  = document.getElementById('costume-name').value.trim();

  if (!name) { showToast('⚠️ El nombre es obligatorio.', 'warn'); return; }

  const data = {
    id:         idVal || generateId(),
    name,
    type:       document.getElementById('costume-type').value,
    priceHour:  parseFloat(document.getElementById('price-hour').value) || 0,
    priceDay:   parseFloat(document.getElementById('price-day').value)  || 0,
    priceSale:  parseFloat(document.getElementById('price-sale').value) || 0,
    stock:      parseInt(document.getElementById('costume-stock').value) || 1,
    notes:      document.getElementById('costume-notes').value.trim(),
  };

  if (addCostume(data)) {
    this.reset();
    document.getElementById('costume-stock').value = 1;
  }
});

// Botón generar ID
document.getElementById('gen-id-btn').addEventListener('click', () => {
  document.getElementById('costume-id').value = generateId();
});

// Botón limpiar
document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('costume-form').reset();
  document.getElementById('costume-stock').value = 1;
});

// Búsqueda y filtro en tiempo real
document.getElementById('search-input').addEventListener('input', () => renderTable(getFilteredList()));
document.getElementById('filter-type').addEventListener('change', () => renderTable(getFilteredList()));

// Delegación de eventos en tabla
document.getElementById('inventory-body').addEventListener('click', (e) => {
  const editBtn   = e.target.closest('.btn-edit');
  const deleteBtn = e.target.closest('.btn-delete');
  if (editBtn)   openEditModal(editBtn.dataset.id);
  if (deleteBtn) deleteCostume(deleteBtn.dataset.id);
});

// Modal edición
document.getElementById('edit-form').addEventListener('submit', function(e) {
  e.preventDefault();
  saveEdit({
    id:         document.getElementById('edit-id').value.trim(),
    name:       document.getElementById('edit-name').value.trim(),
    type:       document.getElementById('edit-type').value,
    priceHour:  parseFloat(document.getElementById('edit-hour').value) || 0,
    priceDay:   parseFloat(document.getElementById('edit-day').value)  || 0,
    priceSale:  parseFloat(document.getElementById('edit-sale').value) || 0,
    stock:      parseInt(document.getElementById('edit-stock').value)  || 0,
    notes:      document.getElementById('edit-notes').value.trim(),
  });
});

document.getElementById('close-modal').addEventListener('click', closeEditModal);
document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
document.getElementById('edit-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeEditModal();
});

// ─── BOT ASISTENTE ────────────────────────────────────────────────

const botPanel  = document.getElementById('bot-panel');
const botToggle = document.getElementById('bot-toggle');
const botBadge  = document.getElementById('bot-badge');
const messagesEl = document.getElementById('bot-messages');

function toggleBot() {
  botPanel.classList.toggle('hidden');
  botBadge.classList.add('hidden');
  if (!botPanel.classList.contains('hidden')) {
    document.getElementById('bot-input').focus();
  }
}

botToggle.addEventListener('click', toggleBot);
document.getElementById('bot-close').addEventListener('click', () => botPanel.classList.add('hidden'));

// Iniciar panel oculto pero sin clase hidden al cargar (primer mensaje ya visible)
botPanel.classList.add('hidden');

function appendMessage(text, role = 'bot') {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = text;  // Permitimos HTML básico para formateo
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.id = 'typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

function botRespond(text) {
  return new Promise(resolve => {
    showTyping();
    setTimeout(() => {
      removeTyping();
      appendMessage(text, 'bot');
      resolve();
    }, 700 + Math.random() * 400);
  });
}

// ─── Base de conocimiento del Bot ────────────────────────────────

const priceGuide = {
  casero: {
    label: 'Casero / Artesanal',
    hour: [8000, 15000],
    day:  [25000, 50000],
    sale: [60000, 120000],
  },
  clasico: {
    label: 'Clásico de Halloween',
    hour: [12000, 20000],
    day:  [40000, 70000],
    sale: [100000, 200000],
  },
  complejo: {
    label: 'Complejo / Elaborado',
    hour: [20000, 40000],
    day:  [70000, 130000],
    sale: [200000, 450000],
  },
  lujo: {
    label: 'Lujo / Premium',
    hour: [40000, 80000],
    day:  [130000, 250000],
    sale: [400000, 900000],
  },
  infantil: {
    label: 'Infantil',
    hour: [8000, 15000],
    day:  [25000, 45000],
    sale: [70000, 150000],
  },
  pareja: {
    label: 'Pareja / Grupal',
    hour: [25000, 50000],
    day:  [80000, 160000],
    sale: [250000, 550000],
  },
};

function formatPriceCOP(n) {
  return '$' + n.toLocaleString('es-CO');
}

function getPriceResponse(type) {
  const g = priceGuide[type];
  if (!g) return null;
  return `
💰 <strong>Precios sugeridos para: ${g.label}</strong><br><br>
⏱️ <em>Por hora:</em> ${formatPriceCOP(g.hour[0])} – ${formatPriceCOP(g.hour[1])} COP<br>
🌙 <em>Por día:</em> ${formatPriceCOP(g.day[0])} – ${formatPriceCOP(g.day[1])} COP<br>
🏷️ <em>Venta total:</em> ${formatPriceCOP(g.sale[0])} – ${formatPriceCOP(g.sale[1])} COP<br><br>
<small>Rangos calculados para el mercado colombiano considerando costo de materiales, demanda de temporada y margen de ganancia justo.</small>
  `.trim();
}

function getInventoryStats() {
  if (costumes.length === 0) {
    return '📦 Tu inventario está <strong>vacío</strong>. ¡Registra tu primer disfraz usando el formulario de la izquierda!';
  }
  const types = {};
  let totalValue = 0;
  let zeroStock = 0;

  costumes.forEach(c => {
    types[c.type] = (types[c.type] || 0) + 1;
    totalValue += Number(c.priceSale) || 0;
    if (!Number(c.stock)) zeroStock++;
  });

  const typeList = Object.entries(types)
    .map(([t, n]) => `• ${typeLabels[t] || t}: ${n}`)
    .join('<br>');

  return `
📦 <strong>Resumen del inventario:</strong><br><br>
Total disfraces: <em>${costumes.length}</em><br>
Valor total (venta): <em>${formatPriceCOP(totalValue)} COP</em><br>
Sin stock: <em>${zeroStock}</em><br><br>
<strong>Por tipo:</strong><br>${typeList}
  `.trim();
}

function getSalesTips() {
  const tips = [
    '🕯️ En Halloween, el precio de alquiler puede incrementarse un 20–30% los días 29, 30 y 31 de octubre. ¡La demanda lo justifica!',
    '🎭 Los paquetes combinados (disfraz + accesorios) venden mejor que los items por separado. Considera crear bundles.',
    '📸 Una foto de buena calidad del disfraz puesto aumenta la confianza del comprador y reduce negociaciones de precio.',
    '💳 Ofrecer mitad de pago al reservar y el resto al recoger reduce los "no-shows" en temporada alta.',
    '🌐 Publica en grupos de WhatsApp y Facebook antes del 25 de octubre para capturar la demanda anticipada.',
    '🔄 Los disfraces de lujo casi nunca se venden; son más rentables como alquiler repetitivo. Guárdalos en inventario permanente.',
    '🧒 Los disfraces infantiles rotan rápido porque los niños los usan una sola vez. Son ideales para la venta.',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

function getGuide() {
  return `
📖 <strong>Guía rápida de uso:</strong><br><br>
1️⃣ <em>Registrar disfraz:</em> Usa el formulario izquierdo. El ID puede ser automático (⚡) o ingresado manualmente.<br><br>
2️⃣ <em>Precios:</em> Configura precio por hora, día y venta. Los campos vacíos muestran "—" en la tabla.<br><br>
3️⃣ <em>Editar/Eliminar:</em> Usa los botones ✏️ y 🗑️ en cada fila del inventario.<br><br>
4️⃣ <em>Buscar/Filtrar:</em> Usa la barra de búsqueda o el selector de tipo en el inventario.<br><br>
5️⃣ <em>Persistencia:</em> Todo se guarda automáticamente en el navegador (LocalStorage). No necesitas internet.
  `.trim();
}

// ─── Motor de respuestas del bot ──────────────────────────────────

function processUserInput(input) {
  const text = input.toLowerCase().trim();

  // Precios por tipo específico
  for (const [key, val] of Object.entries(priceGuide)) {
    if (text.includes(key) || text.includes(val.label.toLowerCase().split('/')[0].trim())) {
      return getPriceResponse(key);
    }
  }

  // Palabras clave: precios
  if (text.match(/precio|tarifa|cuanto|cobr|valor|costo|caro|barato|suger/)) {
    return `
🧙‍♂️ ¿Para qué tipo de disfraz quieres sugerencia de precios?<br><br>
Escribe uno de estos: <em>casero, clásico, complejo, lujo, infantil, pareja</em><br><br>
O haz clic en el botón <strong>💰 Sugerir precios</strong> de arriba.
    `.trim();
  }

  // Inventario
  if (text.match(/inventario|stock|cuantos|disfraces|registro|lista|total/)) {
    return getInventoryStats();
  }

  // Tips de venta
  if (text.match(/tip|consejo|vend|estrategia|promoc|negocio|ganancia|margen/)) {
    return getSalesTips();
  }

  // Guía de uso
  if (text.match(/como|cómo|usar|uso|guia|guía|ayuda|help|registr|agreg/)) {
    return getGuide();
  }

  // Saludos
  if (text.match(/^(hola|buenas|hey|hi|buenas noches|buen día|buenos días|qué hay|como estas)/)) {
    return '🧙‍♂️ ¡Saludos, invocador de disfraces! Soy el <strong>Maestro Oscuro</strong>, tu asistente de Halloween. Puedo ayudarte con:<br><br>• 💰 Sugerencias de precios en COP<br>• 📦 Estado de tu inventario<br>• 🎯 Estrategias de venta<br>• 📖 Cómo usar la aplicación';
  }

  // Moneda / COP
  if (text.match(/cop|pesos|colombiano|moneda|divisa/)) {
    return '💵 La aplicación está configurada en <strong>Pesos Colombianos (COP)</strong>. Todos los precios se muestran con formato <em>$X.XXX.XXX COP</em>. Puedes ingresar los valores sin puntos y el sistema los formatea automáticamente.';
  }

  // Halloween
  if (text.match(/halloween|calabaza|bruja|vampiro|zombie|terror|disfraz/)) {
    return '🎃 ¡Halloween es la temporada más rentable para tu negocio! Los días 29, 30 y 31 de octubre concentran el 80% de la demanda. Te recomiendo tener el inventario listo con al menos 2 semanas de anticipación y publicitar desde el 15 de octubre.';
  }

  // Default
  return `🧙‍♂️ No estoy seguro de entender esa consulta. Prueba preguntando:<br><br>
• "¿Qué precio cobro por un disfraz de lujo?"<br>
• "¿Cuántos disfraces tengo en inventario?"<br>
• "Dame un consejo de ventas"<br>
• "¿Cómo registro un disfraz?"`;
}

// ─── Eventos del Bot ─────────────────────────────────────────────

async function handleBotSend() {
  const input = document.getElementById('bot-input');
  const text  = input.value.trim();
  if (!text) return;

  appendMessage(escapeHtml(text), 'user');
  input.value = '';

  const response = processUserInput(text);
  await botRespond(response);
}

document.getElementById('bot-send').addEventListener('click', handleBotSend);

document.getElementById('bot-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleBotSend();
});

// Quick action buttons
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const action = btn.dataset.action;
    let userMsg, response;

    switch (action) {
      case 'guide':
        userMsg  = '📖 Guía rápida';
        response = getGuide();
        break;
      case 'prices':
        userMsg  = '💰 Sugerir precios';
        response = '¿Para qué tipo de disfraz necesitas sugerencia?<br><br>Escribe: <em>casero, clásico, complejo, lujo, infantil</em> o <em>pareja</em>.';
        break;
      case 'inventory':
        userMsg  = '📦 Ver inventario';
        response = getInventoryStats();
        break;
      case 'tips':
        userMsg  = '🎯 Tips de venta';
        response = getSalesTips();
        break;
    }

    appendMessage(userMsg, 'user');
    await botRespond(response);
  });
});

// ─── Partículas decorativas ───────────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  const emojis = ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀', '🌙', '⚰️', '🔮', '🧿'];
  const count   = 18;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.left     = Math.random() * 100 + 'vw';
    p.style.animationDuration  = (12 + Math.random() * 20) + 's';
    p.style.animationDelay     = (Math.random() * 20) + 's';
    p.style.fontSize = (14 + Math.random() * 16) + 'px';
    container.appendChild(p);
  }
}

// ─── Mensaje de bienvenida del bot ────────────────────────────────
function sendWelcomeMessage() {
  setTimeout(() => {
    appendMessage(
      '🧙‍♂️ ¡Bienvenido a <strong>Halloween Costumes Manager</strong>! Soy el <strong>Maestro Oscuro</strong>, tu asistente personal.<br><br>Puedo ayudarte a:<br>• 💰 Sugerir precios justos en COP<br>• 📦 Consultar tu inventario<br>• 🎯 Darte tips de venta<br>• 📖 Explicarte cómo usar la app<br><br>¡Pregúntame lo que necesites! 🎃',
      'bot'
    );
  }, 500);
}

// ─── Inicialización ───────────────────────────────────────────────
function init() {
  loadFromStorage();
  renderTable();
  createParticles();
  sendWelcomeMessage();

  // Mostrar badge con notificación de bienvenida
  botBadge.classList.remove('hidden');
}

init();
