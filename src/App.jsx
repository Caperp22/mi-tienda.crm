import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, LogOut, DollarSign, Activity, Crown, TrendingUp, Check, X as XIcon } from 'lucide-react';
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
    logo_url: null,
    hora_apertura: '09:00',
    hora_cierre: '18:00',
    intervalo_citas: 30,
    plan: 'pro'
  });

  useEffect(() => {
    // 1. Capturar ID de la tienda desde la URL (SaaS Multi-tenant)
    const params = new URLSearchParams(window.location.search);
    const tiendaUrl = params.get('tienda');
    if (tiendaUrl) {
      localStorage.setItem('tiendaActual', tiendaUrl);
    }

    async function verificarSesionYRol(usuarioActual) {
      let currentEmpresaId = null;

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
          setRol('cliente');
          currentEmpresaId = localStorage.getItem('tiendaActual');
          setEmpresaId(currentEmpresaId);
        }
      } else {
        setRol('cliente');
        currentEmpresaId = localStorage.getItem('tiendaActual');
        setEmpresaId(currentEmpresaId);
      }

      if (currentEmpresaId) {
        const { data: empData } = await supabase.from('empresas').select('nombre, modulos, usa_inventario, usa_citas, color_principal, logo_url, hora_apertura, hora_cierre, intervalo_citas, plan').eq('id', currentEmpresaId).maybeSingle();
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
    return (
      <div className="superadmin-container" style={{ display: 'flex', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        {/* Sidebar SuperAdmin */}
        <div style={{ width: '260px', background: '#0f172a', color: 'white', minHeight: '100vh', padding: '20px 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 20px', marginBottom: '40px', textAlign: 'center', marginTop: '10px' }}>
            <h2 style={{ color: '#38bdf8', fontSize: '24px', margin: 0, letterSpacing: '1px' }}>SúperAdmin</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '5px 0 0 0' }}>Panel de Control SaaS</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { id: 'dashboard', icono: <LayoutDashboard size={20} />, label: 'Dashboard Global' },
              { id: 'empresas',  icono: <Building2 size={20} />,      label: 'Empresas (Inquilinos)' },
              { id: 'admins',    icono: <Users size={20} />,           label: 'Cuentas de Admins' },
              { id: 'clientes',  icono: <Users size={20} />,           label: 'Clientes Globales' },
              { id: 'solicitudes', icono: <TrendingUp size={20} />,   label: 'Solicitudes Upgrade', badge: notifUpgrades },
            ].map(({ id, icono, label, badge }) => (
              <div key={id} onClick={() => { setVistaSuperAdmin(id); if (id === 'solicitudes') setNotifUpgrades(0); }} style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', color: vistaSuperAdmin === id ? 'white' : '#94a3b8', background: vistaSuperAdmin === id ? '#1e293b' : 'transparent', borderLeft: vistaSuperAdmin === id ? '4px solid #38bdf8' : '4px solid transparent', transition: 'all 0.2s', position: 'relative' }}>
                {icono}
                <span style={{ fontWeight: vistaSuperAdmin === id ? 'bold' : 'normal' }}>{label}</span>
                {badge > 0 && <span style={{ position: 'absolute', right: '18px', background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold' }}>{badge}</span>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', padding: '20px', width: '260px', boxSizing: 'border-box' }}>
             <button onClick={cerrarSesion} style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#dc2626'} onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}>
               <LogOut size={18} /> Cerrar Sesión
             </button>
          </div>
        </div>

        <div style={{ flex: 1, background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'white', padding: '15px 40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
             <span style={{ fontWeight: 'bold', color: '#64748b' }}>Sesión activa: {usuario.email}</span>
          </div>
          
          <div style={{ padding: '40px', flex: 1, overflowY: 'auto' }}>
            {vistaSuperAdmin === 'dashboard' && (
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '10px', fontWeight: '800' }}>Dashboard General del SaaS</h1>
                <p style={{ color: '#64748b', marginBottom: '40px' }}>Visión general de todas las empresas operando en tu plataforma.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  {/* TARJETA NUEVA: INGRESOS GLOBALES */}
                  <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#dcfce3', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                      <DollarSign size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>Ingresos de la Red</h3>
                    <p style={{ margin: 0, color: '#10b981', fontSize: '24px', fontWeight: '900' }}>${ingresosGlobales.toLocaleString()}</p>
                    <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Total procesado por todas las tiendas.</p>
                  </div>

                  <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#e0f2fe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                      <Building2 size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>Gestión de Empresas</h3>
                <p style={{ margin: 0, color: '#3b82f6', fontSize: '24px', fontWeight: '900' }}>{totalEmpresas} Inquilinos</p>
                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Empresas activas en la plataforma.</p>
                  </div>
                  
                  <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                      <Users size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>Cuentas de Acceso</h3>
                <p style={{ margin: 0, color: '#d97706', fontSize: '24px', fontWeight: '900' }}>{totalAdmins} Administradores</p>
                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Usuarios gestionando sus tiendas.</p>
                  </div>

                  <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                      <Activity size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>Consumidores Red</h3>
                    <p style={{ margin: 0, color: '#7c3aed', fontSize: '24px', fontWeight: '900' }}>{totalClientes}</p>
                    <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Clientes finales registrados en todo el SaaS.</p>
                  </div>
                </div>

                {/* MÉTRICAS DE PLANES (TIERS) */}
                <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Plan Básico</p>
                       <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{metricasPlanes.basico}</p>
                     </div>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)', padding: '20px', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)' }}>
                     <div>
                       <p style={{ margin: 0, color: '#bfdbfe', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Plan Pro</p>
                       <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: '800' }}>{metricasPlanes.pro}</p>
                     </div>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #0f172a, #1e293b)', padding: '20px', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }}>
                     <div>
                       <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Plan Advance <Crown size={14} style={{ display: 'inline', color: '#fbbf24' }} /></p>
                       <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: '800' }}>{metricasPlanes.advance}</p>
                     </div>
                  </div>
                </div>


                {/* GRÁFICA GLOBAL */}
                <div style={{ marginTop: '30px', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                  <h2 style={{ fontSize: '20px', color: '#1e293b', margin: '0 0 20px 0' }}>Volumen de Ventas de la Red (Todas las Tiendas)</h2>
                  
                  {datosGlobales.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>Aún no hay pedidos entregados para generar la gráfica.</p>
                  ) : (
                    <div style={{ width: '100%', height: '350px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosGlobales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} tickFormatter={(val) => `$${val}`} dx={-5} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#1e293b' }}
                            formatter={(value) => [`$${value}`, 'Ingresos Globales']}
                          />
                          <Bar dataKey="ventas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
            {vistaSuperAdmin === 'empresas' && <GestionEmpresas />}
            {vistaSuperAdmin === 'admins' && <GestionAdminsGlobal />}
            {vistaSuperAdmin === 'clientes' && <GestionClientesGlobal />}
            {vistaSuperAdmin === 'solicitudes' && <VistasSolicitudesUpgrade />}
          </div>
        </div>
      </div>
    );
  }

  // --- MUNDO ADMINISTRADOR DE EMPRESA (Tus Clientes que compraron el CRM) ---
  if (rol === 'admin') {
    return (
      <div className="admin-container" style={{ display: 'flex', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Sidebar notificacionesAdmin={notificacionesAdmin} manejarClickPedidos={manejarClickPedidos} notifCitasAdmin={notifCitasAdmin} manejarClickCitas={manejarClickCitas} empresaConfig={empresaConfig} />
        <div className="admin-main" style={{ width: '100%', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div className="admin-header" style={{ background: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
             <span style={{ fontWeight: 'bold', color: '#64748b', marginRight: '20px' }}>Hola, Jefe ({usuario.email})</span>
             <button onClick={cerrarSesion} style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cerrar Sesión</button>
          </div>
          <div className="admin-content" style={{ padding: '40px' }}>
            <Routes>
              {/* Ruta raíz: redirige al primer módulo habilitado */}
              <Route path="/" element={
                moduloHabilitado(empresaConfig, 'agenda')
                  ? <Agenda refreshCitas={refreshCitas} notifCitasAdmin={notifCitasAdmin} setNotifCitasAdmin={setNotifCitasAdmin} empresaId={empresaId} />
                  : moduloHabilitado(empresaConfig, 'pedidos')
                    ? <Navigate to="/pedidos" />
                    : moduloHabilitado(empresaConfig, 'inventario')
                      ? <Navigate to="/inventario" />
                      : <Navigate to="/clientes" />
              } />
              {moduloHabilitado(empresaConfig, 'servicios')  && <Route path="/servicios"    element={<Servicios empresaId={empresaId} />} />}
              {moduloHabilitado(empresaConfig, 'pedidos')    && <Route path="/pedidos"      element={<Pedidos refreshPedidos={refreshPedidos} notificacionesAdmin={notificacionesAdmin} setNotificacionesAdmin={setNotificacionesAdmin} />} />}
              {moduloHabilitado(empresaConfig, 'inventario') && <Route path="/inventario"   element={<Inventario empresaId={empresaId} />} />}
              {moduloHabilitado(empresaConfig, 'ventas')     && <Route path="/ventas"       element={<Ventas />} />}
              {moduloHabilitado(empresaConfig, 'admins')     && <Route path="/admins"       element={<GestionAdmins />} />}
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/ajustes"  element={<AjustesTienda empresaId={empresaId} />} />
              <Route path="*"         element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    );
  }

  // --- MUNDO CLIENTE ---
  return (
    <div style={{ width: '100%', background: esTemaOscuro ? '#0f172a' : '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif', transition: 'background-color 0.3s' }}>
      <div style={{ padding: '0' }}>
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
      </div>
    </div>
  );
}

export default App;