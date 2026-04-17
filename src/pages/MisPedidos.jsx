import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, ShoppingBag } from 'lucide-react'; 

function MisPedidos({ usuario, esTemaOscuro, setEsTemaOscuro, cerrarSesion, notificaciones, setNotificaciones, empresaNombre, empresaConfig }) {
  const navigate = useNavigate();
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    async function obtenerPedidos() {
      const { data } = await supabase.from('pedidos').select('*').eq('cliente_email', usuario?.email).order('id', { ascending: false }); 
      if (data) setPedidos(data);
    }
    obtenerPedidos();
  }, [usuario]);

  const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const d = esTemaOscuro;
  const cPrin = empresaConfig?.color_principal || '#3b82f6';
  const cSec  = empresaConfig?.color_secundario || '#0f172a';
  const cTer  = empresaConfig?.color_terciario || '#f59e0b';

  const sys = {
    bg:      d ? `color-mix(in srgb, ${cSec} 15%, black)` : `color-mix(in srgb, ${cSec} 3%, white)`,
    navBg:   d ? `color-mix(in srgb, ${cSec} 25%, black)` : 'white',
    cardBg:  d ? `color-mix(in srgb, ${cSec} 25%, black)` : 'white',
    border:  d ? `color-mix(in srgb, ${cSec} 40%, black)` : `color-mix(in srgb, ${cSec} 15%, white)`,
    text:    d ? '#f0f4ff' : '#0f172a',
    sub:     d ? '#94a3b8' : '#475569',
    hover:   d ? `color-mix(in srgb, ${cSec} 35%, black)` : `color-mix(in srgb, ${cSec} 8%, white)`,
  };

  const estilos = {
    container: { minHeight: '100vh', color: sys.text, transition: 'color 0.3s' },
    navbar: { background: sys.navBg, padding: '15px 20px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${sys.border}`, position: 'sticky', top: 0, zIndex: 100 },
    navLinks: { color: sys.text, textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' },
    badgeNotif: { position: 'absolute', top: '-6px', right: '-6px', background: cTer, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
    card: { background: sys.cardBg, padding: '25px', borderRadius: '16px', border: `1px solid ${sys.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: d ? '0 4px 6px -1px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '15px' },
    emptyState: { background: sys.cardBg, padding: '40px', borderRadius: '16px', border: `1px solid ${sys.border}`, textAlign: 'center', color: sys.sub }
  };

  return (
    <div style={estilos.container}>
      <nav style={estilos.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {empresaConfig?.logo_url ? (
            <img src={empresaConfig.logo_url} alt={empresaNombre} style={{ height: '40px', objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{empresaNombre || 'Mi Tienda'}</div>
          )}
        </div>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          {empresaConfig?.usa_inventario && (
            <>
              <Link to="/" style={estilos.navLinks}>Catálogo</Link>
              <Link to="/mis-pedidos" style={{...estilos.navLinks, color: cPrin, fontWeight: 'bold'}}>Mis Pedidos</Link>
            </>
          )}
          {empresaConfig?.usa_citas && (
            <>
              <Link to="/agendar" style={estilos.navLinks}>Agendar Cita</Link>
              <Link to="/mis-citas" style={estilos.navLinks}>Mis Citas</Link>
            </>
          )}
          <div style={{ borderLeft: `1px solid ${sys.border}`, height: '24px', margin: '0 5px' }}></div>
          <button onClick={() => setEsTemaOscuro(!esTemaOscuro)} style={{ background: 'none', border: 'none', color: estilos.navLinks.color, cursor: 'pointer', padding: 0 }}><Sun size={22} /></button>
          
          {/* --- INICIO DROPDOWN DE NOTIFICACIONES --- */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setMostrarNotif(!mostrarNotif)} style={{ background: 'none', border: 'none', color: estilos.navLinks.color, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <Bell size={22} />
              {Array.isArray(notificaciones) && notificaciones.length > 0 && (
                <span style={estilos.badgeNotif}>{notificaciones.length}</span>
              )}
            </button>

            {mostrarNotif && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 998 }} onClick={() => setMostrarNotif(false)}></div>
                
                <div style={{ position: 'absolute', top: '35px', right: '-10px', width: '320px', background: sys.navBg, borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: `1px solid ${sys.border}`, zIndex: 999, overflow: 'hidden' }}>
                  <div style={{ padding: '15px', fontWeight: 'bold', borderBottom: `1px solid ${sys.border}`, color: sys.text }}>
                    Notificaciones ({Array.isArray(notificaciones) ? notificaciones.length : 0})
                  </div>
                  
                  {!Array.isArray(notificaciones) || notificaciones.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: sys.sub, fontSize: '14px' }}>No hay nada nuevo por aquí.</div>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notificaciones.map(n => (
                        <div key={n.id} onClick={() => {
                            navigate(n.ruta); 
                            setNotificaciones(notificaciones.filter(x => x.id !== n.id)); 
                            setMostrarNotif(false); 
                        }} style={{ padding: '15px', borderBottom: `1px solid ${sys.border}`, cursor: 'pointer', fontSize: '13px', color: sys.text, transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = sys.hover}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ fontWeight: 'bold', color: n.ruta === '/mis-citas' ? cPrin : cTer, marginBottom: '4px' }}>
                              {n.ruta === '/mis-citas' ? '📅 Actualización de Cita' : '🛍️ Actualización de Pedido'}
                            </div>
                            <div style={{ color: sys.sub }}>{n.texto}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {/* --- FIN DROPDOWN DE NOTIFICACIONES --- */}

          <div style={{ borderLeft: `1px solid ${sys.border}`, height: '24px', margin: '0 5px' }}></div>
          
          {/* --- NUEVO BOTÓN DE PERFIL AQUÍ --- */}
          <Link to="/mi-perfil" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: cPrin, fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
            <User size={18} /><span>{usuario?.user_metadata?.nombre || 'Mi Perfil'}</span>
          </Link>
          
          <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: sys.hover, color: sys.text, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', marginLeft: '5px' }}>Salir</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', color: sys.text }}>Historial de Compras</h1>
        <p style={{ color: sys.sub, marginBottom: '40px', fontSize: '1.1rem' }}>Rastrea el estado de los productos que has comprado.</p>

        {pedidos.length === 0 ? (
          <div style={estilos.emptyState}>
            <ShoppingBag size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', margin: 0 }}>No has realizado ninguna compra de productos.</p>
          </div>
        ) : (
          pedidos.map(pedido => (
            <div key={pedido.id} style={estilos.card}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: sys.sub }}>Pedido #{String(pedido.id).slice(0, 8)}</p>
                {pedido.descuento > 0 && (
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: sys.sub, textDecoration: 'line-through' }}>
                    Subtotal: {fmt(pedido.total + pedido.descuento)}
                  </p>
                )}
                <p style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem', color: sys.text }}>Total: <span style={{ color: cPrin }}>{fmt(pedido.total)}</span></p>
                {pedido.cupon_aplicado && (
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ background: d ? 'rgba(16,185,129,0.1)' : '#f0fdf4', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                      Cupón: {pedido.cupon_aplicado} (-{fmt(pedido.descuento)})
                    </span>
                  </div>
                )}
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: sys.text }}>Artículos:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: sys.sub, fontSize: '14px' }}>
                  {pedido.productos?.map((prod, index) => <li key={index}>{prod.cantidad}x {prod.nombre}</li>)}
                </ul>
              </div>
              <div style={{ padding: '8px 16px', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px', backgroundColor: pedido.estado === 'Pendiente' ? (d ? '#451a03' : '#fef3c7') : pedido.estado === 'Enviado' ? (d ? '#1e3a8a' : '#dbeafe') : (d ? '#064e3b' : '#d1fae5'), color: pedido.estado === 'Pendiente' ? (d ? '#fcd34d' : '#d97706') : pedido.estado === 'Enviado' ? (d ? '#60a5fa' : '#2563eb') : (d ? '#34d399' : '#059669') }}>
                {pedido.estado}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MisPedidos;