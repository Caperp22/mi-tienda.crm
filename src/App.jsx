import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, LogOut, DollarSign, Activity, Crown, TrendingUp, Check, X as XIcon, Sun, Moon, Power, Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';

import { supabase } from './config/supabase';
import { moduloHabilitado } from './config/modulos';
import Sidebar from './components/Sidebar';

import Agenda from './pages/Agenda';
import Inventario from './pages/Inventario';
import Clientes from './pages/Clientes';
import Ventas from './pages/Ventas';
import Servicios from './pages/Servicios';
import Pedidos from './pages/Pedidos';
import GestionAdmins from './pages/GestionAdmins'; 
import GestionEmpresas from './pages/GestionEmpresas';
import GestionAdminsGlobal from './pages/GestionAdminsGlobal';
import GestionClientesGlobal from './pages/GestionClientesGlobal';
import AjustesTienda from './pages/AjustesTienda';
import DashboardAdmin from './pages/DashboardAdmin';
import Domicilios from './pages/Domicilios';
import Cupones from './pages/Cupones';
import Estadisticas from './pages/Estadisticas';
import POS from './pages/POS';
import Empleados from './pages/Empleados';
import Fidelizacion from './pages/Fidelizacion';
import Reportes from './pages/Reportes';
import TiendaAdmin from './pages/TiendaAdmin';

import Tienda from './pages/Tienda';
import Login from './pages/Login';
import MisPedidos from './pages/MisPedidos';
import MisCitas from './pages/MisCitas';
import AgendarCita from './pages/AgendarCita';
import MiPerfil from './pages/MiPerfil'; 

// CUSTOM HOOK: Manejo de Autenticación y Roles
function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [rol, setRol] = useState('cliente'); // 'superadmin', 'admin', 'cliente'
  const [empresaId, setEmpresaId] = useState(null);
  const [empresaNombre, setEmpresaNombre] = useState('Mi Tienda');
  const [empresaConfig, setEmpresaConfig] = useState({
    usa_inventario: true,
    usa_citas: true,
    color_principal: '#3b82f6',
    color_secundario: '#0f172a',
    color_terciario: '#f59e0b',
    logo_url: null,
    hora_apertura: '09:00',
    hora_cierre: '18:00',
    intervalo_citas: 30,
    plan: 'pro',
    estado: 'activa'
  });

  useEffect(() => {
    async function getEmpresaIdFromUrl() {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const tiendaIdPorQuery = params.get('tienda');
      
      // Extrae el 'slug' de la URL. Ej: /pizzeria -> 'pizzeria'
      const slug = path.substring(1).split('/')[0];

      // Prioridad 1: Buscar por slug en la URL (ej: /pizzeria)
      // Ignoramos rutas internas de la app cliente para no confundirlas con slugs.
      if (slug && !['mis-pedidos', 'mis-citas', 'mi-perfil', 'agendar'].includes(slug)) {
        const { data } = await supabase.from('empresas').select('id').eq('slug', slug).maybeSingle();
        if (data) return data.id;
      }

      // Prioridad 2: Buscar por ID en el query param (ej: ?tienda=uuid)
      if (tiendaIdPorQuery) {
        return tiendaIdPorQuery;
      }

      // Prioridad 3: Usar el que esté guardado en localStorage
      return localStorage.getItem('tiendaActual');
    }

    async function verificarSesionYRol(usuarioActual) {
      const resolvedEmpresaId = await getEmpresaIdFromUrl();
      if (resolvedEmpresaId) {
        localStorage.setItem('tiendaActual', resolvedEmpresaId);
      }
      
      let currentEmpresaId = resolvedEmpresaId;

      if (usuarioActual) {
        // Consultamos el rol y a qué empresa pertenece
        const { data } = await supabase
          .from('administradores')
          .select('rol, empresa_id')
          .eq('email', usuarioActual.email)
          .maybeSingle(); // Usamos maybeSingle para obtener un solo registro o null

        if (data) {
          setRol(data.rol || 'admin'); // Si existe en la tabla, es admin o superadmin
          setEmpresaId(data.empresa_id);
          currentEmpresaId = data.empresa_id;
        } else {
          setRol('cliente'); // Es un cliente normal
          setEmpresaId(currentEmpresaId); // Usa el ID resuelto de la URL/storage
        }
      } else {
        setRol('cliente'); // No hay sesión
        setEmpresaId(currentEmpresaId); // Usa el ID resuelto de la URL/storage
      }

      if (currentEmpresaId) {
        const { data: empData } = await supabase.from('empresas').select('nombre, modulos, usa_inventario, usa_citas, color_principal, color_secundario, color_terciario, logo_url, hora_apertura, hora_cierre, intervalo_citas, plan, slug, estado').eq('id', currentEmpresaId).maybeSingle();
        if (empData) {
          setEmpresaNombre(empData.nombre);
          // Guardamos la configuración visual y de módulos
          setEmpresaConfig(empData);
        }
      }

      setUsuario(usuarioActual);
      setCargando(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      verificarSesionYRol(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') await new Promise(r => setTimeout(r, 1000));
      verificarSesionYRol(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return { usuario, rol, empresaId, empresaNombre, empresaConfig, cargando };
}

// ─── Vista de Solicitudes de Upgrade (SuperAdmin) ────────────────────────────
function VistasSolicitudesUpgrade() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('solicitudes_upgrade')
        .select('*, empresas(nombre, email_admin)')
        .order('created_at', { ascending: false });
      setSolicitudes(data || []);
      setCargando(false);
    }
    cargar();
  }, []);

  async function responder(id, empresaId, planSolicitado, accion) {
    if (accion === 'aprobar') {
      const { error } = await supabase.from('empresas').update({
        plan: planSolicitado,
        modulos: (await import('./config/modulos')).getModulosPorDefecto(planSolicitado),
        usa_inventario: ['básico','pro','advance'].includes(planSolicitado),
        usa_citas: ['pro','advance'].includes(planSolicitado),
      }).eq('id', empresaId);
      if (error) { Swal.fire('Error', error.message, 'error'); return; }
    }
    await supabase.from('solicitudes_upgrade').update({ estado: accion === 'aprobar' ? 'aprobada' : 'rechazada' }).eq('id', id);
    Swal.fire({ toast: true, position: 'top-end', icon: accion === 'aprobar' ? 'success' : 'info', title: accion === 'aprobar' ? '¡Plan actualizado!' : 'Solicitud rechazada', showConfirmButton: false, timer: 3000 });
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: accion === 'aprobar' ? 'aprobada' : 'rechazada' } : s));
  }

  if (cargando) return <p style={{ color: '#64748b' }}>Cargando solicitudes...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <TrendingUp size={30} color="#3b82f6" />
        <h1 style={{ fontSize: '26px', color: '#1e293b', margin: 0, fontWeight: '800' }}>Solicitudes de Upgrade</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Empresas que solicitan cambiar su plan de suscripción.</p>

      {solicitudes.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
          <TrendingUp size={40} color="#e2e8f0" style={{ marginBottom: '15px' }} />
          <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>No hay solicitudes pendientes.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {solicitudes.map(sol => (
            <div key={sol.id} style={{ background: 'white', borderRadius: '12px', border: `1px solid ${sol.estado === 'pendiente' ? '#fde68a' : sol.estado === 'aprobada' ? '#a7f3d0' : '#fecaca'}`, padding: '20px 25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>{sol.empresas?.nombre || 'Empresa'}</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>{sol.empresas?.email_admin}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {sol.plan_actual?.toUpperCase()}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '16px' }}>→</span>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {sol.plan_solicitado?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(sol.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {sol.estado === 'pendiente' ? (
                  <>
                    <button onClick={() => responder(sol.id, sol.empresa_id, sol.plan_solicitado, 'aprobar')} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={15} /> Aprobar
                    </button>
                    <button onClick={() => responder(sol.id, sol.empresa_id, sol.plan_solicitado, 'rechazar')} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XIcon size={15} /> Rechazar
                    </button>
                  </>
                ) : (
                  <span style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', background: sol.estado === 'aprobada' ? '#dcfce3' : '#fee2e2', color: sol.estado === 'aprobada' ? '#166534' : '#991b1b' }}>
                    {sol.estado === 'aprobada' ? '✓ Aprobada' : '✗ Rechazada'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const { usuario, rol, empresaId, empresaNombre, empresaConfig, cargando } = useAuth();
  
  const [esTemaOscuro, setEsTemaOscuro] = useState(() => {
    const temaGuardado = localStorage.getItem('miTemaOscuro');
    return temaGuardado === 'true' ? true : false;
  });

  const [notificaciones, setNotificaciones] = useState([]); 
  const [notificacionesAdmin, setNotificacionesAdmin] = useState(0);
  const [notifCitasAdmin, setNotifCitasAdmin] = useState(0);         
  const [refreshPedidos, setRefreshPedidos] = useState(0);
  const [refreshCitas, setRefreshCitas] = useState(0);               
  const [vistaSuperAdmin, setVistaSuperAdmin] = useState('empresas');
  const [notifUpgrades, setNotifUpgrades] = useState(0);

  // --- NUEVO ESTADO PARA GRÁFICA GLOBAL (SUPERADMIN) ---
  const [datosGlobales, setDatosGlobales] = useState([]);
  const [ingresosGlobales, setIngresosGlobales] = useState(0);
  const [totalEmpresas, setTotalEmpresas] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [metricasPlanes, setMetricasPlanes] = useState({ basico: 0, pro: 0, advance: 0 });

  const manejarClickPedidos = () => { setNotificacionesAdmin(0); setRefreshPedidos(prev => prev + 1); };
  const manejarClickCitas = () => { setNotifCitasAdmin(0); setRefreshCitas(prev => prev + 1); };

  useEffect(() => {
    localStorage.setItem('miTemaOscuro', esTemaOscuro);
  }, [esTemaOscuro]);

  // SISTEMA DE NOTIFICACIONES
  useEffect(() => {
    if (!usuario) return;

    if (rol === 'admin' && empresaId) {
      // El Admin normal solo escucha notificaciones de SU empresa
      const suscripcionPedidos = supabase
        .channel('admin-nuevos-pedidos')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos', filter: `empresa_id=eq.${empresaId}` }, (payload) => {
          setNotificacionesAdmin(prev => prev + 1);
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, icon: 'success', title: `¡Nueva compra de ${payload.new.cliente_email}!` });
        }).subscribe();

      const suscripcionCitas = supabase
        .channel('admin-nuevas-citas')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'citas', filter: `empresa_id=eq.${empresaId}` }, (payload) => {
          setNotifCitasAdmin(prev => prev + 1);
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, icon: 'info', title: `¡Nueva cita agendada por ${payload.new.cliente_nombre}!` });
        }).subscribe();

      return () => { supabase.removeChannel(suscripcionPedidos); supabase.removeChannel(suscripcionCitas); };
    } else if (rol === 'cliente') {
      // El cliente escucha solo SUS pedidos y citas
      const suscripcionClientePedidos = supabase
        .channel('cliente-actualizaciones')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `cliente_email=eq.${usuario.email}` }, (payload) => {
          if (payload.new.estado !== payload.old.estado) {
            const nuevaNotif = { id: Date.now(), texto: `Tu pedido #${payload.new.id} ahora está: ${payload.new.estado}`, ruta: '/mis-pedidos' };
            setNotificaciones(prev => [nuevaNotif, ...prev]);
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, icon: 'info', title: `¡Pedido actualizado!` });
          }
        }).subscribe();
        
      const suscripcionClienteCitas = supabase
        .channel('cliente-citas-actualizaciones')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'citas', filter: `cliente_email=eq.${usuario.email}` }, (payload) => {
          if (payload.new.estado !== payload.old.estado) {
            const nuevaNotif = { id: Date.now() + 1, texto: `Tu cita de ${payload.new.servicio} está: ${payload.new.estado}`, ruta: '/mis-citas' };
            setNotificaciones(prev => [nuevaNotif, ...prev]);
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, icon: 'info', title: `¡Cita actualizada!` });
          }
        }).subscribe();

      return () => { supabase.removeChannel(suscripcionClientePedidos); supabase.removeChannel(suscripcionClienteCitas); };
    } else if (rol === 'superadmin') {
      // Cargar solicitudes de upgrade pendientes al inicio
      supabase.from('solicitudes_upgrade').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente')
        .then(({ count }) => setNotifUpgrades(count || 0));

      // Escuchar nuevas solicitudes en tiempo real
      const suscripcionUpgrades = supabase
        .channel('superadmin-upgrades')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solicitudes_upgrade' }, (payload) => {
          setNotifUpgrades(prev => prev + 1);
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 5000, icon: 'info', title: `📈 Solicitud de upgrade: Plan ${payload.new.plan_solicitado?.toUpperCase()}` });
        }).subscribe();

      return () => { supabase.removeChannel(suscripcionUpgrades); };
    }
  }, [usuario, rol, empresaId]);

  // --- NUEVO EFFECT PARA ESTADÍSTICAS DEL SUPERADMIN ---
  useEffect(() => {
    if (rol === 'superadmin') {
      async function obtenerEstadisticasGlobales() {
        const { data } = await supabase.from('pedidos').select('total, created_at').eq('estado', 'Entregado');
        if (data) {
          const ventasPorFecha = {};
          let sumaTotal = 0;
          data.forEach(p => {
            sumaTotal += Number(p.total);
            const fechaBase = new Date(p.created_at);
            const key = fechaBase.toISOString().split('T')[0];
            ventasPorFecha[key] = (ventasPorFecha[key] || 0) + Number(p.total);
          });
          
          const grafica = Object.keys(ventasPorFecha).sort().map(key => {
            const dateObj = new Date(key + "T00:00:00");
            return {
              fecha: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
              ventas: ventasPorFecha[key]
            };
          });
          setDatosGlobales(grafica);
          setIngresosGlobales(sumaTotal);
        }

        const { data: dataEmp } = await supabase.from('empresas').select('plan');
        if (dataEmp) {
          setTotalEmpresas(dataEmp.length);
          setMetricasPlanes({
            basico: dataEmp.filter(e => e.plan === 'básico').length,
            pro: dataEmp.filter(e => e.plan === 'pro').length,
            advance: dataEmp.filter(e => e.plan === 'advance').length
          });
        }

        const { count: countAdm } = await supabase.from('administradores').select('*', { count: 'exact', head: true }).eq('rol', 'admin');
        setTotalAdmins(countAdm || 0);

        const { count: countCli } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
        setTotalClientes(countCli || 0);
      }
      obtenerEstadisticasGlobales();
    }
  }, [rol]);

  async function cerrarSesion() { await supabase.auth.signOut(); }

  if (cargando) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando sistema...</div>;
  if (!usuario) return <Login />;

  // --- MUNDO SUPER ADMINISTRADOR (TÚ) ---
  if (rol === 'superadmin') {
    const d = esTemaOscuro;
    const sa = {
      page:        d ? '#060d1a'                    : '#f8fafc',
      topbar:      d ? '#0a1020'                    : 'white',
      topbarBorder:d ? 'rgba(255,255,255,0.06)'     : '#e2e8f0',
      card:        d ? 'rgba(255,255,255,0.04)'     : 'white',
      cardBorder:  d ? 'rgba(255,255,255,0.08)'     : '#e2e8f0',
      text:        d ? '#f0f4ff'                    : '#0f172a',
      sub:         d ? '#94a3b8'                    : '#64748b',
      muted:       d ? '#475569'                    : '#94a3b8',
    };
    return (
      <div className="superadmin-container" style={{ display: 'flex', fontFamily: 'sans-serif', margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}>
        {/* ── Sidebar SuperAdmin ─────────────────────────────────── */}
        <div className="sa-sidebar" style={{ width: '240px', background: 'linear-gradient(180deg,#060d1a 0%,#0f172a 100%)', color: 'white', height: '100vh', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Header */}
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: 'linear-gradient(135deg,#38bdf8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 0 20px #38bdf840' }}>
              <Crown size={22} color="white" />
            </div>
            <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '0.3px' }}>SuperAdmin</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#475569' }}>Panel de Control SaaS</p>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '14px 0', overflowY: 'auto' }}>
            {[
              { grupo: 'Principal',   items: [
                { id: 'dashboard',   icono: <LayoutDashboard size={15} />, label: 'Dashboard' },
                { id: 'empresas',    icono: <Building2 size={15} />,       label: 'Empresas' },
              ]},
              { grupo: 'Usuarios',   items: [
                { id: 'admins',      icono: <Users size={15} />,           label: 'Administradores' },
                { id: 'clientes',    icono: <Activity size={15} />,        label: 'Clientes Globales' },
              ]},
              { grupo: 'Gestión',    items: [
                { id: 'solicitudes', icono: <TrendingUp size={15} />,      label: 'Upgrades', badge: notifUpgrades },
              ]},
            ].map(({ grupo, items }) => (
              <div key={grupo} style={{ marginBottom: '4px' }}>
                <p style={{ fontSize: '9px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0', padding: '8px 20px 4px', opacity: 0.9 }}>{grupo}</p>
                {items.map(({ id, icono, label, badge }) => {
                  const activo = vistaSuperAdmin === id;
                  return (
                    <div key={id}
                      onClick={() => { setVistaSuperAdmin(id); if (id === 'solicitudes') setNotifUpgrades(0); }}
                      style={{ padding: '8px 18px 8px 20px', margin: '1px 10px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: activo ? 'white' : '#94a3b8', background: activo ? 'rgba(56,189,248,0.12)' : 'transparent', borderLeft: activo ? '3px solid #38bdf8' : '3px solid transparent', transition: 'all 0.15s', position: 'relative' }}
                      onMouseEnter={e => { if (!activo) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#e2e8f0'; }}}
                      onMouseLeave={e => { if (!activo) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activo ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                        {icono}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: activo ? '600' : '400', flex: 1 }}>{label}</span>
                      {badge > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: '700' }}>{badge}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '9px', padding: '8px 12px', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>Sesión activa</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#38bdf8', fontWeight: '600', wordBreak: 'break-all' }}>{usuario.email}</p>
            </div>
            <button onClick={cerrarSesion} style={{ width: '100%', padding: '9px 14px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '9px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>

        <div style={{ flex: 1, background: sa.page, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'background 0.2s' }}>
          {/* Topbar */}
          <div style={{ background: sa.topbar, padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${sa.topbarBorder}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'background 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '12px', color: sa.sub }}>Sistema operativo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {notifUpgrades > 0 && (
                <button onClick={() => { setVistaSuperAdmin('solicitudes'); setNotifUpgrades(0); }}
                  style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={13} /> {notifUpgrades} solicitud{notifUpgrades > 1 ? 'es' : ''} de upgrade
                </button>
              )}
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <button
                onClick={() => setEsTemaOscuro(d => !d)}
                title={esTemaOscuro ? 'Modo claro' : 'Modo oscuro'}
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #e2e8f0', background: esTemaOscuro ? '#1e293b' : '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: esTemaOscuro ? '#fbbf24' : '#64748b', transition: 'all 0.2s' }}
              >
                {esTemaOscuro ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
          
          <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {vistaSuperAdmin === 'dashboard' && (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Título compacto */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
                  <h1 style={{ fontSize: '20px', color: sa.text, margin: 0, fontWeight: '800' }}>Dashboard General</h1>
                  <span style={{ fontSize: '12px', color: sa.sub }}>Visión global de tu plataforma SaaS</span>
                </div>

                {/* Fila superior: 4 KPIs + 3 planes en la misma fila */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr) repeat(3,auto)', gap: '10px', marginBottom: '12px' }}>
                  {[
                    { label: 'Ingresos',      valor: `$${ingresosGlobales.toLocaleString()}`, color: '#10b981', iconBg: d ? '#10b98120' : '#dcfce3', ico: <DollarSign size={18} /> },
                    { label: 'Empresas',      valor: totalEmpresas,                           color: '#3b82f6', iconBg: d ? '#3b82f620' : '#e0f2fe', ico: <Building2 size={18} /> },
                    { label: 'Admins',        valor: totalAdmins,                             color: '#d97706', iconBg: d ? '#d9770620' : '#fef3c7', ico: <Users size={18} /> },
                    { label: 'Clientes',      valor: totalClientes,                           color: '#7c3aed', iconBg: d ? '#7c3aed20' : '#f3e8ff', ico: <Activity size={18} /> },
                  ].map(({ label, valor, color, iconBg, ico }) => (
                    <div key={label} style={{ background: sa.card, padding: '14px 16px', borderRadius: '10px', border: `1px solid ${sa.cardBorder}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: iconBg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ico}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', color: sa.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</p>
                        <p style={{ margin: 0, color, fontSize: '18px', fontWeight: '900', lineHeight: 1.1 }}>{valor}</p>
                      </div>
                    </div>
                  ))}
                  {/* Planes inline */}
                  {[
                    { label: 'Básico', valor: metricasPlanes.basico, bg: sa.card, border: sa.cardBorder, color: sa.text, sub: sa.sub },
                    { label: 'Pro',    valor: metricasPlanes.pro,    bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'transparent', color: 'white', sub: '#bfdbfe' },
                    { label: 'Advance',valor: metricasPlanes.advance,bg: 'linear-gradient(135deg,#0f172a,#1e293b)', border: '#334155', color: 'white', sub: '#94a3b8', crown: true },
                  ].map(({ label, valor, bg, border, color, sub, crown }) => (
                    <div key={label} style={{ background: bg, padding: '14px 18px', borderRadius: '10px', border: `1px solid ${border}`, minWidth: '90px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: sub, letterSpacing: '0.5px' }}>
                        {label} {crown && <Crown size={10} style={{ display: 'inline', color: '#fbbf24' }} />}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: '900', color }}>{valor}</p>
                    </div>
                  ))}
                </div>

                {/* Gráfica — altura reducida */}
                <div style={{ background: sa.card, padding: '16px 20px', borderRadius: '12px', border: `1px solid ${sa.cardBorder}` }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '700', color: sa.text }}>Volumen de Ventas — Todas las Tiendas</p>
                  {datosGlobales.length === 0 ? (
                    <p style={{ color: sa.sub, textAlign: 'center', padding: '30px 0', fontSize: '13px' }}>Aún no hay pedidos entregados para generar la gráfica.</p>
                  ) : (
                    <div style={{ width: '100%', height: '200px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosGlobales} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={d ? 'rgba(255,255,255,0.06)' : '#e2e8f0'} />
                          <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: sa.sub, fontSize: 11 }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: sa.sub, fontSize: 11 }} tickFormatter={v => `$${v}`} dx={-5} />
                          <Tooltip cursor={{ fill: d ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: `1px solid ${sa.cardBorder}`, background: sa.card, color: sa.text, fontSize: '12px' }}
                            formatter={v => [`$${v}`, 'Ingresos']} />
                          <Bar dataKey="ventas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
            {vistaSuperAdmin === 'empresas' && <GestionEmpresas dark={esTemaOscuro} />}
            {vistaSuperAdmin === 'admins' && <GestionAdminsGlobal />}
            {vistaSuperAdmin === 'clientes' && <GestionClientesGlobal />}
            {vistaSuperAdmin === 'solicitudes' && <VistasSolicitudesUpgrade />}
          </div>
        </div>
      </div>
    );
  }

  // --- MUNDO ADMINISTRADOR DE EMPRESA ---
  if (rol === 'admin') {
    const d = esTemaOscuro;
    const color    = empresaConfig?.color_principal || '#3b82f6';
    const colorSec = empresaConfig?.color_secundario || '#0f172a';
    const colorTer = empresaConfig?.color_terciario || '#f59e0b';
    
    const adm = {
      page:    d ? `color-mix(in srgb, ${colorSec} 15%, black)` : `color-mix(in srgb, ${colorSec} 3%, white)`,
      topbar:  d ? `color-mix(in srgb, ${colorSec} 25%, black)` : 'white',
      border:  d ? `color-mix(in srgb, ${colorSec} 40%, black)` : `color-mix(in srgb, ${colorSec} 15%, white)`,
      text:    d ? '#f0f4ff' : '#0f172a',
      sub:     d ? '#94a3b8' : '#475569',
      content: d ? `color-mix(in srgb, ${colorSec} 15%, black)` : `color-mix(in srgb, ${colorSec} 3%, white)`,
    };
    return (
      <div className="admin-container" style={{ display: 'flex', fontFamily: 'system-ui,sans-serif', margin: 0, padding: 0, height: '100vh', overflow: 'hidden', background: adm.page }}>
        <Sidebar
          dark={d}
          color={color}
          notificacionesAdmin={notificacionesAdmin}
          manejarClickPedidos={manejarClickPedidos}
          notifCitasAdmin={notifCitasAdmin}
          manejarClickCitas={manejarClickCitas}
          empresaConfig={empresaConfig}
          cerrarSesion={cerrarSesion}
        />
        <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* ── Topbar ── */}
          <div className="admin-header" style={{
            background: adm.topbar, borderBottom: `1px solid ${adm.border}`,
            padding: '0 28px', height: '58px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: d ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: adm.text }}>
                {empresaNombre}
              </span>
              <span style={{ fontSize: '12px', color: adm.sub, background: d ? 'rgba(255,255,255,0.06)' : '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                {new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: adm.sub }}>{usuario.email}</span>
              <button onClick={() => setEsTemaOscuro(v => !v)} style={{
                background: d ? `color-mix(in srgb, ${colorSec} 40%, black)` : `color-mix(in srgb, ${colorSec} 8%, white)`,
                border: `1px solid ${adm.border}`, borderRadius: '8px',
                width: '34px', height: '34px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: adm.sub,
              }}>
                {d ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>

          {/* ── Contenido ── */}
          <div className="admin-content" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '28px 32px' }}>
            {empresaConfig?.estado === 'inactiva' ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: adm.topbar, borderRadius: '14px', border: `1px solid ${adm.border}` }}>
                <Power size={48} color="#ef4444" style={{ marginBottom: '15px' }} />
                <h2 style={{ margin: '0 0 10px', color: adm.text }}>Cuenta Suspendida</h2>
                <p style={{ color: adm.sub }}>El portal de tu negocio ha sido pausado. Contacta al administrador.</p>
              </div>
            ) : (
              <Routes>
                <Route path="/"            element={<DashboardAdmin dark={d} color={color} empresaConfig={empresaConfig} empresaId={empresaId} />} />
                {moduloHabilitado(empresaConfig, 'tienda')      && <Route path="/tienda-admin"  element={<TiendaAdmin empresaId={empresaId} empresaConfig={empresaConfig} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'agenda')     && <Route path="/agenda"      element={<Agenda refreshCitas={refreshCitas} notifCitasAdmin={notifCitasAdmin} setNotifCitasAdmin={setNotifCitasAdmin} empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'servicios')  && <Route path="/servicios"    element={<Servicios empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'pedidos')    && <Route path="/pedidos"      element={<Pedidos refreshPedidos={refreshPedidos} notificacionesAdmin={notificacionesAdmin} setNotificacionesAdmin={setNotificacionesAdmin} empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'inventario') && <Route path="/inventario"   element={<Inventario empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'ventas')     && <Route path="/ventas"       element={<Ventas empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'admins')     && <Route path="/admins"       element={<GestionAdmins empresaId={empresaId} dark={d} color={color} />} />}
                <Route path="/clientes"    element={<Clientes empresaId={empresaId} dark={d} color={color} />} />
                <Route path="/ajustes"     element={<AjustesTienda empresaId={empresaId} dark={d} color={color} />} />
                {moduloHabilitado(empresaConfig, 'domicilios')   && <Route path="/domicilios"   element={<Domicilios empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'cupones')      && <Route path="/cupones"      element={<Cupones empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'estadisticas') && <Route path="/estadisticas" element={<Estadisticas empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'pos')          && <Route path="/pos"          element={<POS empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'empleados')    && <Route path="/empleados"    element={<Empleados empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'fidelizacion') && <Route path="/fidelizacion" element={<Fidelizacion empresaId={empresaId} dark={d} color={color} />} />}
                {moduloHabilitado(empresaConfig, 'reportes')     && <Route path="/reportes"     element={<Reportes empresaId={empresaId} dark={d} color={color} />} />}
                <Route path="*"            element={<Navigate to="/" />} />
              </Routes>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MUNDO CLIENTE ---
  return (
    <div style={{ width: '100%', background: esTemaOscuro ? '#0f172a' : '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif', transition: 'background-color 0.3s' }}>
      <div style={{ padding: '0' }}>
        {empresaConfig?.estado === 'inactiva' ? (
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
            <Store size={64} style={{ marginBottom: '20px', opacity: 0.3, color: esTemaOscuro ? '#94a3b8' : '#64748b' }} />
            <h2 style={{ color: esTemaOscuro ? '#f1f5f9' : '#1e293b' }}>Tienda en Mantenimiento</h2>
            <p style={{ color: esTemaOscuro ? '#94a3b8' : '#64748b' }}>Este negocio se encuentra temporalmente inactivo.</p>
          </div>
        ) : (
          <>
            {!empresaId && (
          <div style={{ background: '#ef4444', color: 'white', padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
            ⚠️ Estás navegando sin una tienda seleccionada. Por favor usa el enlace directo que te proporcionó el negocio.
          </div>
            )}
            <Routes>
          {/* Ruteo inteligente basado en la configuración del negocio */}
          <Route path="/" element={
            moduloHabilitado(empresaConfig, 'tienda')
              ? <Tienda usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} empresaId={empresaId} empresaNombre={empresaNombre} empresaConfig={empresaConfig} />
              : (moduloHabilitado(empresaConfig, 'agenda') ? <Navigate to="/agendar" /> : <div style={{padding:'40px',textAlign:'center',color:'#64748b'}}>Esta tienda no tiene servicios activos.</div>)
          } />

          <Route path="/agendar" element={
            moduloHabilitado(empresaConfig, 'agenda')
              ? <AgendarCita usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} empresaId={empresaId} empresaNombre={empresaNombre} empresaConfig={empresaConfig} />
              : <Navigate to="/" />
          } />
          
          <Route path="/mis-citas" element={<MisCitas usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} empresaId={empresaId} empresaNombre={empresaNombre} empresaConfig={empresaConfig} />} />
          <Route path="/mis-pedidos" element={<MisPedidos usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} empresaId={empresaId} empresaNombre={empresaNombre} empresaConfig={empresaConfig} />} />
          <Route path="/mi-perfil" element={<MiPerfil usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} empresaId={empresaId} empresaNombre={empresaNombre} empresaConfig={empresaConfig} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
          </>
        )}
      </div>
    </div>
  );
}

export default App;