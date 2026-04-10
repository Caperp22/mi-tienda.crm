import { useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, Edit3 } from 'lucide-react';

function MiPerfil({ usuario, esTemaOscuro, setEsTemaOscuro, cerrarSesion, notificaciones, setNotificaciones, rutaNotificacion }) {
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
    }
  }

  const estilos = {
    container: { minHeight: '100vh', color: esTemaOscuro ? '#f8fafc' : '#0f172a', transition: 'color 0.3s', overflowX: 'hidden' },
    navbar: { background: esTemaOscuro ? '#1e293b' : '#ffffff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#e5e7eb'}`, position: 'sticky', top: 0, zIndex: 100 },
    navLinks: { color: esTemaOscuro ? '#e2e8f0' : '#4b5563', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' },
    badgeNotif: { position: 'absolute', top: '-6px', right: '-6px', background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
    formCard: { background: esTemaOscuro ? '#1e293b' : 'white', maxWidth: '500px', margin: '60px auto', padding: '40px', borderRadius: '16px', border: `1px solid ${esTemaOscuro ? '#334155' : '#e2e8f0'}`, boxShadow: esTemaOscuro ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.05)' },
    label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: esTemaOscuro ? '#cbd5e1' : '#475569' },
    input: { width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${esTemaOscuro ? '#475569' : '#cbd5e1'}`, background: esTemaOscuro ? '#0f172a' : '#f8fafc', color: esTemaOscuro ? 'white' : 'black', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', outline: 'none' },
    btnPrimary: { width: '100%', padding: '16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }
  };

  return (
    <div style={estilos.container}>
      <nav style={estilos.navbar}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Mi Tienda</div>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <Link to="/" style={estilos.navLinks}>Catálogo</Link>
          <Link to="/agendar" style={estilos.navLinks}>Agendar Cita</Link>
          <Link to="/mis-citas" style={estilos.navLinks}>Mis Citas</Link>
          <Link to="/mis-pedidos" style={estilos.navLinks}>Mis Pedidos</Link>
          <div style={{ borderLeft: `1px solid ${esTemaOscuro ? '#475569' : '#e5e7eb'}`, height: '24px', margin: '0 5px' }}></div>
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
                <div style={{ position: 'absolute', top: '35px', right: '-10px', width: '320px', background: esTemaOscuro ? '#1e293b' : 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: `1px solid ${esTemaOscuro ? '#334155' : '#e2e8f0'}`, zIndex: 999, overflow: 'hidden' }}>
                  <div style={{ padding: '15px', fontWeight: 'bold', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#f1f5f9'}`, color: esTemaOscuro ? '#f8fafc' : '#0f172a' }}>
                    Notificaciones ({Array.isArray(notificaciones) ? notificaciones.length : 0})
                  </div>
                  {!Array.isArray(notificaciones) || notificaciones.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay nada nuevo por aquí.</div>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notificaciones.map(n => (
                        <div key={n.id} onClick={() => { navigate(n.ruta); setNotificaciones(notificaciones.filter(x => x.id !== n.id)); setMostrarNotif(false); }} style={{ padding: '15px', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#f1f5f9'}`, cursor: 'pointer', fontSize: '13px', color: esTemaOscuro ? '#cbd5e1' : '#475569', transition: 'background 0.2s' }}>
                            <div style={{ fontWeight: 'bold', color: n.ruta === '/mis-citas' ? '#4f46e5' : '#10b981', marginBottom: '4px' }}>{n.ruta === '/mis-citas' ? '📅 Actualización de Cita' : '🛍️ Actualización de Pedido'}</div>
                            <div>{n.texto}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ borderLeft: `1px solid ${esTemaOscuro ? '#475569' : '#e5e7eb'}`, height: '24px', margin: '0 5px' }}></div>
          
          <Link to="/mi-perfil" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
            <User size={18} /><span>{usuario?.user_metadata?.nombre || 'Mi Perfil'}</span>
          </Link>
          
          <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: esTemaOscuro ? '#334155' : '#f3f4f6', color: estilos.navLinks.color, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', marginLeft: '5px' }}>Salir</button>
        </div>
      </nav>

      <div style={estilos.formCard}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Edit3 size={40} color="#3b82f6" style={{ marginBottom: '10px' }} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>Mi Perfil</h1>
          <p style={{ color: esTemaOscuro ? '#94a3b8' : '#64748b', marginTop: '10px' }}>Actualiza tus datos para tus pedidos.</p>
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