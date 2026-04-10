import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// 1. Configuración de Base de Datos
import { supabase } from './config/supabase';

// 2. Componentes y Layouts
import Sidebar from './components/Sidebar';

// 3. Páginas del Administrador
import Agenda from './pages/Agenda';
import Inventario from './pages/Inventario';
import Clientes from './pages/Clientes';
import Ventas from './pages/Ventas';
import Pedidos from './pages/Pedidos';

// 4. Páginas del Cliente
import Tienda from './pages/Tienda';
import Login from './pages/Login';
import MisPedidos from './pages/MisPedidos';
import MisCitas from './pages/MisCitas';
import AgendarCita from './pages/AgendarCita';
import MiPerfil from './pages/MiPerfil'; // <-- Nueva Pantalla

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  const [esTemaOscuro, setEsTemaOscuro] = useState(() => {
    const temaGuardado = localStorage.getItem('miTemaOscuro');
    return temaGuardado === 'true' ? true : false;
  });

  const [notificaciones, setNotificaciones] = useState([]); 
  const [notificacionesAdmin, setNotificacionesAdmin] = useState(0);
  const [notifCitasAdmin, setNotifCitasAdmin] = useState(0);         
  const [refreshPedidos, setRefreshPedidos] = useState(0);
  const [refreshCitas, setRefreshCitas] = useState(0);               

  const CORREO_ADMIN = 'caperp22@gmail.com'; 

  const manejarClickPedidos = () => { setNotificacionesAdmin(0); setRefreshPedidos(prev => prev + 1); };
  const manejarClickCitas = () => { setNotifCitasAdmin(0); setRefreshCitas(prev => prev + 1); };

  useEffect(() => {
    localStorage.setItem('miTemaOscuro', esTemaOscuro);
  }, [esTemaOscuro]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      setCargando(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') await new Promise(r => setTimeout(r, 1000));
      setUsuario(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario) return;

    if (usuario.email === CORREO_ADMIN) {
      const suscripcionPedidos = supabase
        .channel('admin-nuevos-pedidos')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
          setNotificacionesAdmin(prev => prev + 1);
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, icon: 'success', title: `¡Nueva compra de ${payload.new.cliente_email}!` });
        }).subscribe();

      const suscripcionCitas = supabase
        .channel('admin-nuevas-citas')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'citas' }, (payload) => {
          setNotifCitasAdmin(prev => prev + 1);
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, icon: 'info', title: `¡Nueva cita agendada por ${payload.new.cliente_nombre}!` });
        }).subscribe();

      return () => { supabase.removeChannel(suscripcionPedidos); supabase.removeChannel(suscripcionCitas); };
    } else {
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
  }, [usuario]);

  async function cerrarSesion() { await supabase.auth.signOut(); }

  if (cargando) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando sistema...</div>;
  if (!usuario) return <Login />;

  const esAdmin = usuario.email === CORREO_ADMIN;

  // --- MUNDO ADMINISTRADOR ---
  if (esAdmin) {
    return (
      <div style={{ display: 'flex', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Sidebar notificacionesAdmin={notificacionesAdmin} manejarClickPedidos={manejarClickPedidos} notifCitasAdmin={notifCitasAdmin} manejarClickCitas={manejarClickCitas} />
        <div style={{ width: '100%', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
             <span style={{ fontWeight: 'bold', color: '#64748b', marginRight: '20px' }}>Hola, Jefe ({usuario.email})</span>
             <button onClick={cerrarSesion} style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cerrar Sesión</button>
          </div>
          <div style={{ padding: '40px' }}>
            <Routes>
              <Route path="/" element={<Agenda refreshCitas={refreshCitas} notifCitasAdmin={notifCitasAdmin} setNotifCitasAdmin={setNotifCitasAdmin} />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/pedidos" element={<Pedidos refreshPedidos={refreshPedidos} notificacionesAdmin={notificacionesAdmin} setNotificacionesAdmin={setNotificacionesAdmin} />} />
              <Route path="/ventas" element={<Ventas />} />
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
        <Routes>
          <Route path="/" element={<Tienda usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} />} />
          <Route path="/agendar" element={<AgendarCita usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} />} />
          <Route path="/mis-citas" element={<MisCitas usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} />} />
          <Route path="/mis-pedidos" element={<MisPedidos usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} />} />
          <Route path="/mi-perfil" element={<MiPerfil usuario={usuario} esTemaOscuro={esTemaOscuro} setEsTemaOscuro={setEsTemaOscuro} cerrarSesion={cerrarSesion} notificaciones={notificaciones} setNotificaciones={setNotificaciones} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;