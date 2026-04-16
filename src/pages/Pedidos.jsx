import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Clock, Truck, CheckCircle2, Eye, X, Package, Tag } from 'lucide-react';

const ESTADOS = {
  Pendiente: { color: '#f59e0b', bg: '#fffbeb', bgDark: 'rgba(245,158,11,0.1)', border: '#fde68a', label: 'Pendiente', icon: Clock },
  Enviado:   { color: '#3b82f6', bg: '#eff6ff', bgDark: 'rgba(59,130,246,0.1)',  border: '#bfdbfe', label: 'En camino', icon: Truck },
  Entregado: { color: '#10b981', bg: '#f0fdf4', bgDark: 'rgba(16,185,129,0.1)', border: '#a7f3d0', label: 'Entregado', icon: CheckCircle2 },
};

function Pedidos({ refreshPedidos, notificacionesAdmin, setNotificacionesAdmin, empresaId, dark = false, color = '#3b82f6' }) {
  const [pedidos,           setPedidos]           = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [filtrarCupones,    setFiltrarCupones]    = useState(false);

  /* ─── Tema ──────────────────────────────────────────────── */
  const t = {
    col:    dark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
    card:   dark ? 'rgba(255,255,255,0.06)' : 'white',
    border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    borderL:dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    text:   dark ? '#f0f4ff'                : '#0f172a',
    sub:    dark ? '#94a3b8'                : '#64748b',
    modal:  dark ? '#0d1526'                : 'white',
  };

  /* ─── Datos ─────────────────────────────────────────────── */
  const obtener = useCallback(async () => {
    const query = supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (empresaId) query.eq('empresa_id', empresaId);
    const { data } = await query;
    setPedidos(data || []);
  }, [empresaId]);

  useEffect(() => {
    obtener();
    if (notificacionesAdmin > 0) setNotificacionesAdmin(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshPedidos]);

  /* ─── Cambiar estado ────────────────────────────────────── */
  async function cambiarEstado(id, nuevoEstado) {
    const { error } = await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
    if (error) return Swal.fire('Error', 'No se pudo actualizar el estado', 'error');

    if (nuevoEstado === 'Entregado') {
      const pedido = pedidos.find(p => p.id === id);
      if (pedido?.productos) {
        for (const prod of pedido.productos) {
          const { data: bd, error: errStock } = await supabase.from('productos').select('stock').eq('id', prod.id).single();
          if (errStock) continue;
          if (bd) {
            const { error: errUpd } = await supabase.from('productos').update({ stock: Math.max(0, bd.stock - prod.cantidad) }).eq('id', prod.id);
            if (errUpd) console.warn('Stock no actualizado para producto', prod.id, errUpd.message);
          }
        }
      }
      Swal.fire({ icon: 'success', title: '¡Venta cerrada!', text: 'Inventario actualizado automáticamente.', timer: 2500, showConfirmButton: false });
    } else {
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, icon: 'success', title: `Movido a ${nuevoEstado}` });
    }
    obtener();
  }

  const cols = ['Pendiente', 'Enviado', 'Entregado'];
  const fmt  = n => `$${Number(n).toLocaleString('es-CO')}`;
  const date = s => new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text }}>Pedidos</h1>
          <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Flujo de trabajo de las compras de tus clientes.</p>
        </div>
        <button 
          onClick={() => setFiltrarCupones(f => !f)}
          style={{
            padding: '8px 14px',
            border: `1px solid ${filtrarCupones ? color : t.border}`,
            background: filtrarCupones ? `${color}18` : 'transparent',
            color: filtrarCupones ? color : t.sub,
            borderRadius: '9px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            transition: 'all 0.2s'
          }}>
          <Tag size={14} />
          {filtrarCupones ? 'Mostrando con cupón' : 'Todos los pedidos'}
        </button>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', flex: 1, minHeight: 0 }}>
        {cols.map(estado => {
          const cfg   = ESTADOS[estado];
          const lista = pedidos.filter(p => p.estado === estado && (!filtrarCupones || p.cupon_aplicado));
          const Icon  = cfg.icon;
          return (
            <div key={estado} style={{ background: dark ? cfg.bgDark : cfg.bg, borderRadius: '12px', border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : cfg.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Cabecera columna */}
              <div style={{ padding: '13px 16px', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : cfg.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={16} color={cfg.color} />
                <span style={{ fontWeight: '700', fontSize: '14px', color: cfg.color }}>{cfg.label}</span>
                <span style={{ marginLeft: 'auto', background: dark ? 'rgba(255,255,255,0.08)' : 'white', color: cfg.color, borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: '700', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : cfg.border}` }}>
                  {lista.length}
                </span>
              </div>

              {/* Tarjetas */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {lista.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: t.sub, fontSize: '13px' }}>Sin pedidos</div>
                )}
                {lista.map(p => (
                  <div key={p.id} style={{
                    background: t.card, borderRadius: '10px', padding: '13px',
                    marginBottom: '10px', border: `1px solid ${t.border}`,
                    borderLeft: `3px solid ${cfg.color}`,
                    boxShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: t.sub }}>#{String(p.id).slice(0, 8)}</span>
                      <span style={{ fontSize: '11px', color: t.sub }}>{date(p.created_at)}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.cliente_email}
                    </p>
                    <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '800', color: cfg.color }}>
                      {fmt(p.total)}
                    </p>
                    {p.descuento > 0 && (
                      <div style={{ marginTop: '-5px', marginBottom: '8px' }}>
                        <span style={{ background: dark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>
                          -{fmt(p.descuento)} ({p.cupon_aplicado})
                        </span>
                      </div>
                    )}
                    <button onClick={() => setPedidoSeleccionado(p)} style={{
                      width: '100%', padding: '7px', border: `1px solid ${t.border}`,
                      background: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                      color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                      marginBottom: '6px',
                    }}>
                      <Eye size={13} /> Ver detalles
                    </button>
                    {estado === 'Pendiente' && (
                      <button onClick={() => cambiarEstado(p.id, 'Enviado')} style={{ width: '100%', padding: '8px', border: 'none', borderRadius: '7px', background: color, color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                        Enviar →
                      </button>
                    )}
                    {estado === 'Enviado' && (
                      <button onClick={() => cambiarEstado(p.id, 'Entregado')} style={{ width: '100%', padding: '8px', border: 'none', borderRadius: '7px', background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                        ✓ Entregado
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal detalle ─────────────────────────────── */}
      {pedidoSeleccionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setPedidoSeleccionado(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${t.border}` }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: t.text }}>
                  Pedido #{String(pedidoSeleccionado.id).slice(0, 8)}
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>{pedidoSeleccionado.cliente_email}</p>
              </div>
              <button onClick={() => setPedidoSeleccionado(null)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}>
                <X size={15} />
              </button>
            </div>

            {/* Productos */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: t.sub, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Artículos</p>
              {(pedidoSeleccionado.productos || []).map((prod, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {prod.imagen
                      ? <img src={prod.imagen} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      : <Package size={18} color={t.sub} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: t.text }}>{prod.nombre}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: t.sub }}>{prod.cantidad} × {fmt(prod.precio)}</p>
                  </div>
                  <span style={{ fontWeight: '700', color: color }}>{fmt(prod.cantidad * prod.precio)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f8fafc', padding: '16px 18px', borderRadius: '10px', border: `1px solid ${t.border}` }}>
              {pedidoSeleccionado.descuento > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: t.sub, marginBottom: '8px' }}>
                    <span>Subtotal:</span>
                    <span>{fmt(pedidoSeleccionado.total + pedidoSeleccionado.descuento)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981', fontWeight: '600', marginBottom: '10px' }}>
                    <span>Descuento ({pedidoSeleccionado.cupon_aplicado}):</span>
                    <span>-{fmt(pedidoSeleccionado.descuento)}</span>
                  </div>
                  <div style={{ height: '1px', background: t.border, margin: '10px 0' }} />
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: t.sub }}>TOTAL</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: color }}>{fmt(pedidoSeleccionado.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pedidos;
