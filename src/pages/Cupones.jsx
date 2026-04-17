import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Tag, Plus, Trash2, Edit, X, ToggleLeft, ToggleRight, Copy, Users } from 'lucide-react';

function Cupones({ empresaId, dark = false, color = '#3b82f6' }) {
  const [cupones,  setCupones]  = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [nuevo, setNuevo] = useState({ codigo: '', tipo: 'porcentaje', valor: '', minimo: '', activo: true, vence_en: '', limite_usos: '', productos_aplicables: [] });
  
  const [viendoUsos, setViendoUsos] = useState(null);
  const [listaUsos, setListaUsos] = useState([]);
  const [cargandoUsos, setCargandoUsos] = useState(false);

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

  const genCodigo = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  useEffect(() => {
    async function cargar() {
      const [{ data: dataC }, { data: dataP }] = await Promise.all([
        supabase.from('cupones').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
        supabase.from('productos').select('id, nombre').eq('empresa_id', empresaId).order('nombre')
      ]);
      setCupones(dataC || []);
      setProductos(dataP || []);
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  const recargar = async () => {
    const { data } = await supabase.from('cupones').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false });
    setCupones(data || []);
  };

  async function guardar(e) {
    e.preventDefault();
    if (!nuevo.codigo || !nuevo.valor) return Swal.fire('Campos requeridos', 'Código y valor son obligatorios', 'warning');
    const payload = { ...nuevo, empresa_id: empresaId };
    if (payload.productos_aplicables && payload.productos_aplicables.length === 0) payload.productos_aplicables = null;
    const { error } = await supabase.from('cupones').insert([payload]);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cupón creado', showConfirmButton: false, timer: 1500 });
    setNuevo({ codigo: '', tipo: 'porcentaje', valor: '', minimo: '', activo: true, vence_en: '', limite_usos: '', productos_aplicables: [] });
    recargar();
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    const payload = { codigo: editando.codigo, tipo: editando.tipo, valor: editando.valor, minimo: editando.minimo, activo: editando.activo, vence_en: editando.vence_en || null, limite_usos: editando.limite_usos || null, productos_aplicables: editando.productos_aplicables?.length > 0 ? editando.productos_aplicables : null };
    const { error } = await supabase.from('cupones').update(payload).eq('id', editando.id);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cupón actualizado', showConfirmButton: false, timer: 1500 });
    setEditando(null); recargar();
  }

  async function toggleActivo(c) {
    const { error } = await supabase.from('cupones').update({ activo: !c.activo }).eq('id', c.id);
    if (error) return Swal.fire('Error', error.message, 'error');
    recargar();
  }

  async function eliminar(id) {
    const ok = await Swal.fire({ title: '¿Eliminar cupón?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (ok.isConfirmed) {
      const { error } = await supabase.from('cupones').delete().eq('id', id);
      if (error) return Swal.fire('Error', error.message, 'error');
      recargar();
    }
  }

  function copiar(codigo) {
    navigator.clipboard.writeText(codigo);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Código copiado', showConfirmButton: false, timer: 1200 });
  }

  async function verUsos(cupon) {
    setViendoUsos(cupon);
    setCargandoUsos(true);
    setListaUsos([]);
    const { data } = await supabase
      .from('pedidos')
      .select('id, created_at, cliente_email, total, descuento')
      .eq('empresa_id', empresaId)
      .eq('cupon_aplicado', cupon.codigo)
      .order('created_at', { ascending: false });
    
    setListaUsos(data || []);
    setCargandoUsos(false);
  }

  const fmtDesc = c => c.tipo === 'porcentaje' ? `${c.valor}%` : `$${Number(c.valor).toLocaleString('es-CO')}`;
  const vencido = c => c.vence_en && new Date(c.vence_en) < new Date();

  const FormCupon = ({ data, setData, onSubmit, btnLabel }) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Código</label>
          <input style={{ ...inp, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px' }} value={data.codigo} onChange={e => setData({ ...data, codigo: e.target.value.toUpperCase() })} placeholder="DESCUENTO20" required />
        </div>
        <button type="button" onClick={() => setData({ ...data, codigo: genCodigo() })} style={{ padding: '10px 12px', border: `1px solid ${t.inputB}`, borderRadius: '8px', background: t.input, color: t.sub, cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', marginBottom: '0' }}>
          Generar
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Tipo</label>
          <select style={{ ...inp }} value={data.tipo} onChange={e => setData({ ...data, tipo: e.target.value })}>
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="valor">Valor fijo ($)</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>{data.tipo === 'porcentaje' ? 'Descuento (%)' : 'Descuento ($)'}</label>
          <input style={inp} type="number" value={data.valor} onChange={e => setData({ ...data, valor: e.target.value })} required />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Mínimo de compra ($)</label>
          <input style={inp} type="number" placeholder="Opcional" value={data.minimo} onChange={e => setData({ ...data, minimo: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Vence el</label>
          <input style={inp} type="date" value={data.vence_en} onChange={e => setData({ ...data, vence_en: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Límite de usos</label>
          <input style={inp} type="number" placeholder="Opcional (ej. 100)" value={data.limite_usos || ''} onChange={e => setData({ ...data, limite_usos: e.target.value })} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Aplica a productos (opcional)</label>
        <div style={{ maxHeight: '120px', overflowY: 'auto', border: `1px solid ${t.inputB}`, borderRadius: '8px', padding: '6px', background: t.input }}>
          {productos.length === 0 ? <p style={{ fontSize: '12px', color: t.sub, margin: '5px' }}>No hay productos</p> : productos.map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: t.text, padding: '4px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={(data.productos_aplicables || []).includes(p.id)}
                onChange={e => {
                  const prev = data.productos_aplicables || [];
                  if (e.target.checked) setData({ ...data, productos_aplicables: [...prev, p.id] });
                  else setData({ ...data, productos_aplicables: prev.filter(id => id !== p.id) });
                }}
              />
              {p.nombre}
            </label>
          ))}
        </div>
        <p style={{ fontSize: '10px', color: t.sub, margin: '4px 0 0' }}>Si no seleccionas ninguno, el cupón aplicará a todos los productos del carrito.</p>
      </div>
      <button type="submit" style={{ padding: '11px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: `0 4px 12px ${color}33` }}>
        {btnLabel}
      </button>
    </form>
  );

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={20} color={color} /> Cupones y Descuentos
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Crea códigos promocionales para tus clientes.</p>
      </div>

      {/* Formulario nuevo */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '700', color: t.text }}>Crear cupón</h2>
        <FormCupon data={nuevo} setData={setNuevo} onSubmit={guardar} btnLabel="Crear cupón" />
      </div>

      {/* Lista */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Código', 'Descuento', 'Mínimo', 'Vence', 'Usos', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 18px', background: t.th, color: t.sub, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `1px solid ${t.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cupones.map((c, i) => {
              const caducado = vencido(c);
              return (
                <tr key={c.id} style={{ background: i % 2 === 0 ? 'transparent' : t.row, opacity: caducado ? 0.5 : 1 }}>
                  <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ background: `${color}18`, color, padding: '3px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', letterSpacing: '1px' }}>{c.codigo}</code>
                      <button onClick={() => copiar(c.codigo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sub, display: 'flex', padding: '2px' }}><Copy size={13} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                    <span style={{ fontWeight: '700', color: '#10b981', fontSize: '15px' }}>{fmtDesc(c)}</span>
                    <span style={{ fontSize: '11px', color: t.sub, marginLeft: '6px' }}>{c.tipo === 'porcentaje' ? 'descuento' : 'fijo'}</span>
                  </td>
                  <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                    <span style={{ fontSize: '13px', color: t.sub }}>{c.minimo ? `$${Number(c.minimo).toLocaleString('es-CO')}` : 'Sin mínimo'}</span>
                  </td>
                  <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                    {c.vence_en ? <span style={{ fontSize: '12px', color: caducado ? '#ef4444' : t.sub, fontWeight: caducado ? '700' : '400' }}>{caducado ? '⚠ Vencido' : c.vence_en}</span> : <span style={{ color: t.sub, opacity: 0.4 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                    <span style={{ fontSize: '12px', color: t.sub, fontWeight: '600' }}>
                      {c.limite_usos ? `${c.usos_actuales || 0} / ${c.limite_usos}` : '∞'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                    <button onClick={() => toggleActivo(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}>
                      {c.activo && !caducado
                        ? <><ToggleRight size={20} color="#10b981" /><span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Activo</span></>
                        : <><ToggleLeft size={20} color={t.sub} /><span style={{ fontSize: '12px', color: t.sub }}>Inactivo</span></>
                      }
                    </button>
                  </td>
                  <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                    <div style={{ display: 'flex', gap: '7px' }}>
                      <button onClick={() => verUsos(c)} style={{ background: dark ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: '1px solid rgba(59,130,246,0.25)', padding: '7px', borderRadius: '7px', color: '#3b82f6', cursor: 'pointer', display: 'flex' }} title="Ver usos"><Users size={13} /></button>
                      <button onClick={() => setEditando(c)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: `1px solid ${t.border}`, padding: '7px', borderRadius: '7px', color, cursor: 'pointer', display: 'flex' }}><Edit size={13} /></button>
                      <button onClick={() => eliminar(c.id)} style={{ background: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.25)', padding: '7px', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {cupones.length === 0 && !cargando && <div style={{ padding: '40px', textAlign: 'center', color: t.sub }}>No hay cupones creados.</div>}
      </div>

      {/* Modal edición */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditando(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: t.text }}>Editar cupón</h2>
              <button onClick={() => setEditando(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}><X size={14} /></button>
            </div>
            <FormCupon data={editando} setData={setEditando} onSubmit={guardarEdicion} btnLabel="Guardar cambios" />
          </div>
        </div>
      )}

      {/* Modal ver usos */}
      {viendoUsos && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setViendoUsos(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: t.text }}>Usos del cupón {viendoUsos.codigo}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: t.sub }}>{listaUsos.length} canjes registrados</p>
              </div>
              <button onClick={() => setViendoUsos(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}><X size={14} /></button>
            </div>
            
            {cargandoUsos ? (
              <p style={{ color: t.sub, textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>Cargando datos...</p>
            ) : listaUsos.length === 0 ? (
              <p style={{ color: t.sub, textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>Este cupón aún no ha sido utilizado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {listaUsos.map(uso => (
                  <div key={uso.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: t.text }}>{uso.cliente_email}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>Pedido #{String(uso.id).slice(0, 8)} • {new Date(uso.created_at).toLocaleDateString('es-CO')}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#10b981' }}>-{uso.descuento ? `$${Number(uso.descuento).toLocaleString('es-CO')}` : '?'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Cupones;
