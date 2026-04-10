import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, Calendar, Clock, Sparkles } from 'lucide-react';

function AgendarCita({ usuario, esTemaOscuro, setEsTemaOscuro, cerrarSesion, notificaciones, setNotificaciones }) {
  const navigate = useNavigate();
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState('');
  
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [cargando, setCargando] = useState(false);

  const HORARIOS_ATENCION = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    async function obtenerBloqueos() {
      const { data } = await supabase.from('fechas_bloqueadas').select('*');
      if (data) setFechasBloqueadas(data);
    }
    obtenerBloqueos();
  }, []);

  async function manejarCambioFecha(e) {
    const diaSeleccionado = e.target.value;
    const hoy = new Date().toISOString().split('T')[0];
    
    if (diaSeleccionado < hoy) {
      setFecha('');
      return Swal.fire('Aviso', 'No puedes agendar citas en el pasado.', 'warning');
    }

    const diaCerrado = fechasBloqueadas.find(b => b.fecha === diaSeleccionado);
    if (diaCerrado) {
      setFecha('');
      setHora('');
      return Swal.fire('Día no disponible', `Este día está cerrado: ${diaCerrado.motivo || 'No laborable'}`, 'info');
    }

    setFecha(diaSeleccionado);
    setHora(''); 
    
    const { data } = await supabase.from('citas').select('hora').eq('fecha', diaSeleccionado).neq('estado', 'Cancelada');

    if (data) setHorasOcupadas(data.map(cita => cita.hora.substring(0, 5)));
  }

  async function confirmarCita(e) {
    e.preventDefault();
    setCargando(true);

    const { error } = await supabase.from('citas').insert([{
      cliente_nombre: usuario.user_metadata?.nombre || 'Cliente Web',
      cliente_email: usuario.email,
      fecha: fecha,
      hora: hora,
      servicio: servicio,
      estado: 'Pendiente'
    }]);

    setCargando(false);

    if (error) {
      Swal.fire('Error de Base de Datos', error.message, 'error');
    } else {
      Swal.fire('¡Cita Agendada!', 'Te esperamos el día de tu reserva.', 'success');
      navigate('/mis-citas'); 
    }
  }

  const estilos = {
    container: { minHeight: '100vh', color: esTemaOscuro ? '#f8fafc' : '#0f172a', transition: 'color 0.3s', overflowX: 'hidden' },
    navbar: { background: esTemaOscuro ? '#1e293b' : '#ffffff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#e5e7eb'}`, position: 'sticky', top: 0, zIndex: 100 },
    navLinks: { color: esTemaOscuro ? '#e2e8f0' : '#4b5563', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' },
    badgeNotif: { position: 'absolute', top: '-6px', right: '-6px', background: '#3b82f6', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
    formCard: { background: esTemaOscuro ? '#1e293b' : 'white', maxWidth: '600px', margin: '40px auto', padding: '40px', borderRadius: '16px', border: `1px solid ${esTemaOscuro ? '#334155' : '#e2e8f0'}`, boxShadow: esTemaOscuro ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.05)' },
    label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: esTemaOscuro ? '#cbd5e1' : '#475569' },
    input: { width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${esTemaOscuro ? '#475569' : '#cbd5e1'}`, background: esTemaOscuro ? '#0f172a' : '#f8fafc', color: esTemaOscuro ? 'white' : 'black', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', outline: 'none' },
    gridHoras: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' },
    btnHora: (ocupada, seleccionada) => ({
      padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: ocupada ? 'not-allowed' : 'pointer',
      background: seleccionada ? '#4f46e5' : ocupada ? (esTemaOscuro ? '#334155' : '#e2e8f0') : (esTemaOscuro ? '#0f172a' : 'white'),
      color: seleccionada ? 'white' : ocupada ? '#94a3b8' : (esTemaOscuro ? '#e2e8f0' : '#475569'),
      border: `1px solid ${seleccionada ? '#4f46e5' : ocupada ? 'transparent' : (esTemaOscuro ? '#475569' : '#cbd5e1')}`, transition: 'all 0.2s'
    }),
    btnPrimary: { width: '100%', padding: '16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }
  };

  return (
    <div style={estilos.container}>
      <nav style={estilos.navbar}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Mi Tienda</div>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <Link to="/" style={estilos.navLinks}>Catálogo</Link>
          <Link to="/agendar" style={{...estilos.navLinks, color: '#3b82f6', fontWeight: 'bold'}}>Agendar Cita</Link>
          <Link to="/mis-citas" style={estilos.navLinks}>Mis Citas</Link>
          <Link to="/mis-pedidos" style={estilos.navLinks}>Mis Pedidos</Link>
          
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: esTemaOscuro ? '#94a3b8' : '#64748b', fontSize: '14px', fontWeight: '500' }}>
            <User size={18} /><span>{usuario?.email}</span>
          </div>
          <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: esTemaOscuro ? '#334155' : '#f3f4f6', color: estilos.navLinks.color, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', marginLeft: '5px' }}>Salir</button>
        </div>
      </nav>

      <div style={estilos.formCard}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Sparkles size={40} color="#4f46e5" style={{ marginBottom: '10px' }} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>Reserva tu Cita</h1>
          <p style={{ color: esTemaOscuro ? '#94a3b8' : '#64748b', marginTop: '10px' }}>Selecciona el servicio y el horario de tu preferencia.</p>
        </div>

        <form onSubmit={confirmarCita}>
          <label style={estilos.label}>¿Qué servicio necesitas?</label>
          <select style={estilos.input} value={servicio} onChange={(e) => setServicio(e.target.value)} required>
            <option value="">-- Selecciona una opción --</option>
            <option value="Asesoría General">Asesoría General</option>
            <option value="Servicio Técnico">Servicio Técnico</option>
            <option value="Reunión de Negocios">Reunión de Negocios</option>
          </select>

          <label style={estilos.label}><Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Día de la cita</label>
          <input type="date" style={estilos.input} value={fecha} onChange={manejarCambioFecha} required />

          {fecha && (
            <>
              <label style={estilos.label}><Clock size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Horarios Disponibles</label>
              <div style={estilos.gridHoras}>
                {HORARIOS_ATENCION.map(h => {
                  const estaOcupada = horasOcupadas.includes(h);
                  const estaSeleccionada = hora === h;
                  return (
                    <button key={h} type="button" disabled={estaOcupada} onClick={() => setHora(h)} style={estilos.btnHora(estaOcupada, estaSeleccionada)}>{h}</button>
                  );
                })}
              </div>
            </>
          )}

          <button type="submit" disabled={!fecha || !hora || !servicio || cargando} style={{...estilos.btnPrimary, opacity: (!fecha || !hora || !servicio) ? 0.5 : 1}}>
            {cargando ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AgendarCita;