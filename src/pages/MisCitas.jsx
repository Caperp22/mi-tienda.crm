import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'; 

function MisCitas({ usuario, esTemaOscuro, setEsTemaOscuro, cerrarSesion, notificaciones, setNotificaciones, empresaNombre, empresaConfig }) {
  const navigate = useNavigate();
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    async function obtenerCitas() {
      const { data } = await supabase.from('citas').select('*').eq('cliente_email', usuario?.email).order('fecha', { ascending: false }); 
      if (data) setCitas(data);
    }
    obtenerCitas();
  }, [usuario]);

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
    navbar: { background: sys.navBg, padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${sys.border}`, position: 'sticky', top: 0, zIndex: 100 },
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
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          {empresaConfig?.usa_inventario && (
            <>
              <Link to="/" style={estilos.navLinks}>Catálogo</Link>
              <Link to="/mis-pedidos" style={estilos.navLinks}>Mis Pedidos</Link>
            </>
          )}
          {empresaConfig?.usa_citas && (
            <>
              <Link to="/agendar" style={estilos.navLinks}>Agendar Cita</Link>
              <Link to="/mis-citas" style={{...estilos.navLinks, color: cPrin, fontWeight: 'bold'}}>Mis Citas</Link>
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
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', color: sys.text }}>Mis Próximas Citas</h1>
        <p style={{ color: sys.sub, marginBottom: '40px', fontSize: '1.1rem' }}>Rastrea el estado de tus reservas de servicios.</p>

        {citas.length === 0 ? (
          <div style={estilos.emptyState}>
            <Calendar size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', margin: 0 }}>No tienes citas o reservas programadas.</p>
          </div>
        ) : (
          citas.map(cita => {
            let colorEstado = '#f59e0b'; let bgEstado = d ? '#451a03' : '#fef3c7';
            if (cita.estado === 'Completada') { colorEstado = '#10b981'; bgEstado = d ? '#064e3b' : '#d1fae5'; }
            if (cita.estado === 'Cancelada') { colorEstado = '#ef4444'; bgEstado = d ? '#7f1d1d' : '#fee2e2'; }

            return (
              <div key={cita.id} style={{...estilos.card, opacity: cita.estado === 'Cancelada' ? 0.6 : 1}}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: '800', color: sys.text }}>{cita.servicio}</h3>
                  <div style={{ color: sys.sub, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <Calendar size={16} /> {new Date(cita.fecha + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ color: sys.sub, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={16} /> {cita.hora?.substring(0, 5)} hrs
                  </div>
                </div>

                <div style={{ padding: '8px 16px', borderRadius: '999px', fontWeight: 'bold', fontSize: '14px', backgroundColor: bgEstado, color: colorEstado, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {cita.estado === 'Pendiente' && <Clock size={16} />}
                  {cita.estado === 'Completada' && <CheckCircle size={16} />}
                  {cita.estado === 'Cancelada' && <XCircle size={16} />}
                  {cita.estado}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}

export default MisCitas;