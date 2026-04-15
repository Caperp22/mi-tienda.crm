import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';

function GestionEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');
  const [usaInventario, setUsaInventario] = useState(true);
  const [usaCitas, setUsaCitas] = useState(true);
  const [colorPrincipal, setColorPrincipal] = useState('#3b82f6');
  const [logoFile, setLogoFile] = useState(null);
  const [horaApertura, setHoraApertura] = useState('09:00');
  const [horaCierre, setHoraCierre] = useState('18:00');
  const [intervaloCitas, setIntervaloCitas] = useState(30);

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
      let logoUrlFinal = null;

      // Si seleccionaste un logo al crear la empresa, lo subimos
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, logoFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);
          
        logoUrlFinal = publicUrl;
      }

      const { error } = await supabase
        .from('empresas')
        .insert([{ 
          nombre, 
          usa_inventario: usaInventario, 
          usa_citas: usaCitas, 
          color_principal: colorPrincipal,
          logo_url: logoUrlFinal,
          hora_apertura: horaApertura,
          hora_cierre: horaCierre,
          intervalo_citas: intervaloCitas
        }]);

      if (error) throw error;
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empresa registrada', showConfirmButton: false, timer: 3000 });
      setNombre('');
      setUsaInventario(true);
      setUsaCitas(true);
      setColorPrincipal('#3b82f6');
      setLogoFile(null);
      setHoraApertura('09:00');
      setHoraCierre('18:00');
      setIntervaloCitas(30);
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
      
      <form onSubmit={crearEmpresa} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Nombre del nuevo negocio / cliente" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ flex: 2, minWidth: '250px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Color App:</label>
            <input type="color" value={colorPrincipal} onChange={(e) => setColorPrincipal(e.target.value)} style={{ border: 'none', width: '30px', height: '30px', cursor: 'pointer', background: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, minWidth: '250px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Logo:</label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} style={{ border: 'none', padding: '5px', fontSize: '12px', width: '100%' }} />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Apertura:</label>
            <input type="time" value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} style={{ border: '1px solid #e2e8f0', padding: '5px', borderRadius: '4px', outline: 'none', width: '100%' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Cierre:</label>
            <input type="time" value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} style={{ border: '1px solid #e2e8f0', padding: '5px', borderRadius: '4px', outline: 'none', width: '100%' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Intervalo (min):</label>
            <input type="number" min="5" step="5" value={intervaloCitas} onChange={(e) => setIntervaloCitas(e.target.value)} style={{ border: '1px solid #e2e8f0', padding: '5px', borderRadius: '4px', outline: 'none', width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={usaInventario} onChange={(e) => setUsaInventario(e.target.checked)} /> Vende Productos (Tienda)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={usaCitas} onChange={(e) => setUsaCitas(e.target.checked)} /> Ofrece Servicios (Agenda)
          </label>
        </div>
        
        <button type="submit" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
          + Registrar Empresa y Crear Espacio
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