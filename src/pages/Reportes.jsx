import { useEffect, useState, useRef } from 'react';
import { supabase } from '../config/supabase';
import { FileText, Download, TrendingUp, ShoppingBag, Users, Star, Package, Calendar } from 'lucide-react';

function Reportes({ empresaId, dark = false, color = '#3b82f6' }) {
  const [pedidos,   setPedidos]   = useState([]);
  const [clientes,  setClientes]  = useState([]);
  const [productos, setProductos] = useState([]);
  const [citas,     setCitas]     = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [rango,     setRango]     = useState('mes'); // 'semana' | 'mes' | 'trimestre' | 'año'
  const printRef = useRef(null);

  const t = {
    card:   dark ? 'rgba(255,255,255,0.04)' : 'white',
    card2:  dark ? 'rgba(255,255,255,0.07)' : '#f8fafc',
    border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    borderL:dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    text:   dark ? '#f0f4ff'                : '#0f172a',
    sub:    dark ? '#94a3b8'                : '#64748b',
    th:     dark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    row:    dark ? 'rgba(255,255,255,0.02)' : '#fafafa',
  };

  useEffect(() => {
    async function cargar() {
      const [{ data: dp }, { data: dc }, { data: dpr }, { data: dci }] = await Promise.all([
        supabase.from('pedidos').select('*').eq('empresa_id', empresaId),
        supabase.from('clientes').select('*').eq('empresa_id', empresaId),
        supabase.from('productos').select('*').eq('empresa_id', empresaId),
        supabase.from('citas').select('*').eq('empresa_id', empresaId),
      ]);
      setPedidos(dp || []);
      setClientes(dc || []);
      setProductos(dpr || []);
      setCitas(dci || []);
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  // Filtrar datos por rango
  function filtrarPorRango(items) {
    const ahora = new Date();
    const inicio = new Date();
    if (rango === 'semana')    inicio.setDate(ahora.getDate() - 7);
    if (rango === 'mes')       inicio.setMonth(ahora.getMonth() - 1);
    if (rango === 'trimestre') inicio.setMonth(ahora.getMonth() - 3);
    if (rango === 'año')       inicio.setFullYear(ahora.getFullYear() - 1);
    return items.filter(i => new Date(i.created_at) >= inicio);
  }

  const pedidosFiltrados   = filtrarPorRango(pedidos);
  const clientesFiltrados  = filtrarPorRango(clientes);
  const citasFiltradas     = filtrarPorRango(citas);
  const entregados         = pedidosFiltrados.filter(p => p.estado === 'Entregado');
  const ingresos           = entregados.reduce((s, p) => s + Number(p.total), 0);
  const cancelados         = pedidosFiltrados.filter(p => p.estado === 'Cancelado').length;
  const pendientes         = pedidosFiltrados.filter(p => p.estado === 'Pendiente').length;
  const ticketPromedio     = entregados.length > 0 ? ingresos / entregados.length : 0;
  const tasaConv           = pedidosFiltrados.length > 0 ? ((entregados.length / pedidosFiltrados.length) * 100).toFixed(1) : 0;

  // Top productos
  const conteo = {};
  entregados.forEach(p => (p.productos || []).forEach(pr => {
    conteo[pr.nombre] = (conteo[pr.nombre] || 0) + pr.cantidad;
  }));
  const topProductos = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Stock bajo (≤ 5)
  const stockBajo = productos.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);

  // Ventas por día
  const ventasDia = {};
  entregados.forEach(p => {
    const k = new Date(p.created_at).toISOString().split('T')[0];
    ventasDia[k] = (ventasDia[k] || 0) + Number(p.total);
  });
  const mejorDia = Object.entries(ventasDia).sort((a, b) => b[1] - a[1])[0];

  const fmt   = n => `$${Number(n).toLocaleString('es-CO')}`;
  const fmtFecha = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const rangos = [
    { id: 'semana',    label: 'Última semana' },
    { id: 'mes',       label: 'Último mes' },
    { id: 'trimestre', label: 'Trimestre' },
    { id: 'año',       label: 'Este año' },
  ];

  function imprimir() {
    window.print();
  }

  if (cargando) return <p style={{ color: t.sub }}>Cargando reportes...</p>;

  return (
    <div ref={printRef} style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color={color} /> Reportes
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Resumen ejecutivo de tu negocio para el rango seleccionado.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Selector de rango */}
          <div style={{ display: 'flex', background: t.card, border: `1px solid ${t.border}`, borderRadius: '9px', overflow: 'hidden' }}>
            {rangos.map(r => (
              <button key={r.id} onClick={() => setRango(r.id)} style={{
                padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                background: rango === r.id ? `linear-gradient(135deg, ${color}, ${color}cc)` : 'transparent',
                color: rango === r.id ? 'white' : t.sub,
                transition: 'all 0.15s',
              }}>{r.label}</button>
            ))}
          </div>

          <button onClick={imprimir} style={{
            padding: '9px 16px', border: `1px solid ${t.border}`, borderRadius: '9px',
            background: t.card, color: t.sub, cursor: 'pointer', fontSize: '12px',
            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '7px',
          }}>
            <Download size={14} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Ingresos',        value: fmt(ingresos),          icon: TrendingUp, accent: '#10b981' },
          { label: 'Pedidos entregados', value: entregados.length,   icon: ShoppingBag, accent: color },
          { label: 'Clientes nuevos', value: clientesFiltrados.length, icon: Users,    accent: '#8b5cf6' },
          { label: 'Ticket promedio', value: fmt(ticketPromedio),    icon: Star,        accent: '#f59e0b' },
          { label: 'Tasa de conversión', value: `${tasaConv}%`,      icon: TrendingUp,  accent: '#06b6d4' },
          { label: 'Citas agendadas', value: citasFiltradas.length,  icon: Calendar,    accent: '#ec4899' },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${kpi.accent}18`, color: kpi.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KpiIcon size={17} />
              </div>
              <div>
                <p style={{ margin: '0 0 1px', fontSize: '17px', fontWeight: '800', color: t.text, lineHeight: 1 }}>{kpi.value}</p>
                <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Resumen de pedidos */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: t.text, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <ShoppingBag size={14} color={color} /> Estado de Pedidos
          </h3>
          {[
            { label: 'Entregados', value: entregados.length, color: '#10b981', bg: '#10b98115' },
            { label: 'Pendientes', value: pendientes,        color: '#f59e0b', bg: '#f59e0b15' },
            { label: 'Enviados',   value: pedidosFiltrados.filter(p => p.estado === 'Enviado').length, color, bg: `${color}15` },
            { label: 'Cancelados', value: cancelados,        color: '#ef4444', bg: '#ef444415' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: row.bg, borderRadius: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: row.color, fontWeight: '600' }}>{row.label}</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: row.color }}>{row.value}</span>
            </div>
          ))}
          {mejorDia && (
            <div style={{ marginTop: '10px', padding: '10px 12px', background: t.card2, borderRadius: '8px', border: `1px solid ${t.borderL}` }}>
              <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>Mejor día de ventas</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '700', color: t.text }}>{fmtFecha(mejorDia[0])} — <span style={{ color: '#10b981' }}>{fmt(mejorDia[1])}</span></p>
            </div>
          )}
        </div>

        {/* Productos más vendidos */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: t.text, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Package size={14} color={color} /> Productos Más Vendidos
          </h3>
          {topProductos.length === 0 ? (
            <p style={{ color: t.sub, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Sin ventas en este período.</p>
          ) : (
            topProductos.map(([nombre, cantidad], i) => {
              const max = topProductos[0][1];
              return (
                <div key={nombre} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', color: t.text, fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{i + 1}. {nombre}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color, flexShrink: 0 }}>{cantidad} uds</span>
                  </div>
                  <div style={{ height: '4px', background: t.border, borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${(cantidad / max) * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}80)`, borderRadius: '2px' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stock bajo */}
      {stockBajo.length > 0 && (
        <div style={{ background: t.card, border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Package size={14} color="#ef4444" /> Alerta de Stock Bajo (≤ 5 unidades)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {stockBajo.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
                <span style={{ fontSize: '12px', color: t.text, fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: p.stock === 0 ? '#ef4444' : '#f59e0b', marginLeft: '8px', flexShrink: 0 }}>
                  {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de clientes recientes */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={14} color={color} />
          <span style={{ fontWeight: '700', fontSize: '14px', color: t.text }}>Clientes Nuevos en el Período</span>
          <span style={{ marginLeft: 'auto', background: `${color}18`, color, padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>{clientesFiltrados.length}</span>
        </div>
        {clientesFiltrados.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: t.sub, fontSize: '13px' }}>No hubo clientes nuevos en este período.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nombre', 'Correo', 'Teléfono', 'Registro'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 18px', background: t.th, color: t.sub, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.slice(0, 20).map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? 'transparent' : t.row }}>
                  <td style={{ padding: '10px 18px', borderBottom: `1px solid ${t.borderL}`, fontSize: '13px', fontWeight: '600', color: t.text }}>{c.nombre || '—'}</td>
                  <td style={{ padding: '10px 18px', borderBottom: `1px solid ${t.borderL}`, fontSize: '12px', color: t.sub }}>{c.correo || '—'}</td>
                  <td style={{ padding: '10px 18px', borderBottom: `1px solid ${t.borderL}`, fontSize: '12px', color: t.sub }}>{c.telefono || '—'}</td>
                  <td style={{ padding: '10px 18px', borderBottom: `1px solid ${t.borderL}`, fontSize: '12px', color: t.sub }}>{new Date(c.created_at).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pie de página del reporte */}
      <div style={{ marginTop: '20px', padding: '12px 20px', background: t.card2, borderRadius: '10px', border: `1px solid ${t.borderL}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: t.sub }}>Reporte generado el {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span style={{ fontSize: '11px', color: t.sub }}>Período: <strong style={{ color: t.text }}>{rangos.find(r => r.id === rango)?.label}</strong></span>
      </div>
    </div>
  );
}

export default Reportes;
