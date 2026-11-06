'use strict';
const express = require('express');
const db      = require('../db/connection');

const router = express.Router();

// ─── Tablas de precios sugeridos por categoría ────────────────
const PRICE_GUIDE = {
  casero:   { label: 'Casero / Artesanal',   hour: [8000, 15000],   day: [25000, 50000],   sale: [60000, 120000]  },
  clasico:  { label: 'Clásico de Halloween', hour: [12000, 20000],  day: [40000, 70000],   sale: [100000, 200000] },
  complejo: { label: 'Complejo / Elaborado', hour: [20000, 40000],  day: [70000, 130000],  sale: [200000, 450000] },
  lujo:     { label: 'Lujo / Premium',       hour: [40000, 80000],  day: [130000, 250000], sale: [400000, 900000] },
  infantil: { label: 'Infantil',             hour: [8000, 15000],   day: [25000, 45000],   sale: [70000, 150000]  },
  pareja:   { label: 'Pareja / Grupal',      hour: [25000, 50000],  day: [80000, 160000],  sale: [250000, 550000] },
};

function cop(n) {
  return '$' + Number(n).toLocaleString('es-CO') + ' COP';
}

// ─── Acciones contextuales ────────────────────────────────────

function getInventorySummary() {
  const total     = db.prepare('SELECT COUNT(*) as n FROM costumes').get().n;
  const available = db.prepare("SELECT COUNT(*) as n FROM costumes WHERE status = 'disponible'").get().n;
  const rented    = db.prepare("SELECT COUNT(*) as n FROM costumes WHERE status = 'alquilado'").get().n;
  const sold      = db.prepare("SELECT COUNT(*) as n FROM costumes WHERE status = 'vendido'").get().n;
  const lowStock  = db.prepare("SELECT COUNT(*) as n FROM costumes WHERE stock <= 1 AND status != 'vendido'").get().n;
  const revenue   = db.prepare('SELECT COALESCE(SUM(total_cop),0) as total FROM transactions').get().total;

  return {
    type: 'inventory',
    message: `📦 **Resumen del inventario:**\n\n` +
      `• Total disfraces: **${total}**\n` +
      `• Disponibles: **${available}**\n` +
      `• Alquilados ahora: **${rented}**\n` +
      `• Vendidos: **${sold}**\n` +
      `• Stock bajo (≤1 unidad): **${lowStock}**\n` +
      `• Ingresos totales: **${cop(revenue)}**`,
  };
}

function getPriceSuggestion(category) {
  const g = PRICE_GUIDE[category];
  if (!g) return null;

  // Obtener promedio del mercado real en BD para la misma categoría
  const market = db.prepare(`
    SELECT AVG(price_per_hour) as avg_hour, AVG(price_per_day) as avg_day, AVG(sale_price) as avg_sale
    FROM costumes WHERE category = ? AND status != 'vendido'
  `).get(category);

  let marketInfo = '';
  if (market && market.avg_hour > 0) {
    marketInfo = `\n\n📊 **Promedio actual en tu tienda:**\n` +
      `Hora: ${cop(Math.round(market.avg_hour))} | Día: ${cop(Math.round(market.avg_day))} | Venta: ${cop(Math.round(market.avg_sale))}`;
  }

  return {
    type: 'prices',
    message: `💰 **Precios sugeridos — ${g.label}**\n\n` +
      `⏱️ Alquiler/hora: **${cop(g.hour[0])} – ${cop(g.hour[1])}**\n` +
      `🌙 Alquiler/día: **${cop(g.day[0])} – ${cop(g.day[1])}**\n` +
      `🏷️ Venta total: **${cop(g.sale[0])} – ${cop(g.sale[1])}**\n\n` +
      `_Rangos calculados para el mercado colombiano con margen de ganancia del 40–60%._` +
      marketInfo,
  };
}

function getTopCostumes() {
  const rows = db.prepare(`
    SELECT c.name, c.category, c.custom_id, COUNT(t.id) as tx_count, COALESCE(SUM(t.total_cop),0) as revenue
    FROM costumes c
    LEFT JOIN transactions t ON t.costume_id = c.id
    GROUP BY c.id
    ORDER BY revenue DESC
    LIMIT 5
  `).all();

  if (rows.length === 0) {
    return { type: 'top', message: '📈 Aún no hay transacciones registradas para calcular rankings.' };
  }

  const lines = rows.map((r, i) =>
    `${i + 1}. **${r.name}** (${r.custom_id}) → ${r.tx_count} transacciones · ${cop(r.revenue)}`
  ).join('\n');

  return { type: 'top', message: `🏆 **Top disfraces por ingresos:**\n\n${lines}` };
}

function getSalesTips() {
  const tips = [
    '🎃 Incrementa precios de alquiler 20–30% los días 29, 30 y 31 de octubre. La demanda lo soporta.',
    '📸 Una foto de calidad aumenta conversiones. Usa fondo oscuro y buena iluminación.',
    '💳 Cobra el 50% al reservar para evitar cancelaciones de último minuto.',
    '🔄 Los disfraces de lujo generan mejor ROI en alquiler repetitivo que en venta única.',
    '🧒 Los disfraces infantiles son ideales para venta porque los niños los usan una sola vez.',
    '📦 Ofrece paquetes (disfraz + maquillaje + accesorios) a precio especial para aumentar ticket promedio.',
    '🌐 Publica en grupos locales de Facebook y WhatsApp desde el 15 de octubre.',
    '⏰ El pico de demanda es entre el 25 y 31 de octubre. Ten inventario listo con anticipación.',
  ];
  return { type: 'tip', message: tips[Math.floor(Math.random() * tips.length)] };
}

// ─── Motor de NLU por reglas ──────────────────────────────────

function processMessage(input) {
  const text = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Inventario
  if (/inventario|stock|cuantos|disponible|alquilado|vendido|cuanto tengo|resumen/.test(text)) {
    return getInventorySummary();
  }

  // Precios por categoría
  for (const [key] of Object.entries(PRICE_GUIDE)) {
    if (text.includes(key)) return getPriceSuggestion(key);
  }

  // Precios genérico
  if (/precio|tarifa|cuanto cobr|valor|costo|cobrar|suger/.test(text)) {
    return {
      type: 'prompt',
      message: `🧙‍♂️ ¿Para qué tipo de disfraz quieres sugerencia de precios?\n\n` +
        Object.entries(PRICE_GUIDE).map(([k, v]) => `• **${k}** → ${v.label}`).join('\n'),
    };
  }

  // Ranking / top
  if (/top|mejor|mas vendido|popular|ranking|ingreso/.test(text)) {
    return getTopCostumes();
  }

  // Tips de venta
  if (/tip|consejo|estrategia|vend|promoc|ganancia|negocio|como vendo/.test(text)) {
    return getSalesTips();
  }

  // Guía de uso
  if (/como|guia|usar|uso|ayuda|help|registr|agreg|nueva/.test(text)) {
    return {
      type: 'guide',
      message: `📖 **Guía rápida de uso:**\n\n` +
        `1️⃣ **Registrar disfraz:** Botón "+ Nuevo Disfraz", completa el formulario y guarda.\n` +
        `2️⃣ **Editar/Eliminar:** Usa los botones ✏️ y 🗑️ en cada fila del inventario.\n` +
        `3️⃣ **Registrar venta/alquiler:** En el detalle de un disfraz, clic en "Nueva Transacción".\n` +
        `4️⃣ **Buscar:** Usa la barra de búsqueda o filtra por categoría/estado.\n` +
        `5️⃣ **Estadísticas:** El Dashboard muestra ingresos, stock y transacciones recientes.`,
    };
  }

  // Saludos
  if (/^(hola|hey|buenas|buenos|que hay|hi\b)/.test(text)) {
    return {
      type: 'greeting',
      message: `🧙‍♂️ ¡Saludos! Soy el **Maestro Oscuro**, tu asistente de Halloween.\n\n` +
        `Puedo ayudarte con:\n` +
        `• 📦 Inventario y stock en tiempo real\n` +
        `• 💰 Sugerencias de precios en COP\n` +
        `• 🏆 Rankings de disfraces más rentables\n` +
        `• 🎯 Estrategias de venta\n` +
        `• 📖 Guía de uso de la plataforma`,
    };
  }

  // Default
  return {
    type: 'default',
    message: `🎃 No entendí bien tu consulta. Puedes preguntarme:\n\n` +
      `• _"¿Qué precio cobro por un disfraz de lujo?"_\n` +
      `• _"¿Cuántos disfraces tengo disponibles?"_\n` +
      `• _"¿Cuál es mi disfraz más rentable?"_\n` +
      `• _"Dame un consejo de ventas"_`,
  };
}

// ─── POST /api/bot/chat ───────────────────────────────────────
router.post('/chat', (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Mensaje vacío o inválido' });
    }

    const trimmed  = message.trim().substring(0, 500); // limitar longitud
    const response = processMessage(trimmed);

    res.json({
      success:  true,
      query:    trimmed,
      response: response.message,
      type:     response.type,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
