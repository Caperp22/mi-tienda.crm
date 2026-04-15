import { useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';

/* ─── Paleta nueva: Teal + Violet (nada de indigo estándar) ─── */
const TEAL   = '#0891b2';  // clientes
const VIOLET = '#7c3aed';  // admins
const NAVY   = '#0a1628';

function Login() {
  const [modo, setModo]           = useState('cliente'); // 'cliente' | 'registro' | 'admin'
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [nombre, setNombre]       = useState('');
  const [direccion, setDireccion] = useState('');
  const [cargando, setCargando]   = useState(false);
  const [verPass, setVerPass]     = useState(false);
  const [ok, setOk]               = useState(false);

  const esAdmin    = modo === 'admin';
  const esRegistro = modo === 'registro';
  const accent     = esAdmin ? VIOLET : TEAL;

  async function submit(e) {
    e.preventDefault();
    setCargando(true);
    setOk(false);
    const tiendaActual = localStorage.getItem('tiendaActual');

    /* ── Admin / SuperAdmin ──────────────────────────────── */
    if (esAdmin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setCargando(false);
      if (error) {
        Swal.fire({
          title: 'Acceso denegado',
          text: 'Correo o contraseña/licencia incorrectos.',
          icon: 'error', confirmButtonColor: VIOLET,
        });
      } else setOk(true);
      return;
    }

    /* ── Registro cliente ────────────────────────────────── */
    if (esRegistro) {
      if (!nombre.trim()) {
        setCargando(false);
        return Swal.fire({ title: 'Falta el nombre', icon: 'warning', confirmButtonColor: TEAL });
      }
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nombre, direccion, telefono: '' } },
      });
      setCargando(false);
      if (error) {
        const yaExiste = error.message.includes('already registered') || error.status === 422;
        Swal.fire({
          title: yaExiste ? 'Correo ya registrado' : 'Error',
          text:  yaExiste ? 'Ese correo ya tiene cuenta. Inicia sesión.' : error.message,
          icon: yaExiste ? 'info' : 'error', confirmButtonColor: TEAL,
        });
        if (yaExiste) setModo('cliente');
      } else {
        if (tiendaActual) {
          await supabase.from('clientes').insert([{
            nombre, correo: email, telefono: '', direccion, empresa_id: tiendaActual,
          }]);
        }
        Swal.fire({ title: '¡Cuenta creada!', text: 'Ya puedes iniciar sesión.', icon: 'success', confirmButtonColor: TEAL });
        setModo('cliente');
        setNombre(''); setDireccion(''); setPassword('');
      }
      return;
    }

    /* ── Login cliente ───────────────────────────────────── */
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      Swal.fire({ title: 'Credenciales incorrectas', icon: 'error', confirmButtonColor: TEAL });
    } else {
      if (tiendaActual) {
        const { data: existe } = await supabase.from('clientes')
          .select('id').eq('correo', email).eq('empresa_id', tiendaActual).maybeSingle();
        if (!existe) {
          const m = data.user.user_metadata;
          await supabase.from('clientes').insert([{
            nombre: m?.nombre || 'Cliente Web', correo: email,
            telefono: m?.telefono || '', direccion: m?.direccion || '',
            empresa_id: tiendaActual,
          }]);
        }
      }
      setOk(true);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ══ Panel izquierdo — Marca ══════════════════════════════ */}
      <div className="login-brand" style={{
        width: '42%', background: `linear-gradient(160deg, ${NAVY} 0%, #0c2340 55%, #110d2e 100%)`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '60px 44px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Orbes decorativos */}
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${TEAL}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: `radial-gradient(circle, ${VIOLET}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '20%', width: '180px', height: '180px', borderRadius: '50%', background: `radial-gradient(circle, ${TEAL}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 16px',
            background: `linear-gradient(135deg, ${TEAL}, ${VIOLET})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px ${TEAL}44`,
          }}>
            <Briefcase size={28} color="white" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '900', color: '#f0f9ff', letterSpacing: '0.5px' }}>
            CRM <span style={{ color: TEAL }}>Pro</span>
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Plataforma de gestión empresarial</p>
        </div>

        {/* Tarjetas de acceso */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
          {[
            { ico: <User size={16} />, titulo: 'Portal de Clientes', desc: 'Compras, citas y pedidos', color: TEAL,   activo: !esAdmin },
            { ico: <Briefcase size={16} />, titulo: 'Panel Administrativo', desc: 'Gestión y configuración', color: VIOLET, activo: esAdmin },
          ].map(({ ico, titulo, desc, color, activo }) => (
            <div key={titulo} style={{
              background: activo ? `${color}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activo ? `${color}40` : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '12px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: '12px',
              transition: 'all 0.2s',
              boxShadow: activo ? `0 0 16px ${color}22` : 'none',
            }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ico}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: activo ? '#f0f9ff' : '#64748b' }}>{titulo}</p>
                <p style={{ margin: 0, fontSize: '11px', color: activo ? `${color}` : '#475569' }}>{desc}</p>
              </div>
              {activo && <ArrowRight size={14} color={color} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
            </div>
          ))}
        </div>

        {/* Nota SuperAdmin */}
        <p style={{ position: 'relative', zIndex: 1, marginTop: '32px', fontSize: '10px', color: '#334155', textAlign: 'center', lineHeight: 1.5, maxWidth: '240px' }}>
          SuperAdmin: usa el tab <b style={{ color: VIOLET }}>Panel Administrativo</b> con tus credenciales personales.
        </p>
      </div>

      {/* ══ Panel derecho — Formulario ═══════════════════════════ */}
      <div className="login-form-panel" style={{
        flex: 1, background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Estado éxito */}
          {ok ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle2 size={56} color={accent} style={{ marginBottom: '16px' }} />
              <h2 style={{ color: '#0f172a', margin: '0 0 8px' }}>¡Acceso concedido!</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Redirigiendo al panel...</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: '#e2e8f0', borderRadius: '11px', padding: '4px' }}>
                {[
                  { id: 'cliente', label: 'Portal Clientes', color: TEAL },
                  { id: 'admin',   label: 'Panel Admin',     color: VIOLET },
                ].map(({ id, label, color }) => {
                  const activo = (id === 'admin' ? esAdmin : !esAdmin);
                  return (
                    <button key={id} type="button"
                      onClick={() => { setModo(id); setEmail(''); setPassword(''); setNombre(''); setDireccion(''); }}
                      style={{
                        flex: 1, padding: '9px 0', border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '700', transition: 'all 0.18s',
                        background: activo ? 'white' : 'transparent',
                        color: activo ? color : '#94a3b8',
                        boxShadow: activo ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
                      }}>
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Título */}
              <div style={{ marginBottom: '22px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                  {esAdmin ? 'Acceso al panel' : esRegistro ? 'Crear cuenta' : 'Bienvenido de vuelta'}
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  {esAdmin
                    ? 'Ingresa tu correo y contraseña o licencia'
                    : esRegistro
                      ? 'Regístrate para acceder a la tienda'
                      : 'Ingresa con tus credenciales'}
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {esRegistro && (
                  <>
                    <Field icon={<User size={15} />} placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} accent={accent} />
                    <Field icon={<MapPin size={15} />} placeholder="Dirección de envío" value={direccion} onChange={e => setDireccion(e.target.value)} accent={accent} />
                  </>
                )}

                <Field icon={<Mail size={15} />} type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required accent={accent} />

                {/* Contraseña / Licencia */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Lock size={15} />
                  </div>
                  <input
                    type={verPass ? 'text' : 'password'}
                    placeholder={esAdmin ? 'Contraseña o licencia (LIC-XXXX-XXXX-XXXX)' : 'Contraseña (mín. 6 caracteres)'}
                    value={password} onChange={e => setPassword(esAdmin ? e.target.value.toUpperCase() : e.target.value)}
                    required style={{ ...inputStyle, paddingRight: '42px', fontFamily: esAdmin && password.startsWith('LIC') ? 'monospace' : 'inherit' }}
                  />
                  <button type="button" onClick={() => setVerPass(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                    {verPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Botón principal */}
                <button type="submit" disabled={cargando} style={{
                  marginTop: '4px', padding: '13px', border: 'none', borderRadius: '10px',
                  background: cargando ? '#94a3b8' : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  color: 'white', fontSize: '14px', fontWeight: '700', cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: cargando ? 'none' : `0 4px 14px ${accent}44`,
                  transition: 'all 0.2s',
                }}>
                  {cargando ? 'Verificando...' : esAdmin ? 'Entrar al panel' : esRegistro ? 'Crear mi cuenta' : 'Iniciar sesión'}
                  {!cargando && <ArrowRight size={16} />}
                </button>
              </form>

              {/* Toggle registro */}
              {!esAdmin && (
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                  {esRegistro ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                  <button
                    onClick={() => { setModo(esRegistro ? 'cliente' : 'registro'); setNombre(''); setDireccion(''); setPassword(''); }}
                    style={{ background: 'none', border: 'none', color: TEAL, cursor: 'pointer', fontWeight: '700', fontSize: '13px', padding: 0 }}>
                    {esRegistro ? 'Inicia sesión' : 'Regístrate gratis'}
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Campo reutilizable ────────────────────────────────────── */
function Field({ icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{icon}</div>
      <input {...props} style={{ ...inputStyle, paddingLeft: '40px' }} />
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 12px 12px 40px', borderRadius: '9px',
  border: '1.5px solid #e2e8f0', fontSize: '13.5px',
  boxSizing: 'border-box', outline: 'none',
  background: 'white', color: '#0f172a',
  transition: 'border-color 0.15s',
};

export default Login;
