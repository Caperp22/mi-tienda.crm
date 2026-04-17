import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Settings, Image as ImageIcon, Palette, Save, Clock, TrendingUp, Zap, Star, Crown, Send, Phone } from 'lucide-react';
import { MODULOS_DISPONIBLES, INFO_PLANES, MODULOS_POR_PLAN } from '../config/modulos';

function AjustesTienda({ empresaId }) {
  const [colorPrincipal, setColorPrincipal] = useState('#3b82f6');
  const [colorSecundario, setColorSecundario] = useState('#0f172a');
  const [colorTerciario, setColorTerciario] = useState('#f59e0b');
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [horaApertura, setHoraApertura] = useState('09:00');
  const [horaCierre, setHoraCierre] = useState('18:00');
  const [intervaloCitas, setIntervaloCitas] = useState(30);
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Datos del plan actual
  const [planActual, setPlanActual] = useState(null);
  const [modulosActuales, setModulosActuales] = useState({});
  const [enviandoUpgrade, setEnviandoUpgrade] = useState(false);
  const [solicitudPendiente, setSolicitudPendiente] = useState(null);

  useEffect(() => {
    async function cargarConfig() {
      const { data } = await supabase
        .from('empresas')
        .select('color_principal, color_secundario, color_terciario, logo_url, hora_apertura, hora_cierre, intervalo_citas, plan, modulos, telefono')
        .eq('id', empresaId)
        .single();
      if (data) {
        setColorPrincipal(data.color_principal || '#3b82f6');
        setColorSecundario(data.color_secundario || '#0f172a');
        setColorTerciario(data.color_terciario || '#f59e0b');
        setLogoUrl(data.logo_url);
        setHoraApertura(data.hora_apertura?.substring(0, 5) || '09:00');
        setHoraCierre(data.hora_cierre?.substring(0, 5) || '18:00');
        setIntervaloCitas(data.intervalo_citas || 30);
        setPlanActual(data.plan || 'básico');
        setModulosActuales(data.modulos || {});
        setTelefono(data.telefono || '');
      }

      // Ver si hay solicitud de upgrade pendiente
      const { data: sol } = await supabase
        .from('solicitudes_upgrade')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('estado', 'pendiente')
        .maybeSingle();
      setSolicitudPendiente(sol);

      setCargando(false);
    }
    if (empresaId) cargarConfig();
  }, [empresaId]);

  async function guardarAjustes(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      let nuevaUrl = logoUrl;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, logoFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
        nuevaUrl = publicUrl;
      }

      const { error } = await supabase
        .from('empresas')
        .update({ color_principal: colorPrincipal, color_secundario: colorSecundario, color_terciario: colorTerciario, logo_url: nuevaUrl, hora_apertura: horaApertura, hora_cierre: horaCierre, intervalo_citas: intervaloCitas, telefono: telefono })
        .eq('id', empresaId);

      if (error) throw error;
      Swal.fire({ title: '¡Ajustes guardados!', text: 'La página se recargará para aplicar los cambios.', icon: 'success', confirmButtonText: 'Entendido' })
        .then(() => window.location.reload());
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function solicitarUpgrade(planDeseado) {
    setEnviandoUpgrade(true);
    try {
      const { error } = await supabase.from('solicitudes_upgrade').insert([{
        empresa_id: empresaId,
        plan_actual: planActual,
        plan_solicitado: planDeseado,
        estado: 'pendiente',
      }]);
      if (error) throw error;

      Swal.fire({
        title: '¡Solicitud enviada!',
        html: `<p>Tu solicitud para cambiar al plan <b>${planDeseado.toUpperCase()}</b> fue enviada al administrador del sistema. Te contactarán pronto.</p>`,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
      });

      // Recargar para mostrar estado pendiente
      const { data: sol } = await supabase.from('solicitudes_upgrade').select('*').eq('empresa_id', empresaId).eq('estado', 'pendiente').maybeSingle();
      setSolicitudPendiente(sol);

      // Enviar WhatsApp al Super Admin
      const { data: sysConf } = await supabase.from('sistema_config').select('telefono_whatsapp').eq('id', 1).maybeSingle();
      if (sysConf && sysConf.telefono_whatsapp) {
        const msg = `👋 Hola Soporte, solicito una mejora al plan *${planDeseado.toUpperCase()}* para mi tienda.\nPor favor revisen la solicitud en el panel.`;
        window.open(`https://wa.me/${sysConf.telefono_whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setEnviandoUpgrade(false);
    }
  }

  if (cargando) return <div style={{ color: '#64748b', padding: '20px' }}>Cargando ajustes...</div>;

  const estilos = {
    card: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '25px' },
    label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#475569' },
    inputGroup: { marginBottom: '25px' },
    fileInput: { border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', width: '100%', boxSizing: 'border-box', background: '#f8fafc' },
    btnPrimary: { padding: '14px 20px', background: colorPrincipal, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' },
  };

  // Planes disponibles para upgrade (solo los superiores al actual)
  const ordenPlanes = ['básico', 'pro', 'advance'];
  const indiceActual = ordenPlanes.indexOf(planActual);
  const planesUpgrade = ordenPlanes.slice(indiceActual + 1);

  return (
    <div style={{ maxWidth: '750px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Settings size={30} color={colorPrincipal} />
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Ajustes de Tienda</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Personaliza tu negocio y gestiona tu plan.</p>

      {/* ===== PLAN ACTUAL Y MÓDULOS ===== */}
      <div style={estilos.card}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="#3b82f6" /> Tu Plan Actual
        </h2>

        {/* Badge del plan */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: planActual === 'advance' ? '#1e293b' : planActual === 'pro' ? '#eff6ff' : '#f1f5f9', color: planActual === 'advance' ? '#fbbf24' : planActual === 'pro' ? '#2563eb' : '#64748b', border: `1px solid ${planActual === 'advance' ? '#334155' : planActual === 'pro' ? '#bfdbfe' : '#e2e8f0'}`, padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', marginBottom: '15px' }}>
          {planActual === 'advance' ? <Crown size={16} /> : planActual === 'pro' ? <Star size={16} /> : <Zap size={16} />}
          PLAN {planActual?.toUpperCase()}
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 15px 0' }}>{INFO_PLANES[planActual]?.descripcion}</p>

        {/* Módulos habilitados */}
        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Módulos activos en tu plan</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {MODULOS_DISPONIBLES.filter(m => modulosActuales[m.id]).map(m => (
            <span key={m.id} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
              {m.nombre}
            </span>
          ))}
          {MODULOS_DISPONIBLES.filter(m => !modulosActuales[m.id] && MODULOS_POR_PLAN['advance'].includes(m.id)).map(m => (
            <span key={m.id} style={{ background: '#f8fafc', color: '#cbd5e1', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
              {m.nombre}
            </span>
          ))}
        </div>
      </div>

      {/* ===== SOLICITAR UPGRADE ===== */}
      {planesUpgrade.length > 0 && (
        <div style={estilos.card}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#10b981" /> Mejorar Plan
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Desbloquea más funcionalidades para tu negocio.</p>

          {solicitudPendiente ? (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Send size={20} color="#d97706" />
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#92400e', fontSize: '14px' }}>Solicitud pendiente de revisión</p>
                <p style={{ margin: '3px 0 0 0', color: '#b45309', fontSize: '12px' }}>
                  Solicitaste el plan <b>{solicitudPendiente.plan_solicitado?.toUpperCase()}</b>. El administrador procesará tu solicitud pronto.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {planesUpgrade.map(plan => {
                const info = INFO_PLANES[plan];
                const nuevosModulos = MODULOS_POR_PLAN[plan].filter(m => !MODULOS_POR_PLAN[planActual]?.includes(m));
                return (
                  <div key={plan} style={{ flex: 1, minWidth: '220px', border: `2px solid ${info.color}`, borderRadius: '12px', padding: '20px', background: plan === 'advance' ? '#0f172a' : info.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      {plan === 'advance' ? <Crown size={20} color="#fbbf24" /> : <Star size={20} color={info.color} />}
                      <h3 style={{ margin: 0, fontSize: '16px', color: plan === 'advance' ? 'white' : '#1e293b', fontWeight: 'bold' }}>Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}</h3>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: plan === 'advance' ? '#94a3b8' : '#64748b' }}>{info.descripcion}</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', color: plan === 'advance' ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Nuevos módulos:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '15px' }}>
                      {nuevosModulos.map(id => (
                        <span key={id} style={{ background: plan === 'advance' ? '#1e293b' : 'white', color: info.color, border: `1px solid ${info.color}`, padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                          + {MODULOS_DISPONIBLES.find(m => m.id === id)?.nombre || id}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => solicitarUpgrade(plan)}
                      disabled={enviandoUpgrade}
                      style={{ width: '100%', padding: '10px', background: plan === 'advance' ? '#fbbf24' : info.color, color: plan === 'advance' ? '#0f172a' : 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Send size={14} /> {enviandoUpgrade ? 'Enviando...' : `Solicitar Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== APARIENCIA ===== */}
      <div style={estilos.card}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={18} color="#3b82f6" /> Apariencia y Horarios
        </h2>
        <form onSubmit={guardarAjustes}>
          <div style={estilos.inputGroup}>
            <label style={estilos.label}><Phone size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Teléfono / WhatsApp (Notificaciones)</label>
            <input 
              type="tel" 
              style={{ ...estilos.fileInput, background: 'white' }} 
              placeholder="Ej. 573001234567 (Incluye el código de país)" 
              value={telefono} 
              onChange={e => setTelefono(e.target.value)} 
            />
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#64748b' }}>A este número llegarán los mensajes de WhatsApp por nuevos pedidos o citas agendadas.</p>
          </div>

          <div style={estilos.inputGroup}>
            <label style={estilos.label}><Palette size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Colores de la Marca</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Principal (Botones/Acentos)</span>
                <input type="color" value={colorPrincipal} onChange={e => setColorPrincipal(e.target.value)} style={{ width: '100%', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Secundario (Fondos/Sidebar)</span>
                <input type="color" value={colorSecundario} onChange={e => setColorSecundario(e.target.value)} style={{ width: '100%', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Terciario (Alertas/Destacados)</span>
                <input type="color" value={colorTerciario} onChange={e => setColorTerciario(e.target.value)} style={{ width: '100%', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
              </div>
            </div>
          </div>

          <div style={estilos.inputGroup}>
            <label style={estilos.label}><ImageIcon size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Logotipo</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={estilos.fileInput} />
            {logoUrl && !logoFile && <img src={logoUrl} alt="Logo" style={{ width: '120px', height: '120px', objectFit: 'contain', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', marginTop: '10px' }} />}
            {logoFile && <p style={{ color: '#10b981', fontSize: '13px', marginTop: '8px', fontWeight: 'bold' }}>✅ Nuevo logo listo para guardar</p>}
          </div>

          <div style={estilos.inputGroup}>
            <label style={estilos.label}><Clock size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Horarios de Atención</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              {[['Apertura', horaApertura, setHoraApertura], ['Cierre', horaCierre, setHoraCierre]].map(([label, val, setter]) => (
                <div key={label} style={{ flex: 1, minWidth: '120px' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>{label}</span>
                  <input type="time" style={{ ...estilos.fileInput, background: 'white' }} value={val} onChange={e => setter(e.target.value)} required />
                </div>
              ))}
              <div style={{ flex: 1, minWidth: '120px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Intervalo (min)</span>
                <input type="number" min="5" step="5" style={{ ...estilos.fileInput, background: 'white' }} value={intervaloCitas} onChange={e => setIntervaloCitas(e.target.value)} required />
              </div>
            </div>
          </div>

          <button type="submit" disabled={guardando} style={{ ...estilos.btnPrimary, opacity: guardando ? 0.7 : 1 }}>
            <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar Ajustes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AjustesTienda;
