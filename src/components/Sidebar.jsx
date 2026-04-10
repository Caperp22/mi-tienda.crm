import { Link, useLocation } from 'react-router-dom';
import { Calendar, Package, Users, ShoppingBag, DollarSign, Shield } from 'lucide-react';

function Sidebar({ notificacionesAdmin, manejarClickPedidos, notifCitasAdmin, manejarClickCitas }) {
  const ubicacion = useLocation();

  const menu = [
    { nombre: 'Agenda', ruta: '/', icono: <Calendar size={20} />, notif: notifCitasAdmin, onClick: manejarClickCitas },
    { nombre: 'Pedidos', ruta: '/pedidos', icono: <ShoppingBag size={20} />, notif: notificacionesAdmin, onClick: manejarClickPedidos },
    { nombre: 'Inventario', ruta: '/inventario', icono: <Package size={20} /> },
    { nombre: 'Clientes', ruta: '/clientes', icono: <Users size={20} /> },
    { nombre: 'Ventas', ruta: '/ventas', icono: <DollarSign size={20} /> },
    { nombre: 'Admins', ruta: '/admins', icono: <Shield size={20} /> }, 
  ];

  return (
    <div className="admin-sidebar" style={{ width: '250px', background: '#0f172a', minHeight: '100vh', padding: '20px 0', color: 'white', flexShrink: 0 }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px', letterSpacing: '1px', color: '#38bdf8' }}>CRM ADMIN</h2>
      
      <div className="admin-menu" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {menu.map((item) => {
          const estaActivo = ubicacion.pathname === item.ruta;
          return (
            <Link key={item.nombre} to={item.ruta} onClick={item.onClick} style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '15px', color: estaActivo ? 'white' : '#94a3b8', background: estaActivo ? '#1e293b' : 'transparent', textDecoration: 'none', borderLeft: estaActivo ? '4px solid #38bdf8' : '4px solid transparent', transition: 'all 0.2s', position: 'relative' }}>
              {item.icono}
              <span style={{ fontWeight: estaActivo ? 'bold' : 'normal', fontSize: '15px' }}>{item.nombre}</span>
              {item.notif > 0 && (
                <span style={{ position: 'absolute', right: '20px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold' }}>{item.notif}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;