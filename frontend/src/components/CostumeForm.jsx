import { useState, useEffect } from 'react';
import { costumesApi } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'clasico',  label: 'Clásico de Halloween' },
  { value: 'casero',   label: 'Casero / Artesanal'   },
  { value: 'complejo', label: 'Complejo / Elaborado'  },
  { value: 'lujo',     label: 'Lujo / Premium'        },
  { value: 'infantil', label: 'Infantil'              },
  { value: 'pareja',   label: 'Pareja / Grupal'       },
];

const STATUSES = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'alquilado',  label: 'Alquilado'  },
  { value: 'vendido',    label: 'Vendido'     },
];

const EMPTY = {
  custom_id: '', name: '', category: 'clasico',
  price_per_hour: '', price_per_day: '', sale_price: '',
  status: 'disponible', stock: 1, image_url: '', notes: '',
};

function genId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let id = 'DSF-';
  for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}{required && <span className="text-orange ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'bg-dark border border-orange/20 rounded-md px-3 py-2 text-sm text-gray-100 outline-none focus:border-orange focus:ring-1 focus:ring-orange/30 transition w-full placeholder:text-gray-600';
const selectCls = inputCls + ' cursor-pointer';

export default function CostumeForm({ editing, onSuccess, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        custom_id:      editing.custom_id      || '',
        name:           editing.name           || '',
        category:       editing.category       || 'clasico',
        price_per_hour: editing.price_per_hour || '',
        price_per_day:  editing.price_per_day  || '',
        sale_price:     editing.sale_price     || '',
        status:         editing.status         || 'disponible',
        stock:          editing.stock          ?? 1,
        image_url:      editing.image_url      || '',
        notes:          editing.notes          || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [editing]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('El nombre es obligatorio');

    const payload = {
      ...form,
      custom_id:      form.custom_id.trim() || genId(),
      price_per_hour: Number(form.price_per_hour) || 0,
      price_per_day:  Number(form.price_per_day)  || 0,
      sale_price:     Number(form.sale_price)     || 0,
      stock:          Number(form.stock)          || 1,
    };

    setLoading(true);
    try {
      if (editing) {
        await costumesApi.update(editing.id, payload);
        toast.success('💾 Disfraz actualizado');
      } else {
        await costumesApi.create(payload);
        toast.success('🎃 Disfraz registrado');
        setForm(EMPTY);
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      {/* ID + nombre */}
      <Field label="ID del Disfraz">
        <div className="flex gap-2">
          <input className={inputCls} value={form.custom_id} onChange={set('custom_id')} placeholder="DSF-001 (o auto)" maxLength={20} />
          <button type="button" onClick={() => setForm(f => ({ ...f, custom_id: genId() }))}
            className="px-3 rounded-md bg-purple/20 border border-purple-light/40 text-purple-light hover:bg-purple/40 transition text-sm whitespace-nowrap">
            ⚡ Auto
          </button>
        </div>
      </Field>

      <Field label="Nombre" required>
        <input className={inputCls} value={form.name} onChange={set('name')} placeholder="Ej: Vampiro Élite" required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <select className={selectCls} value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className={selectCls} value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
      </div>

      {/* Precios */}
      <div className="bg-orange/5 border border-orange/15 rounded-xl p-4 flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-orange-light">💲 Precios COP</h3>
        {[
          { field: 'price_per_hour', label: 'Alquiler / Hora', ph: '15.000' },
          { field: 'price_per_day',  label: 'Alquiler / Día',  ph: '50.000' },
          { field: 'sale_price',     label: 'Precio de Venta', ph: '150.000' },
        ].map(({ field, label, ph }) => (
          <Field key={field} label={label}>
            <div className="flex items-center bg-dark border border-orange/20 rounded-md overflow-hidden focus-within:border-orange transition">
              <span className="px-3 py-2 bg-orange/10 text-orange font-bold text-sm border-r border-orange/20">$</span>
              <input type="number" min="0" step="500" className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-600"
                value={form[field]} onChange={set(field)} placeholder={ph} />
              <span className="px-2 text-xs text-gray-600">COP</span>
            </div>
          </Field>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Stock">
          <input type="number" min="0" className={inputCls} value={form.stock} onChange={set('stock')} />
        </Field>
        <Field label="URL Imagen">
          <input className={inputCls} value={form.image_url} onChange={set('image_url')} placeholder="https://..." />
        </Field>
      </div>

      <Field label="Notas">
        <textarea className={inputCls + ' resize-y min-h-[64px]'} value={form.notes} onChange={set('notes')} placeholder="Estado, talla, detalles..." />
      </Field>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-dark to-orange text-white font-bold py-2.5 rounded-md uppercase tracking-wide text-sm hover:shadow-orange transition disabled:opacity-60">
          {loading ? '⏳ Guardando...' : editing ? '💾 Guardar Cambios' : '🕸️ Agregar Disfraz'}
        </button>
        {editing && (
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 rounded-md border border-gray-700 text-gray-400 text-sm hover:border-gray-500 hover:text-gray-200 transition">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
