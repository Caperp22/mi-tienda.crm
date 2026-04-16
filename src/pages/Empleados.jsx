import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { UserCheck, Plus, Trash2, Edit, X, ToggleLeft, ToggleRight, Phone, Mail } from 'lucide-react';

function Empleados({ empresaId, dark = false, color = '#3b82f6' }) {
  const [empleados, setEmpleados] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [editando,  setEditando]  = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: '', cargo: '', telefono: '', correo: '', activo: true });

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

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('empleados').select('*').eq('empresa_id', empresaId).order('nombre');
      setEmpleados(data || []);
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  const recargar = async () => {
    const { data } = await supabase.from('empleados').select('*').eq('empresa_id', empresaId).order('nombre');
    setEmpleados(data || []);
  };

  async function guardar(e) {
    e.preventDefault();
    if (!nuevo.nombre) return Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
    const { error } = await supabase.from('empleados').insert([{ ...nuevo, empresa_id: empresaId }]);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empleado agregado', showConfirmButton: false, timer: 1500 });
    setNuevo({ nombre: '', cargo: '', telefono: '', correo: '', activo: true });
    recargar();
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    const { error } = await supabase.from('empleados').update({ nombre: editando.nombre, cargo: editando.cargo, telefono: editando.telefono, correo: editando.correo, activo: editando.activo }).eq('id', editando.id);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empleado actualizado', showConfirmButton: false, timer: 1500 });
    setEditando(null); recargar();
  }

  async function toggleActivo(emp) {
    await supabase.from('empleados').update({ activo: !emp.activo }).eq('id', emp.id);
    recargar();
  }

  async function eliminar(id) {
    const ok = await Swal.fire({ title: '¿Eliminar empleado?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (ok.isConfirmed) { await supabase.from('empleados').delete().eq('id', id); recargar(); }
  }

  const activos   = empleados.filter(e => e.activo).length;
  const inactivos = empleados.filter(e => !e.activo).length;

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} color={color} /> Empleados
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Gestiona el personal de tu negocio.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '9px', padding: '7px 14px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color }}>{activos}</p>
            <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>activos</p>
          </div>
          {inactivos > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '9px', padding: '7px 14px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ef4444' }}>{inactivos}</p>
              <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>inactivos</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: t.text }}>Agregar empleado</h2>
        <form onSubmit={guardar}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <input style={inp} placeholder="Nombre completo" value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} required />
            <input style={inp} placeholder="Cargo / Rol" value={nuevo.cargo} onChange={e => setNuevo({ ...nuevo, cargo: e.target.value })} />
            <input style={inp} placeholder="Teléfono" value={nuevo.telefono} onChange={e => setNuevo({ ...nuevo, telefono: e.target.value })} />
            <input style={inp} type="email" placeholder="Correo" value={nuevo.correo} onChange={e => setNuevo({ ...nuevo, correo: e.target.value })} />
          </div>
          <button type="submit" style={{ marginTop: '12px', padding: '10px 20px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: `0 4px 12px ${color}33` }}>
            <Plus size={15} /> Agregar empleado
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Empleado', 'Cargo', 'Contacto', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 18px', background: t.th, color: t.sub, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `1px solid ${t.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empleados.map((emp, i) => (
              <tr key={emp.id} style={{ background: i % 2 === 0 ? 'transparent' : t.row, opacity: emp.activo ? 1 : 0.55 }}>
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                      {emp.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: t.text }}>{emp.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  {emp.cargo ? <span style={{ background: `${color}18`, color, padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{emp.cargo}</span> : <span style={{ color: t.sub, opacity: 0.4 }}>—</span>}
                </td>
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {emp.telefono && <span style={{ fontSize: '12px', color: t.sub, display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={11} />{emp.telefono}</span>}
                    {emp.correo   && <span style={{ fontSize: '12px', color: t.sub, display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={11} />{emp.correo}</span>}
                    {!emp.telefono && !emp.correo && <span style={{ color: t.sub, opacity: 0.4 }}>—</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <button onClick={() => toggleActivo(emp)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}>
                    {emp.activo
                      ? <><ToggleRight size={20} color="#10b981" /><span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Activo</span></>
                      : <><ToggleLeft size={20} color={t.sub} /><span style={{ fontSize: '12px', color: t.sub }}>Inactivo</span></>
                    }
                  </button>
                </td>
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button onClick={() => setEditando(emp)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: `1px solid ${t.border}`, padding: '7px', borderRadius: '7px', color, cursor: 'pointer', display: 'flex' }}><Edit size={14} /></button>
                    <button onClick={() => eliminar(emp.id)} style={{ background: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.25)', padding: '7px', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {empleados.length === 0 && !cargando && <div style={{ padding: '40px', textAlign: 'center', color: t.sub }}>No hay empleados registrados.</div>}
      </div>

      {/* Modal */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditando(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: t.text }}>Editar empleado</h2>
              <button onClick={() => setEditando(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}><X size={14} /></button>
            </div>
            <form onSubmit={guardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['Nombre', 'nombre', 'text', true], ['Cargo', 'cargo', 'text', false], ['Teléfono', 'telefono', 'text', false], ['Correo', 'correo', 'email', false]].map(([label, field, type, req]) => (
                <div key={field}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>{label}</label>
                  <input style={inp} type={type} value={editando[field] || ''} onChange={e => setEditando({ ...editando, [field]: e.target.value })} required={req} />
                </div>
              ))}
              <button type="submit" style={{ padding: '12px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 12px ${color}33` }}>Guardar cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Empleados;
