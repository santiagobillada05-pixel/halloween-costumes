import { useState } from 'react';
import { transactionsApi } from '../services/api';
import toast from 'react-hot-toast';

const inputCls = 'bg-dark border border-orange/20 rounded-md px-3 py-2 text-sm text-gray-100 outline-none focus:border-orange focus:ring-1 focus:ring-orange/30 transition w-full placeholder:text-gray-600';

export default function TransactionModal({ costume, onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: 'alquiler', rental_days: 1, rental_hours: '',
    start_date: '', end_date: '', notes: '',
    client_name: '', client_phone: '', client_email: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const calcTotal = () => {
    if (form.type === 'venta') return Number(costume.sale_price) || 0;
    if (form.rental_days) return (Number(form.rental_days) * Number(costume.price_per_day)) || 0;
    if (form.rental_hours) return (Number(form.rental_hours) * Number(costume.price_per_hour)) || 0;
    return 0;
  };

  const total = calcTotal();
  const cop = (n) => '$' + Math.round(n).toLocaleString('es-CO') + ' COP';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await transactionsApi.create({
        costume_id: costume.id,
        type: form.type,
        rental_hours: form.rental_hours ? Number(form.rental_hours) : null,
        rental_days:  form.rental_days  ? Number(form.rental_days)  : null,
        total_cop: total,
        start_date: form.start_date || null,
        end_date:   form.end_date   || null,
        notes:      form.notes      || null,
        client_name:  form.client_name  || null,
        client_phone: form.client_phone || null,
        client_email: form.client_email || null,
      });
      toast.success('✅ Transacción registrada');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-orange/25 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-orange">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange/20 bg-card2 rounded-t-2xl">
          <h3 className="text-orange font-bold">💳 Nueva Transacción</h3>
          <p className="text-sm text-gray-400 font-mono">{costume.name}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-orange transition text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Tipo */}
          <div className="flex gap-2">
            {['alquiler', 'venta'].map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg border font-bold text-sm capitalize transition ${form.type === t ? 'bg-orange/20 border-orange text-orange' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                {t === 'alquiler' ? '🔄 Alquiler' : '🏷️ Venta'}
              </button>
            ))}
          </div>

          {/* Duración alquiler */}
          {form.type === 'alquiler' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Días</label>
                <input type="number" min="0" className={inputCls} value={form.rental_days} onChange={set('rental_days')} placeholder="1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Horas</label>
                <input type="number" min="0" className={inputCls} value={form.rental_hours} onChange={set('rental_hours')} placeholder="0" />
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            {[['start_date','Fecha inicio'],['end_date','Fecha fin']].map(([field,label]) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</label>
                <input type="date" className={inputCls} value={form[field]} onChange={set(field)} />
              </div>
            ))}
          </div>

          {/* Cliente */}
          <div className="bg-purple/5 border border-purple/20 rounded-xl p-3 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-purple-light uppercase tracking-wide">👤 Datos del Cliente (opcional)</h4>
            <input className={inputCls} value={form.client_name}  onChange={set('client_name')}  placeholder="Nombre" />
            <input className={inputCls} value={form.client_phone} onChange={set('client_phone')} placeholder="Teléfono" />
            <input className={inputCls} value={form.client_email} onChange={set('client_email')} placeholder="Email" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Notas</label>
            <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={set('notes')} placeholder="Observaciones..." />
          </div>

          {/* Total calculado */}
          <div className="bg-orange/10 border border-orange/25 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total calculado</p>
            <p className="text-2xl font-bold text-orange">{cop(total)}</p>
          </div>

          <button type="submit" disabled={loading || total === 0}
            className="w-full bg-gradient-to-r from-orange-dark to-orange text-white font-bold py-3 rounded-lg uppercase tracking-wide hover:shadow-orange transition disabled:opacity-60">
            {loading ? '⏳ Guardando...' : '✅ Confirmar Transacción'}
          </button>
        </form>
      </div>
    </div>
  );
}
