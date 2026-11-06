import { useState, useRef, useEffect } from 'react';
import { botApi } from '../services/api';

const QUICK_ACTIONS = [
  { label: '📖 Guía',           msg: 'Cómo usar la plataforma' },
  { label: '💰 Precios',        msg: 'Sugerencias de precios' },
  { label: '📦 Inventario',     msg: 'Resumen de inventario' },
  { label: '🏆 Top disfraces',  msg: 'Top disfraces más rentables' },
  { label: '🎯 Tips de venta',  msg: 'Consejo de ventas' },
];

function MarkdownText({ text }) {
  // Parser mínimo: **bold**, _italic_, \n → <br>, listas
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-light">$1</strong>')
    .replace(/_(.*?)_/g, '<em class="text-purple-light not-italic font-semibold">$1</em>')
    .replace(/\n/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function BotChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '🧙‍♂️ ¡Bienvenido! Soy el **Maestro Oscuro**, tu asistente de Halloween. Pregúntame sobre inventario, precios, estadísticas o estrategias de venta.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [badge, setBadge] = useState(true);
  const messagesEnd = useRef(null);

  useEffect(() => {
    if (open) messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    setInput('');
    setBadge(false);
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await botApi.chat(msg);
      setMessages(m => [...m, { role: 'bot', text: res.response }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: '⚠️ No pude conectar con el servidor. ¿Está corriendo el backend?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel */}
      {open && (
        <div className="w-80 sm:w-96 bg-card border border-purple/30 rounded-2xl shadow-purple flex flex-col max-h-[520px] overflow-hidden animate-[panel-open_0.3s_ease]">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-dark to-card2 border-b border-purple/20 rounded-t-2xl">
            <span className="text-2xl animate-float">🧙‍♂️</span>
            <div className="flex-1">
              <p className="font-gothic text-sm text-purple-light">Maestro Oscuro</p>
              <p className="text-xs text-neon-green">● En línea · BD conectada</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-orange transition">✕</button>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-1.5 p-2 border-b border-purple/10 bg-purple/5">
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => sendMessage(a.msg)}
                className="text-xs px-2 py-1 rounded-md bg-purple/15 border border-purple/25 text-purple-light hover:bg-purple/30 transition font-semibold">
                {a.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[90%] px-3 py-2 rounded-xl text-sm leading-relaxed
                ${m.role === 'bot'
                  ? 'self-start bg-purple/20 border border-purple/25 text-gray-200 rounded-bl-sm'
                  : 'self-end bg-orange/20 border border-orange/25 text-gray-200 rounded-br-sm'}`}>
                <MarkdownText text={m.text} />
              </div>
            ))}
            {loading && (
              <div className="self-start flex gap-1 px-3 py-2 bg-purple/20 border border-purple/25 rounded-xl">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 bg-purple-light rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-2 border-t border-purple/15 bg-card2 rounded-b-2xl">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe tu consulta..."
              className="flex-1 bg-dark border border-purple/25 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-purple-light transition placeholder:text-gray-600"
            />
            <button onClick={() => sendMessage()}
              className="w-9 h-9 flex items-center justify-center bg-purple/30 border border-purple-light/40 rounded-lg text-purple-light hover:bg-purple/60 transition">
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => { setOpen(o => !o); setBadge(false); }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-dark to-purple border-2 border-purple-light text-2xl flex items-center justify-center shadow-purple hover:scale-110 transition-transform animate-float relative">
        {open ? '✕' : '🧙'}
        {badge && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange border-2 border-void rounded-full text-xs flex items-center justify-center text-white font-bold animate-bounce">1</span>
        )}
      </button>
    </div>
  );
}
