import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Search, MapPin, Phone, Mail, Trash2, Edit, X, Users } from 'lucide-react';

function Clientes({ empresaId, dark = false, color = '#3b82f6' }) {
  const [clientes,        setClientes]        = useState([]);
  const [busqueda,        setBusqueda]        = useState('');
  const [cargando,        setCargando]        = useState(true);
  const [clienteEditando, setClienteEditando] = useState(null);

  /* ─── Tema ──────────────────────────────────────────────── */
  const t = {
    card:    dark ? 'rgba(255,255,255,0.04)' : 'white',
    border:  dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    borderL: dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    text:    dark ? '#f0f4ff'                : '#0f172a',
    sub:     dark ? '#94a3b8'                : '#64748b',
    input:   dark ? 'rgba(255,255,255,0.06)' : 'white',
    inputB:  dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
    inputT:  dark ? '#e2e8f0'                : '#1e293b',
    th:      dark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    row:     dark ? 'rgba(255,255,255,0.02)' : '#fafafa',
    modal:   dark ? '#0d1526'                : 'white',
    disabled:dark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
  };

  const inp = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${t.inputB}`, fontSize: '13.5px',
    background: t.input, color: t.inputT,
    boxSizing: 'border-box', outline: 'none',
  };

  /* ─── Datos ─────────────────────────────────────────────── */
  const obtener = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nombre', { ascending: true });
    if (error) { setCargando(false); return; }
    setClientes(data || []);
    setCargando(false);
  }, [empresaId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { obtener(); }, [obtener]);

  /* ─── CRUD ──────────────────────────────────────────────── */
  async function guardarEdicion(e) {
    e.preventDefault();
    const { error } = await supabase.from('clientes')
      .update({ nombre: clienteEditando.nombre, telefono: clienteEditando.telefono, direccion: clienteEditando.direccion })
      .eq('id', clienteEditando.id);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, icon: 'success', title: 'Cliente actualizado' });
    setClienteEditando(null);
    obtener();
  }

  async function eliminar(id) {
    const ok = await Swal.fire({ title: '¿Eliminar cliente?', text: 'Esta acción no se puede deshacer', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (ok.isConfirmed) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) return Swal.fire('Error', error.message, 'error');
      obtener();
    }
  }

  const filtrados = clientes.filter(c => {
    if (!busqueda) return true; // Si no hay búsqueda, mostramos a todos (incluso a los que tienen datos nulos)
    const nom = String(c.nombre || '').toLowerCase();
    const cor = String(c.correo || '').toLowerCase();
    const b = String(busqueda).toLowerCase();
    return nom.includes(b) || cor.includes(b);
  });

  const avatar = nombre => String(nombre || '?').charAt(0).toUpperCase();
  const date = s => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* ── Encabezado ─────────────────────────────────── */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text }}>Clientes</h1>
          <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Directorio de usuarios registrados en tu tienda.</p>
        </div>
        <div style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} color={color} />
          <span style={{ fontWeight: '700', fontSize: '14px', color }}>{clientes.length}</span>
          <span style={{ fontSize: '12px', color: t.sub }}>registrados</span>
        </div>
      </div>

      {/* ── Tabla ──────────────────────────────────────── */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Buscador */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={15} color={t.sub} />
          <input
            style={{ ...inp, border: 'none', background: 'transparent', padding: '4px 0', flex: 1 }}
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sub, display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Cliente', 'Contacto', 'Dirección', 'Registro', 'Acciones'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 18px', background: t.th, color: t.sub, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: `1px solid ${t.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 === 0 ? 'transparent' : t.row }}>
                {/* Cliente */}
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: `${color}22`, color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '15px',
                    }}>
                      {avatar(c.nombre)}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: t.text }}>{c.nombre}</span>
                  </div>
                </td>
                {/* Contacto */}
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Mail size={12} color={t.sub} />
                    <span style={{ fontSize: '13px', color: t.sub }}>{c.correo}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={12} color={t.sub} />
                    <span style={{ fontSize: '13px', color: c.telefono ? t.sub : t.sub, opacity: c.telefono ? 1 : 0.4 }}>
                      {c.telefono || 'Sin teléfono'}
                    </span>
                  </div>
                </td>
                {/* Dirección */}
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={12} color={t.sub} />
                    <span style={{ fontSize: '13px', color: c.direccion ? t.sub : t.sub, opacity: c.direccion ? 1 : 0.4, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.direccion || 'No especificada'}
                    </span>
                  </div>
                </td>
                {/* Fecha */}
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <span style={{ fontSize: '12px', color: t.sub }}>{date(c.created_at)}</span>
                </td>
                {/* Acciones */}
                <td style={{ padding: '12px 18px', borderBottom: `1px solid ${t.borderL}` }}>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button onClick={() => setClienteEditando(c)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: `1px solid ${t.border}`, padding: '7px', borderRadius: '7px', color, cursor: 'pointer', display: 'flex' }} title="Editar">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => eliminar(c.id)} style={{ background: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.25)', padding: '7px', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', display: 'flex' }} title="Eliminar">
                      <Trash2 size={14} />
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
            {busqueda ? 'No hay clientes con esa búsqueda.' : 'Aún no hay clientes registrados.'}
          </div>
        )}
      </div>

      {/* ── Modal edición ──────────────────────────────── */}
      {clienteEditando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setClienteEditando(null)}>
          <div style={{ background: t.modal, border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: t.text }}>Editar Cliente</h2>
              <button onClick={() => setClienteEditando(null)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: 'none', borderRadius: '7px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={guardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Correo (no editable)</label>
                <input style={{ ...inp, background: t.disabled, color: t.sub, cursor: 'not-allowed' }} value={clienteEditando.correo || ''} disabled />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Nombre</label>
                <input style={inp} value={clienteEditando.nombre || ''} onChange={e => setClienteEditando({ ...clienteEditando, nombre: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Teléfono</label>
                <input style={inp} value={clienteEditando.telefono || ''} onChange={e => setClienteEditando({ ...clienteEditando, telefono: e.target.value })} placeholder="+57 300 000 0000" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Dirección de entrega</label>
                <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }} value={clienteEditando.direccion || ''} onChange={e => setClienteEditando({ ...clienteEditando, direccion: e.target.value })} placeholder="Calle, ciudad..." />
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

export default Clientes;
