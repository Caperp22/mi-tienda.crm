import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { DollarSign, TrendingUp, ShoppingBag, Award, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Ventas({ empresaId, dark = false, color = '#3b82f6' }) {
  const [pedidos,  setPedidos]  = useState([]);
  const [cargando, setCargando] = useState(true);

  const t = {
    card:   dark ? 'rgba(255,255,255,0.04)' : 'white',
    border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    text:   dark ? '#f0f4ff'                : '#0f172a',
    sub:    dark ? '#94a3b8'                : '#64748b',
    grid:   dark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
    tooltip:dark ? '#0d1526'                : 'white',
  };

  useEffect(() => {
    async function cargar() {
      const query = supabase.from('pedidos').select('*').eq('estado', 'Entregado');
      if (empresaId) query.eq('empresa_id', empresaId);
      const { data } = await query;
      setPedidos(data || []);
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  if (cargando) return <p style={{ color: t.sub }}>Calculando métricas...</p>;

  /* ─── Cálculos ──────────────────────────────────────────── */
  const ingresos      = pedidos.reduce((s, p) => s + Number(p.total), 0);
  const totalVentas   = pedidos.length;
  const ticketProm    = totalVentas > 0 ? Math.round(ingresos / totalVentas) : 0;

  const conteo = {};
  pedidos.forEach(p => (p.productos || []).forEach(pr => {
    conteo[pr.nombre] = (conteo[pr.nombre] || 0) + pr.cantidad;
  }));
  const estrella = Object.keys(conteo).length > 0
    ? Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b)
    : '—';

  const porFecha = {};
  pedidos.forEach(p => {
    const k = new Date(p.created_at).toISOString().split('T')[0];
    porFecha[k] = (porFecha[k] || 0) + Number(p.total);
  });
  const grafica = Object.keys(porFecha).sort().slice(-14).map(k => ({
    fecha: new Date(k + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    ventas: porFecha[k],
  }));

  const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const kpis = [
    { label: 'Ingresos totales', value: fmt(ingresos),      icon: DollarSign, accent: '#10b981' },
    { label: 'Ventas cerradas',  value: totalVentas,         icon: ShoppingBag, accent: color },
    { label: 'Ticket promedio',  value: fmt(ticketProm),     icon: TrendingUp,  accent: '#8b5cf6' },
    { label: 'Producto estrella',value: estrella,            icon: Award,       accent: '#f59e0b' },
  ];

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text }}>Ventas</h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Resumen financiero de pedidos completados.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        {kpis.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '18px 20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${kpi.accent}18`, color: kpi.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KpiIcon size={19} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: '800', color: t.text, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kpi.value}</p>
                <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfica */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '22px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: t.text }}>Tendencia de ingresos (últimos 14 días)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: `${color}18`, color, borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: '700' }}>
            <ArrowUpRight size={13} /> {fmt(ingresos)}
          </div>
        </div>
        {grafica.length === 0 ? (
          <p style={{ color: t.sub, textAlign: 'center', padding: '40px 0' }}>No hay datos suficientes para la gráfica.</p>
        ) : (
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafica} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.grid} />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: t.sub, fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: t.sub, fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} dx={-5} />
                <Tooltip
                  cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${t.border}`, background: t.tooltip, color: t.text, fontSize: '13px' }}
                  formatter={v => [fmt(v), 'Ingresos']}
                />
                <Bar dataKey="ventas" fill={color} radius={[5, 5, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ventas;
