import { costumesApi } from '../services/api';
import toast from 'react-hot-toast';

function cop(n) {
  const num = Number(n);
  if (!num) return <span className="text-gray-600 italic text-xs">—</span>;
  return <span className="text-neon-green font-semibold">${num.toLocaleString('es-CO')}</span>;
}

const CATEGORY_STYLES = {
  clasico:  'bg-orange/15  text-orange-light  border-orange/30',
  casero:   'bg-green-900/30 text-green-400  border-green-700/40',
  complejo: 'bg-sky-900/30  text-sky-400     border-sky-700/40',
  lujo:     'bg-pink-900/30 text-pink-400    border-pink-700/40',
  infantil: 'bg-amber-900/30 text-amber-400  border-amber-700/40',
  pareja:   'bg-purple/20   text-purple-light border-purple/40',
};

const STATUS_STYLES = {
  disponible: 'bg-green-900/30 text-green-400  border-green-700/40',
  alquilado:  'bg-amber-900/30 text-amber-400  border-amber-700/40',
  vendido:    'bg-red-900/30   text-red-400    border-red-700/40',
};

const CATEGORY_LABELS = {
  clasico: 'Clásico', casero: 'Casero', complejo: 'Complejo',
  lujo: 'Lujo', infantil: 'Infantil', pareja: 'Pareja',
};

export default function CostumeTable({ costumes, onEdit, onRefresh }) {

  const handleDelete = async (costume) => {
    if (!window.confirm(`¿Eliminar "${costume.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await costumesApi.delete(costume.id);
      toast.success('🗑️ Disfraz eliminado');
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (costumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
        <span className="text-5xl">🎃</span>
        <p className="text-base">No hay disfraces registrados.</p>
        <p className="text-sm">¡Agrega el primero con el formulario!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-orange/10 to-purple/10 border-b border-orange/20">
            {['ID', 'Nombre', 'Categoría', 'Estado', 'Hora', 'Día', 'Venta', 'Stock', 'Acciones'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-orange whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {costumes.map(c => {
            const stock = Number(c.stock) || 0;
            const stockColor = stock === 0 ? 'text-red-400' : stock <= 2 ? 'text-amber-400' : 'text-green-400';

            return (
              <tr key={c.id} className="border-b border-orange/5 hover:bg-orange/5 transition-colors group">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-purple/15 text-purple-light border border-purple/25 px-2 py-0.5 rounded">{c.custom_id}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {c.image_url && (
                      <img src={c.image_url} alt={c.name} className="w-8 h-8 rounded object-cover border border-orange/20 flex-shrink-0" onError={e => e.target.style.display='none'} />
                    )}
                    <div>
                      <p className="font-semibold text-gray-100">{c.name}</p>
                      {c.notes && <p className="text-xs text-gray-600 truncate max-w-[160px]">{c.notes}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[c.category] || ''}`}>
                    {CATEGORY_LABELS[c.category] || c.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status] || ''}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{cop(c.price_per_hour)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{cop(c.price_per_day)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{cop(c.sale_price)}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${stockColor}`}>{stock}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(c)}
                      className="w-8 h-8 flex items-center justify-center rounded bg-sky-900/30 border border-sky-700/40 text-sky-400 hover:bg-sky-800/50 transition text-xs"
                      title="Editar">✏️</button>
                    <button onClick={() => handleDelete(c)}
                      className="w-8 h-8 flex items-center justify-center rounded bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-800/50 transition text-xs"
                      title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
