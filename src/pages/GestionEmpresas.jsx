import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Building2, Plus, Power, Store, Calendar, Palette, Image as ImageIcon, Clock, CheckCircle } from 'lucide-react';

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

  const estilos = {
    card: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' },
    sectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' },
    label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' },
    checkboxContainer: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', transition: 'border 0.2s' },
    btnPrimary: { width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <Building2 size={32} color="#3b82f6" />
        <h1 style={{ fontSize: '28px', color: '#1e293b', margin: 0, fontWeight: '800' }}>Empresas (Inquilinos)</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Registra nuevos negocios y configura su espacio de trabajo en la plataforma.</p>
      
      <div style={estilos.card}>
        <form onSubmit={crearEmpresa}>
          
          <div style={estilos.sectionTitle}><Building2 size={18} color="#4f46e5" /> Datos Generales</div>
          <div style={estilos.formGrid}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={estilos.label}>Nombre Comercial del Negocio</label>
              <input type="text" placeholder="Ej. Pizzería Don Lucio" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{...estilos.input, background: 'white'}} required />
            </div>
            <div>
              <label style={estilos.label}>Color Principal (Marca)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '8px' }}>
                <Palette size={16} color="#64748b" />
                <input type="color" value={colorPrincipal} onChange={(e) => setColorPrincipal(e.target.value)} style={{ border: 'none', width: '30px', height: '30px', cursor: 'pointer', background: 'none', padding: 0 }} />
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase' }}>{colorPrincipal}</span>
              </div>
            </div>
            <div>
              <label style={estilos.label}>Logotipo (Opcional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '8px', overflow: 'hidden' }}>
                <ImageIcon size={16} color="#64748b" style={{ flexShrink: 0 }} />
                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} style={{ border: 'none', fontSize: '12px', width: '100%', background: 'transparent' }} />
              </div>
            </div>
          </div>
        
          <div style={estilos.sectionTitle}><Clock size={18} color="#10b981" /> Horarios de Atención</div>
          <div style={estilos.formGrid}>
            <div>
              <label style={estilos.label}>Hora de Apertura</label>
              <input type="time" value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} style={{...estilos.input, background: 'white'}} required />
            </div>
            <div>
              <label style={estilos.label}>Hora de Cierre</label>
              <input type="time" value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} style={{...estilos.input, background: 'white'}} required />
            </div>
            <div>
              <label style={estilos.label}>Intervalo de Citas (Mins)</label>
              <input type="number" min="5" step="5" value={intervaloCitas} onChange={(e) => setIntervaloCitas(e.target.value)} style={{...estilos.input, background: 'white'}} required />
            </div>
          </div>

          <div style={estilos.sectionTitle}><CheckCircle size={18} color="#f59e0b" /> Módulos Activos</div>
          <div style={estilos.formGrid}>
            <label style={{ ...estilos.checkboxContainer, borderColor: usaInventario ? '#3b82f6' : '#cbd5e1' }}>
              <input type="checkbox" checked={usaInventario} onChange={(e) => setUsaInventario(e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}><Store size={16} color="#3b82f6" /> Tienda Física / Productos</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Habilita el inventario y recepción de pedidos.</div>
              </div>
            </label>
            <label style={{ ...estilos.checkboxContainer, borderColor: usaCitas ? '#10b981' : '#cbd5e1' }}>
              <input type="checkbox" checked={usaCitas} onChange={(e) => setUsaCitas(e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={16} color="#10b981" /> Servicios / Agenda</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Habilita el calendario para reservar citas.</div>
              </div>
            </label>
          </div>
        
          <button type="submit" disabled={cargando} style={{ ...estilos.btnPrimary, opacity: cargando ? 0.7 : 1 }}>
            <Plus size={20} /> {cargando ? 'Procesando...' : 'Registrar Empresa y Crear Espacio'}
          </button>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Directorio de Empresas</h3>
          <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{empresas.length} Registradas</span>
        </div>
        
        {cargando && empresas.length === 0 ? (
          <p style={{ color: '#64748b', padding: '30px', textAlign: 'center' }}>Cargando lista de empresas...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '15px 20px', background: 'white', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>ID Sistema (UUID)</th>
                  <th style={{ padding: '15px 20px', background: 'white', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Empresa</th>
                  <th style={{ padding: '15px 20px', background: 'white', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                  <th style={{ padding: '15px 20px', background: 'white', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '15px 20px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>{emp.id}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {emp.logo_url ? (
                          <img src={emp.logo_url} alt="logo" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'contain', background: '#f1f5f9' }} />
                        ) : (
                          <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: emp.color_principal || '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                            {emp.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontWeight: 'bold', color: '#334155' }}>{emp.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block',
                        background: emp.estado === 'activa' ? '#dcfce3' : '#fee2e2',
                        color: emp.estado === 'activa' ? '#166534' : '#991b1b'
                      }}>
                        {emp.estado === 'activa' ? '🟢 ACTIVA' : '🔴 INACTIVA'}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                      <button 
                        onClick={() => cambiarEstado(emp.id, emp.estado)}
                        style={{ padding: '8px 12px', background: emp.estado === 'activa' ? '#fffbeb' : '#ecfdf5', color: emp.estado === 'activa' ? '#d97706' : '#059669', border: `1px solid ${emp.estado === 'activa' ? '#fde68a' : '#a7f3d0'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', margin: '0 auto', transition: 'all 0.2s' }}
                      >
                        <Power size={16} /> {emp.estado === 'activa' ? 'Suspender' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {empresas.length === 0 && !cargando && (
                  <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay empresas registradas aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionEmpresas;