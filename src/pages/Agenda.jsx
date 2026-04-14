import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Calendar, Clock, CheckCircle, XCircle, Trash2, ShieldAlert, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

function Agenda({ refreshCitas, notifCitasAdmin, setNotifCitasAdmin, empresaId }) {
  const [citas, setCitas] = useState([]);
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DEL CALENDARIO ---
  const [mesActual, setMesActual] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [nuevoBloqueo, setNuevoBloqueo] = useState({ fecha: '', motivo: '' });

  const obtenerDatos = useCallback(async () => {
    // Traer Citas
    const { data: dataCitas } = await supabase
      .from('citas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: true });
    if (dataCitas) setCitas(dataCitas);

    // Traer Fechas Bloqueadas
    const { data: dataBloqueos } = await supabase
      .from('fechas_bloqueadas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: true });
    if (dataBloqueos) setFechasBloqueadas(dataBloqueos);
    
    setCargando(false);
  }, [empresaId]);

  useEffect(() => {
    const timer = setTimeout(() => obtenerDatos(), 0);
    
    // Limpiamos la campanita roja al abrir esta pantalla
    if (notifCitasAdmin > 0) {
      // Usamos setTimeout para deferir la limpieza y evitar el "cascading render"
      setTimeout(() => setNotifCitasAdmin(0), 0);
    }

    return () => clearTimeout(timer);
  }, [refreshCitas, notifCitasAdmin, obtenerDatos, setNotifCitasAdmin]); 

  async function cambiarEstado(id, nuevoEstado) {
    const { error } = await supabase
      .from('citas')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (!error) {
      setCitas(citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Cita marcada como ${nuevoEstado}`,
        showConfirmButton: false,
        timer: 2000
      });
    } else {
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  }

  async function bloquearFecha(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('fechas_bloqueadas')
      .insert([{ ...nuevoBloqueo, empresa_id: empresaId }])
      .select();

    if (!error && data) {
      setFechasBloqueadas([...fechasBloqueadas, data[0]]);
      setNuevoBloqueo({ fecha: '', motivo: '' });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Fecha bloqueada correctamente', showConfirmButton: false, timer: 2000 });
    }
  }

  async function eliminarBloqueo(id) {
    const { error } = await supabase.from('fechas_bloqueadas').delete().eq('id', id);
    if (!error) {
      setFechasBloqueadas(fechasBloqueadas.filter(b => b.id !== id));
      Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Día liberado', showConfirmButton: false, timer: 2000 });
    }
  }

  // --- LÓGICA DEL CALENDARIO ---
  const cambiarMes = (offset) => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + offset, 1));
  };

  const diasMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate();
  const primerDiaIndex = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay();
  const emptyCells = primerDiaIndex === 0 ? 6 : primerDiaIndex - 1; // Ajuste para que Lunes sea la primera columna

  const citasFiltradas = fechaSeleccionada
    ? citas.filter(c => c.fecha === fechaSeleccionada)
    : citas;

  const estilos = {
    card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
    btnEstado: (color, bg) => ({ padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: bg, color: color }),
    input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }
  };

  if (cargando) return <div>Cargando agenda...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Agenda de Citas</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Administra tus reservaciones y horarios disponibles.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: CALENDARIO Y BLOQUEOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* --- CALENDARIO MENSUAL --- */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => cambiarMes(-1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: '#64748b', display: 'flex' }}><ChevronLeft size={20} /></button>
              <h3 style={{ textTransform: 'capitalize', margin: 0, color: '#1e293b', fontSize: '16px' }}>
                {mesActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => cambiarMes(1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: '#64748b', display: 'flex' }}><ChevronRight size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', marginBottom: '10px', fontSize: '12px' }}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} style={{ fontWeight: 'bold', color: '#94a3b8' }}>{d}</div>)}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
              {Array.from({ length: emptyCells }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: diasMes }).map((_, i) => {
                const dia = i + 1;
                const fechaStr = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const citasDia = citas.filter(c => c.fecha === fechaStr && c.estado !== 'Cancelada');
                const bloqueo = fechasBloqueadas.find(b => b.fecha === fechaStr);
                const esSeleccionada = fechaSeleccionada === fechaStr;
                
                const hoyObj = new Date();
                const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
                const esHoy = fechaStr === hoyStr;

                return (
                  <div
                    key={dia}
                    onClick={() => setFechaSeleccionada(esSeleccionada ? null : fechaStr)}
                    style={{
                      padding: '8px 0',
                      textAlign: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: esSeleccionada ? '#3b82f6' : (esHoy ? '#eff6ff' : 'transparent'),
                      color: esSeleccionada ? 'white' : (esHoy ? '#1d4ed8' : '#334155'),
                      border: esHoy && !esSeleccionada ? '1px solid #bfdbfe' : '1px solid transparent',
                      fontWeight: esSeleccionada || esHoy ? 'bold' : 'normal',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    onMouseEnter={(e) => { if (!esSeleccionada) e.currentTarget.style.background = '#f1f5f9' }}
                    onMouseLeave={(e) => { if (!esSeleccionada) e.currentTarget.style.background = esHoy ? '#eff6ff' : 'transparent' }}
                  >
                    <span>{dia}</span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', height: '6px' }}>
                      {bloqueo && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: esSeleccionada ? 'white' : '#ef4444' }} title="Día bloqueado" />}
                      {!bloqueo && citasDia.length > 0 && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: esSeleccionada ? 'white' : '#10b981' }} title={`${citasDia.length} citas`} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- BLOQUEO DE FECHAS --- */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={20} color="#ef4444"/> Bloquear Fechas</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Cierra días específicos para que los clientes no puedan agendar.</p>
            
            <form onSubmit={bloquearFecha} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input type="date" style={{...estilos.input, flex: 1, minWidth: '130px'}} value={nuevoBloqueo.fecha} onChange={e => setNuevoBloqueo({...nuevoBloqueo, fecha: e.target.value})} required />
              <input type="text" placeholder="Motivo" style={{...estilos.input, flex: 1, minWidth: '130px'}} value={nuevoBloqueo.motivo} onChange={e => setNuevoBloqueo({...nuevoBloqueo, motivo: e.target.value})} />
              <button type="submit" style={{ padding: '10px 15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Bloquear</button>
            </form>

            <div>
              {fechasBloqueadas.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{b.fecha}</span>
                    <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '10px' }}>{b.motivo || 'Día inhábil'}</span>
                  </div>
                  <button onClick={() => eliminarBloqueo(b.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              ))}
              {fechasBloqueadas.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>No hay bloqueos activos.</p>}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA DE CITAS */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
              {fechaSeleccionada ? `Citas del ${fechaSeleccionada.split('-').reverse().join('/')}` : 'Citas Programadas'}
            </h2>
            {fechaSeleccionada && (
              <button onClick={() => setFechaSeleccionada(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontSize: '12px', fontWeight: 'bold' }}>
                <Filter size={14} /> Ver todas
              </button>
            )}
          </div>
          
          {citasFiltradas.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>{fechaSeleccionada ? 'No hay citas para este día.' : 'No hay citas agendadas.'}</p>
          ) : (
            citasFiltradas.map(cita => (
              <div key={cita.id} style={{...estilos.card, opacity: cita.estado === 'Cancelada' ? 0.6 : 1}}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{cita.servicio}</h3>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#334155' }}>👤 {cita.cliente_nombre || cita.cliente_email}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#64748b', display: 'flex', gap: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {cita.fecha}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {cita.hora.substring(0,5)}</span>
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {cita.estado === 'Pendiente' ? (
                    <>
                      <button onClick={() => cambiarEstado(cita.id, 'Completada')} style={estilos.btnEstado('#059669', '#d1fae5')}><CheckCircle size={16}/> Completar</button>
                      <button onClick={() => cambiarEstado(cita.id, 'Cancelada')} style={estilos.btnEstado('#dc2626', '#fee2e2')}><XCircle size={16}/> Cancelar</button>
                    </>
                  ) : (
                    <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', backgroundColor: cita.estado === 'Completada' ? '#d1fae5' : '#fee2e2', color: cita.estado === 'Completada' ? '#059669' : '#dc2626' }}>
                      {cita.estado}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default Agenda;