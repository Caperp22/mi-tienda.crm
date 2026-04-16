import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Users, Building, Mail, Phone, MapPin } from 'lucide-react';

function GestionClientesGlobal() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      // Traemos a todos los clientes y usamos la relación para saber a qué empresa pertenecen
      const { data, error } = await supabase
        .from('clientes')
        .select('*, empresas(nombre)')
        .order('created_at', { ascending: false });
      
      if (!error && data) setClientes(data);
      setCargando(false);
    }
    cargarDatos();
  }, []);

  const estilos = {
    th: { padding: '15px 20px', background: '#f8fafc', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td: { padding: '15px 20px', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: '#334155' }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <Users size={32} color="#4f46e5" />
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '800' }}>Directorio Global de Clientes</h2>
      </div>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Visión general de todos los consumidores finales registrados en las tiendas de tus inquilinos.</p>
      
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Consumidores Finales de la Red</h3>
          <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{clientes.length} Registrados</span>
        </div>

        {cargando ? (
          <p style={{ color: '#64748b', padding: '30px', textAlign: 'center' }}>Cargando directorio global...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={estilos.th}>Cliente / Consumidor</th>
                  <th style={estilos.th}>Contacto</th>
                  <th style={estilos.th}>Ubicación</th>
                  <th style={estilos.th}>Tienda a la que pertenece</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr key={cliente.id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={estilos.td}>
                      <span style={{ fontWeight: '600', display: 'block' }}>{cliente.nombre}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {String(cliente.id).substring(0,8)}...</span>
                    </td>
                    <td style={estilos.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={14} color="#94a3b8" /> {cliente.correo}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}><Phone size={14} color="#94a3b8" /> {cliente.telefono || 'N/D'}</div>
                    </td>
                    <td style={estilos.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}><MapPin size={14} color="#94a3b8" /> {cliente.direccion || 'N/D'}</div>
                    </td>
                    <td style={estilos.td}>
                      <span style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={12} color="#64748b" /> {cliente.empresas?.nombre || 'Empresa Eliminada'}
                      </span>
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay clientes registrados en la plataforma.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionClientesGlobal;
