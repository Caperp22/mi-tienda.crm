import { useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Lock, LockOpen, User, MapPin, Mail, Briefcase } from 'lucide-react';

// modo: 'cliente' | 'registro' | 'admin'
function Login() {
  const [modo, setModo] = useState('cliente'); // 'cliente', 'registro', 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licencia, setLicencia] = useState(''); // clave de acceso para admins
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [loginExitoso, setLoginExitoso] = useState(false);

  async function manejarAcceso(e) {
    e.preventDefault();
    setCargando(true);
    setLoginExitoso(false);
    const tiendaActual = localStorage.getItem('tiendaActual');

    // ── MODO ADMIN: email + licencia como contraseña ─────────────
    if (modo === 'admin') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: licencia.trim(),
      });
      setCargando(false);
      if (error) {
        Swal.fire('Acceso denegado', 'Correo o licencia incorrectos. Verifica los datos proporcionados por tu proveedor.', 'error');
      } else {
        setLoginExitoso(true);
      }
      return;
    }

    // ── MODO REGISTRO ────────────────────────────────────────────
    if (modo === 'registro') {
      if (!nombre) {
        setCargando(false);
        return Swal.fire('Error', 'El nombre es obligatorio', 'warning');
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre, direccion, telefono: '' } },
      });
      if (error) {
        if (error.message.includes('already registered') || error.status === 422) {
          Swal.fire('Cuenta existente', 'Tu correo ya está registrado. Inicia sesión.', 'info');
        } else {
          Swal.fire('Error', error.message, 'error');
        }
      } else {
        if (tiendaActual) {
          await supabase.from('clientes').insert([{
            nombre, correo: email, telefono: '', direccion, empresa_id: tiendaActual,
          }]);
        }
        Swal.fire('¡Éxito!', 'Cuenta creada. Ya puedes iniciar sesión.', 'success');
        setModo('cliente');
      }
      setCargando(false);
      return;
    }

    // ── MODO CLIENTE: email + contraseña ─────────────────────────
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Swal.fire('Error', 'Credenciales incorrectas', 'error');
      setCargando(false);
    } else {
      if (tiendaActual) {
        const { data: existente } = await supabase.from('clientes')
          .select('id').eq('correo', email).eq('empresa_id', tiendaActual).maybeSingle();
        if (!existente) {
          const meta = data.user.user_metadata;
          await supabase.from('clientes').insert([{
            nombre: meta?.nombre || 'Cliente Web',
            correo: email, telefono: meta?.telefono || '',
            direccion: meta?.direccion || '', empresa_id: tiendaActual,
          }]);
        }
      }
      setLoginExitoso(true);
    }
  }

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        {/* ── Ícono ─────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: loginExitoso ? '#10b981' : '#4f46e5', transition: 'all 0.4s', transform: loginExitoso ? 'scale(1.2)' : 'scale(1)' }}>
          {loginExitoso ? <LockOpen size={64} /> : <Lock size={64} />}
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '6px', color: '#1e293b' }}>
          {modo === 'registro' ? 'Crear Cuenta' : modo === 'admin' ? 'Acceso Administrador' : 'Bienvenido'}
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
          {modo === 'admin' ? 'Usa el correo y la licencia que te proporcionaron' : modo === 'registro' ? 'Regístrate para comprar en la tienda' : 'Ingresa a tu cuenta'}
        </p>

        {/* ── Tabs modo ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
          {[
            { id: 'cliente',  label: 'Cliente',       ico: <User size={14} /> },
            { id: 'admin',    label: 'Administrador', ico: <Briefcase size={14} /> },
          ].map(({ id, label, ico }) => (
            <button key={id} type="button"
              onClick={() => { setModo(id); setEmail(''); setPassword(''); }}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: '7px', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                background: modo === id ? 'white' : 'transparent',
                color: modo === id ? '#4f46e5' : '#64748b',
                boxShadow: modo === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
              {ico} {label}
            </button>
          ))}
        </div>

        {/* ── Formulario ────────────────────────────────── */}
        <form onSubmit={manejarAcceso} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {modo === 'registro' && (
            <>
              <div style={s.inputGroup}>
                <User style={s.inputIcon} size={18} />
                <input type="text" placeholder="Tu nombre completo" value={nombre}
                  onChange={e => setNombre(e.target.value)} style={s.input} />
              </div>
              <div style={s.inputGroup}>
                <MapPin style={s.inputIcon} size={18} />
                <input type="text" placeholder="Tu dirección de envío" value={direccion}
                  onChange={e => setDireccion(e.target.value)} style={s.input} />
              </div>
            </>
          )}

          <div style={s.inputGroup}>
            <Mail style={s.inputIcon} size={18} />
            <input type="email" placeholder="Tu correo electrónico" value={email}
              onChange={e => setEmail(e.target.value)} required style={s.input} />
          </div>

          {modo === 'admin' ? (
            <div style={s.inputGroup}>
              <Briefcase style={s.inputIcon} size={18} />
              <input
                type="text"
                placeholder="LIC-XXXX-XXXX-XXXX"
                value={licencia} onChange={e => setLicencia(e.target.value.toUpperCase())} required
                style={{ ...s.input, letterSpacing: '1.5px', fontFamily: 'monospace', fontSize: '14px' }}
              />
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type={verContrasena ? 'text' : 'password'}
                placeholder="Tu contraseña (mínimo 6 caracteres)"
                value={password} onChange={e => setPassword(e.target.value)} required
                style={{ ...s.input, paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setVerContrasena(!verContrasena)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex' }}>
                {verContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          <button type="submit" disabled={cargando} style={{
            padding: '14px', background: loginExitoso ? '#10b981' : '#4f46e5', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700',
            cursor: cargando ? 'not-allowed' : 'pointer', transition: 'background 0.3s', marginTop: '4px',
          }}>
            {cargando ? 'Cargando...' : loginExitoso ? '¡Acceso Concedido!' : modo === 'admin' ? 'Ingresar al panel' : modo === 'registro' ? 'Registrarme' : 'Entrar'}
          </button>
        </form>

        {/* ── Toggle registro (solo en modo cliente) ───── */}
        {(modo === 'cliente' || modo === 'registro') && (
          <div style={{ textAlign: 'center', marginTop: '18px' }}>
            <button
              onClick={() => { setModo(modo === 'registro' ? 'cliente' : 'registro'); setNombre(''); setDireccion(''); }}
              style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline', fontSize: '13px' }}>
              {modo === 'registro' ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b, #0f172a)',
    fontFamily: 'sans-serif', padding: '20px',
  },
  card: {
    background: 'white', padding: '40px', borderRadius: '16px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  },
  inputGroup: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  input: {
    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px',
    border: '1px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box', outline: 'none',
  },
};

export default Login;
