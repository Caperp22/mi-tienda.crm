import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Swal from 'sweetalert2';
// Importamos Edit (Lápiz) y X para el modal
import { Search, MapPin, Phone, Mail, Trash2, Edit, X } from 'lucide-react';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estado para controlar qué cliente estamos editando en el modal
  const [clienteEditando, setClienteEditando] = useState(null);

  useEffect(() => {
    obtenerClientes();
  }, []);

  async function obtenerClientes() {
    setCargando(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error) setClientes(data);
    setCargando(false);
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    
    // Actualizamos solo los datos permitidos en la base de datos
    const { error } = await supabase
      .from('clientes')
      .update({
        nombre: clienteEditando.nombre,
        telefono: clienteEditando.telefono,
        direccion: clienteEditando.direccion
      })
      .eq('id', clienteEditando.id);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      Toast.fire({ icon: 'success', title: 'Cliente actualizado' });
      setClienteEditando(null); // Cerramos el modal
      obtenerClientes(); // Recargamos la lista
    }
  }

  async function eliminarCliente(id) {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar'
    });

    if (confirmacion.isConfirmed) {
      await supabase.from('clientes').delete().eq('id', id);
      obtenerClientes();
    }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.correo?.toLowerCase().includes(busqueda.toLowerCase()) 
  );

  const estilos = {
    container: { fontFamily: 'sans-serif', color: '#1e293b' },
    input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', marginBottom: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
    btnPrimary: { width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' },
    tablaCard: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    th: { textAlign: 'left', padding: '15px', background: '#f8fafc', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
    
    // Estilos del Modal
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    modalBox: { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
    label: { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }
  };

  return (
    <div style={estilos.container}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>Directorio de Clientes</h1>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Gestiona la información de contacto y envío de tus usuarios registrados.</p>

      {/* --- BARRA DE BÚSQUEDA --- */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
        <input 
          style={{ ...estilos.input, paddingLeft: '40px', marginBottom: 0, background: 'white' }} 
          placeholder="Buscar por nombre o correo..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* --- TABLA DE CLIENTES --- */}
      <div style={estilos.tablaCard}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={estilos.th}>Cliente</th>
              <th style={estilos.th}>Contacto</th>
              <th style={estilos.th}>Dirección de Envío</th>
              <th style={estilos.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map(c => (
              <tr key={c.id}>
                <td style={estilos.td}>
                  <div style={{ fontWeight: 'bold' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Registrado: {new Date(c.created_at).toLocaleDateString()}</div>
                </td>
                <td style={estilos.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={14} color="#94a3b8" /> {c.correo}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                    <Phone size={14} color="#94a3b8" /> {c.telefono || <span style={{ color: '#cbd5e1' }}>Sin teléfono</span>}
                  </div>
                </td>
                <td style={estilos.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
                    <MapPin size={14} color="#94a3b8" /> {c.direccion || <span style={{ color: '#cbd5e1' }}>No especificada</span>}
                  </div>
                </td>
                <td style={estilos.td}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Botón Editar */}
                    <button 
                      onClick={() => setClienteEditando(c)} // Guardamos todo el objeto del cliente en el estado
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer' }}
                      title="Editar Cliente"
                    >
                      <Edit size={16} />
                    </button>
                    {/* Botón Eliminar */}
                    <button 
                      onClick={() => eliminarCliente(c.id)}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                      title="Eliminar Cliente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientesFiltrados.length === 0 && !cargando && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No se encontraron clientes con esa búsqueda.
          </div>
        )}
      </div>

      {/* --- MODAL PARA EDITAR CLIENTE --- */}
      {clienteEditando && (
        <div style={estilos.overlay} onClick={() => setClienteEditando(null)}>
          <div style={estilos.modalBox} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Editar Cliente</h2>
              <button onClick={() => setClienteEditando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarEdicion}>
              {/* El correo no se edita porque está atado a la autenticación del usuario */}
              <div style={{ marginBottom: '15px' }}>
                <label style={estilos.label}>Correo Electrónico (No editable)</label>
                <input style={{...estilos.input, background: '#f1f5f9', color: '#94a3b8'}} value={clienteEditando.correo} disabled />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={estilos.label}>Nombre Completo</label>
                <input 
                  style={estilos.input} 
                  value={clienteEditando.nombre} 
                  onChange={(e) => setClienteEditando({...clienteEditando, nombre: e.target.value})} 
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={estilos.label}>Teléfono</label>
                <input 
                  style={estilos.input} 
                  value={clienteEditando.telefono || ''} 
                  onChange={(e) => setClienteEditando({...clienteEditando, telefono: e.target.value})} 
                  placeholder="Ej: +57 300 123 4567"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={estilos.label}>Dirección de Entrega</label>
                <textarea 
                  style={{ ...estilos.input, minHeight: '80px', resize: 'vertical' }} 
                  value={clienteEditando.direccion || ''} 
                  onChange={(e) => setClienteEditando({...clienteEditando, direccion: e.target.value})} 
                  placeholder="Calle, número, ciudad..."
                />
              </div>

              <button type="submit" style={estilos.btnPrimary}>
                Guardar Cambios
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;