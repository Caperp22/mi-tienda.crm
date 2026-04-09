import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Package, ShoppingCart, BarChart3, Bell } from 'lucide-react';

function Sidebar({ notificacionesAdmin, manejarClickPedidos, notifCitasAdmin, manejarClickCitas }) {
  const location = useLocation();

  const enlaces = [
    { ruta: '/', nombre: 'Agenda', icono: <Calendar size={20} />, isCitas: true },
    { ruta: '/clientes', nombre: 'Clientes', icono: <Users size={20} /> },
    { ruta: '/inventario', nombre: 'Inventario', icono: <Package size={20} /> },
    { ruta: '/pedidos', nombre: 'Pedidos', icono: <ShoppingCart size={20} />, isPedidos: true },
    { ruta: '/ventas', nombre: 'Ventas (Dashboard)', icono: <BarChart3 size={20} /> },
  ];

  return (
    <div style={{ width: '250px', background: '#1e293b', minHeight: '100vh', color: 'white', padding: '20px 0', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px' }}>Mi Negocio</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {enlaces.map(enlace => {
          const activo = location.pathname === enlace.ruta;
          
          // Determinamos qué número de notificación mostrar
          let badgeNotif = 0;
          if (enlace.isPedidos) badgeNotif = notificacionesAdmin;
          if (enlace.isCitas) badgeNotif = notifCitasAdmin;

          return (
            <li key={enlace.ruta} style={{ margin: '10px 0' }}>
              <Link 
                to={enlace.ruta} 
                onClick={() => {
                  if (enlace.isPedidos) manejarClickPedidos();
                  if (enlace.isCitas) manejarClickCitas();
                }}
                style={{
                  display: 'flex', alignItems: 'center', padding: '12px 20px',
                  color: activo ? '#38bdf8' : '#cbd5e1', textDecoration: 'none',
                  background: activo ? '#0f172a' : 'transparent',
                  borderLeft: activo ? '4px solid #38bdf8' : '4px solid transparent',
                  fontWeight: activo ? 'bold' : 'normal', transition: 'all 0.2s', position: 'relative'
                }}
              >
                <span style={{ marginRight: '15px', display: 'flex' }}>{enlace.icono}</span>
                {enlace.nombre}
                
                {/* Burbuja de Notificación */}
                {badgeNotif > 0 && (
                  <div style={{ position: 'absolute', right: '20px', display: 'flex', alignItems: 'center', gap: '5px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    <Bell size={12} /> {badgeNotif}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Sidebar;