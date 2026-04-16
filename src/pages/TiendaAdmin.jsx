import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Store, Copy, ExternalLink, Package, ShoppingBag, Users, CheckCircle2, Eye, Settings, Link2 } from 'lucide-react';

function TiendaAdmin({ empresaId, empresaConfig, dark = false, color = '#3b82f6' }) {
  const [stats,    setStats]    = useState({ productos: 0, pedidosHoy: 0, clientes: 0, sinStock: 0 });
  const [cargando, setCargando] = useState(true);

  const t = {
    card:   dark ? 'rgba(255,255,255,0.04)' : 'white',
    card2:  dark ? 'rgba(255,255,255,0.07)' : '#f8fafc',
    border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    text:   dark ? '#f0f4ff'                : '#0f172a',
    sub:    dark ? '#94a3b8'                : '#64748b',
  };

  // URL pública de la tienda
  const origen = window.location.origin;
  const urlTienda = empresaConfig?.slug
    ? `${origen}/${empresaConfig.slug}`
    : `${origen}?tienda=${empresaId}`;

  useEffect(() => {
    async function cargar() {
      const hoy = new Date().toISOString().split('T')[0];
      const [{ count: cProd }, { count: cPed }, { count: cCli }, { count: cSinStock }] = await Promise.all([
        supabase.from('productos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).gt('stock', 0),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).gte('created_at', hoy),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('productos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('stock', 0),
      ]);
      setStats({ productos: cProd || 0, pedidosHoy: cPed || 0, clientes: cCli || 0, sinStock: cSinStock || 0 });
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  function copiarUrl() {
    navigator.clipboard.writeText(urlTienda);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'URL copiada', showConfirmButton: false, timer: 1500 });
  }

  function abrirTienda() {
    window.open(urlTienda, '_blank');
  }

  const activa = empresaConfig?.estado !== 'inactiva';

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={20} color={color} /> Mi Tienda
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>
          Vista y acceso rápido a la tienda que ven tus clientes.
        </p>
      </div>

      {/* URL de la tienda */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '22px', marginBottom: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={16} color={color} />
            <span style={{ fontWeight: '700', fontSize: '14px', color: t.text }}>URL pública de tu tienda</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activa ? '#10b981' : '#ef4444', boxShadow: activa ? '0 0 6px #10b981' : 'none' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: activa ? '#10b981' : '#ef4444' }}>
              {activa ? 'Tienda activa' : 'Tienda inactiva'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: t.card2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '12px 16px' }}>
          <span style={{ flex: 1, fontSize: '13px', color: t.sub, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {urlTienda}
          </span>
          <button onClick={copiarUrl} title="Copiar URL" style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f1f5f9', border: `1px solid ${t.border}`, borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: t.sub, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
            <Copy size={13} /> Copiar
          </button>
          <button onClick={abrirTienda} title="Ver tienda" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', flexShrink: 0, boxShadow: `0 4px 12px ${color}33` }}>
            <ExternalLink size={13} /> Abrir tienda
          </button>
        </div>

        {!empresaConfig?.slug && (
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#f59e0b' }}>
            💡 Configura un <strong>slug</strong> en Ajustes para tener una URL personalizada (ej: <em>/mi-negocio</em>).
          </p>
        )}
      </div>

      {/* Stats rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Productos con stock',  value: cargando ? '…' : stats.productos,   icon: Package,      accent: '#10b981' },
          { label: 'Pedidos hoy',          value: cargando ? '…' : stats.pedidosHoy,  icon: ShoppingBag,  accent: color },
          { label: 'Clientes registrados', value: cargando ? '…' : stats.clientes,    icon: Users,        accent: '#8b5cf6' },
          { label: 'Productos sin stock',  value: cargando ? '…' : stats.sinStock,    icon: Package,      accent: stats.sinStock > 0 ? '#ef4444' : '#94a3b8' },
        ].map(kpi => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${kpi.accent}18`, color: kpi.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KpiIcon size={17} />
              </div>
              <div>
                <p style={{ margin: '0 0 1px', fontSize: '20px', fontWeight: '800', color: kpi.accent, lineHeight: 1 }}>{kpi.value}</p>
                <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accesos rápidos */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: t.text }}>Acciones rápidas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Ver como cliente',     desc: 'Abre la tienda en otra pestaña',       icon: Eye,          action: abrirTienda,    accent: color },
            { label: 'Copiar link',          desc: 'Comparte con tus clientes',             icon: Copy,         action: copiarUrl,      accent: '#10b981' },
            { label: 'Gestionar inventario', desc: 'Agrega o edita productos',              icon: Package,      action: () => window.location.href = '/inventario',   accent: '#8b5cf6' },
            { label: 'Ajustes de tienda',    desc: 'Logo, colores, horarios',               icon: Settings,     action: () => window.location.href = '/ajustes',      accent: '#f59e0b' },
            { label: 'Ver pedidos',          desc: 'Gestiona las órdenes entrantes',        icon: ShoppingBag,  action: () => window.location.href = '/pedidos',      accent: '#ef4444' },
            { label: 'Verificar estado',     desc: `Tienda ${activa ? 'activa' : 'INACTIVA'}`, icon: CheckCircle2, action: () => window.location.href = '/ajustes', accent: activa ? '#10b981' : '#ef4444' },
          ].map(item => {
            const ItemIcon = item.icon;
            return (
              <button key={item.label} onClick={item.action} style={{
                background: t.card2, border: `1px solid ${t.border}`, borderRadius: '10px',
                padding: '14px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'flex-start', gap: '10px', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = item.accent; e.currentTarget.style.boxShadow = `0 0 0 2px ${item.accent}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${item.accent}18`, color: item.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ItemIcon size={16} />
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: t.text }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TiendaAdmin;
