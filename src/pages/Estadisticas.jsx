import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingBag, Star } from 'lucide-react';

function Estadisticas({ empresaId, dark = false, color = '#3b82f6' }) {
  const [pedidos,  setPedidos]  = useState([]);
  const [clientes, setClientes] = useState([]);
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
      const [{ data: dp }, { data: dc }] = await Promise.all([
        supabase.from('pedidos').select('*').eq('empresa_id', empresaId),
        supabase.from('clientes').select('id,created_at').eq('empresa_id', empresaId),
      ]);
      setPedidos(dp || []);
      setClientes(dc || []);
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  if (cargando) return <p style={{ color: t.sub }}>Cargando estadísticas...</p>;

  /* ─── Cálculos ──────────────────────────────────────────── */
  const entregados    = pedidos.filter(p => p.estado === 'Entregado');
  const ingresos      = entregados.reduce((s, p) => s + Number(p.total), 0);
  const cancelados    = pedidos.filter(p => p.estado === 'Cancelado').length;
  const tasaConversion= pedidos.length > 0 ? ((entregados.length / pedidos.length) * 100).toFixed(1) : 0;

  // Ventas por día (últimos 30 días)
  const porDia = {};
  entregados.forEach(p => {
    const k = new Date(p.created_at).toISOString().split('T')[0];
    porDia[k] = (porDia[k] || 0) + Number(p.total);
  });
  const grafVentas = Object.keys(porDia).sort().slice(-30).map(k => ({
    fecha: new Date(k + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    ventas: porDia[k],
  }));

  // Productos más vendidos (top 5)
  const conteo = {};
  entregados.forEach(p => (p.productos || []).forEach(pr => {
    conteo[pr.nombre] = (conteo[pr.nombre] || 0) + pr.cantidad;
  }));
  const topProductos = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, cantidad]) => ({ nombre, cantidad }));

  // Estado de pedidos (pie chart)
  const estados = [
    { name: 'Entregados', value: entregados.length, color: '#10b981' },
    { name: 'Pendientes', value: pedidos.filter(p => p.estado === 'Pendiente').length, color: '#f59e0b' },
    { name: 'Enviados',   value: pedidos.filter(p => p.estado === 'Enviado').length,   color: color },
    { name: 'Cancelados', value: cancelados, color: '#ef4444' },
  ].filter(e => e.value > 0);

  // Clientes nuevos por mes
  const porMes = {};
  clientes.forEach(c => {
    const k = new Date(c.created_at).toLocaleString('es-ES', { month: 'short', year: '2-digit' });
    porMes[k] = (porMes[k] || 0) + 1;
  });
  const grafClientes = Object.entries(porMes).slice(-6).map(([mes, total]) => ({ mes, total }));

  const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const kpis = [
    { label: 'Ingresos totales', value: fmt(ingresos),        icon: TrendingUp, accent: '#10b981' },
    { label: 'Pedidos entregados', value: entregados.length,  icon: ShoppingBag, accent: color },
    { label: 'Total clientes',   value: clientes.length,      icon: Users,       accent: '#8b5cf6' },
    { label: 'Tasa de conversión', value: `${tasaConversion}%`, icon: Star,      accent: '#f59e0b' },
  ];

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text }}>Estadísticas</h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Métricas y análisis avanzado de tu negocio.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        {kpis.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${kpi.accent}18`, color: kpi.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KpiIcon size={18} />
              </div>
              <div>
                <p style={{ margin: '0 0 1px', fontSize: '18px', fontWeight: '800', color: t.text, lineHeight: 1 }}>{kpi.value}</p>
                <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Gráfica ventas */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: t.text }}>Ventas diarias (30 días)</h3>
          {grafVentas.length === 0 ? <p style={{ color: t.sub, textAlign: 'center', padding: '30px 0' }}>Sin datos</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={grafVentas}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.grid} />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: t.sub, fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: t.sub, fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={40} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${t.border}`, background: t.tooltip, color: t.text, fontSize: '12px' }} formatter={v => [fmt(v), 'Ingresos']} />
                <Line type="monotone" dataKey="ventas" stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estado de pedidos */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: t.text }}>Estado de pedidos</h3>
          {estados.length === 0 ? <p style={{ color: t.sub, textAlign: 'center', padding: '30px 0' }}>Sin pedidos</p> : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={estados} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                    {estados.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {estados.map(e => (
                  <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: e.color }} />
                      <span style={{ fontSize: '12px', color: t.sub }}>{e.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: t.text }}>{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Top productos */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: t.text }}>Productos más vendidos</h3>
          {topProductos.length === 0 ? <p style={{ color: t.sub, textAlign: 'center', padding: '20px 0' }}>Sin ventas aún</p> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={topProductos} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: t.sub, fontSize: 10 }} />
                <YAxis type="category" dataKey="nombre" axisLine={false} tickLine={false} tick={{ fill: t.sub, fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${t.border}`, background: t.tooltip, color: t.text, fontSize: '12px' }} />
                <Bar dataKey="cantidad" fill={color} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Clientes nuevos */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: t.text }}>Clientes nuevos (6 meses)</h3>
          {grafClientes.length === 0 ? <p style={{ color: t.sub, textAlign: 'center', padding: '20px 0' }}>Sin datos</p> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={grafClientes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.grid} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: t.sub, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: t.sub, fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${t.border}`, background: t.tooltip, color: t.text, fontSize: '12px' }} />
                <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Estadisticas;
