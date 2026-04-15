import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import {
  Building2, Plus, Power, Store, Calendar, Palette, Image as ImageIcon,
  Clock, Trash2, Zap, Star, Crown, Package, ShoppingBag, Users,
  DollarSign, BarChart2, Shield, Briefcase, Edit3, X, Save,
  Mail, KeyRound, Truck, Tag, Monitor, UserCheck, Gift, FileText,
  Copy, Check, ChevronRight, Lock,
} from 'lucide-react';
import {
  MODULOS_DISPONIBLES, MODULOS_POR_PLAN, getModulosPorDefecto,
  generarLicencia, INFO_PLANES,
} from '../config/modulos';

const ICONOS = {
  Store, Calendar, Package, ShoppingBag, Users, DollarSign, BarChart2,
  Shield, Briefcase, Truck, Tag, Monitor, UserCheck, Gift, FileText,
};

const CATEGORIA_COLOR = {
  Ventas:    { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  Servicios: { color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
  Gestión:   { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  Analítica: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
};

const PLAN_ESTILOS = {
  'básico': {
    label: 'Básico', gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', textColor: '#475569',
    icono: Zap, desc: 'Para negocios pequeños que arrancan', tag: null,
  },
  'pro': {
    label: 'Pro', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', textColor: '#1d4ed8',
    icono: Star, desc: 'Tienda + Agenda + Estadísticas', tag: 'MÁS POPULAR',
  },
  'advance': {
    label: 'Advance', gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', textColor: '#6d28d9',
    icono: Crown, desc: 'Todo ilimitado + POS + Empleados', tag: 'PREMIUM',
  },
};

// ── Selector de Plan ────────────────────────────────────────────────────────
function SelectorPlan({ planActual, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
      {Object.entries(PLAN_ESTILOS).map(([id, cfg]) => {
        const activo = planActual === id;
        const Ico = cfg.icono;
        const moduleCount = MODULOS_POR_PLAN[id]?.length || 0;
        return (
          <div
            key={id}
            onClick={() => onChange(id)}
            style={{
              border: activo ? `2px solid ${cfg.color}` : '2px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px 16px',
              cursor: 'pointer',
              background: activo ? cfg.bg : 'white',
              transition: 'all 0.2s',
              position: 'relative',
              boxShadow: activo ? `0 4px 14px ${cfg.color}22` : '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {cfg.tag && (
              <span style={{
                position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
                background: cfg.gradient, color: 'white',
                fontSize: '9px', padding: '3px 10px', borderRadius: '10px', fontWeight: '800',
                letterSpacing: '0.8px', whiteSpace: 'nowrap',
              }}>
                {cfg.tag}
              </span>
            )}

            {/* Ícono del plan */}
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', marginBottom: '12px',
              background: activo ? cfg.gradient : '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: activo ? `0 4px 10px ${cfg.color}33` : 'none',
              transition: 'all 0.2s',
            }}>
              <Ico size={20} color={activo ? 'white' : '#94a3b8'} />
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: activo ? cfg.textColor : '#1e293b' }}>
              {cfg.label}
            </h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: activo ? cfg.color : '#94a3b8', lineHeight: '1.4' }}>
              {cfg.desc}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{
                fontSize: '11px', fontWeight: '600',
                color: activo ? cfg.textColor : '#64748b',
                background: activo ? `${cfg.color}15` : '#f1f5f9',
                padding: '2px 8px', borderRadius: '6px',
              }}>
                {moduleCount} módulos
              </span>
            </div>

            {activo && (
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: cfg.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={11} color="white" strokeWidth={3} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Grid de Módulos ─────────────────────────────────────────────────────────
function ModulosGrid({ modulos, plan, onToggle }) {
  const categorias = [...new Set(MODULOS_DISPONIBLES.map(m => m.categoria))];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {categorias.map(cat => {
        const catCfg = CATEGORIA_COLOR[cat] || { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
        const modulosCat = MODULOS_DISPONIBLES.filter(m => m.categoria === cat);
        return (
          <div key={cat}>
            {/* Header de categoría */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ height: '1px', flex: 1, background: catCfg.border }} />
              <span style={{
                fontSize: '10px', fontWeight: '700', color: catCfg.color,
                textTransform: 'uppercase', letterSpacing: '1.2px',
                background: catCfg.bg, border: `1px solid ${catCfg.border}`,
                padding: '3px 10px', borderRadius: '20px',
              }}>
                {cat}
              </span>
              <div style={{ height: '1px', flex: 1, background: catCfg.border }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px,1fr))', gap: '8px' }}>
              {modulosCat.map(mod => {
                const planPermite = MODULOS_POR_PLAN[plan]?.includes(mod.id);
                const activo = modulos[mod.id] && planPermite;
                const Ico = ICONOS[mod.icono] || Package;
                return (
                  <div
                    key={mod.id}
                    onClick={() => planPermite && onToggle(mod.id)}
                    title={mod.descripcion}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '10px',
                      cursor: planPermite ? 'pointer' : 'default',
                      border: activo ? `1.5px solid ${catCfg.color}55` : `1.5px solid ${planPermite ? '#e2e8f0' : '#f1f5f9'}`,
                      background: activo ? catCfg.bg : (planPermite ? 'white' : '#fafafa'),
                      opacity: planPermite ? 1 : 0.5,
                      transition: 'all 0.15s',
                      boxShadow: activo ? `0 2px 8px ${catCfg.color}18` : 'none',
                    }}
                  >
                    {/* Ícono */}
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0,
                      background: activo ? `${catCfg.color}15` : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {planPermite
                        ? <Ico size={14} color={activo ? catCfg.color : '#94a3b8'} />
                        : <Lock size={12} color="#cbd5e1" />
                      }
                    </div>

                    {/* Nombre */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: '12px', fontWeight: activo ? '600' : '500',
                        color: activo ? catCfg.color : (planPermite ? '#334155' : '#94a3b8'),
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {mod.nombre.split('/')[0].trim()}
                      </p>
                      {!planPermite && (
                        <p style={{ margin: 0, fontSize: '9px', color: '#cbd5e1', fontWeight: '600' }}>
                          {mod.id === 'admins' || mod.id === 'empleados' || mod.id === 'fidelizacion' || mod.id === 'pos' || mod.id === 'reportes'
                            ? 'ADVANCE' : 'PRO +'}
                        </p>
                      )}
                    </div>

                    {/* Toggle */}
                    {planPermite && (
                      <div style={{
                        width: '32px', height: '18px', borderRadius: '9px', flexShrink: 0,
                        background: activo ? catCfg.color : '#e2e8f0',
                        position: 'relative', transition: 'background 0.2s',
                      }}>
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                          position: 'absolute', top: '2px',
                          left: activo ? '16px' : '2px',
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente Principal ────────────────────────────────────────────────────
function GestionEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState(1); // wizard por pasos

  // Formulario
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [planSeleccionado, setPlanSeleccionado] = useState('pro');
  const [modulosSeleccionados, setModulosSeleccionados] = useState(getModulosPorDefecto('pro'));
  const [colorPrincipal, setColorPrincipal] = useState('#3b82f6');
  const [logoFile, setLogoFile] = useState(null);
  const [horaApertura, setHoraApertura] = useState('09:00');
  const [horaCierre, setHoraCierre] = useState('18:00');
  const [intervaloCitas, setIntervaloCitas] = useState(30);
  const [enviando, setEnviando] = useState(false);

  // Modal edición
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [editModulos, setEditModulos] = useState({});
  const [editPlan, setEditPlan] = useState('pro');
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // Búsqueda / filtro
  const [busqueda, setBusqueda] = useState('');
  const [filtroPlan, setFiltroPlan] = useState('todos');

  function seleccionarPlan(plan) {
    setPlanSeleccionado(plan);
    setModulosSeleccionados(getModulosPorDefecto(plan));
  }

  function toggleModulo(id) {
    if (!MODULOS_POR_PLAN[planSeleccionado]?.includes(id)) return;
    setModulosSeleccionados(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleModuloEdit(id) {
    if (!MODULOS_POR_PLAN[editPlan]?.includes(id)) return;
    setEditModulos(prev => ({ ...prev, [id]: !prev[id] }));
  }

  useEffect(() => { cargarEmpresas(); }, []);

  async function cargarEmpresas() {
    setCargando(true);
    const { data, error } = await supabase.from('empresas').select('*').order('created_at', { ascending: false });
    if (error) Swal.fire('Error', error.message, 'error');
    else setEmpresas(data || []);
    setCargando(false);
  }

  async function crearEmpresa(e) {
    e.preventDefault();
    if (!nombre.trim() || !emailAdmin.trim()) return;
    setEnviando(true);
    try {
      let logoUrlFinal = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fn = `${Date.now()}-${Math.random()}.${ext}`;
        const { error: ue } = await supabase.storage.from('logos').upload(fn, logoFile);
        if (ue) throw ue;
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fn);
        logoUrlFinal = publicUrl;
      }

      const licencia = generarLicencia();

      const { data, error: ee } = await supabase.from('empresas').insert([{
        nombre, rut, email_admin: emailAdmin, licencia,
        plan: planSeleccionado, modulos: modulosSeleccionados,
        usa_inventario: modulosSeleccionados.inventario || false,
        usa_citas: modulosSeleccionados.agenda || false,
        color_principal: colorPrincipal, logo_url: logoUrlFinal,
        hora_apertura: horaApertura, hora_cierre: horaCierre,
        intervalo_citas: intervaloCitas, estado: 'activa',
      }]).select();
      if (ee) throw ee;

      const nueva = data[0];
      const { error: ea } = await supabase.from('administradores')
        .insert([{ email: emailAdmin, rol: 'admin', empresa_id: nueva.id }]);
      if (ea && ea.code !== '23505') throw ea;

      await supabase.auth.signInWithOtp({
        email: emailAdmin,
        options: { emailRedirectTo: `${window.location.origin}/?tienda=${nueva.id}` },
      });

      const urlTienda = `${window.location.origin}/?tienda=${nueva.id}`;
      Swal.fire({
        title: '¡Empresa registrada!',
        width: 580,
        html: `<div style="text-align:left;font-size:13px;color:#334155;display:flex;flex-direction:column;gap:10px;">
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px 16px;">
            <p style="margin:0 0 3px 0;font-weight:700;color:#15803d;font-size:13px;">✅ Acceso enviado</p>
            <p style="margin:0;color:#166534;font-size:12px;">Magic link enviado a <b>${emailAdmin}</b></p>
          </div>
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:14px 16px;">
            <p style="margin:0 0 6px 0;font-weight:700;color:#6d28d9;font-size:13px;">🔑 Licencia</p>
            <div style="background:white;padding:10px;border-radius:8px;border:1px solid #ddd6fe;font-family:monospace;font-size:16px;color:#7c3aed;letter-spacing:3px;text-align:center;font-weight:700;">${licencia}</div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
            <p style="margin:0 0 6px 0;font-weight:700;color:#1e293b;font-size:13px;">🌐 Enlace de la tienda</p>
            <div style="background:white;padding:9px 12px;border-radius:8px;border:1px solid #cbd5e1;font-family:monospace;font-size:11px;color:#3b82f6;word-break:break-all;">${urlTienda}</div>
          </div>
        </div>`,
        icon: 'success',
        confirmButtonText: 'Perfecto',
        confirmButtonColor: '#7c3aed',
      });

      setNombre(''); setRut(''); setEmailAdmin(''); setPlanSeleccionado('pro');
      setModulosSeleccionados(getModulosPorDefecto('pro'));
      setColorPrincipal('#3b82f6'); setLogoFile(null);
      setHoraApertura('09:00'); setHoraCierre('18:00'); setIntervaloCitas(30);
      setPaso(1);
      cargarEmpresas();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  function abrirEdicion(emp) {
    setEmpresaEditando(emp);
    setEditPlan(emp.plan || 'básico');
    setEditModulos(emp.modulos ? { ...emp.modulos } : getModulosPorDefecto(emp.plan || 'básico'));
  }

  async function guardarEdicion() {
    setGuardandoEdit(true);
    try {
      const { error } = await supabase.from('empresas').update({
        plan: editPlan, modulos: editModulos,
        usa_inventario: editModulos.inventario || false,
        usa_citas: editModulos.agenda || false,
      }).eq('id', empresaEditando.id);
      if (error) throw error;
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Configuración guardada', showConfirmButton: false, timer: 3000 });
      setEmpresaEditando(null);
      cargarEmpresas();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setGuardandoEdit(false);
    }
  }

  async function cambiarEstado(id, estado) {
    await supabase.from('empresas').update({ estado: estado === 'activa' ? 'inactiva' : 'activa' }).eq('id', id);
    cargarEmpresas();
  }

  async function eliminarEmpresa(id, nombreEmp) {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar empresa?', text: `"${nombreEmp}" será eliminada permanentemente.`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) Swal.fire('Error', 'No se pudo eliminar. Puede tener datos vinculados.', 'error');
    else { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Empresa eliminada', showConfirmButton: false, timer: 2500 }); cargarEmpresas(); }
  }

  // Filtro de empresas
  const empresasFiltradas = empresas.filter(e => {
    const matchBusqueda = !busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (e.email_admin || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchPlan = filtroPlan === 'todos' || e.plan === filtroPlan;
    return matchBusqueda && matchPlan;
  });

  const stats = {
    total: empresas.length,
    activas: empresas.filter(e => e.estado === 'activa').length,
    basico: empresas.filter(e => e.plan === 'básico').length,
    pro: empresas.filter(e => e.plan === 'pro').length,
    advance: empresas.filter(e => e.plan === 'advance').length,
  };

  const inp = {
    width: '100%', padding: '10px 13px', borderRadius: '8px',
    border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s',
  };
  const lbl = { display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#64748b', marginBottom: '5px', letterSpacing: '0.3px' };

  const PASOS = [
    { n: 1, label: 'Plan' },
    { n: 2, label: 'Empresa' },
    { n: 3, label: 'Módulos' },
    { n: 4, label: 'Confirmar' },
  ];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Header de Página ─────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px', padding: '28px 32px', marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 20px rgba(15,23,42,0.15)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#38bdf8" />
            </div>
            <h1 style={{ fontSize: '22px', color: 'white', margin: 0, fontWeight: '800' }}>Gestión de Empresas</h1>
          </div>
          <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Administra los inquilinos de tu plataforma SaaS</p>
        </div>

        {/* Stats rápidos */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Total', value: stats.total,   color: '#38bdf8' },
            { label: 'Activas', value: stats.activas, color: '#10b981' },
            { label: 'Pro',    value: stats.pro,     color: '#3b82f6' },
            { label: 'Advance',value: stats.advance, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 16px' }}>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Formulario Wizard ────────────────────── */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

        {/* Barra de pasos */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '18px 28px', display: 'flex', alignItems: 'center', gap: '0' }}>
          {PASOS.map((p, i) => (
            <div key={p.n} style={{ display: 'flex', alignItems: 'center', flex: i < PASOS.length - 1 ? 1 : 'none' }}>
              <div
                onClick={() => p.n < paso || (p.n === paso) ? null : (p.n === paso + 1 && nombre && rut && emailAdmin && planSeleccionado ? setPaso(p.n) : null)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: paso > p.n ? '#10b981' : paso === p.n ? '#3b82f6' : '#e2e8f0',
                  color: paso >= p.n ? 'white' : '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '700', flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  {paso > p.n ? <Check size={14} strokeWidth={3} /> : p.n}
                </div>
                <span style={{ fontSize: '12px', fontWeight: paso === p.n ? '700' : '500', color: paso === p.n ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap' }}>
                  {p.label}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div style={{ flex: 1, height: '2px', margin: '0 12px', background: paso > p.n ? '#10b981' : '#e2e8f0', borderRadius: '2px', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={crearEmpresa}>
          <div style={{ padding: '28px' }}>

            {/* ── PASO 1: Plan ─────── */}
            {paso === 1 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>Selecciona el plan contratado</h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>El plan define qué módulos estarán disponibles por defecto.</p>
                <SelectorPlan planActual={planSeleccionado} onChange={seleccionarPlan} />
              </div>
            )}

            {/* ── PASO 2: Datos ─────── */}
            {paso === 2 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>Identidad y acceso de la empresa</h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 22px 0' }}>Datos del negocio y correo del administrador principal.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={lbl}>Nombre comercial</label>
                    <input type="text" placeholder="Ej. Salón Bella Rosa" value={nombre} onChange={e => setNombre(e.target.value)} style={inp} required />
                  </div>
                  <div>
                    <label style={lbl}>RUT / NIT</label>
                    <input type="text" placeholder="Ej. 900.123.456-7" value={rut} onChange={e => setRut(e.target.value)} style={inp} required />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={lbl}><Mail size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Correo del administrador</label>
                    <input
                      type="email" placeholder="admin@minegocio.com" value={emailAdmin}
                      onChange={e => setEmailAdmin(e.target.value)} style={{ ...inp, borderColor: emailAdmin ? '#3b82f6' : '#e2e8f0' }} required
                    />
                    <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      <KeyRound size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                      Se generará una licencia y se enviará magic link a este correo.
                    </p>
                  </div>
                  <div>
                    <label style={lbl}><Palette size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Color de marca</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1.5px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', background: 'white' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: colorPrincipal, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <input type="color" value={colorPrincipal} onChange={e => setColorPrincipal(e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600', fontFamily: 'monospace' }}>{colorPrincipal.toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}><ImageIcon size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Logo (opcional)</label>
                    <div style={{ border: '1.5px dashed #e2e8f0', borderRadius: '8px', padding: '8px 12px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <ImageIcon size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ border: 'none', fontSize: '11px', width: '100%', background: 'transparent', color: '#64748b' }} />
                    </div>
                    {logoFile && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#10b981', fontWeight: '600' }}>✓ {logoFile.name}</p>}
                  </div>
                  {/* Config agenda */}
                  <div style={{ gridColumn: 'span 2', opacity: modulosSeleccionados.agenda ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                    <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={11} />
                      Horarios de agenda
                      {!modulosSeleccionados.agenda && <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: '9px', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>MÓDULO INACTIVO</span>}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {[['Apertura', horaApertura, setHoraApertura], ['Cierre', horaCierre, setHoraCierre]].map(([l, v, s]) => (
                        <div key={l}>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0' }}>{l}</p>
                          <input type="time" value={v} onChange={e => s(e.target.value)} disabled={!modulosSeleccionados.agenda} style={{ ...inp, background: modulosSeleccionados.agenda ? 'white' : '#f8fafc' }} />
                        </div>
                      ))}
                      <div>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0' }}>Intervalo (min)</p>
                        <input type="number" min="5" step="5" value={intervaloCitas} onChange={e => setIntervaloCitas(e.target.value)} disabled={!modulosSeleccionados.agenda} style={{ ...inp, background: modulosSeleccionados.agenda ? 'white' : '#f8fafc' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PASO 3: Módulos ─────── */}
            {paso === 3 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>Módulos habilitados</h2>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                      Plan <b>{planSeleccionado.toUpperCase()}</b> — Puedes desactivar módulos incluidos si el cliente no los necesita.
                    </p>
                  </div>
                  <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                    {Object.values(modulosSeleccionados).filter(Boolean).length} activos
                  </span>
                </div>
                <ModulosGrid modulos={modulosSeleccionados} plan={planSeleccionado} onToggle={toggleModulo} />
              </div>
            )}

            {/* ── PASO 4: Confirmación ─────── */}
            {paso === 4 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px 0' }}>Confirma el registro</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { label: 'Empresa',     value: nombre },
                    { label: 'RUT / NIT',   value: rut },
                    { label: 'Email Admin', value: emailAdmin },
                    { label: 'Plan',        value: planSeleccionado.toUpperCase() },
                    { label: 'Color',       value: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '14px', height: '14px', borderRadius: '3px', background: colorPrincipal, display: 'inline-block' }} />{colorPrincipal}</span> },
                    { label: 'Módulos',     value: `${Object.values(modulosSeleccionados).filter(Boolean).length} activos` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 3px 0', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <KeyRound size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
                    Se generará automáticamente una <b>licencia única</b> y se enviará un <b>magic link</b> al correo del administrador.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navegación de pasos */}
          <div style={{ padding: '16px 28px 24px', display: 'flex', gap: '10px', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => setPaso(p => Math.max(1, p - 1))}
              disabled={paso === 1}
              style={{ padding: '10px 20px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '9px', cursor: paso === 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', opacity: paso === 1 ? 0.4 : 1 }}
            >
              ← Anterior
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              {paso < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (paso === 2 && (!nombre.trim() || !rut.trim() || !emailAdmin.trim())) {
                      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Completa todos los campos', showConfirmButton: false, timer: 3000 });
                      return;
                    }
                    setPaso(p => Math.min(4, p + 1));
                  }}
                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                >
                  Siguiente <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={enviando}
                  style={{ padding: '10px 28px', background: enviando ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '9px', cursor: enviando ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: enviando ? 'none' : '0 4px 12px rgba(124,58,237,0.35)' }}
                >
                  <Plus size={16} />
                  {enviando ? 'Creando empresa...' : 'Crear Empresa y Enviar Acceso'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ── Tabla de Empresas ────────────────────── */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

        {/* Header tabla con filtros */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: '#fafafa' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ margin: '0 0 1px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
              Directorio de Empresas
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{empresasFiltradas.length} de {empresas.length} empresas</p>
          </div>

          {/* Búsqueda */}
          <input
            placeholder="Buscar empresa o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', width: '200px', background: 'white' }}
          />

          {/* Filtro por plan */}
          <select
            value={filtroPlan}
            onChange={e => setFiltroPlan(e.target.value)}
            style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', background: 'white', cursor: 'pointer', color: '#475569' }}
          >
            <option value="todos">Todos los planes</option>
            <option value="básico">Básico</option>
            <option value="pro">Pro</option>
            <option value="advance">Advance</option>
          </select>
        </div>

        {cargando ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>Cargando empresas...</p>
          </div>
        ) : empresasFiltradas.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Building2 size={40} color="#e2e8f0" style={{ marginBottom: '12px' }} />
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px', fontWeight: '500' }}>
              {busqueda || filtroPlan !== 'todos' ? 'No se encontraron resultados' : 'Aún no hay empresas registradas'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Empresa', 'Plan', 'Módulos activos', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', fontSize: '10.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid #f1f5f9', textAlign: h === 'Acciones' ? 'center' : 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map((emp, idx) => {
                  const mods = emp.modulos || {};
                  const modsActivos = MODULOS_DISPONIBLES.filter(m => mods[m.id]);
                  const pe = PLAN_ESTILOS[emp.plan] || PLAN_ESTILOS['básico'];
                  const iniciales = emp.nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                  return (
                    <tr
                      key={emp.id}
                      style={{ borderBottom: idx < empresasFiltradas.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Empresa */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {emp.logo_url ? (
                            <img src={emp.logo_url} alt="logo" style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'contain', border: '1px solid #f1f5f9', background: 'white', padding: '3px' }} />
                          ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `linear-gradient(135deg, ${emp.color_principal || '#3b82f6'}22, ${emp.color_principal || '#3b82f6'}11)`, border: `1px solid ${emp.color_principal || '#3b82f6'}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: emp.color_principal || '#3b82f6', flexShrink: 0 }}>
                              {iniciales}
                            </div>
                          )}
                          <div>
                            <p style={{ margin: '0 0 2px 0', fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>{emp.nombre}</p>
                            {emp.email_admin && (
                              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Mail size={9} /> {emp.email_admin}
                              </p>
                            )}
                            {emp.licencia && (
                              <button
                                onClick={() => { navigator.clipboard.writeText(emp.licencia); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Licencia copiada', showConfirmButton: false, timer: 2000 }); }}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '3px', color: '#a78bfa', fontSize: '10px', fontFamily: 'monospace', fontWeight: '600' }}
                              >
                                <Copy size={9} /> {emp.licencia}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${pe.color}15`, color: pe.textColor, border: `1px solid ${pe.color}30`, padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                          {emp.plan === 'advance' ? <Crown size={11} /> : emp.plan === 'pro' ? <Star size={11} /> : <Zap size={11} />}
                          {(emp.plan || 'básico').toUpperCase()}
                        </div>
                      </td>

                      {/* Módulos */}
                      <td style={{ padding: '14px 16px', maxWidth: '260px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {modsActivos.length > 0 ? (
                            <>
                              {modsActivos.slice(0, 5).map(m => {
                                const catCfg = CATEGORIA_COLOR[m.categoria] || {};
                                const Ic = ICONOS[m.icono] || Package;
                                return (
                                  <span key={m.id} title={m.nombre} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: catCfg.bg || '#f1f5f9', color: catCfg.color || '#64748b', border: `1px solid ${catCfg.border || '#e2e8f0'}`, padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '600' }}>
                                    <Ic size={9} /> {m.nombre.split('/')[0].trim()}
                                  </span>
                                );
                              })}
                              {modsActivos.length > 5 && (
                                <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '600' }}>
                                  +{modsActivos.length - 5}
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Sin módulos</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: emp.estado === 'activa' ? '#dcfce7' : '#fee2e2', color: emp.estado === 'activa' ? '#166534' : '#991b1b' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: emp.estado === 'activa' ? '#16a34a' : '#dc2626' }} />
                          {emp.estado === 'activa' ? 'Activa' : 'Inactiva'}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => abrirEdicion(emp)}
                            title="Configurar módulos y plan"
                            style={{ padding: '7px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
                          >
                            <Edit3 size={12} /> Configurar
                          </button>
                          <button
                            onClick={() => cambiarEstado(emp.id, emp.estado)}
                            title={emp.estado === 'activa' ? 'Suspender' : 'Activar'}
                            style={{ padding: '7px 10px', background: emp.estado === 'activa' ? '#fffbeb' : '#f0fdf4', color: emp.estado === 'activa' ? '#d97706' : '#15803d', border: `1px solid ${emp.estado === 'activa' ? '#fde68a' : '#bbf7d0'}`, borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Power size={12} /> {emp.estado === 'activa' ? 'Pausar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => eliminarEmpresa(emp.id, emp.nombre)}
                            title="Eliminar empresa"
                            style={{ padding: '7px 9px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de Edición ─────────────────────── */}
      {empresaEditando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
            {/* Header modal */}
            <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '18px 18px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {empresaEditando.logo_url ? (
                  <img src={empresaEditando.logo_url} alt="logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${empresaEditando.color_principal || '#3b82f6'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: empresaEditando.color_principal || '#3b82f6' }}>
                    {empresaEditando.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 2px 0', fontSize: '17px', color: '#0f172a', fontWeight: '800' }}>{empresaEditando.nombre}</h2>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Configurar plan y módulos</p>
                </div>
              </div>
              <button onClick={() => setEmpresaEditando(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px 26px' }}>
              {/* Selector plan en modal */}
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>Plan de suscripción</p>
              <SelectorPlan
                planActual={editPlan}
                onChange={plan => { setEditPlan(plan); setEditModulos(getModulosPorDefecto(plan)); }}
              />

              <div style={{ height: '1px', background: '#f1f5f9', margin: '22px 0' }} />

              {/* Grid de módulos en modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Módulos habilitados</p>
                <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                  {Object.values(editModulos).filter(Boolean).length} activos
                </span>
              </div>
              <ModulosGrid modulos={editModulos} plan={editPlan} onToggle={toggleModuloEdit} />
            </div>

            {/* Footer modal */}
            <div style={{ padding: '16px 26px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEmpresaEditando(null)}
                style={{ padding: '10px 20px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardandoEdit}
                style={{ padding: '10px 24px', background: guardandoEdit ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '9px', cursor: guardandoEdit ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: guardandoEdit ? 'none' : '0 4px 12px rgba(59,130,246,0.3)' }}
              >
                <Save size={14} /> {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEmpresas;
