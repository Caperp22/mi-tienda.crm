import { useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, Edit3 } from 'lucide-react';

function MiPerfil({ usuario, esTemaOscuro, setEsTemaOscuro, cerrarSesion, notificaciones, setNotificaciones, empresaNombre, empresaConfig }) {
  const navigate = useNavigate();
  const [mostrarNotif, setMostrarNotif] = useState(false);
  
  // Cargamos los datos actuales
  const [nombre, setNombre] = useState(usuario?.user_metadata?.nombre || '');
  const [telefono, setTelefono] = useState(usuario?.user_metadata?.telefono || '');
  const [direccion, setDireccion] = useState(usuario?.user_metadata?.direccion || ''); // <-- NUEVO
  const [cargando, setCargando] = useState(false);

  async function guardarPerfil(e) {
    e.preventDefault();
    setCargando(true);

    const { error } = await supabase.auth.updateUser({
      data: { 
        nombre: nombre, 
        telefono: telefono,
        direccion: direccion // <-- NUEVO
      }
    });

    setCargando(false);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('¡Perfil Actualizado!', 'Tus datos se guardaron correctamente.', 'success');
      
      // Notificación local
      setNotificaciones(prev => [
        { id: Date.now(), ruta: '/mi-perfil', texto: 'Has actualizado tu información de perfil.' },
        ...(Array.isArray(prev) ? prev : [])
      ]);
    }
  }

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
    container: { minHeight: '100vh', color: sys.text, transition: 'color 0.3s', overflowX: 'hidden' },
    navbar: { background: sys.navBg, padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${sys.border}`, position: 'sticky', top: 0, zIndex: 100 },
    navLinks: { color: sys.text, textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' },
    badgeNotif: { position: 'absolute', top: '-6px', right: '-6px', background: cTer, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
    formCard: { background: sys.cardBg, maxWidth: '500px', margin: '60px auto', padding: '40px', borderRadius: '16px', border: `1px solid ${sys.border}`, boxShadow: d ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.05)' },
    label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: sys.text },
    input: { width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${sys.border}`, background: sys.bg, color: sys.text, fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', outline: 'none' },
    btnPrimary: { width: '100%', padding: '16px', background: cPrin, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }
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
              <Link to="/mis-citas" style={estilos.navLinks}>Mis Citas</Link>
            </>
          )}
          <div style={{ borderLeft: `1px solid ${sys.border}`, height: '24px', margin: '0 5px' }}></div>
          <button onClick={() => setEsTemaOscuro(!esTemaOscuro)} style={{ background: 'none', border: 'none', color: estilos.navLinks.color, cursor: 'pointer', padding: 0 }}><Sun size={22} /></button>
          
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
                        <div key={n.id} onClick={() => { navigate(n.ruta); setNotificaciones(notificaciones.filter(x => x.id !== n.id)); setMostrarNotif(false); }} style={{ padding: '15px', borderBottom: `1px solid ${sys.border}`, cursor: 'pointer', fontSize: '13px', color: sys.text, transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = sys.hover}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ fontWeight: 'bold', color: n.ruta === '/mis-citas' ? cPrin : cTer, marginBottom: '4px' }}>{n.ruta === '/mis-citas' ? '📅 Actualización de Cita' : '🛍️ Actualización de Pedido'}</div>
                            <div style={{ color: sys.sub }}>{n.texto}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ borderLeft: `1px solid ${sys.border}`, height: '24px', margin: '0 5px' }}></div>
          
          <Link to="/mi-perfil" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: cPrin, fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
            <User size={18} /><span>{usuario?.user_metadata?.nombre || 'Mi Perfil'}</span>
          </Link>
          
          <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: sys.hover, color: sys.text, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', marginLeft: '5px' }}>Salir</button>
        </div>
      </nav>

      <div style={estilos.formCard}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Edit3 size={40} color={cPrin} style={{ marginBottom: '10px' }} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: sys.text }}>Mi Perfil</h1>
          <p style={{ color: sys.sub, marginTop: '10px' }}>Actualiza tus datos para tus pedidos.</p>
        </div>

        <form onSubmit={guardarPerfil}>
          <label style={estilos.label}>Correo Electrónico</label>
          <input type="text" style={{...estilos.input, opacity: 0.6, cursor: 'not-allowed'}} value={usuario?.email} disabled />

          <label style={estilos.label}>Nombre Completo</label>
          <input type="text" style={estilos.input} placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

          <label style={estilos.label}>Teléfono o WhatsApp</label>
          <input type="tel" style={estilos.input} placeholder="Ej. 5512345678" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />

          {/* NUEVO CAMPO DE DIRECCIÓN */}
          <label style={estilos.label}>Dirección de Envío</label>
          <textarea 
            style={{...estilos.input, minHeight: '80px', resize: 'vertical'}} 
            placeholder="Ej. Calle 123 #45-67, Colonia Centro, Ciudad" 
            value={direccion} 
            onChange={(e) => setDireccion(e.target.value)} 
            required 
          />

          <button type="submit" disabled={cargando} style={{...estilos.btnPrimary, opacity: cargando ? 0.5 : 1}}>
            {cargando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MiPerfil;