import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { ShoppingBag, Users, Calendar, DollarSign, TrendingUp, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function DashboardAdmin({ empresaId, dark = false, color = '#3b82f6', empresaConfig }) {
  const [metricas, setMetricas] = useState({
    pedidosPendientes: 0, pedidosHoy: 0, citasHoy: 0,
    totalClientes: 0, ingresosHoy: 0, ingresosMes: 0,
  });
  const [cargando, setCargando] = useState(true);

  const colorSec = empresaConfig?.color_secundario || '#0f172a';
  const colorTer = empresaConfig?.color_terciario || '#f59e0b';

  const t = {
    bg:     dark ? `color-mix(in srgb, ${colorSec} 25%, black)` : 'white',
    border: dark ? `color-mix(in srgb, ${colorSec} 40%, black)` : `color-mix(in srgb, ${colorSec} 15%, white)`,
    text:   dark ? '#f0f4ff' : '#0f172a',
    sub:    dark ? '#94a3b8' : '#475569',
  };

  useEffect(() => {
    if (!empresaId) { setCargando(false); return; }
    async function cargar() {
      const hoy       = new Date().toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [
        { count: pedidosPendientes },
        { data: pedidosHoyData },
        { count: citasHoy },
        { count: totalClientes },
        { data: pedidosMes },
      ] = await Promise.all([
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('estado', 'Pendiente'),
        supabase.from('pedidos').select('total').eq('empresa_id', empresaId).gte('created_at', hoy),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).gte('fecha', hoy).lt('fecha', hoy + 'T23:59:59'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('pedidos').select('total').eq('empresa_id', empresaId).eq('estado', 'Entregado').gte('created_at', inicioMes),
      ]);

      setMetricas({
        pedidosPendientes: pedidosPendientes || 0,
        pedidosHoy: (pedidosHoyData || []).length,
        citasHoy: citasHoy || 0,
        totalClientes: totalClientes || 0,
        ingresosHoy:  (pedidosHoyData  || []).reduce((s, p) => s + Number(p.total || 0), 0),
        ingresosMes:  (pedidosMes      || []).reduce((s, p) => s + Number(p.total || 0), 0),
      });
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  const fmt   = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const cards = [
    { label: 'Pedidos pendientes', value: metricas.pedidosPendientes, icon: Clock,        accent: colorTer, urgente: metricas.pedidosPendientes > 0 },
    { label: 'Pedidos hoy',        value: metricas.pedidosHoy,        icon: ShoppingBag,  accent: color },
    { label: 'Citas hoy',          value: metricas.citasHoy,          icon: Calendar,     accent: colorTer },
    { label: 'Clientes totales',   value: metricas.totalClientes,     icon: Users,        accent: colorSec },
    { label: 'Ingresos hoy',       value: fmt(metricas.ingresosHoy),  icon: DollarSign,   accent: color },
    { label: 'Ingresos del mes',   value: fmt(metricas.ingresosMes),  icon: TrendingUp,   accent: colorTer },
  ];

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text }}>
          Centro de mando
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub, textTransform: 'capitalize' }}>{fecha}</p>
      </div>

      {/* Alerta pedidos pendientes */}
      {!cargando && metricas.pedidosPendientes > 0 && (
        <div style={{
          marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
          background: dark ? `color-mix(in srgb, ${colorTer} 15%, transparent)` : `color-mix(in srgb, ${colorTer} 10%, white)`,
          border: `1px solid color-mix(in srgb, ${colorTer} 30%, transparent)`,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <AlertCircle size={16} color={colorTer} />
          <span style={{ fontSize: '13px', color: colorTer, fontWeight: '600' }}>
            Tienes {metricas.pedidosPendientes} pedido{metricas.pedidosPendientes !== 1 ? 's' : ''} pendiente{metricas.pedidosPendientes !== 1 ? 's' : ''} por procesar
          </span>
          <ArrowUpRight size={14} color={colorTer} style={{ marginLeft: 'auto' }} />
        </div>
      )}

      {cargando ? (
        <p style={{ color: t.sub }}>Cargando métricas...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {cards.map(({ label, value, icon: Icon, accent, urgente }) => (
            <div key={label} style={{
              background: t.bg, borderRadius: '12px',
              border: `1px solid ${urgente ? `${accent}40` : t.border}`,
              padding: '20px 22px',
              display: 'flex', alignItems: 'center', gap: '16px',
              boxShadow: urgente ? `0 0 0 2px ${accent}20` : dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
              transition: 'box-shadow 0.2s',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                background: `${accent}18`, color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} />
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '800', color: t.text, lineHeight: 1 }}>
                  {value}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: t.sub }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
