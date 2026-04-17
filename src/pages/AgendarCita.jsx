import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Bell, User, Calendar, Clock, Sparkles } from 'lucide-react';

function AgendarCita({ usuario, esTemaOscuro, setEsTemaOscuro, cerrarSesion, notificaciones, setNotificaciones, empresaId, empresaNombre, empresaConfig }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState(location.state?.servicioPrevio || '');
  const [observaciones, setObservaciones] = useState('');
  
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [listaServicios, setListaServicios] = useState([]);
  const [cargando, setCargando] = useState(false);

  const imgFallback = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80';

  // --- MAGIA: GENERADOR DE HORARIOS DINÁMICO ---
  function generarHorarios() {
    const apertura = empresaConfig?.hora_apertura || '09:00';
    const cierre = empresaConfig?.hora_cierre || '18:00';
    const intervalo = empresaConfig?.intervalo_citas || 30;
    
    let [horaInicio, minInicio] = apertura.split(':').map(Number);
    let [horaFin, minFin] = cierre.split(':').map(Number);

    const horarios = [];
    let tiempoActual = horaInicio * 60 + (minInicio || 0);
    const tiempoCierre = horaFin * 60 + (minFin || 0);

    while (tiempoActual < tiempoCierre) {
      const h = Math.floor(tiempoActual / 60).toString().padStart(2, '0');
      const m = (tiempoActual % 60).toString().padStart(2, '0');
      horarios.push(`${h}:${m}`);
      tiempoActual += Number(intervalo); // Saltos dinámicos configurables
    }
    return horarios;
  }
  const HORARIOS_ATENCION = generarHorarios();

  useEffect(() => {
    async function obtenerDatosIniciales() {
      if (!empresaId) return;
      // Traemos bloqueos
      const { data: bloqueos } = await supabase.from('fechas_bloqueadas').select('*').eq('empresa_id', empresaId);
      if (bloqueos) setFechasBloqueadas(bloqueos);
      // Traemos servicios de la empresa
      const { data: serviciosDb } = await supabase.from('servicios').select('*').eq('empresa_id', empresaId).order('nombre');
      if (serviciosDb) setListaServicios(serviciosDb);
    }
    obtenerDatosIniciales();
  }, [empresaId]);

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
    
    const { data } = await supabase.from('citas').select('hora').eq('fecha', diaSeleccionado).eq('empresa_id', empresaId).neq('estado', 'Cancelada');

    if (data) setHorasOcupadas(data.map(cita => cita.hora.substring(0, 5)));
  }

  async function confirmarCita(e) {
    e.preventDefault();
    setCargando(true);

    const nombreCliente = usuario.user_metadata?.nombre || 'Cliente Web';
    const telefonoCliente = usuario.user_metadata?.telefono || 'No especificado';

    const { error } = await supabase.from('citas').insert([{
      cliente_nombre: nombreCliente,
      cliente_email: usuario.email,
      fecha: fecha,
      hora: hora,
      servicio: servicio,
      observaciones: observaciones,
      estado: 'Pendiente',
      empresa_id: empresaId
    }]);

    setCargando(false);

    if (error) {
      Swal.fire('Error de Base de Datos', error.message, 'error');
    } else {
      // Armamos el mensaje de WhatsApp para el administrador
      let textoMensaje = "📅 *¡Nueva Cita Agendada!*\n\n";
      textoMensaje += `▪️ *Servicio:* ${servicio}\n`;
      textoMensaje += `▪️ *Fecha:* ${fecha}\n`;
      textoMensaje += `▪️ *Hora:* ${hora}\n`;
      textoMensaje += `--------------------------\n`;
      textoMensaje += `👤 *Cliente:* ${nombreCliente} (${usuario.email})\n`;
      textoMensaje += `📞 *Teléfono:* ${telefonoCliente}\n`;
      if (observaciones) {
        textoMensaje += `📝 *Observaciones:* ${observaciones}\n`;
      }

      const miNumeroWhatsApp = empresaConfig?.telefono || "521234567890";

      // Notificación local de éxito
      setNotificaciones(prev => [
        { id: Date.now(), ruta: '/mis-citas', texto: `¡Tu cita para ${servicio} el ${fecha} ha sido confirmada!` },
        ...(Array.isArray(prev) ? prev : [])
      ]);

      Swal.fire({ icon: 'success', title: '¡Cita Agendada!', text: 'Te esperamos el día de tu reserva.', timer: 2000, showConfirmButton: false });
      
      setTimeout(() => {
        window.open(`https://wa.me/${miNumeroWhatsApp}?text=${encodeURIComponent(textoMensaje)}`, '_blank');
        navigate('/mis-citas'); 
      }, 2000);
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
    navbar: { background: sys.navBg, padding: '15px 20px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${sys.border}`, position: 'sticky', top: 0, zIndex: 100 },
    navLinks: { color: sys.text, textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' },
    badgeNotif: { position: 'absolute', top: '-6px', right: '-6px', background: cTer, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
    formCard: { background: sys.cardBg, maxWidth: '600px', margin: '40px auto', padding: '40px', borderRadius: '16px', border: `1px solid ${sys.border}`, boxShadow: d ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.05)' },
    label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: sys.text },
    input: { width: '100%', padding: '14px', borderRadius: '8px', border: `1px solid ${sys.border}`, background: sys.bg, color: sys.text, fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', outline: 'none' },
    gridHoras: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' },
    btnHora: (ocupada, seleccionada) => ({
      padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: ocupada ? 'not-allowed' : 'pointer',
      background: seleccionada ? cPrin : ocupada ? sys.border : sys.bg,
      color: seleccionada ? 'white' : ocupada ? sys.sub : sys.text,
      border: `1px solid ${seleccionada ? cPrin : ocupada ? 'transparent' : sys.border}`, transition: 'all 0.2s'
    }),
    btnPrimary: { width: '100%', padding: '16px', background: cPrin, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }
  };

  return (
    <div style={estilos.container}>
      <nav style={estilos.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {empresaConfig?.logo_url ? (
            <img src={empresaConfig.logo_url} alt={empresaNombre} style={{ height: '40px', objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{empresaNombre}</div>
          )}
        </div>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          {empresaConfig?.usa_inventario && (
            <>
              <Link to="/" style={estilos.navLinks}>Catálogo</Link>
              <Link to="/mis-pedidos" style={estilos.navLinks}>Mis Pedidos</Link>
            </>
          )}
          {empresaConfig?.usa_citas && (
            <>
              <Link to="/agendar" style={{...estilos.navLinks, color: cPrin, fontWeight: 'bold'}}>Agendar Cita</Link>
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

      <div style={estilos.formCard}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Sparkles size={40} color={cPrin} style={{ marginBottom: '10px' }} />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: sys.text }}>Reserva tu Cita</h1>
          <p style={{ color: sys.sub, marginTop: '10px' }}>Selecciona el servicio y el horario de tu preferencia.</p>
        </div>

        <form onSubmit={confirmarCita}>
          <label style={estilos.label}>¿Qué servicio necesitas?</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {listaServicios.map(s => {
              const seleccionado = servicio === s.nombre;
              return (
                <div 
                  key={s.id} 
                  onClick={() => setServicio(s.nombre)}
                  style={{
                    border: `2px solid ${seleccionado ? cPrin : sys.border}`,
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    background: sys.cardBg,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    opacity: (servicio && !seleccionado) ? 0.6 : 1,
                    transform: seleccionado ? 'scale(1.02)' : 'scale(1)'
                  }}
                >
                  <img src={s.imagen || imgFallback} alt={s.nombre} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                  <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 'bold', color: sys.text }}>{s.nombre}</h3>
                  {s.descripcion && <p style={{ margin: '0 0 8px', fontSize: '11px', color: sys.sub, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.descripcion}</p>}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                    {s.precio > 0 && <span style={{ fontSize: '13px', color: cPrin, fontWeight: '700' }}>${Number(s.precio).toLocaleString('es-CO')}</span>}
                    {s.duracion && <span style={{ fontSize: '12px', color: sys.sub, display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={12} /> {s.duracion}'</span>}
                  </div>
                </div>
              )
            })}
          </div>

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

          <label style={estilos.label}>Observaciones o detalles (opcional)</label>
          <textarea 
            style={{ ...estilos.input, minHeight: '80px', resize: 'vertical' }} 
            placeholder="Ej: Necesito que sea rápido, tengo alguna alergia, es para un evento especial..." 
            value={observaciones} 
            onChange={(e) => setObservaciones(e.target.value)} 
          />

          <button type="submit" disabled={!fecha || !hora || !servicio || cargando} style={{...estilos.btnPrimary, opacity: (!fecha || !hora || !servicio) ? 0.5 : 1}}>
            {cargando ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AgendarCita;