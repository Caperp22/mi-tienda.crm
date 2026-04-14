import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Briefcase, Plus, Edit, Trash2, X } from 'lucide-react';

function Servicios({ empresaId }) {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [servicioEditando, setServicioEditando] = useState(null);

  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: '',
    precio: ''
  });

  const obtenerServicios = useCallback(async () => {
    const { data, error } = await supabase.from('servicios').select('*').eq('empresa_id', empresaId).order('id', { ascending: false });
    if (!error) setServicios(data);
    setCargando(false);
  }, [empresaId]);

  useEffect(() => {
    const timer = setTimeout(() => obtenerServicios(), 0);
    return () => clearTimeout(timer);
  }, [obtenerServicios]);

  async function guardarServicio(e) {
    e.preventDefault();
    if (!nuevoServicio.nombre) {
      return Swal.fire('Error', 'El nombre del servicio es obligatorio', 'warning');
    }

    const { error } = await supabase.from('servicios').insert([{ ...nuevoServicio, empresa_id: empresaId }]);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Servicio agregado', showConfirmButton: false, timer: 1500 });
      setNuevoServicio({ nombre: '', precio: '' });
      obtenerServicios();
    }
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('servicios')
      .update({ nombre: servicioEditando.nombre, precio: servicioEditando.precio })
      .eq('id', servicioEditando.id);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Servicio actualizado', showConfirmButton: false, timer: 1500 });
      setServicioEditando(null);
      obtenerServicios();
    }
  }

  async function eliminarServicio(id) {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar servicio?',
      text: "No podrás deshacer esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar'
    });

    if (confirmacion.isConfirmed) {
      await supabase.from('servicios').delete().eq('id', id);
      obtenerServicios();
    }
  }

  const estilos = {
    container: { fontFamily: 'sans-serif', color: '#1e293b' },
    cardForm: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '30px', border: '1px solid #e2e8f0' },
    input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', marginBottom: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
    gridForm: { display: 'grid', gridTemplateColumns: '1fr 150px', gap: '15px', alignItems: 'start' },
    btnPrimary: { padding: '12px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', width: '100%' },
    tablaCard: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    th: { textAlign: 'left', padding: '15px', background: '#f8fafc', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', verticalAlign: 'middle' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    modalBox: { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' },
    label: { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }
  };

  return (
    <div style={estilos.container}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>Catálogo de Servicios</h1>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Define los servicios que ofreces para que tus clientes puedan agendar citas.</p>

      <div style={estilos.cardForm}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><Briefcase size={20} /> Agregar nuevo servicio</h2>
        <form onSubmit={guardarServicio}>
          <div style={estilos.gridForm}>
            <div><input style={estilos.input} placeholder="Nombre del servicio (Ej. Asesoría Legal)" value={nuevoServicio.nombre} onChange={(e) => setNuevoServicio({...nuevoServicio, nombre: e.target.value})} required /></div>
            <div><input style={estilos.input} type="number" placeholder="Precio ($)" value={nuevoServicio.precio} onChange={(e) => setNuevoServicio({...nuevoServicio, precio: e.target.value})} /></div>
          </div>
          <button type="submit" style={estilos.btnPrimary}><Plus size={18} /> Guardar Servicio</button>
        </form>
      </div>

      <div style={estilos.tablaCard}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={estilos.th}>Servicio</th><th style={estilos.th}>Precio Base</th><th style={estilos.th}>Acciones</th></tr></thead>
          <tbody>
            {servicios.map(s => (
              <tr key={s.id}>
                <td style={estilos.td}><span style={{ fontWeight: 'bold', fontSize: '15px' }}>{s.nombre}</span></td>
                <td style={estilos.td}><span style={{ fontWeight: 'bold', color: '#10b981' }}>${s.precio || 0}</span></td>
                <td style={estilos.td}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setServicioEditando(s)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer' }}><Edit size={16} /></button>
                    <button onClick={() => eliminarServicio(s.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {servicios.length === 0 && !cargando && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No has agregado servicios aún.</div>}
      </div>

      {servicioEditando && (
        <div style={estilos.overlay} onClick={() => setServicioEditando(null)}>
          <div style={estilos.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Editar Servicio</h2>
              <button onClick={() => setServicioEditando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={guardarEdicion}>
              <div style={{ marginBottom: '15px' }}><label style={estilos.label}>Nombre del Servicio</label><input style={estilos.input} value={servicioEditando.nombre} onChange={(e) => setServicioEditando({...servicioEditando, nombre: e.target.value})} required /></div>
              <div style={{ marginBottom: '15px' }}><label style={estilos.label}>Precio</label><input style={estilos.input} type="number" value={servicioEditando.precio} onChange={(e) => setServicioEditando({...servicioEditando, precio: e.target.value})} /></div>
              <button type="submit" style={estilos.btnPrimary}>Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicios;