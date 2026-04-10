import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Shield, Trash2, Plus, AlertTriangle } from 'lucide-react';

function GestionAdmins() {
  const [admins, setAdmins] = useState([]);
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerAdmins();
  }, []);

  async function obtenerAdmins() {
    setCargando(true);
    const { data } = await supabase.from('administradores').select('*').order('id', { ascending: true });
    if (data) setAdmins(data);
    setCargando(false);
  }

  async function agregarAdmin(e) {
    e.preventDefault();
    if (!nuevoCorreo.includes('@')) return Swal.fire('Error', 'Ingresa un correo válido', 'error');

    const { data, error } = await supabase.from('administradores').insert([{ email: nuevoCorreo.toLowerCase() }]).select();
    
    if (error) {
      Swal.fire('Error', 'Ese correo ya es administrador o hubo un problema.', 'error');
    } else if (data) {
      setAdmins([...admins, data[0]]);
      setNuevoCorreo('');
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Administrador agregado', showConfirmButton: false, timer: 2000 });
    }
  }

  async function eliminarAdmin(id, email) {
    if (admins.length === 1) {
      return Swal.fire('Aviso', 'No puedes eliminar al último administrador, te quedarías sin acceso al sistema.', 'warning');
    }

    const confirmacion = await Swal.fire({
      title: '¿Revocar acceso?',
      text: `El usuario ${email} perderá acceso al panel de control inmediatamente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, revocar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      const { error } = await supabase.from('administradores').delete().eq('id', id);
      if (!error) {
        setAdmins(admins.filter(a => a.id !== id));
        Swal.fire('Revocado', 'El usuario ya no es administrador.', 'success');
      }
    }
  }

  if (cargando) return <div>Cargando administradores...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <Shield size={32} color="#4f46e5" />
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Administradores</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Controla quién tiene acceso a este panel de control.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'start' }}>
        
        {/* Formulario para agregar */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Dar acceso a un usuario</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>El usuario debe iniciar sesión con su correo normalmente. Una vez inicie, verá este panel en lugar de la tienda.</p>
          
          <form onSubmit={agregarAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="correo@ejemplo.com" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} required />
            <button type="submit" style={{ padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Agregar Administrador
            </button>
          </form>
        </div>

        {/* Lista de Jefes */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Jefes Actuales ({admins.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {admins.map(admin => (
              <div key={admin.id} style={{ background: 'white', padding: '15px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#334155' }}>{admin.email}</div>
                <button onClick={() => eliminarAdmin(admin.id, admin.email)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Revocar acceso">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', padding: '15px', background: '#fffbeb', color: '#d97706', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '13px', display: 'flex', gap: '10px' }}>
            <AlertTriangle size={24} style={{ flexShrink: 0 }} />
            <span>Cualquier persona en esta lista tiene control total sobre inventario, pedidos y citas. Agrega solo personas de confianza.</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GestionAdmins;