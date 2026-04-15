import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { UserPlus, Trash2, Building, Users, Mail, ShieldAlert } from 'lucide-react';

function GestionAdminsGlobal() {
  const [admins, setAdmins] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [email, setEmail] = useState('');
  const [empresaId, setEmpresaId] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      // 1. Traer empresas para el menú desplegable
      const { data: dataEmpresas, error: errEmpresas } = await supabase
        .from('empresas')
        .select('id, nombre, estado')
        .eq('estado', 'activa')
        .order('nombre', { ascending: true });
      
      if (errEmpresas) throw errEmpresas;
      setEmpresas(dataEmpresas || []);

      // 2. Traer administradores y el nombre de su empresa relacionada
      const { data: dataAdmins, error: errAdmins } = await supabase
        .from('administradores')
        .select('id, email, rol, empresa_id, empresas(nombre)')
        .eq('rol', 'admin')
        .order('id', { ascending: true });

      if (errAdmins) throw errAdmins;
      setAdmins(dataAdmins || []);
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setCargando(false);
    }
  }

  async function enlazarAdmin(e) {
    e.preventDefault();
    if (!email.trim() || !empresaId) return;

    try {
      const { error } = await supabase
        .from('administradores')
        .insert([{ 
          email: email.toLowerCase(), 
          rol: 'admin', 
          empresa_id: empresaId 
        }]);

      if (error) throw error;
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Administrador enlazado a la empresa', showConfirmButton: false, timer: 3000 });
      setEmail('');
      setEmpresaId('');
      cargarDatos();
    } catch (error) {
      Swal.fire('Error', error.message || 'Ese correo ya está registrado o hubo un problema.', 'error');
    }
  }

  async function revocarAcceso(id, emailAdmin) {
    const confirmacion = await Swal.fire({
      title: '¿Revocar acceso?',
      text: `El usuario ${emailAdmin} ya no podrá administrar su empresa.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, revocar'
    });

    if (confirmacion.isConfirmed) {
      const { error } = await supabase.from('administradores').delete().eq('id', id);
      if (!error) {
        cargarDatos();
        Swal.fire('Revocado', 'Acceso eliminado correctamente.', 'success');
      }
    }
  }

  const estilos = {
    card: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' },
    input: { width: '100%', padding: '10px 12px 10px 35px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' },
    btnPrimary: { padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s', height: '38px' },
    th: { padding: '12px 15px', background: '#f8fafc', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td: { padding: '12px 15px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: '#334155' }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <Users size={32} color="#4f46e5" />
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '800' }}>Admins de Empresas</h2>
      </div>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Enlaza los correos de tus clientes (dueños de negocio) con sus respectivas tiendas.</p>
      
      <div style={estilos.card}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={20} color="#4f46e5" /> Asignar nuevo administrador
        </h3>
        <form onSubmit={enlazarAdmin} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              <input 
                type="email" 
                placeholder="dueño@negocio.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ ...estilos.input, background: 'white' }}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Empresa (Inquilino)</label>
            <div style={{ position: 'relative' }}>
              <Building size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              <select 
                value={empresaId} 
                onChange={(e) => setEmpresaId(e.target.value)} 
                required
                style={{ ...estilos.input, background: 'white', cursor: 'pointer' }}
              >
                <option value="">-- Seleccionar --</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ flex: '0 0 auto' }}>
            <button type="submit" style={{ ...estilos.btnPrimary }}>
              Enlazar Cuenta
            </button>
          </div>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Cuentas con Acceso a Tiendas</h3>
          <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{admins.length} Administradores</span>
        </div>

        {cargando ? (
          <p style={{ color: '#64748b', padding: '30px', textAlign: 'center' }}>Cargando datos...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={estilos.th}>Usuario / Correo</th>
                  <th style={estilos.th}>Negocio Administrado</th>
                  <th style={{ ...estilos.th, textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={estilos.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <UserPlus size={16} />
                        </div>
                        <span style={{ fontWeight: '600' }}>{admin.email}</span>
                      </div>
                    </td>
                    <td style={estilos.td}>
                      <span style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={12} color="#64748b" /> {admin.empresas?.nombre || 'Empresa Eliminada'}
                      </span>
                    </td>
                    <td style={{ ...estilos.td, textAlign: 'center' }}>
                      <button 
                        onClick={() => revocarAcceso(admin.id, admin.email)}
                        style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' }}
                        title="Revocar Acceso"
                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                      >
                        <Trash2 size={14} /> Revocar
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <ShieldAlert size={40} style={{ opacity: 0.2, marginBottom: '10px', display: 'inline-block' }} />
                    <p style={{ margin: 0 }}>No hay administradores enlazados a empresas.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionAdminsGlobal;