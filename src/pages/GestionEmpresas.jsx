import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import {
  Building2, Plus, Power, Store, Calendar, Palette, Image as ImageIcon,
  Clock, CheckCircle, Trash2, Zap, Star, Crown, Package, ShoppingBag,
  Users, DollarSign, BarChart2, Shield, Briefcase, Edit3, X, Save
} from 'lucide-react';
import {
  MODULOS_DISPONIBLES,
  MODULOS_POR_PLAN,
  getModulosPorDefecto,
} from '../config/modulos';

// Mapeo de nombre de ícono → componente Lucide
const ICONOS = { Store, Calendar, Package, ShoppingBag, Users, DollarSign, BarChart2, Shield, Briefcase };

function GestionEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- Estado del formulario de creación ---
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [planSeleccionado, setPlanSeleccionado] = useState('pro');
  const [modulosSeleccionados, setModulosSeleccionados] = useState(getModulosPorDefecto('pro'));
  const [colorPrincipal, setColorPrincipal] = useState('#3b82f6');
  const [logoFile, setLogoFile] = useState(null);
  const [horaApertura, setHoraApertura] = useState('09:00');
  const [horaCierre, setHoraCierre] = useState('18:00');
  const [intervaloCitas, setIntervaloCitas] = useState(30);

  // --- Estado del modal de edición ---
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [editModulos, setEditModulos] = useState({});
  const [editPlan, setEditPlan] = useState('pro');
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // Cuando cambia el plan, se actualizan los módulos por defecto
  function seleccionarPlan(plan) {
    setPlanSeleccionado(plan);
    setModulosSeleccionados(getModulosPorDefecto(plan));
  }

  function toggleModulo(moduloId) {
    const planPermite = MODULOS_POR_PLAN[planSeleccionado]?.includes(moduloId);
    if (!planPermite) return; // No se puede habilitar un módulo que no está en el plan
    setModulosSeleccionados(prev => ({ ...prev, [moduloId]: !prev[moduloId] }));
  }

  function toggleModuloEdit(moduloId) {
    const planPermite = MODULOS_POR_PLAN[editPlan]?.includes(moduloId);
    if (!planPermite) return;
    setEditModulos(prev => ({ ...prev, [moduloId]: !prev[moduloId] }));
  }

  useEffect(() => { cargarEmpresas(); }, []);

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
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, logoFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
        logoUrlFinal = publicUrl;
      }

      const { data, error } = await supabase
        .from('empresas')
        .insert([{
          nombre,
          rut,
          plan: planSeleccionado,
          modulos: modulosSeleccionados,
          // Compatibilidad legacy
          usa_inventario: modulosSeleccionados.inventario || false,
          usa_citas: modulosSeleccionados.agenda || false,
          color_principal: colorPrincipal,
          logo_url: logoUrlFinal,
          hora_apertura: horaApertura,
          hora_cierre: horaCierre,
          intervalo_citas: intervaloCitas
        }]).select();

      if (error) throw error;

      const nuevaEmpresa = data[0];
      const urlTienda = `${window.location.origin}/?tienda=${nuevaEmpresa.id}`;

      Swal.fire({
        title: '¡Empresa Creada!',
        html: `
          <div style="text-align:left;padding:15px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-top:10px;">
            <p style="margin:0 0 10px 0;color:#475569;font-size:14px;"><strong>1. Enlace público de la tienda:</strong></p>
            <div style="background:white;padding:10px;border-radius:6px;border:1px solid #cbd5e1;word-break:break-all;font-family:monospace;font-size:13px;color:#3b82f6;margin-bottom:15px;user-select:all;">
              ${urlTienda}
            </div>
            <p style="margin:0 0 5px 0;color:#d97706;font-size:14px;font-weight:bold;">⚠️ 2. Credenciales de Acceso:</p>
            <p style="margin:0;color:#64748b;font-size:13px;">Ve a <b>"Cuentas de Admins"</b>, registra el correo del dueño y asígnale esta empresa.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Entendido, continuar',
        confirmButtonColor: '#3b82f6'
      });

      setNombre(''); setRut(''); setPlanSeleccionado('pro');
      setModulosSeleccionados(getModulosPorDefecto('pro'));
      setColorPrincipal('#3b82f6'); setLogoFile(null);
      setHoraApertura('09:00'); setHoraCierre('18:00'); setIntervaloCitas(30);
      cargarEmpresas();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  function abrirEdicion(empresa) {
    setEmpresaEditando(empresa);
    setEditPlan(empresa.plan || 'básico');
    // Soporta modulos JSONB o el formato legacy
    if (empresa.modulos) {
      setEditModulos({ ...empresa.modulos });
    } else {
      setEditModulos(getModulosPorDefecto(empresa.plan || 'básico'));
    }
  }

  async function guardarEdicion() {
    if (!empresaEditando) return;
    setGuardandoEdit(true);
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          plan: editPlan,
          modulos: editModulos,
          usa_inventario: editModulos.inventario || false,
          usa_citas: editModulos.agenda || false,
        })
        .eq('id', empresaEditando.id);
      if (error) throw error;
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Configuración guardada', showConfirmButton: false, timer: 3000 });
      setEmpresaEditando(null);
      cargarEmpresas();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setGuardandoEdit(false);
    }
  }

  async function cambiarEstado(id, estadoActual) {
    const nuevoEstado = estadoActual === 'activa' ? 'inactiva' : 'activa';
    try {
      const { error } = await supabase.from('empresas').update({ estado: nuevoEstado }).eq('id', id);
      if (error) throw error;
      cargarEmpresas();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  async function eliminarEmpresa(id, nombreEmpresa) {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar empresa?',
      text: `Estás a punto de eliminar "${nombreEmpresa}". ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (confirmacion.isConfirmed) {
      try {
        const { error } = await supabase.from('empresas').delete().eq('id', id);
        if (error) throw error;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empresa eliminada', showConfirmButton: false, timer: 3000 });
        cargarEmpresas();
      } catch {
        Swal.fire('Error', 'No se pudo eliminar. Es posible que tenga datos vinculados.', 'error');
      }
    }
  }

  const estilos = {
    card: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' },
    sectionTitle: { fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: 'white' },
    label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' },
    planCard: (activo) => ({ border: activo ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: activo ? '#eff6ff' : 'white', borderRadius: '12px', padding: '15px', cursor: 'pointer', flex: 1, textAlign: 'center', transition: 'all 0.2s', position: 'relative', minWidth: '100px' }),
    btnPrimary: { width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' },
  };

  function ModulosGrid({ modulos, plan, onToggle, compacto = false }) {
    const categorias = [...new Set(MODULOS_DISPONIBLES.map(m => m.categoria))];
    return (
      <div>
        {categorias.map(cat => (
          <div key={cat} style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>{cat}</p>
            <div style={{ display: 'grid', gridTemplateColumns: compacto ? 'repeat(auto-fill, minmax(160px,1fr))' : 'repeat(auto-fill, minmax(190px,1fr))', gap: '8px' }}>
              {MODULOS_DISPONIBLES.filter(m => m.categoria === cat).map(mod => {
                const planPermite = MODULOS_POR_PLAN[plan]?.includes(mod.id);
                const activo = modulos[mod.id] && planPermite;
                const Icono = ICONOS[mod.icono] || Package;
                return (
                  <div
                    key={mod.id}
                    onClick={() => planPermite && onToggle(mod.id)}
                    title={mod.descripcion}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 12px', borderRadius: '8px', cursor: planPermite ? 'pointer' : 'not-allowed',
                      border: activo ? `2px solid ${planPermite ? '#3b82f6' : '#e2e8f0'}` : '1px solid #e2e8f0',
                      background: activo ? '#eff6ff' : (planPermite ? 'white' : '#f8fafc'),
                      opacity: planPermite ? 1 : 0.45,
                      transition: 'all 0.2s',
                      userSelect: 'none',
                    }}
                  >
                    <Icono size={16} color={activo ? '#3b82f6' : '#94a3b8'} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: activo ? '#1d4ed8' : '#475569' }}>{mod.nombre}</p>
                      {!planPermite && (
                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>
                          {mod.id === 'admins' ? 'Solo Advance' : 'Solo Pro+'}
                        </p>
                      )}
                    </div>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${activo ? '#3b82f6' : '#cbd5e1'}`, background: activo ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {activo && <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold', lineHeight: 1 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function SelectorPlan({ planActual, onChange }) {
    return (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={estilos.planCard(planActual === 'básico')} onClick={() => onChange('básico')}>
          <Zap size={22} color={planActual === 'básico' ? '#3b82f6' : '#94a3b8'} style={{ marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>Básico</h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Tienda + Inventario</p>
        </div>
        <div style={estilos.planCard(planActual === 'pro')} onClick={() => onChange('pro')}>
          {planActual === 'pro' && <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', fontSize: '10px', padding: '2px 10px', borderRadius: '10px', fontWeight: 'bold' }}>POPULAR</span>}
          <Star size={22} color={planActual === 'pro' ? '#3b82f6' : '#94a3b8'} style={{ marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>Pro</h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Básico + Agenda + Stats</p>
        </div>
        <div style={estilos.planCard(planActual === 'advance')} onClick={() => onChange('advance')}>
          <Crown size={22} color={planActual === 'advance' ? '#3b82f6' : '#94a3b8'} style={{ marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b' }}>Advance</h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Todo + Multi-Admins</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Building2 size={32} color="#3b82f6" />
        <h1 style={{ fontSize: '26px', color: '#1e293b', margin: 0, fontWeight: '800' }}>Empresas (Inquilinos)</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Registra negocios y configura su espacio según el plan contratado.</p>

      {/* ===== FORMULARIO CREAR EMPRESA ===== */}
      <div style={estilos.card}>
        <form onSubmit={crearEmpresa}>
          {/* PLAN */}
          <div style={{ marginBottom: '25px' }}>
            <div style={estilos.sectionTitle}><Crown size={15} color="#f59e0b" /> 1. Selecciona el Plan Contratado</div>
            <SelectorPlan planActual={planSeleccionado} onChange={seleccionarPlan} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {/* IDENTIDAD */}
            <div>
              <div style={estilos.sectionTitle}><Building2 size={15} color="#4f46e5" /> 2. Identidad de la Empresa</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={estilos.label}>Nombre Comercial</label>
                <input type="text" placeholder="Ej. Salón Bella Rosa" value={nombre} onChange={e => setNombre(e.target.value)} style={estilos.input} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={estilos.label}>RUT / NIT</label>
                <input type="text" placeholder="Ej. 900.123.456-7" value={rut} onChange={e => setRut(e.target.value)} style={estilos.input} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={estilos.label}>Color Principal</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', background: 'white' }}>
                    <Palette size={13} color="#64748b" />
                    <input type="color" value={colorPrincipal} onChange={e => setColorPrincipal(e.target.value)} style={{ border: 'none', width: '24px', height: '24px', cursor: 'pointer', background: 'none', padding: 0 }} />
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>{colorPrincipal}</span>
                  </div>
                </div>
                <div>
                  <label style={estilos.label}>Logo (Opcional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', overflow: 'hidden', background: 'white' }}>
                    <ImageIcon size={13} color="#64748b" style={{ flexShrink: 0 }} />
                    <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ border: 'none', fontSize: '11px', width: '100%', background: 'transparent' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* HORARIOS */}
            <div>
              <div style={{ opacity: modulosSeleccionados.agenda ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                <div style={estilos.sectionTitle}><Clock size={15} color="#10b981" /> 3. Config. de Agenda {!modulosSeleccionados.agenda && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'normal' }}>(módulo no activo)</span>}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={estilos.label}>Hora Apertura</label>
                    <input type="time" value={horaApertura} onChange={e => setHoraApertura(e.target.value)} style={estilos.input} disabled={!modulosSeleccionados.agenda} />
                  </div>
                  <div>
                    <label style={estilos.label}>Hora Cierre</label>
                    <input type="time" value={horaCierre} onChange={e => setHoraCierre(e.target.value)} style={estilos.input} disabled={!modulosSeleccionados.agenda} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={estilos.label}>Intervalo de Citas (min)</label>
                    <input type="number" min="5" step="5" value={intervaloCitas} onChange={e => setIntervaloCitas(e.target.value)} style={estilos.input} disabled={!modulosSeleccionados.agenda} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MÓDULOS */}
          <div style={{ marginTop: '25px' }}>
            <div style={estilos.sectionTitle}><CheckCircle size={15} color="#f59e0b" /> 4. Módulos Habilitados — Plan {planSeleccionado.toUpperCase()}</div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Los módulos grises no están disponibles en este plan. Puedes desactivar módulos incluidos en el plan si el cliente no los necesita.
            </p>
            <ModulosGrid modulos={modulosSeleccionados} plan={planSeleccionado} onToggle={toggleModulo} />
          </div>

          <button type="submit" style={estilos.btnPrimary}>
            <Plus size={18} /> Registrar Empresa y Crear Espacio
          </button>
        </form>
      </div>

      {/* ===== DIRECTORIO DE EMPRESAS ===== */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>Directorio de Empresas</h3>
          <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{empresas.length} Registradas</span>
        </div>

        {cargando ? (
          <p style={{ color: '#64748b', padding: '30px', textAlign: 'center' }}>Cargando...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  {['Empresa', 'Plan', 'Módulos Activos', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '11px 15px', background: 'white', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empresas.map(emp => {
                  const mods = emp.modulos || {};
                  const modulosActivos = MODULOS_DISPONIBLES.filter(m => mods[m.id]);
                  return (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {emp.logo_url
                            ? <img src={emp.logo_url} alt="logo" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'contain', background: '#f1f5f9' }} />
                            : <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: emp.color_principal || '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '13px' }}>{emp.nombre.charAt(0).toUpperCase()}</div>
                          }
                          <div>
                            <span style={{ fontWeight: 'bold', color: '#334155', fontSize: '13px', display: 'block' }}>{emp.nombre}</span>
                            {emp.rut && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{emp.rut}</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                          background: emp.plan === 'advance' ? '#1e293b' : emp.plan === 'pro' ? '#eff6ff' : '#f1f5f9',
                          color: emp.plan === 'advance' ? '#fbbf24' : emp.plan === 'pro' ? '#2563eb' : '#64748b',
                        }}>
                          {emp.plan === 'advance' && <Crown size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />}
                          {emp.plan || 'BÁSICO'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {modulosActivos.length > 0
                            ? modulosActivos.map(m => {
                                const Ic = ICONOS[m.icono] || Package;
                                return (
                                  <span key={m.id} title={m.nombre} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                    <Ic size={10} /> {m.nombre.split('/')[0].trim()}
                                  </span>
                                );
                              })
                            : <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sin módulos (legado)</span>
                          }
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block',
                          background: emp.estado === 'activa' ? '#dcfce3' : '#fee2e2',
                          color: emp.estado === 'activa' ? '#166534' : '#991b1b'
                        }}>
                          {emp.estado === 'activa' ? '● ACTIVA' : '● INACTIVA'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => abrirEdicion(emp)} title="Configurar módulos" style={{ padding: '6px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Edit3 size={13} /> Configurar
                          </button>
                          <button onClick={() => cambiarEstado(emp.id, emp.estado)} style={{ padding: '6px 10px', background: emp.estado === 'activa' ? '#fffbeb' : '#ecfdf5', color: emp.estado === 'activa' ? '#d97706' : '#059669', border: `1px solid ${emp.estado === 'activa' ? '#fde68a' : '#a7f3d0'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Power size={13} /> {emp.estado === 'activa' ? 'Suspender' : 'Activar'}
                          </button>
                          <button onClick={() => eliminarEmpresa(emp.id, emp.nombre)} title="Eliminar" style={{ padding: '6px 8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {empresas.length === 0 && !cargando && (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay empresas registradas aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== MODAL EDITAR MÓDULOS ===== */}
      {empresaEditando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a' }}>Configurar: {empresaEditando.nombre}</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Cambia el plan o activa/desactiva módulos individuales.</p>
              </div>
              <button onClick={() => setEmpresaEditando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Plan de Suscripción</p>
              <SelectorPlan planActual={editPlan} onChange={(plan) => { setEditPlan(plan); setEditModulos(getModulosPorDefecto(plan)); }} />
            </div>

            <div>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Módulos Habilitados</p>
              <ModulosGrid modulos={editModulos} plan={editPlan} onToggle={toggleModuloEdit} compacto />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEmpresaEditando(null)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                Cancelar
              </button>
              <button onClick={guardarEdicion} disabled={guardandoEdit} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={15} /> {guardandoEdit ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEmpresas;
