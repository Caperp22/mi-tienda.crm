import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Monitor, Plus, Minus, Trash2, Search, ShoppingCart, CheckCircle2 } from 'lucide-react';

function POS({ empresaId, dark = false, color = '#3b82f6' }) {
  const [productos, setProductos] = useState([]);
  const [carrito,   setCarrito]   = useState([]);
  const [busqueda,  setBusqueda]  = useState('');
  const [correo,    setCorreo]    = useState('');
  const [procesando,setProcesando]= useState(false);
  const [ultimaVenta,setUltimaVenta] = useState(null);

  const t = {
    card:   dark ? 'rgba(255,255,255,0.04)' : 'white',
    card2:  dark ? 'rgba(255,255,255,0.07)' : '#f8fafc',
    border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    borderL:dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    text:   dark ? '#f0f4ff'                : '#0f172a',
    sub:    dark ? '#94a3b8'                : '#64748b',
    input:  dark ? 'rgba(255,255,255,0.06)' : 'white',
    inputB: dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
    inputT: dark ? '#e2e8f0'                : '#1e293b',
  };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${t.inputB}`, background: t.input, color: t.inputT, fontSize: '13.5px', boxSizing: 'border-box', outline: 'none' };

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('productos').select('*').eq('empresa_id', empresaId).gt('stock', 0).order('nombre');
      setProductos(data || []);
    }
    cargar();
  }, [empresaId]);

  const filtrados = productos.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  function agregar(p) {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === p.id);
      if (existe) {
        if (existe.cantidad >= p.stock) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Stock insuficiente', showConfirmButton: false, timer: 1500 });
          return prev;
        }
        return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { ...p, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id, delta) {
    setCarrito(prev => prev.map(i => i.id === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i).filter(i => i.cantidad > 0));
  }

  function quitar(id) { setCarrito(prev => prev.filter(i => i.id !== id)); }

  const total = carrito.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0);
  const fmt   = n => `$${Number(n).toLocaleString('es-CO')}`;

  async function cobrar() {
    if (carrito.length === 0) return;
    setProcesando(true);
    const productos_data = carrito.map(i => ({ id: i.id, nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, imagen: i.imagen || '' }));

    const { error } = await supabase.from('pedidos').insert([{
      empresa_id: empresaId,
      cliente_email: correo || 'venta-presencial@pos.local',
      productos: productos_data,
      total,
      estado: 'Entregado',
    }]);

    if (error) { setProcesando(false); return Swal.fire('Error', error.message, 'error'); }

    // Descontar stock
    for (const item of carrito) {
      const { data: bd, error: errStock } = await supabase.from('productos').select('stock').eq('id', item.id).single();
      if (errStock) continue;
      if (bd) await supabase.from('productos').update({ stock: Math.max(0, bd.stock - item.cantidad) }).eq('id', item.id);
    }

    setUltimaVenta({ items: carrito, total, correo });
    setCarrito([]);
    setCorreo('');
    setBusqueda('');
    // Recargar productos para actualizar stock
    const { data } = await supabase.from('productos').select('*').eq('empresa_id', empresaId).gt('stock', 0).order('nombre');
    setProductos(data || []);
    setProcesando(false);
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', height: 'auto', minHeight: 'calc(100vh - 120px)' }}>

      {/* ── Panel izquierdo: productos ─────────────── */}
      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
        <div style={{ marginBottom: '4px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={20} color={color} /> Punto de Venta
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Registro rápido de ventas presenciales.</p>
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: t.sub }} />
          <input style={{ ...inp, paddingLeft: '34px' }} placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        {/* Grid productos */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', alignContent: 'start' }}>
          {filtrados.map(p => (
            <button key={p.id} onClick={() => agregar(p)} style={{
              background: t.card, border: `1px solid ${t.border}`, borderRadius: '10px',
              padding: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 2px ${color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {p.imagen && <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />}
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: t.text, lineHeight: 1.3 }}>{p.nombre}</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color }}>{fmt(p.precio)}</p>
              <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>Stock: {p.stock}</p>
            </button>
          ))}
          {filtrados.length === 0 && <p style={{ color: t.sub, fontSize: '13px', gridColumn: '1/-1' }}>Sin productos con stock disponible.</p>}
        </div>
      </div>

      {/* ── Panel derecho: carrito ─────────────────── */}
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden' }}>
        {/* Header carrito */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={16} color={color} />
          <span style={{ fontWeight: '700', fontSize: '14px', color: t.text }}>Carrito</span>
          <span style={{ marginLeft: 'auto', background: `${color}18`, color, borderRadius: '10px', padding: '2px 8px', fontSize: '12px', fontWeight: '700' }}>{carrito.length}</span>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: t.sub }}>
              <ShoppingCart size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Agrega productos al carrito</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} style={{ background: t.card2, borderRadius: '8px', padding: '10px', marginBottom: '8px', border: `1px solid ${t.borderL}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: t.text, flex: 1, paddingRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</p>
                  <button onClick={() => quitar(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sub, padding: 0, display: 'flex' }}><Trash2 size={13} /></button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => cambiarCantidad(item.id, -1)} style={{ background: dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', border: `1px solid ${t.border}`, borderRadius: '5px', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}><Minus size={11} /></button>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: t.text, minWidth: '18px', textAlign: 'center' }}>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.id, 1)} style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '5px', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}><Plus size={11} /></button>
                  </div>
                  <span style={{ fontWeight: '700', color, fontSize: '14px' }}>{fmt(Number(item.precio) * item.cantidad)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Correo + Total + Cobrar */}
        <div style={{ padding: '14px', borderTop: `1px solid ${t.border}` }}>
          <input style={{ ...inp, marginBottom: '10px', fontSize: '12px' }} type="email" placeholder="Correo cliente (opcional)" value={correo} onChange={e => setCorreo(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 12px', background: t.card2, borderRadius: '8px' }}>
            <span style={{ fontWeight: '600', color: t.sub, fontSize: '13px' }}>TOTAL</span>
            <span style={{ fontWeight: '900', color, fontSize: '18px' }}>{fmt(total)}</span>
          </div>
          <button onClick={cobrar} disabled={carrito.length === 0 || procesando} style={{
            width: '100%', padding: '13px', border: 'none', borderRadius: '9px',
            background: carrito.length === 0 || procesando ? t.border : `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: carrito.length === 0 || procesando ? t.sub : 'white',
            fontWeight: '700', fontSize: '14px', cursor: carrito.length === 0 || procesando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: carrito.length === 0 ? 'none' : `0 4px 14px ${color}44`,
          }}>
            <CheckCircle2 size={16} />
            {procesando ? 'Procesando...' : 'Cobrar venta'}
          </button>
        </div>
      </div>

      {/* Toast última venta */}
      {ultimaVenta && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: dark ? '#0d1526' : 'white', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px 20px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', zIndex: 100, maxWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span style={{ fontWeight: '700', fontSize: '14px', color: t.text }}>Venta registrada</span>
            <button onClick={() => setUltimaVenta(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: t.sub, padding: 0, fontSize: '16px' }}>×</button>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '900', color: '#10b981' }}>{fmt(ultimaVenta.total)}</p>
          <p style={{ margin: 0, fontSize: '12px', color: t.sub }}>{ultimaVenta.items.length} artículo(s){ultimaVenta.correo ? ` · ${ultimaVenta.correo}` : ''}</p>
        </div>
      )}
    </div>
  );
}

export default POS;
