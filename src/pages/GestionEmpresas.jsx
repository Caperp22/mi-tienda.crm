import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseNoSession } from '../config/supabase';
import Swal from 'sweetalert2';
import {
  Building2, Plus, Store, Calendar, Palette, Image as ImageIcon, Clock,
  Trash2, Zap, Star, Crown, Package, ShoppingBag, Users, DollarSign,
  BarChart2, Shield, Briefcase, Edit3, X, Save, Mail, KeyRound,
  Truck, Tag, Monitor, UserCheck, Gift, FileText, Copy, Check,
  ChevronDown, ChevronUp, Lock, Search, Filter,
  Power, ChevronRight,
} from 'lucide-react';
import {
  MODULOS_DISPONIBLES, MODULOS_POR_PLAN, getModulosPorDefecto,
  generarLicencia, INFO_PLANES,
} from '../config/modulos';

/* ─── Íconos de módulos ───────────────────────────────────────────────── */
const ICONOS = {
  Store, Calendar, Package, ShoppingBag, Users, DollarSign, BarChart2,
  Shield, Briefcase, Truck, Tag, Monitor, UserCheck, Gift, FileText,
};

/* ─── Categorías con colores vibrantes ───────────────────────────────── */
const CAT = {
  Ventas:    { color: '#00d68f', glow: '0 0 12px #00d68f44', bg: '#00d68f18', border: '#00d68f40' },
  Servicios: { color: '#a78bfa', glow: '0 0 12px #a78bfa44', bg: '#a78bfa18', border: '#a78bfa40' },
  Gestión:   { color: '#38bdf8', glow: '0 0 12px #38bdf844', bg: '#38bdf818', border: '#38bdf840' },
  Analítica: { color: '#fb923c', glow: '0 0 12px #fb923c44', bg: '#fb923c18', border: '#fb923c40' },
};

/* ─── Configuración de planes ─────────────────────────────────────────── */
const PLANES = {
  'básico':  { label: 'Básico',   grad: 'linear-gradient(135deg,#475569,#334155)', color: '#94a3b8', glow: '#47556944', Ico: Zap,   tag: null },
  'pro':     { label: 'Pro',      grad: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#60a5fa', glow: '#3b82f644', Ico: Star,  tag: 'POPULAR' },
  'advance': { label: 'Advance',  grad: 'linear-gradient(135deg,#7c3aed,#4338ca)', color: '#a78bfa', glow: '#7c3aed44', Ico: Crown, tag: 'PREMIUM' },
};

/* ─── Temas claro / oscuro ────────────────────────────────────────────── */
const DARK = {
  page: '#060d1a',
  card: 'rgba(255,255,255,0.04)',
  cardSolid: '#0d1526',
  border: 'rgba(255,255,255,0.08)',
  borderBright: 'rgba(255,255,255,0.14)',
  text: '#f0f4ff',
  muted: '#64748b',
  sub: '#94a3b8',
  input: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputText: '#e2e8f0',
  badge: 'rgba(255,255,255,0.08)',
  hover: 'rgba(255,255,255,0.06)',
  tableRow: 'rgba(255,255,255,0.02)',
};
const LIGHT = {
  page: '#f0f4ff',
  card: 'white',
  cardSolid: 'white',
  border: '#e2e8f0',
  borderBright: '#cbd5e1',
  text: '#0f172a',
  muted: '#64748b',
  sub: '#94a3b8',
  input: 'white',
  inputBorder: '#e2e8f0',
  inputText: '#1e293b',
  badge: '#f1f5f9',
  hover: '#f8fafc',
  tableRow: '#fafafa',
};

/* ════════════════════════════════════════════════════════════════════════
   SELECTOR DE PLAN
════════════════════════════════════════════════════════════════════════ */
function SelectorPlan({ planActual, onChange, t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
      {Object.entries(PLANES).map(([id, cfg]) => {
        const activo = planActual === id;
        const Ico = cfg.Ico;
        return (
          <div key={id} onClick={() => onChange(id)} style={{
            border: `1.5px solid ${activo ? cfg.color : t.border}`,
            borderRadius: '12px', padding: '14px 12px', cursor: 'pointer',
            background: activo ? `${cfg.glow.replace('44','18')}` : t.card,
            boxShadow: activo ? `0 0 16px ${cfg.glow}` : 'none',
            transition: 'all 0.2s', position: 'relative',
          }}>
            {cfg.tag && <span style={{
              position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)',
              background: cfg.grad, color: 'white', fontSize: '8px',
              padding: '2px 8px', borderRadius: '8px', fontWeight: '800', letterSpacing: '0.8px',
            }}>{cfg.tag}</span>}
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px', marginBottom: '8px',
              background: activo ? cfg.grad : t.badge,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: activo ? `0 4px 12px ${cfg.glow}` : 'none',
              transition: 'all 0.2s',
            }}>
              <Ico size={17} color={activo ? 'white' : t.sub} />
            </div>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: activo ? cfg.color : t.text }}>{cfg.label}</p>
            <p style={{ margin: '0 0 6px 0', fontSize: '10px', color: t.muted, lineHeight: '1.3' }}>{INFO_PLANES[id]?.descripcion}</p>
            <span style={{
              fontSize: '10px', fontWeight: '600',
              background: activo ? `${cfg.color}20` : t.badge,
              color: activo ? cfg.color : t.sub,
              padding: '1px 7px', borderRadius: '5px',
            }}>{MODULOS_POR_PLAN[id]?.length} módulos</span>
            {activo && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '18px', height: '18px', borderRadius: '50%', background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={10} color="white" strokeWidth={3} />
            </div>}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   GRID DE MÓDULOS
════════════════════════════════════════════════════════════════════════ */
function ModulosGrid({ modulos, plan, onToggle, t }) {
  const cats = [...new Set(MODULOS_DISPONIBLES.map(m => m.categoria))];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {cats.map(cat => {
        const c = CAT[cat] || CAT.Gestión;
        return (
          <div key={cat}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ height: '1px', flex: 1, background: c.border }} />
              <span style={{ fontSize: '9px', fontWeight: '800', color: c.color, textTransform: 'uppercase', letterSpacing: '1.2px', background: c.bg, border: `1px solid ${c.border}`, padding: '2px 8px', borderRadius: '12px' }}>{cat}</span>
              <div style={{ height: '1px', flex: 1, background: c.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: '6px' }}>
              {MODULOS_DISPONIBLES.filter(m => m.categoria === cat).map(mod => {
                const ok = MODULOS_POR_PLAN[plan]?.includes(mod.id);
                const on = modulos[mod.id] && ok;
                const Ic = ICONOS[mod.icono] || Package;
                return (
                  <div key={mod.id} onClick={() => ok && onToggle(mod.id)} title={mod.descripcion} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '8px', cursor: ok ? 'pointer' : 'default',
                    border: `1.5px solid ${on ? c.border : t.border}`,
                    background: on ? c.bg : t.card,
                    opacity: ok ? 1 : 0.45, transition: 'all 0.15s',
                    boxShadow: on ? c.glow : 'none',
                  }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0, background: on ? `${c.color}20` : t.badge, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ok ? <Ic size={13} color={on ? c.color : t.sub} /> : <Lock size={11} color={t.muted} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: on ? '600' : '400', color: on ? c.color : t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mod.nombre.split('/')[0].trim()}
                      </p>
                      {!ok && <p style={{ margin: 0, fontSize: '8px', color: t.muted, fontWeight: '700', letterSpacing: '0.5px' }}>
                        {['admins','empleados','fidelizacion','pos','reportes'].includes(mod.id) ? 'ADVANCE' : 'PRO+'}
                      </p>}
                    </div>
                    {ok && <div style={{ width: '28px', height: '16px', borderRadius: '8px', background: on ? c.color : t.border, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: on ? '14px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    </div>}
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

/* ════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════════════ */
function GestionEmpresas({ dark = false }) {
  const t = dark ? DARK : LIGHT;

  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState(1);
  const [dirOpen, setDirOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPlan, setFiltroPlan] = useState('todos');

  // Formulario
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('pro');
  const [modulos, setModulos] = useState(getModulosPorDefecto('pro'));
  const [colorPrin, setColorPrin] = useState('#3b82f6');
  const [colorSec, setColorSec] = useState('#0f172a');
  const [colorTer, setColorTer] = useState('#f59e0b');
  const [logoFile, setLogoFile] = useState(null);
  const [horaAp, setHoraAp] = useState('09:00');
  const [horaCi, setHoraCi] = useState('18:00');
  const [intCitas, setIntCitas] = useState(30);
  const [enviando, setEnviando] = useState(false);

  // Modal edición
  const [editEmp, setEditEmp] = useState(null);
  const [editMods, setEditMods] = useState({});
  const [editPlan, setEditPlan] = useState('pro');
  const [editColorPrin, setEditColorPrin] = useState('#3b82f6');
  const [editColorSec, setEditColorSec] = useState('#0f172a');
  const [editColorTer, setEditColorTer] = useState('#f59e0b');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase.from('empresas').select('*').order('created_at', { ascending: false });
    setEmpresas(data || []);
    setCargando(false);
  }, []);

useEffect(() => { cargar(); }, [cargar]);

  function cambiarPlan(p) { setPlan(p); setModulos(getModulosPorDefecto(p)); }
  function toggleMod(id) { if (!MODULOS_POR_PLAN[plan]?.includes(id)) return; setModulos(prev => ({ ...prev, [id]: !prev[id] })); }
  function toggleModEdit(id) { if (!MODULOS_POR_PLAN[editPlan]?.includes(id)) return; setEditMods(prev => ({ ...prev, [id]: !prev[id] })); }

  async function crearEmpresa(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      let logoUrl = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fn = `${Date.now()}.${ext}`;
        const { error: ue } = await supabase.storage.from('logos').upload(fn, logoFile);
        if (ue) throw ue;
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fn);
        logoUrl = publicUrl;
      }
      const licencia = generarLicencia();
      const { data, error: ee } = await supabase.from('empresas').insert([{
        nombre, rut, slug, email_admin: email, licencia, plan, modulos,
        usa_inventario: modulos.inventario || false, usa_citas: modulos.agenda || false,
        color_principal: colorPrin, color_secundario: colorSec, color_terciario: colorTer, logo_url: logoUrl,
        hora_apertura: horaAp, hora_cierre: horaCi, intervalo_citas: intCitas, estado: 'activa',
      }]).select();
      if (ee) throw ee;
      const nueva = data[0];
      const { error: ea } = await supabase.from('administradores').insert([{ email, rol: 'admin', empresa_id: nueva.id }]);
      if (ea && ea.code !== '23505') throw ea;
      // Crear cuenta en Supabase Auth con la licencia como contraseña
      const { data: authData, error: authError } = await supabaseNoSession.auth.signUp({
        email, password: licencia,
      });

      // Si el usuario ya existía en Auth (correo previo), signUp devuelve
      // identities:[] sin error real — la contraseña NO se actualiza.
      const yaExistia = !authError && authData?.user?.identities?.length === 0;

      if (authError) {
        // Error real de Supabase al crear la cuenta
        Swal.fire('Empresa creada, pero hubo un problema con la cuenta de acceso',
          `La empresa quedó registrada en el sistema, pero no se pudo crear la cuenta de login.\n\nError: ${authError.message}\n\nPuede intentar recrear el acceso desde el panel de Supabase.`,
          'warning');
      } else {
        const url = `${window.location.origin}/${nueva.slug || `?tienda=${nueva.id}`}`;
        Swal.fire({ title: yaExistia ? '⚠️ Empresa creada — Revisar acceso' : '✅ Empresa creada', width: 580, icon: yaExistia ? 'warning' : 'success', confirmButtonColor: '#7c3aed', confirmButtonText: 'Entendido',
          html: `<div style="text-align:left;font-size:12px;display:flex;flex-direction:column;gap:10px;">

            ${yaExistia ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;">
              <p style="margin:0 0 4px;font-weight:700;color:#92400e;font-size:13px;">⚠️ El correo ya tenía una cuenta en Supabase</p>
              <p style="margin:0;color:#78350f;font-size:12px;line-height:1.6;">La contraseña <b>no se actualizó</b> porque el correo ya existía. El admin debe ingresar con su contraseña anterior, o ve a <b>Supabase → Authentication → Users</b>, elimina ese usuario y vuelve a crear la empresa.</p>
            </div>` : ''}

            <div style="background:#faf5ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 14px;">
              <p style="margin:0 0 6px;font-weight:700;color:#6d28d9;font-size:13px;">🔑 Licencia generada</p>
              <code style="font-size:16px;color:#7c3aed;letter-spacing:3px;font-weight:700">${licencia}</code>
              <p style="margin:6px 0 0;color:#7c3aed;font-size:11px;">${yaExistia ? 'Guardada en BD, pero no aplicada como contraseña.' : 'Contraseña de acceso al panel administrativo.'}</p>
            </div>

            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 14px;">
              <p style="margin:0 0 2px;font-weight:700;color:#0369a1;font-size:12px;">🌐 URL de la tienda</p>
              <code style="font-size:10px;color:#0284c7;word-break:break-all">${url}</code>
            </div>

          </div>`,
        });
      }
      setNombre(''); setRut(''); setSlug(''); setEmail(''); setPlan('pro'); setModulos(getModulosPorDefecto('pro')); 
      setColorPrin('#3b82f6'); setColorSec('#0f172a'); setColorTer('#f59e0b');
      setLogoFile(null); setHoraAp('09:00'); setHoraCi('18:00'); setIntCitas(30); setPaso(1);
      cargar();
    } catch (err) { Swal.fire('Error', err.message, 'error'); }
    finally { setEnviando(false); }
  }

  async function guardarEdicion() {
    setGuardando(true);
    try {
      const { error } = await supabase.from('empresas').update({ plan: editPlan, modulos: editMods, usa_inventario: editMods.inventario || false, usa_citas: editMods.agenda || false, color_principal: editColorPrin, color_secundario: editColorSec, color_terciario: editColorTer }).eq('id', editEmp.id);
      if (error) throw error;
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cambios guardados', showConfirmButton: false, timer: 2500 });
      setEditEmp(null); cargar();
    } catch (err) { Swal.fire('Error', err.message, 'error'); }
    finally { setGuardando(false); }
  }

  async function toggleEstado(id, estado) {
    await supabase.from('empresas').update({ estado: estado === 'activa' ? 'inactiva' : 'activa' }).eq('id', id);
    cargar();
  }

  async function eliminar(id, n) {
    const { isConfirmed } = await Swal.fire({
      title: `¿Eliminar "${n}"?`,
      html: `<p style="color:#64748b;font-size:13px">Esta acción es <b>irreversible</b>. Se eliminará la empresa y todos sus datos asociados.</p>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    // Primero eliminar el admin relacionado para evitar FK constraint
    await supabase.from('administradores').delete().eq('empresa_id', id);
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) {
      Swal.fire('No se pudo eliminar', `La empresa tiene datos relacionados que impiden su eliminación.\n\nError: ${error.message}\n\nTip: desactívala si no quieres que opere, o elimina primero sus pedidos y clientes desde las vistas globales.`, 'error');
      return;
    }
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `"${n}" eliminada`, showConfirmButton: false, timer: 2500 });
    cargar();
  }

  async function copiarAcceso(emp) {
    const url = `${window.location.origin}/${emp.slug || `?tienda=${emp.id}`}`;
    const texto = `Empresa: ${emp.nombre}\nEmail: ${emp.email_admin}\nLicencia: ${emp.licencia}\nAcceso: ${url}`;
    await navigator.clipboard.writeText(texto);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Credenciales y enlace copiados', showConfirmButton: false, timer: 2000 });
  }

  const emp_filtradas = empresas.filter(e =>
    (!busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (e.email_admin || '').toLowerCase().includes(busqueda.toLowerCase())) &&
    (filtroPlan === 'todos' || e.plan === filtroPlan)
  );

  const stats = { total: empresas.length, activas: empresas.filter(e => e.estado === 'activa').length, pro: empresas.filter(e => e.plan === 'pro').length, advance: empresas.filter(e => e.plan === 'advance').length };

  /* Estilos comunes reutilizables */
  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1.5px solid ${t.inputBorder}`, fontSize: '12px', outline: 'none', boxSizing: 'border-box', background: t.input, color: t.inputText, transition: 'border-color 0.15s' };
  const lbl = { fontSize: '10.5px', fontWeight: '700', color: t.muted, marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' };
  const PASOS = [{ n: 1, l: 'Plan' }, { n: 2, l: 'Empresa' }, { n: 3, l: 'Módulos' }, { n: 4, l: 'Confirmar' }];

  return (
    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', background: t.page, minHeight: '100vh', padding: '20px 24px', boxSizing: 'border-box' }}>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px #3b82f644' }}>
            <Building2 size={18} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: t.text }}>Gestión de Empresas</h1>
            <p style={{ margin: 0, fontSize: '11px', color: t.muted }}>Administra tus inquilinos SaaS</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { l: 'Total',   v: stats.total,   c: '#38bdf8' },
              { l: 'Activas', v: stats.activas, c: '#00d68f' },
              { l: 'Pro',     v: stats.pro,     c: '#60a5fa' },
              { l: 'Advance', v: stats.advance, c: '#a78bfa' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center', background: t.card, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '6px 12px', backdropFilter: 'blur(8px)' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: s.c, lineHeight: 1 }}>{s.v}</p>
                <p style={{ margin: 0, fontSize: '9px', color: t.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ══ FORMULARIO WIZARD ═══════════════════════════════════ */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '14px', backdropFilter: 'blur(12px)', boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.06)' }}>

        {/* Tabs de pasos */}
        <div style={{ display: 'flex', background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderBottom: `1px solid ${t.border}` }}>
          {PASOS.map((p, i) => {
            const activo = paso === p.n;
            const listo = paso > p.n;
            return (
              <div key={p.n} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
                <button
                  type="button"
                  onClick={() => listo && setPaso(p.n)}
                  style={{
                    padding: '12px 16px', border: 'none', cursor: listo ? 'pointer' : 'default',
                    background: activo ? 'transparent' : 'transparent',
                    borderBottom: activo ? '2px solid #3b82f6' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', gap: '7px', flex: 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', background: listo ? '#10b981' : activo ? '#3b82f6' : t.badge, color: (listo || activo) ? 'white' : t.muted, transition: 'all 0.2s' }}>
                    {listo ? <Check size={11} strokeWidth={3} /> : p.n}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: activo ? '700' : '500', color: activo ? '#3b82f6' : t.muted }}>{p.l}</span>
                </button>
                {i < 3 && <div style={{ width: '20px', height: '1px', background: t.border, flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        <form onSubmit={crearEmpresa}>
          <div style={{ padding: '18px 20px' }}>

            {/* ── Paso 1: Plan ── */}
            {paso === 1 && (
              <div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: t.muted }}>Selecciona el plan — define qué módulos se activan por defecto.</p>
                <SelectorPlan planActual={plan} onChange={cambiarPlan} t={t} />
              </div>
            )}

            {/* ── Paso 2: Empresa ── */}
            {paso === 2 && (
              <div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: t.muted }}>Datos del negocio y correo del administrador principal.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>Nombre comercial</label>
                    <input type="text" placeholder="Ej. Salón Bella Rosa" value={nombre} onChange={e => setNombre(e.target.value)} style={inp} required />
                  </div>
                  <div>
                    <label style={lbl}>RUT / NIT</label>
                    <input type="text" placeholder="900.123.456-7" value={rut} onChange={e => setRut(e.target.value)} style={inp} required />
                  </div>
                  <div>
                    <label style={lbl}>URL Personalizada (slug)</label>
                    <input type="text" placeholder="pizzeria-carlos" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={{...inp, fontFamily: 'monospace'}} required />
                    <p style={{margin: '3px 0 0', fontSize: '9px', color: t.muted}}>Solo minúsculas, números y guiones.</p>
                  </div>
                  <div>
                    <label style={lbl}><Mail size={9} style={{ display: 'inline', marginRight: '3px' }} />Correo del admin</label>
                    <input type="email" placeholder="admin@empresa.com" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inp, borderColor: email ? '#3b82f6' : t.inputBorder }} required />
                  </div>
                  <div>
                    <label style={lbl}><Palette size={9} style={{ display: 'inline', marginRight: '3px' }} />Colores de la marca</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1.5px solid ${t.inputBorder}`, padding: '6px 8px', borderRadius: '8px', background: t.input }}>
                      <input type="color" title="Principal (Botones/Acciones)" value={colorPrin} onChange={e => setColorPrin(e.target.value)} style={{ width: '100%', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                      <input type="color" title="Secundario (Fondos/Sidebar)" value={colorSec} onChange={e => setColorSec(e.target.value)} style={{ width: '100%', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                      <input type="color" title="Terciario (Acentos/Alertas)" value={colorTer} onChange={e => setColorTer(e.target.value)} style={{ width: '100%', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                    </div>
                    <p style={{margin: '3px 0 0', fontSize: '9px', color: t.muted}}>Prin / Secun / Terc</p>
                  </div>
                  <div>
                    <label style={lbl}><ImageIcon size={9} style={{ display: 'inline', marginRight: '3px' }} />Logo (opcional)</label>
                    <div style={{ border: `1.5px dashed ${t.inputBorder}`, borderRadius: '8px', padding: '7px 10px', background: t.badge, overflow: 'hidden' }}>
                      <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ border: 'none', fontSize: '10px', width: '100%', background: 'transparent', color: t.muted }} />
                    </div>
                    {logoFile && <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#00d68f', fontWeight: '600' }}>✓ {logoFile.name}</p>}
                  </div>
                  <div style={{ opacity: modulos.agenda ? 1 : 0.4 }}>
                    <label style={lbl}><Clock size={9} style={{ display: 'inline', marginRight: '3px' }} />Intervalo agenda (min)</label>
                    <input type="number" min="5" step="5" value={intCitas} onChange={e => setIntCitas(e.target.value)} disabled={!modulos.agenda} style={{ ...inp, background: modulos.agenda ? t.input : t.badge }} />
                  </div>
                  {modulos.agenda && (
                    <>
                      <div>
                        <label style={lbl}>Hora apertura</label>
                        <input type="time" value={horaAp} onChange={e => setHoraAp(e.target.value)} style={inp} />
                      </div>
                      <div>
                        <label style={lbl}>Hora cierre</label>
                        <input type="time" value={horaCi} onChange={e => setHoraCi(e.target.value)} style={inp} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Paso 3: Módulos ── */}
            {paso === 3 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: t.muted }}>Plan <b style={{ color: PLANES[plan].color }}>{plan.toUpperCase()}</b> — activa o desactiva según las necesidades del cliente.</p>
                  <span style={{ background: '#3b82f620', color: '#60a5fa', border: '1px solid #3b82f640', padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                    {Object.values(modulos).filter(Boolean).length} activos
                  </span>
                </div>
                <ModulosGrid modulos={modulos} plan={plan} onToggle={toggleMod} t={t} />
              </div>
            )}

            {/* ── Paso 4: Confirmación ── */}
            {paso === 4 && (
              <div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: t.muted }}>Revisa la información antes de crear la empresa.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
                  {[
                    ['Empresa', nombre], ['RUT', rut], ['Email admin', email],
                    ['Plan', plan.toUpperCase()], ['Módulos activos', `${Object.values(modulos).filter(Boolean).length}`],
                    ['Colores', <div style={{ display: 'flex', gap: '4px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colorPrin }} title="Principal"/><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colorSec }} title="Secundario"/><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colorTer }} title="Terciario"/></div>],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: t.cardSolid, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '10px 12px' }}>
                      <p style={{ margin: '0 0 2px', fontSize: '9px', fontWeight: '700', color: t.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</p>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: t.text }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: dark ? '#fbbf2414' : '#fffbeb', border: `1px solid ${dark ? '#fbbf2430' : '#fde68a'}`, borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <KeyRound size={14} color="#d97706" />
                  <p style={{ margin: 0, fontSize: '11px', color: dark ? '#fbbf24' : '#92400e' }}>Se generará una <b>licencia única</b> — el administrador accede con su correo y la licencia como contraseña. <b>Guarda la licencia</b> para entregársela.</p>
                </div>
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', background: dark ? 'rgba(255,255,255,0.02)' : '#fafafa' }}>
            <button type="button" onClick={() => setPaso(p => Math.max(1, p - 1))} disabled={paso === 1}
              style={{ padding: '8px 18px', background: 'transparent', color: t.muted, border: `1.5px solid ${t.border}`, borderRadius: '8px', cursor: paso === 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '12px', opacity: paso === 1 ? 0.3 : 1 }}>
              ← Anterior
            </button>
            {paso < 4 ? (
              <button type="button" onClick={() => {
                if (paso === 2 && (!nombre.trim() || !rut.trim() || !email.trim())) {
                  Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Completa todos los campos', showConfirmButton: false, timer: 2500 }); return;
                }
                setPaso(p => p + 1);
              }} style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 12px #3b82f640' }}>
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button type="submit" disabled={enviando}
                style={{ padding: '8px 22px', background: enviando ? '#64748b' : 'linear-gradient(135deg,#7c3aed,#4338ca)', color: 'white', border: 'none', borderRadius: '8px', cursor: enviando ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: enviando ? 'none' : '0 4px 14px #7c3aed50' }}>
                <Plus size={14} />{enviando ? 'Creando...' : 'Crear empresa y enviar acceso'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ══ DIRECTORIO (ACORDEÓN) ════════════════════════════════ */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', overflow: 'hidden', backdropFilter: 'blur(12px)', boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.06)' }}>

        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setDirOpen(d => !d)}
          style={{ width: '100%', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px #0ea5e944' }}>
              <Building2 size={14} color="white" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: t.text }}>Directorio de Empresas</p>
              <p style={{ margin: 0, fontSize: '10px', color: t.muted }}>{empresas.length} empresas registradas</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[
              { l: 'Básico', v: empresas.filter(e => e.plan === 'básico').length, c: '#94a3b8' },
              { l: 'Pro',    v: empresas.filter(e => e.plan === 'pro').length,    c: '#60a5fa' },
              { l: 'Advance',v: empresas.filter(e => e.plan === 'advance').length, c: '#a78bfa' },
            ].map(s => (
              <span key={s.l} style={{ background: `${s.c}18`, color: s.c, border: `1px solid ${s.c}30`, padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                {s.v} {s.l}
              </span>
            ))}
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: t.badge, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted }}>
              {dirOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
        </button>

        {/* Contenido del directorio */}
        {dirOpen && (
          <>
            {/* Barra de búsqueda y filtros */}
            <div style={{ padding: '0 20px 12px', display: 'flex', gap: '8px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={13} color={t.muted} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input placeholder="Buscar empresa o email..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  style={{ ...inp, paddingLeft: '30px', fontSize: '11.5px' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <Filter size={12} color={t.muted} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <select value={filtroPlan} onChange={e => setFiltroPlan(e.target.value)}
                  style={{ ...inp, width: 'auto', paddingLeft: '28px', fontSize: '11.5px', cursor: 'pointer' }}>
                  <option value="todos">Todos los planes</option>
                  <option value="básico">Básico</option>
                  <option value="pro">Pro</option>
                  <option value="advance">Advance</option>
                </select>
              </div>
            </div>

            {/* Tabla */}
            {cargando ? (
              <div style={{ padding: '30px', textAlign: 'center', color: t.muted, fontSize: '12px' }}>Cargando...</div>
            ) : emp_filtradas.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: t.muted, fontSize: '12px' }}>
                {busqueda || filtroPlan !== 'todos' ? 'Sin resultados' : 'No hay empresas aún'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                      {['Empresa', 'Plan', 'Módulos', 'Estado', 'Creación', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', fontSize: '9.5px', fontWeight: '700', color: t.muted, textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: `1px solid ${t.border}`, textAlign: h === 'Acciones' ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {emp_filtradas.map((emp, idx) => {
                      const mods = emp.modulos || {};
                      const modsOn = MODULOS_DISPONIBLES.filter(m => mods[m.id]);
                      const pe = PLANES[emp.plan] || PLANES['básico'];
                      const ini = emp.nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                      return (
                        <tr key={emp.id} style={{ borderBottom: idx < emp_filtradas.length - 1 ? `1px solid ${t.border}` : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = t.hover}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {emp.logo_url ? (
                                <img src={emp.logo_url} alt="logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', border: `1px solid ${t.border}` }} />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${emp.color_principal || '#3b82f6'}20`, border: `1px solid ${emp.color_principal || '#3b82f6'}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: emp.color_principal || '#3b82f6', flexShrink: 0 }}>{ini}</div>
                              )}
                              <div>
                                <p style={{ margin: '0 0 1px', fontWeight: '700', color: t.text, fontSize: '12px' }}>{emp.nombre}</p>
                              {emp.email_admin && <p style={{ margin: '0 0 1px', fontSize: '10px', color: t.muted, display: 'flex', alignItems: 'center', gap: '3px' }}><Mail size={9} />{emp.email_admin}</p>}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                {emp.licencia && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: t.badge, padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace', fontWeight: '600', color: '#a78bfa' }}>
                                    <KeyRound size={9} /> {emp.licencia}
                                  </span>
                                )}
                                <a href={`/${emp.slug || `?tienda=${emp.id}`}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: t.badge, padding: '2px 6px', borderRadius: '4px', fontSize: '9px', textDecoration: 'none', color: '#38bdf8', fontWeight: '600' }}>
                                   <Store size={9} /> /{emp.slug || `?tienda=${emp.id.substring(0,6)}...`}
                                </a>
                              </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${pe.color}15`, color: pe.color, border: `1px solid ${pe.color}30`, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                              <pe.Ico size={10} />{(emp.plan || 'básico').toUpperCase()}
                            </span>
                          </td>

                          <td style={{ padding: '10px 14px', maxWidth: '220px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {modsOn.slice(0, 4).map(m => {
                                const c = CAT[m.categoria] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
                                const Ic = ICONOS[m.icono] || Package;
                                return (
                                  <span key={m.id} title={m.nombre} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '600' }}>
                                    <Ic size={8} />{m.nombre.split('/')[0].trim()}
                                  </span>
                                );
                              })}
                              {modsOn.length > 4 && <span style={{ background: t.badge, color: t.muted, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '600' }}>+{modsOn.length - 4}</span>}
                            </div>
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', background: emp.estado === 'activa' ? '#00d68f18' : '#ef444418', color: emp.estado === 'activa' ? '#00d68f' : '#f87171', border: `1px solid ${emp.estado === 'activa' ? '#00d68f30' : '#ef444430'}` }}>
                              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: emp.estado === 'activa' ? '#00d68f' : '#f87171' }} />
                              {emp.estado === 'activa' ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            <p style={{ margin: 0, fontSize: '10px', color: t.muted }}>
                              {emp.created_at ? new Date(emp.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </p>
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button onClick={() => { setEditEmp(emp); setEditPlan(emp.plan || 'básico'); setEditMods(emp.modulos ? { ...emp.modulos } : getModulosPorDefecto(emp.plan || 'básico')); setEditColorPrin(emp.color_principal || '#3b82f6'); setEditColorSec(emp.color_secundario || '#0f172a'); setEditColorTer(emp.color_terciario || '#f59e0b'); }}
                                title="Configurar módulos y plan"
                                style={{ padding: '5px 10px', background: '#3b82f618', color: '#60a5fa', border: '1px solid #3b82f630', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Edit3 size={11} />Configurar
                              </button>
                              <button onClick={() => copiarAcceso(emp)}
                                title="Copiar credenciales de acceso"
                                style={{ padding: '5px 8px', background: '#a78bfa18', color: '#a78bfa', border: '1px solid #a78bfa30', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: '700' }}>
                                <Copy size={11} />Acceso
                              </button>
                              <button onClick={() => toggleEstado(emp.id, emp.estado)}
                                title={emp.estado === 'activa' ? 'Pausar empresa' : 'Reactivar empresa'}
                                style={{ padding: '5px 8px', background: emp.estado === 'activa' ? '#fbbf2418' : '#00d68f18', color: emp.estado === 'activa' ? '#fbbf24' : '#00d68f', border: `1px solid ${emp.estado === 'activa' ? '#fbbf2430' : '#00d68f30'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Power size={11} />{emp.estado === 'activa' ? 'Pausar' : 'Activar'}
                              </button>
                              <button onClick={() => eliminar(emp.id, emp.nombre)}
                                title="Eliminar empresa"
                                style={{ padding: '5px 7px', background: '#ef444418', color: '#f87171', border: '1px solid #ef444430', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Trash2 size={12} />
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
          </>
        )}
      </div>

      {/* ══ MODAL EDICIÓN ═══════════════════════════════════════ */}
      {editEmp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: dark ? '#0d1526' : 'white', border: `1px solid ${t.border}`, borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: dark ? '#0d1526' : 'white', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${editEmp.color_principal || '#3b82f6'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: editEmp.color_principal || '#3b82f6' }}>
                  {editEmp.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: '0 0 1px', fontSize: '15px', fontWeight: '800', color: t.text }}>{editEmp.nombre}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: t.muted }}>Configurar plan y módulos</p>
                </div>
              </div>
              <button onClick={() => setEditEmp(null)} style={{ width: '28px', height: '28px', borderRadius: '7px', background: t.badge, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: t.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>Color Principal</p>
                  <input type="color" value={editColorPrin} onChange={e => setEditColorPrin(e.target.value)} style={{ width: '100%', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: t.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>Color Secundario</p>
                  <input type="color" value={editColorSec} onChange={e => setEditColorSec(e.target.value)} style={{ width: '100%', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: t.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>Color Terciario</p>
                  <input type="color" value={editColorTer} onChange={e => setEditColorTer(e.target.value)} style={{ width: '100%', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                </div>
              </div>
              <p style={{ fontSize: '10px', fontWeight: '700', color: t.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>Plan de suscripción</p>
              <SelectorPlan planActual={editPlan} onChange={p => { setEditPlan(p); setEditMods(getModulosPorDefecto(p)); }} t={t} />
              <div style={{ height: '1px', background: t.border, margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: t.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Módulos habilitados</p>
                <span style={{ background: '#3b82f620', color: '#60a5fa', border: '1px solid #3b82f640', padding: '2px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                  {Object.values(editMods).filter(Boolean).length} activos
                </span>
              </div>
              <ModulosGrid modulos={editMods} plan={editPlan} onToggle={toggleModEdit} t={t} />
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditEmp(null)} style={{ padding: '9px 18px', background: 'transparent', color: t.muted, border: `1.5px solid ${t.border}`, borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={guardando} style={{ padding: '9px 20px', background: guardando ? '#475569' : 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: guardando ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: guardando ? 'none' : '0 4px 14px #3b82f650' }}>
                <Save size={13} />{guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEmpresas;
