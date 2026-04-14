import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { UserPlus, Trash2, Building } from 'lucide-react';

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

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Building size={24} /> Enlazar Administradores a Empresas
      </h2>
      
      <form onSubmit={enlazarAdmin} style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <input 
          type="email" 
          placeholder="Correo del cliente (Ej: juan@pizzeria.com)" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ flex: 1, minWidth: '250px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
        <select 
          value={empresaId} 
          onChange={(e) => setEmpresaId(e.target.value)} 
          required
          style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}
        >
          <option value="">-- Selecciona una Empresa --</option>
          {empresas.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
          ))}
        </select>
        <button type="submit" style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} /> Enlazar Usuario
        </button>
      </form>

      {cargando ? (
        <p style={{ color: '#64748b' }}>Cargando datos...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '14px' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Correo Administrador</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Empresa Asignada</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: '500', color: '#334155' }}>{admin.email}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>
                  <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    {admin.empresas?.nombre || 'Empresa Desconocida'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => revocarAcceso(admin.id, admin.email)}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                    title="Revocar Acceso"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay administradores asignados a empresas.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GestionAdminsGlobal;