import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Package, Plus, Edit, Trash2, Image as ImageIcon, AlignLeft, X, Search } from 'lucide-react';

function Inventario({ empresaId, dark = false, color = '#3b82f6' }) {
  const [productos,        setProductos]        = useState([]);
  const [cargando,         setCargando]         = useState(true);
  const [productoEditando, setProductoEditando] = useState(null);
  const [busqueda,         setBusqueda]         = useState('');
  const [nuevo, setNuevo] = useState({ nombre: '', precio: '', stock: '', imagen: '', descripcion: '' });
  const [fileNuevo, setFileNuevo] = useState(null);
  const [fileEdicion, setFileEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);

  /* ─── Tema ──────────────────────────────────────────────── */
  const t = {
    card:        dark ? 'rgba(255,255,255,0.04)' : 'white',
    cardSolid:   dark ? '#0d1526'                : 'white',
    border:      dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    borderLight: dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    text:        dark ? '#f0f4ff'                : '#0f172a',
    sub:         dark ? '#94a3b8'                : '#64748b',
    input:       dark ? 'rgba(255,255,255,0.06)' : 'white',
    inputBorder: dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
    inputText:   dark ? '#e2e8f0'                : '#1e293b',
    th:          dark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    row:         dark ? 'rgba(255,255,255,0.02)' : '#fafafa',
  };

  const inp = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${t.inputBorder}`, fontSize: '13.5px',
    background: t.input, color: t.inputText,
    boxSizing: 'border-box', outline: 'none',
  };

  /* ─── Datos ─────────────────────────────────────────────── */
  const obtener = useCallback(async () => {
    const { data } = await supabase
      .from('productos').select('*')
      .eq('empresa_id', empresaId)
      .order('id', { ascending: false });
    setProductos(data || []);
    setCargando(false);
  }, [empresaId]);

  useEffect(() => { obtener(); }, [obtener]);

  /* ─── CRUD ──────────────────────────────────────────────── */
  async function guardar(e) {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.precio || !nuevo.stock)
      return Swal.fire('Campos requeridos', 'Nombre, precio y stock son obligatorios', 'warning');
      
    setGuardando(true);
    try {
      let imageUrl = nuevo.imagen;
      if (fileNuevo) {
        const fileExt = fileNuevo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, fileNuevo);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('productos').insert([{ ...nuevo, imagen: imageUrl, empresa_id: empresaId }]);
      if (error) throw error;

      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto agregado', showConfirmButton: false, timer: 1500 });
      setNuevo({ nombre: '', precio: '', stock: '', imagen: '', descripcion: '' });
      setFileNuevo(null);
      obtener();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      let imageUrl = productoEditando.imagen;
      if (fileEdicion) {
        const fileExt = fileEdicion.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, fileEdicion);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('productos').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('productos')
        .update({ nombre: productoEditando.nombre, precio: productoEditando.precio, stock: productoEditando.stock, imagen: imageUrl, descripcion: productoEditando.descripcion })
        .eq('id', productoEditando.id);
        
      if (error) throw error;
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto actualizado', showConfirmButton: false, timer: 1500 });
      setProductoEditando(null);
      setFileEdicion(null);
      obtener();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    const ok = await Swal.fire({ title: '¿Eliminar producto?', text: 'No podrás deshacerlo', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (ok.isConfirmed) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) return Swal.fire('Error', error.message, 'error');
      obtener();
    }
  }

  const filtrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );
  const imgFallback = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80';

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* ── Encabezado ─────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text }}>Inventario</h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Gestiona tus productos en tiempo real.</p>
      </div>

      {/* ── Formulario nuevo producto ───────────────────── */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '22px', marginBottom: '22px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={17} color={color} /> Agregar producto
        </h2>
        <form onSubmit={guardar}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <input style={inp} placeholder="Nombre del producto" value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} />
            </div>
            <input style={inp} type="number" placeholder="Precio ($)" value={nuevo.precio} onChange={e => setNuevo({ ...nuevo, precio: e.target.value })} />
            <input style={inp} type="number" placeholder="Stock (uds.)" value={nuevo.stock} onChange={e => setNuevo({ ...nuevo, stock: e.target.value })} />
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <ImageIcon size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: t.sub }} />
                <input style={{ ...inp, paddingLeft: '34px' }} placeholder="URL de imagen (https://...)" value={nuevo.imagen} onChange={e => { setNuevo({ ...nuevo, imagen: e.target.value }); setFileNuevo(null); }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ height: '1px', flex: 1, background: t.border }} />
                <span style={{ fontSize: '10px', color: t.sub, fontWeight: 'bold' }}>O SUBIR ARCHIVO</span>
                <div style={{ height: '1px', flex: 1, background: t.border }} />
              </div>
              <input key={fileNuevo ? 'file-yes' : 'file-no'} type="file" accept="image/*" onChange={e => { setFileNuevo(e.target.files[0]); setNuevo({ ...nuevo, imagen: '' }); }} style={{ ...inp, padding: '7px 12px', background: t.card }} />
            </div>
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <AlignLeft size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: t.sub }} />
              <textarea style={{ ...inp, paddingLeft: '34px', minHeight: '70px', resize: 'vertical' }} placeholder="Descripción..." value={nuevo.descripcion} onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={guardando} style={{
            marginTop: '14px', padding: '11px 20px', border: 'none', borderRadius: '9px',
            background: guardando ? '#64748b' : `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: 'white', fontWeight: '700', fontSize: '13px', cursor: guardando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px',
            boxShadow: guardando ? 'none' : `0 4px 12px ${color}33`,
          }}>
            <Plus size={16} /> {guardando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </form>
      </div>

      {/* ── Buscador + tabla ────────────────────────────── */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Barra superior */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color={t.sub} style={{ flexShrink: 0 }} />
          <input
            style={{ ...inp, border: 'none', background: 'transparent', padding: '4px 0', flex: 1 }}
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <span style={{ fontSize: '12px', color: t.sub, flexShrink: 0 }}>{filtrados.length} productos</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Producto', 'Precio', 'Stock', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 18px', background: t.th, color: t.sub, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `1px solid ${t.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? 'transparent' : t.row }}>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderLight}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={p.imagen || imgFallback} alt={p.nombre}
                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${t.border}` }}
                      onError={e => { e.target.src = imgFallback; }}
                    />
                    <div>
                      <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: t.text }}>{p.nombre}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: t.sub, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderLight}` }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: color }}>
                    ${Number(p.precio).toLocaleString('es-CO')}
                  </span>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderLight}` }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                    background: p.stock > 5 ? '#dcfce7' : p.stock > 0 ? '#fef9c3' : '#fee2e2',
                    color: p.stock > 5 ? '#15803d' : p.stock > 0 ? '#854d0e' : '#dc2626',
                  }}>
                    {p.stock} uds.
                  </span>
                </td>
                <td style={{ padding: '13px 18px', borderBottom: `1px solid ${t.borderLight}` }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setProductoEditando(p)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: `1px solid ${t.border}`, padding: '7px', borderRadius: '7px', color: color, cursor: 'pointer', display: 'flex' }}>
                      <Edit size={15} />
                    </button>
                    <button onClick={() => eliminar(p.id)} style={{ background: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.25)', padding: '7px', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtrados.length === 0 && !cargando && (
          <div style={{ padding: '40px', textAlign: 'center', color: t.sub }}>
            {busqueda ? 'No hay productos con esa búsqueda.' : 'No hay productos en el inventario.'}
          </div>
        )}
      </div>

      {/* ── Modal edición ──────────────────────────────── */}
      {productoEditando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => { setProductoEditando(null); setFileEdicion(null); }}>
          <div style={{ background: dark ? '#0d1526' : 'white', border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: t.text }}>Editar Producto</h2>
              <button onClick={() => { setProductoEditando(null); setFileEdicion(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={guardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Nombre</label>
                <input style={inp} value={productoEditando.nombre} onChange={e => setProductoEditando({ ...productoEditando, nombre: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Precio</label>
                  <input style={inp} type="number" value={productoEditando.precio} onChange={e => setProductoEditando({ ...productoEditando, precio: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Stock</label>
                  <input style={inp} type="number" value={productoEditando.stock} onChange={e => setProductoEditando({ ...productoEditando, stock: e.target.value })} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Imagen del Producto (URL o Subir nueva)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input style={inp} placeholder="URL de imagen (https://...)" value={productoEditando.imagen || ''} onChange={e => { setProductoEditando({ ...productoEditando, imagen: e.target.value }); setFileEdicion(null); }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ height: '1px', flex: 1, background: t.border }} />
                    <span style={{ fontSize: '10px', color: t.sub, fontWeight: 'bold' }}>O SUBIR ARCHIVO</span>
                    <div style={{ height: '1px', flex: 1, background: t.border }} />
                  </div>
                  <input key={fileEdicion ? 'file-yes' : 'file-no'} type="file" accept="image/*" onChange={e => { setFileEdicion(e.target.files[0]); setProductoEditando({ ...productoEditando, imagen: '' }); }} style={{ ...inp, padding: '7px 12px' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Descripción</label>
                <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }} value={productoEditando.descripcion || ''} onChange={e => setProductoEditando({ ...productoEditando, descripcion: e.target.value })} />
              </div>
              <button type="submit" disabled={guardando} style={{ padding: '12px', border: 'none', borderRadius: '9px', background: guardando ? '#64748b' : `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', cursor: guardando ? 'not-allowed' : 'pointer', boxShadow: guardando ? 'none' : `0 4px 12px ${color}33` }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;
