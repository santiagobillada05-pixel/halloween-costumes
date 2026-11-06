import { useEffect, useState } from 'react';
import { transactionsApi } from '../services/api';

function StatCard({ icon, label, value, color = 'orange' }) {
  const glow = color === 'orange' ? 'shadow-orange-sm border-orange/30' : 'shadow-purple border-purple-light/30';
  return (
    <div className={`flex items-center gap-3 bg-card2 border ${glow} rounded-xl px-4 py-3 min-w-[150px]`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
        <p className={`font-bold text-lg ${color === 'orange' ? 'text-orange' : 'text-purple-light'}`}>{value}</p>
      </div>
    </div>
  );
}

function cop(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
}

export default function StatsBar({ refresh }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    transactionsApi.getStats()
      .then(r => setStats(r.data))
      .catch(() => {});
  }, [refresh]);

  if (!stats) return null;

  const { inventory, revenue, transactions } = stats;

  return (
    <div className="flex flex-wrap gap-3 py-4 px-4 overflow-x-auto">
      <StatCard icon="👻" label="Total Disfraces"  value={inventory.total}      />
      <StatCard icon="✅" label="Disponibles"      value={inventory.available}   />
      <StatCard icon="🔄" label="Alquilados"       value={inventory.rented}      color="purple" />
      <StatCard icon="🏷️" label="Vendidos"         value={inventory.sold}        />
      <StatCard icon="💰" label="Ingresos Totales" value={cop(revenue.total) + ' COP'} color="purple" />
      <StatCard icon="📋" label="Transacciones"    value={transactions.total}    />
    </div>
  );
}
