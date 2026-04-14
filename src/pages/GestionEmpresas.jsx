import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';

function GestionEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    cargarEmpresas();
  }, []);

  async function cargarEmpresas() {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setCargando(false);
    }
  }

  async function crearEmpresa(e) {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      const { error } = await supabase
        .from('empresas')
        .insert([{ nombre }]);

      if (error) throw error;
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empresa registrada', showConfirmButton: false, timer: 3000 });
      setNombre('');
      cargarEmpresas();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  async function cambiarEstado(id, estadoActual) {
    const nuevoEstado = estadoActual === 'activa' ? 'inactiva' : 'activa';
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      cargarEmpresas();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>🏢 Gestión de Empresas (Inquilinos)</h2>
      
      <form onSubmit={crearEmpresa} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Nombre del nuevo negocio / cliente" 
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Registrar Empresa
        </button>
      </form>

      {cargando ? (
        <p style={{ color: '#64748b' }}>Cargando lista de empresas...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '14px' }}>
              <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ID Sistema (UUID)</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Nombre Comercial</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
              <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{emp.id}</td>
                <td style={{ padding: '12px', fontWeight: '500', color: '#334155' }}>{emp.nombre}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                    background: emp.estado === 'activa' ? '#dcfce3' : '#fee2e2',
                    color: emp.estado === 'activa' ? '#166534' : '#991b1b'
                  }}>
                    {emp.estado.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => cambiarEstado(emp.id, emp.estado)}
                    style={{ padding: '6px 12px', background: emp.estado === 'activa' ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    {emp.estado === 'activa' ? 'Suspender' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay empresas registradas aún.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GestionEmpresas;