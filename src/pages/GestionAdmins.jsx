import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { supabaseNoSession } from '../config/supabase';
import Swal from 'sweetalert2';
import { Shield, Trash2, Plus, AlertTriangle, Mail } from 'lucide-react';

function GestionAdmins({ empresaId, dark = false, color = '#3b82f6' }) {
  const [admins,      setAdmins]      = useState([]);
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [cargando,    setCargando]    = useState(true);

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
    warn:   dark ? 'rgba(245,158,11,0.1)'   : '#fffbeb',
    warnB:  dark ? 'rgba(245,158,11,0.2)'   : '#fde68a',
  };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${t.inputB}`, background: t.input, color: t.inputT, fontSize: '13.5px', boxSizing: 'border-box', outline: 'none' };

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const query = supabase.from('administradores').select('*').eq('rol', 'admin').order('id', { ascending: true });
      if (empresaId) query.eq('empresa_id', empresaId);
      const { data } = await query;
      setAdmins(data || []);
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  async function agregar(e) {
    e.preventDefault();
    if (!nuevoCorreo.includes('@')) return Swal.fire('Error', 'Ingresa un correo válido', 'error');

    // Crear cuenta en Supabase Auth con contraseña temporal
    const pass = Math.random().toString(36).slice(2, 10);
    await supabaseNoSession.auth.signUp({ email: nuevoCorreo.toLowerCase(), password: pass });

    const { data, error } = await supabase
      .from('administradores')
      .insert([{ email: nuevoCorreo.toLowerCase(), rol: 'admin', empresa_id: empresaId }])
      .select();

    if (error) return Swal.fire('Error', 'Ese correo ya es administrador o hubo un problema.', 'error');
    setAdmins([...admins, data[0]]);
    setNuevoCorreo('');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Administrador agregado', showConfirmButton: false, timer: 2000 });
  }

  async function eliminar(id, email) {
    if (admins.length === 1) return Swal.fire('Aviso', 'No puedes eliminar al último administrador.', 'warning');
    const ok = await Swal.fire({ title: '¿Revocar acceso?', text: `${email} perderá acceso inmediatamente.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Revocar', cancelButtonText: 'Cancelar' });
    if (ok.isConfirmed) {
      const { error } = await supabase.from('administradores').delete().eq('id', id);
      if (!error) setAdmins(admins.filter(a => a.id !== id));
    }
  }

  if (cargando) return <p style={{ color: t.sub }}>Cargando administradores...</p>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color={color} /> Administradores
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Controla quién tiene acceso a este panel de control.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>

        {/* Formulario */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '700', color: t.text }}>Dar acceso</h2>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: t.sub }}>El usuario podrá iniciar sesión con su correo y ver este panel.</p>
          <form onSubmit={agregar} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: t.sub }} />
              <input type="email" placeholder="correo@ejemplo.com" style={{ ...inp, paddingLeft: '34px' }} value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} required />
            </div>
            <button type="submit" style={{ padding: '11px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: `0 4px 12px ${color}33` }}>
              <Plus size={15} /> Agregar administrador
            </button>
          </form>

          <div style={{ marginTop: '16px', padding: '12px 14px', background: t.warn, border: `1px solid ${t.warnB}`, borderRadius: '9px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#d97706', lineHeight: 1.5 }}>
              Agrega solo personas de confianza. Tendrán acceso total al panel.
            </p>
          </div>
        </div>

        {/* Lista */}
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: t.text }}>
            Accesos activos ({admins.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {admins.map((admin, i) => (
              <div key={admin.id} style={{ background: i % 2 === 0 ? t.card : 'transparent', border: `1px solid ${t.border}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                    {admin.email?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{admin.email}</span>
                </div>
                <button onClick={() => eliminar(admin.id, admin.email)} style={{ background: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.25)', padding: '7px', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', display: 'flex' }} title="Revocar acceso">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {admins.length === 0 && <p style={{ color: t.sub, fontSize: '13px' }}>No hay administradores adicionales.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestionAdmins;
