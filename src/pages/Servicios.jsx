import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Briefcase, Plus, Edit, Trash2, X, Clock } from 'lucide-react';

function Servicios({ empresaId, dark = false, color = '#3b82f6' }) {
  const [servicios,        setServicios]        = useState([]);
  const [cargando,         setCargando]         = useState(true);
  const [servicioEditando, setServicioEditando] = useState(null);
  const [nuevo,            setNuevo]            = useState({ nombre: '', precio: '', duracion: '' });

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
    th:     dark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    row:    dark ? 'rgba(255,255,255,0.02)' : '#fafafa',
    modal:  dark ? '#0d1526'                : 'white',
  };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${t.inputB}`, background: t.input, color: t.inputT, fontSize: '13.5px', boxSizing: 'border-box', outline: 'none' };

  /* ─── Datos ─────────────────────────────────────────────── */
  const obtener = useCallback(async () => {
    const { data } = await supabase.from('servicios').select('*').eq('empresa_id', empresaId).order('id', { ascending: false });
    setServicios(data || []);
    setCargando(false);
  }, [empresaId]);

  useEffect(() => { obtener(); }, [obtener]);

  /* ─── CRUD ──────────────────────────────────────────────── */
  async function guardar(e) {
    e.preventDefault();
    if (!nuevo.nombre) return Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
    const { error } = await supabase.from('servicios').insert([{ ...nuevo, empresa_id: empresaId }]);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Servicio agregado', showConfirmButton: false, timer: 1500 });
    setNuevo({ nombre: '', precio: '', duracion: '' });
    obtener();
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    const { error } = await supabase.from('servicios').update({ nombre: servicioEditando.nombre, precio: servicioEditando.precio, duracion: servicioEditando.duracion }).eq('id', servicioEditando.id);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Servicio actualizado', showConfirmButton: false, timer: 1500 });
    setServicioEditando(null);
    obtener();
  }

  async function eliminar(id) {
    const ok = await Swal.fire({ title: '¿Eliminar servicio?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (ok.isConfirmed) {
      const { error } = await supabase.from('servicios').delete().eq('id', id);
      if (error) return Swal.fire('Error', error.message, 'error');
      obtener();
    }
  }

  const fmt = n => n ? `$${Number(n).toLocaleString('es-CO')}` : '—';

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text }}>Servicios</h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Define los servicios disponibles para que los clientes agenden citas.</p>
      </div>

      {/* Formulario */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: t.text, display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Briefcase size={15} color={color} /> Agregar servicio
        </h2>
        <form onSubmit={guardar}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px', gap: '10px', alignItems: 'end' }}>
            <input style={inp} placeholder="Nombre del servicio" value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} required />
            <input style={inp} type="number" placeholder="Precio ($)" value={nuevo.precio} onChange={e => setNuevo({ ...nuevo, precio: e.target.value })} />
            <input style={inp} type="number" placeholder="Min. duración" value={nuevo.duracion} onChange={e => setNuevo({ ...nuevo, duracion: e.target.value })} />
          </div>
          <button type="submit" style={{ marginTop: '12px', padding: '10px 20px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: `0 4px 12px ${color}33` }}>
            <Plus size={15} /> Guardar servicio
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Servicio', 'Precio', 'Duración', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 18px', background: t.th, color: t.sub, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `1px solid ${t.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {servicios.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? 'transparent' : t.row }}>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Briefcase size={15} color={color} />
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: t.text }}>{s.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <span style={{ fontWeight: '700', color: color }}>{fmt(s.precio)}</span>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  {s.duracion ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: t.sub }}>
                      <Clock size={13} /> {s.duracion} min
                    </span>
                  ) : <span style={{ color: t.sub, opacity: 0.4 }}>—</span>}
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setServicioEditando(s)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: `1px solid ${t.border}`, padding: '7px', borderRadius: '7px', color, cursor: 'pointer', display: 'flex' }}><Edit size={14} /></button>
                    <button onClick={() => eliminar(s.id)} style={{ background: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.25)', padding: '7px', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {servicios.length === 0 && !cargando && (
          <div style={{ padding: '40px', textAlign: 'center', color: t.sub }}>No hay servicios registrados.</div>
        )}
      </div>

      {/* Modal edición */}
      {servicioEditando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setServicioEditando(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: t.text }}>Editar Servicio</h2>
              <button onClick={() => setServicioEditando(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}><X size={14} /></button>
            </div>
            <form onSubmit={guardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Nombre</label>
                <input style={inp} value={servicioEditando.nombre} onChange={e => setServicioEditando({ ...servicioEditando, nombre: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Precio ($)</label>
                  <input style={inp} type="number" value={servicioEditando.precio || ''} onChange={e => setServicioEditando({ ...servicioEditando, precio: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Duración (min)</label>
                  <input style={inp} type="number" value={servicioEditando.duracion || ''} onChange={e => setServicioEditando({ ...servicioEditando, duracion: e.target.value })} />
                </div>
              </div>
              <button type="submit" style={{ padding: '12px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 12px ${color}33` }}>
                Guardar cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicios;
