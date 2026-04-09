import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Swal from 'sweetalert2';
import { Calendar as CalendarIcon, Clock, User, CheckCircle, XCircle, ShieldAlert, Trash2 } from 'lucide-react';

// --- INTERFACES DE TYPESCRIPT ---
// Le decimos a TypeScript la estructura exacta de nuestros datos
interface Cita {
  id: number;
  cliente_nombre: string;
  cliente_email: string;
  fecha: string;
  hora: string;
  servicio: string;
  estado: string;
}

interface Bloqueo {
  id: number;
  fecha: string;
  motivo: string;
}

function Agenda({ refreshCitas, notifCitasAdmin, setNotifCitasAdmin }: any) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fechasBloqueadas, setFechasBloqueadas] = useState<Bloqueo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const [nuevoBloqueo, setNuevoBloqueo] = useState({ fecha: '', motivo: '' });

  // 2. Agregamos las variables al array de dependencias del useEffect
  useEffect(() => {
    obtenerDatos();
    
    // 3. Limpiamos las notificaciones al abrir la página
    if (notifCitasAdmin > 0) {
      setNotifCitasAdmin(0);
    }
  }, [refreshCitas, notifCitasAdmin]); // <- ¡IMPORTANTE ESTE CORCHETE!

  async function obtenerDatos() {
    setCargando(true);
    // 1. Traemos las citas
    const { data: dataCitas } = await supabase
      .from('citas')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    
    // Le indicamos a TS que confíe en que los datos que llegan tienen la forma de "Cita[]"
    if (dataCitas) setCitas(dataCitas as Cita[]);

    // 2. Traemos las fechas bloqueadas
    const { data: dataBloqueos } = await supabase
      .from('fechas_bloqueadas')
      .select('*')
      .order('fecha', { ascending: true });
      
    if (dataBloqueos) setFechasBloqueadas(dataBloqueos as Bloqueo[]);
    
    setCargando(false);
  }

  // --- FUNCIONES DE CITAS ---
  async function cambiarEstado(id: number, nuevoEstado: string) {
    const { error } = await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', id);
    if (error) {
      Swal.fire('Error', 'No se pudo actualizar la cita', 'error');
    } else {
      obtenerDatos();
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      Toast.fire({ icon: 'success', title: `Cita ${nuevoEstado.toLowerCase()}` });
    }
  }

  // --- FUNCIONES DE BLOQUEOS ---
  async function bloquearFecha(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoBloqueo.fecha) return Swal.fire('Aviso', 'Selecciona una fecha', 'warning');

    const { error } = await supabase.from('fechas_bloqueadas').insert([nuevoBloqueo]);
    if (error) {
      Swal.fire('Error', 'No se pudo bloquear la fecha', 'error');
    } else {
      setNuevoBloqueo({ fecha: '', motivo: '' });
      obtenerDatos();
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Fecha bloqueada', showConfirmButton: false, timer: 1500 });
    }
  }

  async function desbloquearFecha(id: number) {
    await supabase.from('fechas_bloqueadas').delete().eq('id', id);
    obtenerDatos();
  }

  const estilos: { [key: string]: React.CSSProperties } = {
    container: { fontFamily: 'sans-serif', color: '#1e293b' },
    gridPrincipal: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', alignItems: 'start' },
    
    // Tarjetas generales
    card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    tituloCard: { fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    
    // Formularios
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' },
    label: { fontSize: '13px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc' },
    btnBloqueo: { width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    
    // Lista de Citas
    citaCard: { background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
    infoText: { display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', marginBottom: '5px' },
    btnAction: { padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' },
    
    // Lista de Bloqueos
    bloqueoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', padding: '12px 15px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '10px' }
  };

  return (
    <div style={estilos.container}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>Panel de Agenda</h1>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Administra reservas entrantes y días no laborables.</p>

      <div style={estilos.gridPrincipal}>
        
        {/* COLUMNA IZQUIERDA: GESTIÓN DE CITAS */}
        <div style={estilos.card}>
          <h2 style={estilos.tituloCard}><CalendarIcon size={20} color="#4f46e5" /> Citas de Clientes</h2>
          
          {cargando ? <p>Cargando...</p> : citas.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No hay citas agendadas.</p>
          ) : (
            citas.map((cita) => {
              const esPasada = cita.estado === 'Cancelada' || cita.estado === 'Completada';
              
              return (
                <div key={cita.id} style={{...estilos.citaCard, opacity: esPasada ? 0.6 : 1}}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>{cita.servicio}</h3>
                    <div style={estilos.infoText}>
                      <CalendarIcon size={14} /> <strong>Fecha:</strong> {new Date(cita.fecha + "T00:00:00").toLocaleDateString()}
                    </div>
                    <div style={estilos.infoText}>
                      <Clock size={14} /> <strong>Hora:</strong> {cita.hora.substring(0, 5)}
                    </div>
                    <div style={estilos.infoText}>
                      <User size={14} /> <strong>Cliente:</strong> {cita.cliente_nombre} ({cita.cliente_email})
                    </div>
                    <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', background: cita.estado === 'Pendiente' ? '#fef3c7' : '#f1f5f9', color: cita.estado === 'Pendiente' ? '#d97706' : '#64748b' }}>
                      {cita.estado}
                    </span>
                  </div>

                  {cita.estado === 'Pendiente' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => cambiarEstado(cita.id, 'Completada')} style={{ ...estilos.btnAction, background: '#10b981', color: 'white' }}>
                        <CheckCircle size={14} /> Completar
                      </button>
                      <button onClick={() => cambiarEstado(cita.id, 'Cancelada')} style={{ ...estilos.btnAction, background: 'white', color: '#ef4444', border: '1px solid #fecaca' }}>
                        <XCircle size={14} /> Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* COLUMNA DERECHA: BLOQUEO DE FECHAS */}
        <div>
          {/* Formulario de Bloqueo */}
          <div style={{...estilos.card, marginBottom: '20px'}}>
            <h2 style={{...estilos.tituloCard, color: '#ef4444'}}><ShieldAlert size={20} /> Bloquear Fecha</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>Evita que los clientes agenden en días específicos (Vacaciones, festivos, mantenimiento).</p>
            
            <form onSubmit={bloquearFecha}>
              <div style={estilos.inputGroup}>
                <label style={estilos.label}>Día a bloquear</label>
                <input type="date" style={estilos.input} value={nuevoBloqueo.fecha} onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, fecha: e.target.value})} required />
              </div>
              <div style={estilos.inputGroup}>
                <label style={estilos.label}>Motivo (Opcional)</label>
                <input style={estilos.input} placeholder="Ej: Vacaciones" value={nuevoBloqueo.motivo} onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, motivo: e.target.value})} />
              </div>
              <button type="submit" style={estilos.btnBloqueo}>Cerrar Agenda en esta fecha</button>
            </form>
          </div>

          {/* Lista de fechas bloqueadas */}
          <div style={estilos.card}>
            <h2 style={estilos.tituloCard}>Fechas Cerradas</h2>
            {fechasBloqueadas.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No hay bloqueos activos.</p>
            ) : (
              fechasBloqueadas.map(b => (
                <div key={b.id} style={estilos.bloqueoItem}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#991b1b' }}>{new Date(b.fecha + "T00:00:00").toLocaleDateString()}</div>
                    <div style={{ fontSize: '12px', color: '#ef4444' }}>{b.motivo || 'Sin especificar'}</div>
                  </div>
                  <button onClick={() => desbloquearFecha(b.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Quitar bloqueo">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Agenda;