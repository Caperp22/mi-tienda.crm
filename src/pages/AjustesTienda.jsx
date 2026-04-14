import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Settings, Image as ImageIcon, Palette, Save, Clock } from 'lucide-react';

function AjustesTienda({ empresaId }) {
  const [colorPrincipal, setColorPrincipal] = useState('#3b82f6');
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [horaApertura, setHoraApertura] = useState('09:00');
  const [horaCierre, setHoraCierre] = useState('18:00');
  const [intervaloCitas, setIntervaloCitas] = useState(30);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarConfig() {
      const { data } = await supabase.from('empresas').select('color_principal, logo_url, hora_apertura, hora_cierre, intervalo_citas').eq('id', empresaId).single();
      if (data) {
        setColorPrincipal(data.color_principal || '#3b82f6');
        setLogoUrl(data.logo_url);
        setHoraApertura(data.hora_apertura?.substring(0, 5) || '09:00');
        setHoraCierre(data.hora_cierre?.substring(0, 5) || '18:00');
        setIntervaloCitas(data.intervalo_citas || 30);
      }
      setCargando(false);
    }
    if (empresaId) cargarConfig();
  }, [empresaId]);

  async function guardarAjustes(e) {
    e.preventDefault();
    setGuardando(true);

    try {
      let nuevaUrl = logoUrl;

      // Si seleccionó un archivo nuevo, lo subimos
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

        nuevaUrl = publicUrl;
      }

      const { error } = await supabase
        .from('empresas')
        .update({ 
          color_principal: colorPrincipal, 
          logo_url: nuevaUrl,
          hora_apertura: horaApertura,
          hora_cierre: horaCierre,
          intervalo_citas: intervaloCitas 
        })
        .eq('id', empresaId);

      if (error) throw error;

      Swal.fire({
        title: '¡Ajustes guardados!',
        text: 'Tu configuración ha sido actualizada. La página se recargará para aplicar los cambios en todo el sistema.',
        icon: 'success',
        confirmButtonText: 'Entendido'
      }).then(() => {
        window.location.reload(); // Recargamos para que el App.jsx tome los nuevos colores y logos
      });

    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <div style={{ color: '#64748b' }}>Cargando ajustes...</div>;

  const estilos = {
    card: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', maxWidth: '600px' },
    label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#475569' },
    inputGroup: { marginBottom: '25px' },
    fileInput: { border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', width: '100%', boxSizing: 'border-box', background: '#f8fafc' },
    colorInput: { border: 'none', width: '60px', height: '50px', cursor: 'pointer', background: 'none', padding: 0 },
    btnPrimary: { padding: '14px 20px', background: colorPrincipal, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', transition: 'opacity 0.2s' },
    preview: { width: '150px', height: '150px', objectFit: 'contain', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', marginTop: '10px', background: '#f8fafc' }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <Settings size={32} color={colorPrincipal} />
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Ajustes de Tienda</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Personaliza la apariencia de tu negocio para tus clientes.</p>

      <div style={estilos.card}>
        <form onSubmit={guardarAjustes}>
          
          <div style={estilos.inputGroup}>
            <label style={estilos.label}><Palette size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Color Principal de la Marca</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input type="color" value={colorPrincipal} onChange={(e) => setColorPrincipal(e.target.value)} style={estilos.colorInput} />
              <span style={{ fontFamily: 'monospace', color: '#64748b', background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>{colorPrincipal.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>Este color se usará en tus botones, notificaciones y menú de navegación.</p>
          </div>

          <div style={estilos.inputGroup}>
            <label style={estilos.label}><ImageIcon size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Logotipo de la Empresa</label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} style={estilos.fileInput} />
            
            {logoUrl && !logoFile && (
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '15px', marginBottom: '5px', fontWeight: 'bold' }}>Logo actual en tu tienda:</p>
                <img src={logoUrl} alt="Logo" style={estilos.preview} />
              </div>
            )}
            {logoFile && (
              <div>
                <p style={{ fontSize: '13px', color: '#10b981', marginTop: '15px', marginBottom: '5px', fontWeight: 'bold' }}>✅ Nuevo logo listo para ser guardado.</p>
              </div>
            )}
          </div>

          <div style={estilos.inputGroup}>
            <label style={estilos.label}><Clock size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Horarios de Atención (Agenda)</label>
            <div style={{ display: 'flex', gap: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>Hora de Apertura</span>
                <input type="time" style={{...estilos.fileInput, background: 'white'}} value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>Hora de Cierre</span>
                <input type="time" style={{...estilos.fileInput, background: 'white'}} value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>Intervalo (Mins)</span>
                <input type="number" min="5" step="5" style={{...estilos.fileInput, background: 'white'}} value={intervaloCitas} onChange={(e) => setIntervaloCitas(e.target.value)} required />
              </div>
            </div>
          </div>

          <button type="submit" disabled={guardando} style={{...estilos.btnPrimary, opacity: guardando ? 0.7 : 1}}>
            <Save size={20} /> {guardando ? 'Guardando cambios...' : 'Guardar Ajustes'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default AjustesTienda;