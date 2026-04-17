import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Calendar, Clock, CheckCircle, XCircle, Trash2, ShieldAlert, ChevronLeft, ChevronRight, Filter, Eye, X, RefreshCw } from 'lucide-react';

function Agenda({ refreshCitas, notifCitasAdmin, setNotifCitasAdmin, empresaId, dark = false, color = '#3b82f6' }) {
  const [citas,            setCitas]            = useState([]);
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [cargando,         setCargando]         = useState(true);
  const [mesActual,        setMesActual]        = useState(new Date());
  const [fechaSel,         setFechaSel]         = useState(null);
  const [nuevoBloqueo,     setNuevoBloqueo]     = useState({ fecha: '', motivo: '' });
  const [bloqueando,       setBloqueando]       = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [detallesCliente,  setDetallesCliente]  = useState(null);
  const [citaReprogramar,  setCitaReprogramar]  = useState(null);
  const [nuevaFecha,       setNuevaFecha]       = useState('');
  const [nuevaHora,        setNuevaHora]        = useState('');

  /* ─── Tema ──────────────────────────────────────────────── */
  const t = {
    card:   dark ? 'rgba(255,255,255,0.04)' : 'white',
    border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    borderL:dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    text:   dark ? '#f0f4ff'                : '#0f172a',
    sub:    dark ? '#94a3b8'                : '#64748b',
    input:  dark ? 'rgba(255,255,255,0.06)' : 'white',
    inputB: dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
    inputT: dark ? '#e2e8f0'                : '#1e293b',
    blk:    dark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
  };
  const inp = { padding: '9px 12px', borderRadius: '8px', border: `1px solid ${t.inputB}`, background: t.input, color: t.inputT, fontSize: '13px', outline: 'none', boxSizing: 'border-box' };

  /* ─── Datos ─────────────────────────────────────────────── */
  const obtener = useCallback(async () => {
    const [{ data: dc }, { data: db }] = await Promise.all([
      supabase.from('citas').select('*').eq('empresa_id', empresaId).order('fecha', { ascending: true }),
      supabase.from('fechas_bloqueadas').select('*').eq('empresa_id', empresaId).order('fecha', { ascending: true }),
    ]);
    setCitas(dc || []);
    setFechasBloqueadas(db || []);
    setCargando(false);
  }, [empresaId]);

  useEffect(() => {
    const t1 = setTimeout(() => obtener(), 0);
    if (notifCitasAdmin > 0) setTimeout(() => setNotifCitasAdmin(0), 0);
    return () => clearTimeout(t1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCitas]);

  /* ─── Acciones ──────────────────────────────────────────── */
  async function cambiarEstado(id, nuevoEstado) {
    const cita = citas.find(c => c.id === id);

    // Si se está cancelando, pedir confirmación
    if (nuevoEstado === 'Cancelada') {
      const { isConfirmed } = await Swal.fire({
        title: '¿Cancelar esta cita?',
        html: `Se cancelará la cita de <strong>${cita?.cliente_nombre || 'Cliente'}</strong> para el servicio de <strong>${cita?.servicio}</strong>.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'No, mantener',
        confirmButtonText: 'Sí, cancelar cita'
      });
      if (!isConfirmed) return;
    }

    const { error } = await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', id);
    if (!error) {
      setCitas(citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Cita ${nuevoEstado}`, showConfirmButton: false, timer: 1800 });

      // Notificar por correo si se canceló
      if (nuevoEstado === 'Cancelada' && cita?.cliente_email) {
        const subject = encodeURIComponent('Cancelación de cita programada');
        const body = encodeURIComponent(`Hola ${cita.cliente_nombre},\n\nLamentamos informarte que tu cita para el servicio de "${cita.servicio}" programada para el día ${cita.fecha} a las ${cita.hora?.substring(0,5)} ha sido cancelada.\n\nPor favor, contáctanos si deseas reprogramarla.\n\nSaludos cordiales.`);
        window.location.href = `mailto:${cita.cliente_email}?subject=${subject}&body=${body}`;
      }
    }
  }

  async function bloquearFecha(e) {
    e.preventDefault();
    if (!nuevoBloqueo.fecha) return;
    setBloqueando(true);
    const { data, error } = await supabase
      .from('fechas_bloqueadas')
      .insert([{ fecha: nuevoBloqueo.fecha, motivo: nuevoBloqueo.motivo || '', empresa_id: empresaId }])
      .select();
    setBloqueando(false);
    if (error) return Swal.fire('Error al bloquear', error.message, 'error');
    if (data?.[0]) {
      setFechasBloqueadas(prev => [...prev, data[0]]);
      setNuevoBloqueo({ fecha: '', motivo: '' });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Fecha bloqueada', showConfirmButton: false, timer: 1800 });
    }
  }

  async function eliminarBloqueo(id) {
    const { error } = await supabase.from('fechas_bloqueadas').delete().eq('id', id);
    if (error) return Swal.fire('Error', error.message, 'error');
    setFechasBloqueadas(prev => prev.filter(b => b.id !== id));
  }

  async function abrirDetalles(cita) {
    setCitaSeleccionada(cita);
    setDetallesCliente(null);
    if (cita.cliente_email) {
      const { data } = await supabase.from('clientes').select('telefono, direccion').eq('correo', cita.cliente_email).eq('empresa_id', empresaId).maybeSingle();
      if (data) setDetallesCliente(data);
    }
  }

  function abrirReprogramar(cita) {
    setCitaReprogramar(cita);
    setNuevaFecha(cita.fecha);
    setNuevaHora(cita.hora ? cita.hora.substring(0, 5) : '');
  }

  async function guardarReprogramacion(e) {
    e.preventDefault();
    const { error } = await supabase.from('citas').update({ fecha: nuevaFecha, hora: nuevaHora }).eq('id', citaReprogramar.id);
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cita reprogramada', showConfirmButton: false, timer: 1800 });
      setCitas(citas.map(c => c.id === citaReprogramar.id ? { ...c, fecha: nuevaFecha, hora: nuevaHora } : c));
      
      if (citaReprogramar.cliente_email) {
        const subject = encodeURIComponent('Reprogramación de cita programada');
        const body = encodeURIComponent(`Hola ${citaReprogramar.cliente_nombre},\n\nTe informamos que tu cita para el servicio de "${citaReprogramar.servicio}" ha sido reprogramada.\n\nNueva fecha: ${nuevaFecha}\nNueva hora: ${nuevaHora}\n\nSi tienes alguna duda, por favor contáctanos.\n\nSaludos cordiales.`);
        window.location.href = `mailto:${citaReprogramar.cliente_email}?subject=${subject}&body=${body}`;
      }
      setCitaReprogramar(null);
    }
  }

  /* ─── Calendario ────────────────────────────────────────── */
  const cambiarMes  = offset => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + offset, 1));
  const diasMes     = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate();
  const primerIdx   = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay();
  const emptyCells  = primerIdx === 0 ? 6 : primerIdx - 1;

  const hoyObj = new Date();
  const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth()+1).padStart(2,'0')}-${String(hoyObj.getDate()).padStart(2,'0')}`;

  const citasFiltradas = fechaSel ? citas.filter(c => c.fecha === fechaSel) : citas;

  if (cargando) return <p style={{ color: t.sub }}>Cargando agenda...</p>;

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text }}>Agenda de Citas</h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Administra reservaciones y horarios disponibles.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>

        {/* ── Columna izquierda ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Calendario */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => cambiarMes(-1)} style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f1f5f9', border: 'none', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: t.sub, display: 'flex' }}>
                <ChevronLeft size={18} />
              </button>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: t.text, textTransform: 'capitalize' }}>
                {mesActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => cambiarMes(1)} style={{ background: dark ? 'rgba(255,255,255,0.07)' : '#f1f5f9', border: 'none', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: t.sub, display: 'flex' }}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center', marginBottom: '8px' }}>
              {['L','M','X','J','V','S','D'].map(d => (
                <div key={d} style={{ fontSize: '11px', fontWeight: '700', color: t.sub, padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
              {Array.from({ length: emptyCells }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: diasMes }).map((_, i) => {
                const dia      = i + 1;
                const fStr     = `${mesActual.getFullYear()}-${String(mesActual.getMonth()+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                const citasDia = citas.filter(c => c.fecha === fStr && c.estado !== 'Cancelada');
                const bloqueo  = fechasBloqueadas.find(b => b.fecha === fStr);
                const esSel    = fechaSel === fStr;
                const esHoy    = fStr === hoyStr;
                return (
                  <div key={dia} onClick={() => setFechaSel(esSel ? null : fStr)}
                    style={{
                      padding: '6px 2px', textAlign: 'center', borderRadius: '7px', cursor: 'pointer', fontSize: '13px',
                      background: esSel ? color : esHoy ? `${color}18` : 'transparent',
                      color: esSel ? 'white' : esHoy ? color : t.text,
                      border: esHoy && !esSel ? `1px solid ${color}44` : '1px solid transparent',
                      fontWeight: esSel || esHoy ? '700' : '400',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!esSel) e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'; }}
                    onMouseLeave={e => { if (!esSel) e.currentTarget.style.background = esHoy ? `${color}18` : 'transparent'; }}
                  >
                    <span>{dia}</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {bloqueo     && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: esSel ? 'white' : '#ef4444' }} />}
                      {!bloqueo && citasDia.length > 0 && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: esSel ? 'white' : '#10b981' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloqueo de fechas */}
          <div style={{ background: t.blk, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: t.text, display: 'flex', alignItems: 'center', gap: '7px' }}>
              <ShieldAlert size={15} color="#ef4444" /> Bloquear Fechas
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: t.sub }}>Cierra días para que los clientes no puedan agendar.</p>
            <form onSubmit={bloquearFecha} style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input type="date" style={{ ...inp, flex: 1, minWidth: '120px' }} value={nuevoBloqueo.fecha} onChange={e => setNuevoBloqueo({ ...nuevoBloqueo, fecha: e.target.value })} required />
              <input type="text" placeholder="Motivo (opcional)" style={{ ...inp, flex: 2, minWidth: '130px' }} value={nuevoBloqueo.motivo} onChange={e => setNuevoBloqueo({ ...nuevoBloqueo, motivo: e.target.value })} />
              <button type="submit" disabled={bloqueando} style={{ padding: '9px 16px', background: bloqueando ? '#fca5a5' : '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: bloqueando ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '12px', flexShrink: 0 }}>
                {bloqueando ? 'Guardando...' : 'Bloquear'}
              </button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {fechasBloqueadas.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: t.card, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#ef4444' }}>{b.fecha}</span>
                    <span style={{ fontSize: '12px', color: t.sub, marginLeft: '10px' }}>{b.motivo || 'Día inhábil'}</span>
                  </div>
                  <button onClick={() => eliminarBloqueo(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sub, display: 'flex', padding: '4px' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {fechasBloqueadas.length === 0 && <p style={{ margin: 0, fontSize: '12px', color: t.sub, textAlign: 'center' }}>Sin bloqueos activos.</p>}
            </div>
          </div>
        </div>

        {/* ── Columna derecha: Lista de citas ──────────── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: `1px solid ${t.border}` }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: t.text }}>
              {fechaSel ? `Citas del ${fechaSel.split('-').reverse().join('/')}` : 'Citas programadas'}
            </h2>
            {fechaSel && (
              <button onClick={() => setFechaSel(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', color: t.sub, fontSize: '12px', fontWeight: '600' }}>
                <Filter size={12} /> Ver todas
              </button>
            )}
          </div>

          {citasFiltradas.length === 0 ? (
            <p style={{ color: t.sub, fontSize: '14px' }}>{fechaSel ? 'No hay citas para este día.' : 'No hay citas agendadas.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {citasFiltradas.map(cita => (
                <div key={cita.id} style={{
                  background: t.card, border: `1px solid ${t.border}`,
                  borderLeft: `3px solid ${cita.estado === 'Completada' ? '#10b981' : cita.estado === 'Cancelada' ? '#ef4444' : color}`,
                  borderRadius: '10px', padding: '14px 16px',
                  opacity: cita.estado === 'Cancelada' ? 0.6 : 1,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '14px', color: t.text }}>{cita.servicio}</p>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: t.sub }}>👤 {cita.cliente_nombre || cita.cliente_email}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: t.sub, display: 'flex', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {cita.fecha}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {cita.hora?.substring(0, 5)}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => abrirDetalles(cita)} style={{ padding: '7px 12px', borderRadius: '7px', border: `1px solid ${t.border}`, cursor: 'pointer', fontWeight: '600', fontSize: '12px', background: dark ? 'rgba(255,255,255,0.05)' : '#f8fafc', color: t.sub, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Eye size={14} /> Detalles
                    </button>
                    {cita.estado === 'Pendiente' ? (
                      <>
                        <button onClick={() => abrirReprogramar(cita)} style={{ padding: '7px 12px', borderRadius: '7px', border: `1px solid ${t.border}`, cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: dark ? 'rgba(59,130,246,0.1)' : '#eff6ff', color: color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <RefreshCw size={14} /> Reprogramar
                        </button>
                        <button onClick={() => cambiarEstado(cita.id, 'Completada')} style={{ padding: '7px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: dark ? 'rgba(16,185,129,0.15)' : '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle size={14} /> Completar
                        </button>
                        <button onClick={() => cambiarEstado(cita.id, 'Cancelada')} style={{ padding: '7px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: dark ? 'rgba(239,68,68,0.12)' : '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <XCircle size={14} /> Cancelar
                        </button>
                      </>
                    ) : (
                      <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: cita.estado === 'Completada' ? (dark ? 'rgba(16,185,129,0.15)' : '#d1fae5') : (dark ? 'rgba(239,68,68,0.12)' : '#fee2e2'), color: cita.estado === 'Completada' ? '#059669' : '#dc2626' }}>
                        {cita.estado}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Detalles de Cita ───────────────────────── */}
      {citaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setCitaSeleccionada(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '28px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: `1px solid ${t.border}`, paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px', fontSize: '18px', fontWeight: '800', color: t.text }}>Detalles de la Reserva</h2>
                <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>{citaSeleccionada.servicio}</p>
              </div>
              <button onClick={() => setCitaSeleccionada(null)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}><X size={15} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '11px', color: t.sub, textTransform: 'uppercase', fontWeight: '700' }}>Cliente</p>
                  <p style={{ margin: 0, fontSize: '14px', color: t.text, fontWeight: '600' }}>{citaSeleccionada.cliente_nombre}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '11px', color: t.sub, textTransform: 'uppercase', fontWeight: '700' }}>Contacto</p>
                  <p style={{ margin: 0, fontSize: '14px', color: t.text, fontWeight: '600', wordBreak: 'break-all' }}>{citaSeleccionada.cliente_email}</p>
                  {detallesCliente?.telefono && <p style={{ margin: '3px 0 0', fontSize: '13px', color: t.sub }}>📞 {detallesCliente.telefono}</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '11px', color: t.sub, textTransform: 'uppercase', fontWeight: '700' }}>Fecha</p>
                  <p style={{ margin: 0, fontSize: '14px', color: t.text, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14}/> {citaSeleccionada.fecha}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '11px', color: t.sub, textTransform: 'uppercase', fontWeight: '700' }}>Hora</p>
                  <p style={{ margin: 0, fontSize: '14px', color: t.text, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14}/> {citaSeleccionada.hora?.substring(0,5)} hrs</p>
                </div>
              </div>

              {detallesCliente?.direccion && (
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '11px', color: t.sub, textTransform: 'uppercase', fontWeight: '700' }}>Dirección</p>
                  <p style={{ margin: 0, fontSize: '14px', color: t.text, fontWeight: '600' }}>{detallesCliente.direccion}</p>
                </div>
              )}

              <div>
                <p style={{ margin: '0 0 5px', fontSize: '11px', color: t.sub, textTransform: 'uppercase', fontWeight: '700' }}>Observaciones del cliente</p>
                <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '15px', fontSize: '13px', color: citaSeleccionada.observaciones ? t.text : t.sub, lineHeight: '1.5' }}>
                  {citaSeleccionada.observaciones || 'No se dejaron observaciones adicionales.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Reprogramar Cita ───────────────────────── */}
      {citaReprogramar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setCitaReprogramar(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: `1px solid ${t.border}`, paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: '0 0 5px', fontSize: '18px', fontWeight: '800', color: t.text }}>Reprogramar Cita</h2>
                <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>{citaReprogramar.cliente_nombre} - {citaReprogramar.servicio}</p>
              </div>
              <button onClick={() => setCitaReprogramar(null)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}><X size={15} /></button>
            </div>
            
            <form onSubmit={guardarReprogramacion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Nueva Fecha</label>
                <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} required style={{ ...inp, width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Nueva Hora</label>
                <input type="time" value={nuevaHora} onChange={e => setNuevaHora(e.target.value)} required style={{ ...inp, width: '100%' }} />
              </div>
              <button type="submit" style={{ padding: '12px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 12px ${color}33`, marginTop: '10px' }}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agenda;
