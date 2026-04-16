import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Truck, Plus, Trash2, Edit, X, ToggleLeft, ToggleRight } from 'lucide-react';

function Domicilios({ empresaId, dark = false, color = '#3b82f6' }) {
  const [zonas,   setZonas]   = useState([]);
  const [cargando,setCargando]= useState(true);
  const [editando,setEditando]= useState(null);
  const [nueva,   setNueva]   = useState({ nombre: '', costo: '', minimo: '', activo: true });

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
      const { data } = await supabase.from('zonas_domicilio').select('*').eq('empresa_id', empresaId).order('nombre');
      setZonas(data || []);
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  const recargar = async () => {
    const { data } = await supabase.from('zonas_domicilio').select('*').eq('empresa_id', empresaId).order('nombre');
    setZonas(data || []);
  };

  async function guardar(e) {
    e.preventDefault();
    if (!nueva.nombre) return Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
    const { error } = await supabase.from('zonas_domicilio').insert([{ ...nueva, empresa_id: empresaId }]);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Zona agregada', showConfirmButton: false, timer: 1500 });
    setNueva({ nombre: '', costo: '', minimo: '', activo: true });
    recargar();
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    const { error } = await supabase.from('zonas_domicilio').update({ nombre: editando.nombre, costo: editando.costo, minimo: editando.minimo, activo: editando.activo }).eq('id', editando.id);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Zona actualizada', showConfirmButton: false, timer: 1500 });
    setEditando(null); recargar();
  }

  async function toggleActivo(zona) {
    const { error } = await supabase.from('zonas_domicilio').update({ activo: !zona.activo }).eq('id', zona.id);
    if (error) return Swal.fire('Error', error.message, 'error');
    recargar();
  }

  async function eliminar(id) {
    const ok = await Swal.fire({ title: '¿Eliminar zona?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (ok.isConfirmed) {
      const { error } = await supabase.from('zonas_domicilio').delete().eq('id', id);
      if (error) return Swal.fire('Error', error.message, 'error');
      recargar();
    }
  }

  const fmt = n => n ? `$${Number(n).toLocaleString('es-CO')}` : '—';

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={20} color={color} /> Domicilios
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Gestiona las zonas de entrega y costos de envío.</p>
      </div>

      {/* Formulario */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: t.text }}>Agregar zona de entrega</h2>
        <form onSubmit={guardar}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
            <input style={inp} placeholder="Nombre de la zona (ej. Norte, Centro)" value={nueva.nombre} onChange={e => setNueva({ ...nueva, nombre: e.target.value })} required />
            <input style={inp} type="number" placeholder="Costo ($)" value={nueva.costo} onChange={e => setNueva({ ...nueva, costo: e.target.value })} />
            <input style={inp} type="number" placeholder="Mínimo de compra" value={nueva.minimo} onChange={e => setNueva({ ...nueva, minimo: e.target.value })} />
          </div>
          <button type="submit" style={{ marginTop: '12px', padding: '10px 20px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: `0 4px 12px ${color}33` }}>
            <Plus size={15} /> Agregar zona
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Zona', 'Costo envío', 'Mínimo pedido', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 18px', background: t.th, color: t.sub, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `1px solid ${t.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zonas.map((z, i) => (
              <tr key={z.id} style={{ background: i % 2 === 0 ? 'transparent' : t.row }}>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={14} color={color} />
                    </div>
                    <span style={{ fontWeight: '600', color: t.text }}>{z.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <span style={{ fontWeight: '700', color: color }}>{fmt(z.costo)}</span>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <span style={{ fontSize: '13px', color: t.sub }}>{z.minimo ? `${fmt(z.minimo)} mín.` : 'Sin mínimo'}</span>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <button onClick={() => toggleActivo(z)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
                    {z.activo
                      ? <><ToggleRight size={22} color="#10b981" /><span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Activa</span></>
                      : <><ToggleLeft size={22} color={t.sub} /><span style={{ fontSize: '12px', color: t.sub }}>Inactiva</span></>
                    }
                  </button>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditando(z)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: `1px solid ${t.border}`, padding: '7px', borderRadius: '7px', color, cursor: 'pointer', display: 'flex' }}><Edit size={14} /></button>
                    <button onClick={() => eliminar(z.id)} style={{ background: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.25)', padding: '7px', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {zonas.length === 0 && !cargando && (
          <div style={{ padding: '40px', textAlign: 'center', color: t.sub }}>No hay zonas de domicilio configuradas.</div>
        )}
      </div>

      {/* Modal */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditando(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: t.text }}>Editar zona</h2>
              <button onClick={() => setEditando(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}><X size={14} /></button>
            </div>
            <form onSubmit={guardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Nombre</label><input style={inp} value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Costo ($)</label><input style={inp} type="number" value={editando.costo || ''} onChange={e => setEditando({ ...editando, costo: e.target.value })} /></div>
                <div><label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Mínimo ($)</label><input style={inp} type="number" value={editando.minimo || ''} onChange={e => setEditando({ ...editando, minimo: e.target.value })} /></div>
              </div>
              <button type="submit" style={{ padding: '12px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 12px ${color}33` }}>Guardar cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Domicilios;
