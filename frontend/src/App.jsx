import { useState, useEffect, useCallback } from 'react';
import { costumesApi } from './services/api';
import StatsBar         from './components/StatsBar';
import CostumeForm      from './components/CostumeForm';
import CostumeTable     from './components/CostumeTable';
import TransactionModal from './components/TransactionModal';
import BotChat          from './components/BotChat';
import toast            from 'react-hot-toast';

const CATEGORIES = ['all','clasico','casero','complejo','lujo','infantil','pareja'];
const STATUSES   = ['all','disponible','alquilado','vendido'];

export default function App() {
  const [costumes,     setCostumes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState(null);
  const [txCostume,    setTxCostume]    = useState(null);
  const [statsRefresh, setStatsRefresh] = useState(0);

  // Filtros
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [status,   setStatus]   = useState('all');

  const loadCostumes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)              params.search   = search;
      if (category !== 'all')  params.category = category;
      if (status   !== 'all')  params.status   = status;

      const res = await costumesApi.getAll(params);
      setCostumes(res.data);
    } catch (err) {
      toast.error('Error al cargar disfraces: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    const timer = setTimeout(loadCostumes, 300); // debounce búsqueda
    return () => clearTimeout(timer);
  }, [loadCostumes]);

  const onSuccess = () => {
    setEditing(null);
    loadCostumes();
    setStatsRefresh(n => n + 1);
  };

  const inputCls = 'bg-card border border-orange/20 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-orange transition placeholder:text-gray-600 w-full';
  const selectCls = inputCls + ' cursor-pointer';

  return (
    <div className="min-h-screen bg-void font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-void/95 border-b border-orange/15 backdrop-blur-md shadow-[0_2px_30px_rgba(255,117,24,0.1)]">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-glow-pulse">🎃</span>
            <div>
              <h1 className="font-gothic text-base sm:text-xl bg-gradient-to-r from-orange to-purple-light bg-clip-text text-transparent leading-none">
                Halloween Costumes
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[3px]">Manager</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
            API conectada
          </div>
        </div>
      </header>

      {/* Stats */}
      <StatsBar refresh={statsRefresh} />

      {/* Main layout */}
      <main className="max-w-screen-xl mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">

        {/* Form panel */}
        <section className="bg-card border border-orange/15 rounded-2xl h-fit shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="px-5 py-4 bg-card2 border-b border-orange/15">
            <h2 className="font-gothic text-sm text-orange flex items-center gap-2" style={{ textShadow: '0 0 10px rgba(255,117,24,0.4)' }}>
              <span>🦇</span>
              {editing ? 'Editar Disfraz' : 'Registrar Disfraz'}
            </h2>
          </div>
          <CostumeForm editing={editing} onSuccess={onSuccess} onCancel={() => setEditing(null)} />
        </section>

        {/* Inventory panel */}
        <section className="bg-card border border-orange/15 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-card2 border-b border-orange/15 flex flex-wrap items-center gap-3">
            <h2 className="font-gothic text-sm text-orange flex items-center gap-2 mr-auto" style={{ textShadow: '0 0 10px rgba(255,117,24,0.4)' }}>
              <span>💀</span> Inventario
            </h2>

            {/* Controles de filtro */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Buscar..."
              className="bg-dark border border-orange/20 rounded-lg px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-orange transition placeholder:text-gray-600 w-44"
            />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="bg-dark border border-orange/20 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-orange transition cursor-pointer">
              {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'Todas las cat.' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="bg-dark border border-orange/20 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-orange transition cursor-pointer">
              {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'Todos los estados' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>

            {/* Botón nueva transacción rápida */}
            <button
              onClick={() => costumes.length > 0 && setTxCostume(costumes[0])}
              className="px-3 py-1.5 bg-purple/20 border border-purple/40 rounded-lg text-purple-light text-xs font-bold hover:bg-purple/40 transition whitespace-nowrap">
              + Transacción
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-600">
              <span className="text-2xl animate-spin">🎃</span> Cargando inventario...
            </div>
          ) : (
            <CostumeTable
              costumes={costumes}
              onEdit={c => { setEditing(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onRefresh={onSuccess}
            />
          )}
        </section>

      </main>

      {/* Transaction Modal */}
      {txCostume && (
        <TransactionModal
          costume={txCostume}
          onClose={() => setTxCostume(null)}
          onSuccess={onSuccess}
        />
      )}

      {/* Bot flotante */}
      <BotChat />
    </div>
  );
}
