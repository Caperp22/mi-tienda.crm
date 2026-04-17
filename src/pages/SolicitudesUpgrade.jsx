import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { TrendingUp, Phone, CheckCircle, XCircle, Clock, Save, Building } from 'lucide-react';
import { getModulosPorDefecto } from '../config/modulos';

function SolicitudesUpgrade({ dark = false }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [telefonoAdmin, setTelefonoAdmin] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardandoTel, setGuardandoTel] = useState(false);

  const t = {
    page:    dark ? '#060d1a'                : '#f0f4ff',
    card:    dark ? 'rgba(255,255,255,0.04)' : 'white',
    border:  dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    text:    dark ? '#f0f4ff'                : '#0f172a',
    sub:     dark ? '#94a3b8'                : '#64748b',
    input:   dark ? 'rgba(255,255,255,0.06)' : 'white',
    inputB:  dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
  };

  const cargarDatos = useCallback(async () => {
    // Cargar teléfono del Super Admin
    const { data: sysConf } = await supabase.from('sistema_config').select('telefono_whatsapp').eq('id', 1).maybeSingle();
    if (sysConf) setTelefonoAdmin(sysConf.telefono_whatsapp || '');

    // Cargar solicitudes con datos de la empresa
    const { data: sols } = await supabase
      .from('solicitudes_upgrade')
      .select('*, empresas(nombre, telefono, email_admin)')
      .order('created_at', { ascending: false });
      
    setSolicitudes(sols || []);
    setCargando(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  async function guardarTelefono() {
    setGuardandoTel(true);
    const { error } = await supabase
      .from('sistema_config')
      .upsert({ id: 1, telefono_whatsapp: telefonoAdmin }, { onConflict: 'id' });
      
    setGuardandoTel(false);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Número de soporte actualizado', showConfirmButton: false, timer: 2000 });
  }

  async function aprobar(solicitud) {
    const plan = solicitud.plan_solicitado || '';
    const { isConfirmed } = await Swal.fire({
      title: `¿Aprobar Plan ${plan.toUpperCase()}?`,
      text: `La empresa ${solicitud.empresas?.nombre || 'desconocida'} cambiará de plan inmediatamente y se le activarán los nuevos módulos.`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, aprobar', cancelButtonText: 'Cancelar', confirmButtonColor: '#10b981'
    });

    if (!isConfirmed) return;

    // 1. Actualizar empresa: plan y modulos
    const nuevosModulos = getModulosPorDefecto(plan);
    const { error: errEmp } = await supabase.from('empresas').update({
      plan: plan,
      modulos: nuevosModulos,
      usa_inventario: nuevosModulos.inventario || false,
      usa_citas: nuevosModulos.agenda || false
    }).eq('id', solicitud.empresa_id);

    if (errEmp) return Swal.fire('Error al actualizar empresa', errEmp.message, 'error');

    // 2. Actualizar solicitud a aprobada
    await supabase.from('solicitudes_upgrade').update({ estado: 'aprobada' }).eq('id', solicitud.id);

    Swal.fire('¡Aprobada!', 'El plan de la empresa ha sido actualizado.', 'success');
    
    // Notificar por WhatsApp al cliente informándole que fue aprobado
    if (solicitud.empresas?.telefono) {
      const msg = `¡Hola! Tu solicitud de mejora al plan *${plan.toUpperCase()}* ha sido aprobada con éxito. 🚀\nYa puedes ingresar a tu panel y disfrutar de las nuevas funcionalidades.`;
      window.open(`https://wa.me/${solicitud.empresas.telefono}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    
    cargarDatos();
  }

  async function rechazar(solicitud) {
    const { isConfirmed } = await Swal.fire({
      title: '¿Rechazar solicitud?',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, rechazar', confirmButtonColor: '#ef4444'
    });
    
    if (!isConfirmed) return;

    await supabase.from('solicitudes_upgrade').update({ estado: 'rechazada' }).eq('id', solicitud.id);
    Swal.fire('Rechazada', 'La solicitud de mejora fue denegada.', 'info');
    cargarDatos();
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <TrendingUp size={32} color="#3b82f6" />
        <h2 style={{ margin: 0, color: t.text, fontSize: '28px', fontWeight: '800' }}>Solicitudes de Upgrade</h2>
      </div>
      <p style={{ color: t.sub, marginBottom: '30px' }}>Gestiona los cambios de plan solicitados por tus inquilinos.</p>

      {/* Configuración del Super Admin */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '24px', marginBottom: '30px', boxShadow: dark ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={18} color="#10b981" /> Tu número de WhatsApp (Soporte)
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: t.sub }}>
          Recibirás un mensaje directo a este número cuando una empresa solicite mejorar su suscripción.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            type="tel" 
            value={telefonoAdmin} 
            onChange={e => setTelefonoAdmin(e.target.value)} 
            placeholder="Ej. 573001234567 (Incluye el código de país)"
            style={{ padding: '12px 16px', borderRadius: '8px', border: `1px solid ${t.inputB}`, background: t.input, color: t.text, flex: 1, minWidth: '200px', outline: 'none', fontSize: '14px' }}
          />
          <button onClick={guardarTelefono} disabled={guardandoTel} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0 24px', height: '45px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> {guardandoTel ? 'Guardando...' : 'Guardar número'}
          </button>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: t.text, fontWeight: '700' }}>Historial de Solicitudes</h3>
      
      {cargando ? (
        <p style={{ color: t.sub, textAlign: 'center', padding: '30px' }}>Cargando solicitudes...</p>
      ) : solicitudes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: t.card, borderRadius: '12px', border: `1px solid ${t.border}` }}>
          <TrendingUp size={48} color={t.sub} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ margin: 0, color: t.sub, fontSize: '15px' }}>No hay solicitudes de upgrade por el momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {solicitudes.map(sol => (
            <div key={sol.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderLeft: `4px solid ${sol.estado === 'aprobada' ? '#10b981' : sol.estado === 'rechazada' ? '#ef4444' : '#f59e0b'}`, borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', boxShadow: dark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Building size={16} color={t.sub} />
                  <span style={{ fontSize: '16px', fontWeight: '800', color: t.text }}>{sol.empresas?.nombre || 'Empresa Eliminada'}</span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '14px', color: t.sub }}>Solicita pasar de <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: t.text }}>{sol.plan_actual}</span> a <span style={{ color: '#3b82f6', textTransform: 'uppercase', fontWeight: 'bold' }}>{sol.plan_solicitado}</span></p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: t.sub }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {new Date(sol.created_at).toLocaleString('es-CO')}</span>
                  {sol.empresas?.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {sol.empresas.telefono}</span>}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {sol.estado === 'pendiente' ? (
                  <>
                    <button onClick={() => rechazar(sol)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}><XCircle size={16} /> Rechazar</button>
                    <button onClick={() => aprobar(sol)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'filter 0.2s', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'none'}><CheckCircle size={16} /> Aprobar</button>
                  </>
                ) : (
                  <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: sol.estado === 'aprobada' ? '#10b98120' : '#ef444420', color: sol.estado === 'aprobada' ? '#10b981' : '#ef4444' }}>{sol.estado.toUpperCase()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SolicitudesUpgrade;