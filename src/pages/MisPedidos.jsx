import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, ShoppingBag } from 'lucide-react'; 

function MisPedidos({ usuario, esTemaOscuro, setEsTemaOscuro, cerrarSesion, notificaciones, setNotificaciones }) {
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

  const estilos = {
    container: { minHeight: '100vh', color: esTemaOscuro ? '#f8fafc' : '#0f172a', transition: 'color 0.3s' },
    navbar: { background: esTemaOscuro ? '#1e293b' : '#ffffff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#e5e7eb'}`, position: 'sticky', top: 0, zIndex: 100 },
    navLinks: { color: esTemaOscuro ? '#e2e8f0' : '#4b5563', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' },
    badgeNotif: { position: 'absolute', top: '-6px', right: '-6px', background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
    card: { background: esTemaOscuro ? '#1e293b' : '#ffffff', padding: '25px', borderRadius: '16px', border: `1px solid ${esTemaOscuro ? '#334155' : '#e5e7eb'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: esTemaOscuro ? '0 4px 6px -1px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '15px' },
    emptyState: { background: esTemaOscuro ? '#1e293b' : '#ffffff', padding: '40px', borderRadius: '16px', border: `1px solid ${esTemaOscuro ? '#334155' : '#e5e7eb'}`, textAlign: 'center', color: esTemaOscuro ? '#94a3b8' : '#64748b' }
  };

  return (
    <div style={estilos.container}>
      <nav style={estilos.navbar}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Mi Tienda</div>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <Link to="/" style={estilos.navLinks}>Catálogo</Link>
          <Link to="/agendar" style={estilos.navLinks}>Agendar Cita</Link>
          <Link to="/mis-citas" style={estilos.navLinks}>Mis Citas</Link>
          <Link to="/mis-pedidos" style={{...estilos.navLinks, color: '#3b82f6', fontWeight: 'bold'}}>Mis Pedidos</Link>
          <div style={{ borderLeft: `1px solid ${esTemaOscuro ? '#475569' : '#e5e7eb'}`, height: '24px', margin: '0 5px' }}></div>
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
                
                <div style={{ position: 'absolute', top: '35px', right: '-10px', width: '320px', background: esTemaOscuro ? '#1e293b' : 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: `1px solid ${esTemaOscuro ? '#334155' : '#e2e8f0'}`, zIndex: 999, overflow: 'hidden' }}>
                  <div style={{ padding: '15px', fontWeight: 'bold', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#f1f5f9'}`, color: esTemaOscuro ? '#f8fafc' : '#0f172a' }}>
                    Notificaciones ({Array.isArray(notificaciones) ? notificaciones.length : 0})
                  </div>
                  
                  {!Array.isArray(notificaciones) || notificaciones.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay nada nuevo por aquí.</div>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notificaciones.map(n => (
                        <div key={n.id} onClick={() => {
                            navigate(n.ruta); 
                            setNotificaciones(notificaciones.filter(x => x.id !== n.id)); 
                            setMostrarNotif(false); 
                        }} style={{ padding: '15px', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#f1f5f9'}`, cursor: 'pointer', fontSize: '13px', color: esTemaOscuro ? '#cbd5e1' : '#475569', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = esTemaOscuro ? '#334155' : '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ fontWeight: 'bold', color: n.ruta === '/mis-citas' ? '#4f46e5' : '#10b981', marginBottom: '4px' }}>
                              {n.ruta === '/mis-citas' ? '📅 Actualización de Cita' : '🛍️ Actualización de Pedido'}
                            </div>
                            <div>{n.texto}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {/* --- FIN DROPDOWN DE NOTIFICACIONES --- */}

          <div style={{ borderLeft: `1px solid ${esTemaOscuro ? '#475569' : '#e5e7eb'}`, height: '24px', margin: '0 5px' }}></div>
          
          {/* --- NUEVO BOTÓN DE PERFIL AQUÍ --- */}
          <Link to="/mi-perfil" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
            <User size={18} /><span>{usuario?.user_metadata?.nombre || 'Mi Perfil'}</span>
          </Link>
          
          <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: esTemaOscuro ? '#334155' : '#f3f4f6', color: estilos.navLinks.color, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', marginLeft: '5px' }}>Salir</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>Historial de Compras</h1>
        <p style={{ color: esTemaOscuro ? '#94a3b8' : '#6b7280', marginBottom: '40px', fontSize: '1.1rem' }}>Rastrea el estado de los productos que has comprado.</p>

        {pedidos.length === 0 ? (
          <div style={estilos.emptyState}>
            <ShoppingBag size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', margin: 0 }}>No has realizado ninguna compra de productos.</p>
          </div>
        ) : (
          pedidos.map(pedido => (
            <div key={pedido.id} style={estilos.card}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: esTemaOscuro ? '#94a3b8' : '#6b7280' }}>Pedido #{pedido.id}</p>
                <p style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem' }}>Total: <span style={{ color: esTemaOscuro ? '#34d399' : '#10b981'}}>${pedido.total}</span></p>
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>Artículos:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: esTemaOscuro ? '#cbd5e1' : '#4b5563', fontSize: '14px' }}>
                  {pedido.productos?.map((prod, index) => <li key={index}>{prod.cantidad}x {prod.nombre}</li>)}
                </ul>
              </div>
              <div style={{ padding: '8px 16px', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px', backgroundColor: pedido.estado === 'Pendiente' ? (esTemaOscuro ? '#451a03' : '#fef3c7') : pedido.estado === 'Enviado' ? (esTemaOscuro ? '#1e3a8a' : '#dbeafe') : (esTemaOscuro ? '#064e3b' : '#d1fae5'), color: pedido.estado === 'Pendiente' ? (esTemaOscuro ? '#fcd34d' : '#d97706') : pedido.estado === 'Enviado' ? (esTemaOscuro ? '#60a5fa' : '#2563eb') : (esTemaOscuro ? '#34d399' : '#059669') }}>
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