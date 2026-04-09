import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Swal from 'sweetalert2';
import { Package, Plus, Edit, Trash2, Image as ImageIcon, AlignLeft, X } from 'lucide-react';

function Inventario() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [productoEditando, setProductoEditando] = useState(null);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio: '',
    stock: '',
    imagen: '',
    descripcion: ''
  });

  useEffect(() => {
    obtenerProductos();
  }, []);

  async function obtenerProductos() {
    setCargando(true);
    const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (!error) setProductos(data);
    setCargando(false);
  }

  async function guardarProducto(e) {
    e.preventDefault();
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.stock) {
      return Swal.fire('Error', 'Nombre, precio y stock son obligatorios', 'warning');
    }

    const { error } = await supabase.from('productos').insert([nuevoProducto]);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto agregado', showConfirmButton: false, timer: 1500 });
      setNuevoProducto({ nombre: '', precio: '', stock: '', imagen: '', descripcion: '' });
      obtenerProductos();
    }
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('productos')
      .update({
        nombre: productoEditando.nombre,
        precio: productoEditando.precio,
        stock: productoEditando.stock,
        imagen: productoEditando.imagen,
        descripcion: productoEditando.descripcion
      })
      .eq('id', productoEditando.id);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto actualizado', showConfirmButton: false, timer: 1500 });
      setProductoEditando(null);
      obtenerProductos();
    }
  }

  async function eliminarProducto(id) {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar producto?',
      text: "No podrás deshacer esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar'
    });

    if (confirmacion.isConfirmed) {
      await supabase.from('productos').delete().eq('id', id);
      obtenerProductos();
    }
  }

  const estilos = {
    container: { fontFamily: 'sans-serif', color: '#1e293b' },
    cardForm: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '30px', border: '1px solid #e2e8f0' },
    input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', marginBottom: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
    gridForm: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
    btnPrimary: { padding: '12px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', width: '100%' },
    tablaCard: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    th: { textAlign: 'left', padding: '15px', background: '#f8fafc', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', verticalAlign: 'middle' },
    imgThumb: { width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' },
    
    // Modal
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    modalBox: { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' },
    label: { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }
  };

  const imgFallback = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';

  return (
    <div style={estilos.container}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>Inventario</h1>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Gestiona tus productos en tiempo real.</p>

      {/* FORMULARIO */}
      <div style={estilos.cardForm}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={20} /> Agregar nuevo producto
        </h2>
        <form onSubmit={guardarProducto}>
          <div style={estilos.gridForm}>
            <div style={{ gridColumn: 'span 2' }}>
              <input style={estilos.input} placeholder="Nombre del producto" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} />
            </div>
            <div>
              <input style={estilos.input} type="number" placeholder="Precio ($)" value={nuevoProducto.precio} onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})} />
            </div>
            <div>
              <input style={estilos.input} type="number" placeholder="Stock (Cant.)" value={nuevoProducto.stock} onChange={(e) => setNuevoProducto({...nuevoProducto, stock: e.target.value})} />
            </div>
            
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <ImageIcon size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input style={{...estilos.input, paddingLeft: '35px'}} placeholder="URL de la imagen (Ej: https://...)" value={nuevoProducto.imagen} onChange={(e) => setNuevoProducto({...nuevoProducto, imagen: e.target.value})} />
            </div>
            
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <AlignLeft size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <textarea style={{...estilos.input, paddingLeft: '35px', minHeight: '80px', resize: 'vertical'}} placeholder="Descripción breve del producto..." value={nuevoProducto.descripcion} onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})} />
            </div>
          </div>
          <button type="submit" style={estilos.btnPrimary}><Plus size={18} /> Guardar Producto</button>
        </form>
      </div>

      {/* TABLA */}
      <div style={estilos.tablaCard}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={estilos.th}>Producto</th>
              <th style={estilos.th}>Precio</th>
              <th style={estilos.th}>Stock</th>
              <th style={estilos.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td style={estilos.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={p.imagen || imgFallback} alt={p.nombre} style={estilos.imgThumb} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{p.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.descripcion || 'Sin descripción'}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={estilos.td}><span style={{ fontWeight: 'bold', color: '#10b981' }}>${p.precio}</span></td>
                <td style={estilos.td}>
                  <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: p.stock > 0 ? '#d1fae5' : '#fee2e2', color: p.stock > 0 ? '#059669' : '#ef4444' }}>
                    {p.stock} uds.
                  </span>
                </td>
                <td style={estilos.td}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setProductoEditando(p)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer' }}><Edit size={16} /></button>
                    <button onClick={() => eliminarProducto(p.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productos.length === 0 && !cargando && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay productos en tu inventario.</div>}
      </div>

      {/* MODAL DE EDICIÓN */}
      {productoEditando && (
        <div style={estilos.overlay} onClick={() => setProductoEditando(null)}>
          <div style={estilos.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Editar Producto</h2>
              <button onClick={() => setProductoEditando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <form onSubmit={guardarEdicion}>
              <div style={{ marginBottom: '15px' }}>
                <label style={estilos.label}>Nombre</label>
                <input style={estilos.input} value={productoEditando.nombre} onChange={(e) => setProductoEditando({...productoEditando, nombre: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={estilos.label}>Precio</label>
                  <input style={estilos.input} type="number" value={productoEditando.precio} onChange={(e) => setProductoEditando({...productoEditando, precio: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={estilos.label}>Stock</label>
                  <input style={estilos.input} type="number" value={productoEditando.stock} onChange={(e) => setProductoEditando({...productoEditando, stock: e.target.value})} required />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={estilos.label}>URL de Imagen</label>
                <input style={estilos.input} value={productoEditando.imagen || ''} onChange={(e) => setProductoEditando({...productoEditando, imagen: e.target.value})} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={estilos.label}>Descripción</label>
                <textarea style={{...estilos.input, minHeight: '80px', resize: 'vertical'}} value={productoEditando.descripcion || ''} onChange={(e) => setProductoEditando({...productoEditando, descripcion: e.target.value})} />
              </div>
              <button type="submit" style={estilos.btnPrimary}>Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;