import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { ShoppingBag, Users, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';

export default function DashboardAdmin({ empresaId }) {
  const [metricas, setMetricas] = useState({
    pedidosPendientes: 0,
    pedidosHoy: 0,
    citasHoy: 0,
    totalClientes: 0,
    ingresosHoy: 0,
    ingresosMes: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!empresaId) { setCargando(false); return; }
    async function cargar() {
      const hoy = new Date().toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [
        { count: pedidosPendientes },
        { data: pedidosHoyData },
        { count: citasHoy },
        { count: totalClientes },
        { data: pedidosMes },
      ] = await Promise.all([
        supabase.from('pedidos').select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId).eq('estado', 'Pendiente'),
        supabase.from('pedidos').select('total')
          .eq('empresa_id', empresaId).gte('created_at', hoy),
        supabase.from('citas').select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId).gte('fecha', hoy).lt('fecha', hoy + 'T23:59:59'),
        supabase.from('clientes').select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId),
        supabase.from('pedidos').select('total')
          .eq('empresa_id', empresaId).eq('estado', 'Entregado').gte('created_at', inicioMes),
      ]);

      const ingresosHoy = (pedidosHoyData || []).reduce((s, p) => s + Number(p.total || 0), 0);
      const ingresosMes = (pedidosMes || []).reduce((s, p) => s + Number(p.total || 0), 0);

      setMetricas({
        pedidosPendientes: pedidosPendientes || 0,
        pedidosHoy: (pedidosHoyData || []).length,
        citasHoy: citasHoy || 0,
        totalClientes: totalClientes || 0,
        ingresosHoy,
        ingresosMes,
      });
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  const cards = [
    { label: 'Pedidos pendientes', value: metricas.pedidosPendientes, icon: <Clock size={20} />,        color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Pedidos hoy',        value: metricas.pedidosHoy,        icon: <ShoppingBag size={20} />,  color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Citas hoy',          value: metricas.citasHoy,          icon: <Calendar size={20} />,     color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Clientes totales',   value: metricas.totalClientes,     icon: <Users size={20} />,        color: '#10b981', bg: '#f0fdf4' },
    { label: 'Ingresos hoy',       value: fmt(metricas.ingresosHoy),  icon: <DollarSign size={20} />,   color: '#0891b2', bg: '#f0f9ff' },
    { label: 'Ingresos del mes',   value: fmt(metricas.ingresosMes),  icon: <TrendingUp size={20} />,   color: '#7c3aed', bg: '#faf5ff' },
  ];

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
          Centro de mando
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', textTransform: 'capitalize' }}>{fecha}</p>
      </div>

      {cargando ? (
        <p style={{ color: '#94a3b8' }}>Cargando métricas...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {cards.map(({ label, value, icon, color, bg }) => (
            <div key={label} style={{
              background: 'white', borderRadius: '12px',
              border: '1px solid #e2e8f0', padding: '20px 22px',
              display: 'flex', alignItems: 'center', gap: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: bg, color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
                  {value}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
