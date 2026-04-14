import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { supabase } from './config/supabase';
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
    intervalo_citas: 30
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
        const { data: empData } = await supabase.from('empresas').select('nombre, usa_inventario, usa_citas, color_principal, logo_url, hora_apertura, hora_cierre, intervalo_citas').eq('id', currentEmpresaId).maybeSingle();
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
    }
  }, [usuario, rol, empresaId]); 

  async function cerrarSesion() { await supabase.auth.signOut(); }

  if (cargando) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando sistema...</div>;
  if (!usuario) return <Login />;

  // --- MUNDO SUPER ADMINISTRADOR (TÚ) ---
  if (rol === 'superadmin') {
    return (
      <div className="superadmin-container" style={{ display: 'flex', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        {/* Podrías hacer un SidebarSuperAdmin específico */}
        <div style={{ width: '250px', background: '#1e293b', color: 'white', minHeight: '100vh', padding: '20px' }}>
          <h2>Súper CRM</h2>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '30px' }}>
             <li style={{ marginBottom: '15px', cursor: 'pointer', color: vistaSuperAdmin === 'dashboard' ? '#38bdf8' : 'white' }} onClick={() => setVistaSuperAdmin('dashboard')}>🚀 Dashboard Global</li>
             <li style={{ marginBottom: '15px', cursor: 'pointer', color: vistaSuperAdmin === 'empresas' ? '#38bdf8' : 'white' }} onClick={() => setVistaSuperAdmin('empresas')}>🏢 Gestión de Empresas</li>
             <li style={{ marginBottom: '15px', cursor: 'pointer', color: vistaSuperAdmin === 'admins' ? '#38bdf8' : 'white' }} onClick={() => setVistaSuperAdmin('admins')}>👥 Admins de Empresas</li>
             <li style={{ marginBottom: '15px', color: '#f87171', cursor: 'pointer' }} onClick={cerrarSesion}>Cerrar Sesión</li>
          </ul>
        </div>
        <div style={{ flex: 1, padding: '40px', background: '#f1f5f9' }}>
          {vistaSuperAdmin === 'dashboard' && (
            <div>
              <h1 style={{color: '#0f172a'}}>Panel de Control Global</h1>
              <p style={{color: '#475569'}}>Bienvenido. Aquí podrás crear nuevas empresas, suspender clientes por falta de pago y ver métricas generales del SaaS.</p>
            </div>
          )}
          {vistaSuperAdmin === 'empresas' && <GestionEmpresas />}
          {vistaSuperAdmin === 'admins' && <GestionAdminsGlobal />}
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
              <Route path="/" element={<Agenda refreshCitas={refreshCitas} notifCitasAdmin={notifCitasAdmin} setNotifCitasAdmin={setNotifCitasAdmin} empresaId={empresaId} />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/inventario" element={<Inventario empresaId={empresaId} />} />
              <Route path="/pedidos" element={<Pedidos refreshPedidos={refreshPedidos} notificacionesAdmin={notificacionesAdmin} setNotificacionesAdmin={setNotificacionesAdmin} />} />
              <Route path="/servicios" element={<Servicios empresaId={empresaId} />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/admins" element={<GestionAdmins />} /> 
              <Route path="/ajustes" element={<AjustesTienda empresaId={empresaId} />} />
              <Route path="*" element={<Navigate to="/" />} />
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
            empresaConfig.usa_inventario 
              ? <Tienda usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} empresaId={empresaId} empresaNombre={empresaNombre} empresaConfig={empresaConfig} /> 
              : (empresaConfig.usa_citas ? <Navigate to="/agendar" /> : <div>Esta tienda no tiene servicios activos.</div>)
          } />
          
          <Route path="/agendar" element={
            empresaConfig.usa_citas
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