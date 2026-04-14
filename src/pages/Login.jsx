import { useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Lock, LockOpen, User, MapPin } from 'lucide-react'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [loginExitoso, setLoginExitoso] = useState(false);

  async function manejarAcceso(e) {
    e.preventDefault();
    setCargando(true);
    setLoginExitoso(false);

    const tiendaActual = localStorage.getItem('tiendaActual');

    if (esRegistro) {
      if (!nombre) {
        setCargando(false);
        return Swal.fire('Error', 'El nombre es obligatorio', 'warning');
      }

      // 1. Guardamos en la Bóveda de Seguridad (Auth)
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { nombre, direccion, telefono: '' } // Guardamos datos a nivel global
        }
      });
      
      if (error) {
        if (error.message.includes('already registered') || error.status === 422) {
          Swal.fire('Cuenta existente', 'Tu correo ya pertenece a nuestra red de tiendas. Por favor, selecciona "Iniciar Sesión".', 'info');
        } else {
          Swal.fire('Error', error.message, 'error');
        }
      } else {
        // 2. Guardamos en el Directorio de Clientes (Tabla Pública)
        if (tiendaActual) {
          await supabase.from('clientes').insert([{ 
            nombre: nombre, 
            correo: email,
            telefono: '', 
            direccion: direccion,
            empresa_id: tiendaActual
          }]);
        }

        Swal.fire('¡Éxito!', 'Cuenta creada correctamente. Ya puedes iniciar sesión.', 'success');
        setEsRegistro(false); 
      }
      setCargando(false);

    } else {
      // INICIO DE SESIÓN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        Swal.fire('Error', 'Credenciales incorrectas', 'error');
        setCargando(false);
      } else {
          // --- MAGIA MULTI-TENANT: Agregar al directorio de la nueva tienda ---
          if (tiendaActual) {
            const { data: clienteExistente } = await supabase.from('clientes')
              .select('id').eq('correo', email).eq('empresa_id', tiendaActual).maybeSingle();

            if (!clienteExistente) {
              const meta = data.user.user_metadata;
              await supabase.from('clientes').insert([{
                nombre: meta?.nombre || 'Cliente Web',
                correo: email,
                telefono: meta?.telefono || '',
                direccion: meta?.direccion || '',
                empresa_id: tiendaActual
              }]);
            }
          }
        setLoginExitoso(true);
      }
    }
  }

  const estilos = {
    overlay: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b, #0f172a)', fontFamily: 'sans-serif', padding: '20px' },
    card: { background: 'white', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' },
    iconHeader: { marginBottom: '20px', color: loginExitoso ? '#10b981' : '#4f46e5', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: loginExitoso ? 'scale(1.2)' : 'scale(1)', display: 'flex', justifyContent: 'center' },
    inputGroup: { position: 'relative', marginBottom: '15px' },
    inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
    inputBase: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' },
    passwordWrapper: { position: 'relative', width: '100%', marginBottom: '15px' },
    passwordInput: { padding: '12px 45px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none' },
    eyeIcon: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex', alignItems: 'center' },
    mainBtn: { width: '100%', padding: '14px', background: loginExitoso ? '#10b981' : '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: cargando ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'background 0.3s' }
  };

  return (
    <div style={estilos.overlay}>
      <div style={estilos.card}>
        <div style={estilos.iconHeader}>
          {loginExitoso ? <LockOpen size={64} /> : <Lock size={64} />}
        </div>
        <h1 style={{ marginBottom: '10px', color: '#1e293b' }}>{esRegistro ? 'Crear Cuenta' : 'Bienvenido'}</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>{esRegistro ? 'Regístrate para comprar' : 'Ingresa a tu cuenta'}</p>

        <form onSubmit={manejarAcceso} style={{ display: 'flex', flexDirection: 'column' }}>
          {esRegistro && (
            <>
              <div style={estilos.inputGroup}>
                <User style={estilos.inputIcon} size={18} />
                <input type="text" placeholder="Tu nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} style={estilos.inputBase} />
              </div>
              <div style={estilos.inputGroup}>
                <MapPin style={estilos.inputIcon} size={18} />
                <input type="text" placeholder="Tu dirección de envío" value={direccion} onChange={(e) => setDireccion(e.target.value)} style={estilos.inputBase} />
              </div>
            </>
          )}

          <div style={estilos.inputGroup}>
            <input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required style={{...estilos.inputBase, paddingLeft: '12px'}} />
          </div>
          
          <div style={estilos.passwordWrapper}>
            <input type={verContrasena ? 'text' : 'password'} placeholder="Tu contraseña (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required style={{...estilos.passwordInput, paddingLeft: '12px'}} />
            <button type="button" onClick={() => setVerContrasena(!verContrasena)} style={estilos.eyeIcon}>
              {verContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <button type="submit" disabled={cargando} style={estilos.mainBtn}>
            {cargando ? 'Cargando...' : loginExitoso ? '¡Acceso Concedido!' : (esRegistro ? 'Registrarme' : 'Entrar')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => { setEsRegistro(!esRegistro); setNombre(''); setDireccion(''); }} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
            {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;