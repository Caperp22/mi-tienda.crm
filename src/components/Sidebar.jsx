import { Link, useLocation } from 'react-router-dom';
import { Calendar, Package, Users, ShoppingBag, DollarSign, Shield, Settings, Briefcase } from 'lucide-react';

function Sidebar({ notificacionesAdmin, manejarClickPedidos, notifCitasAdmin, manejarClickCitas, empresaConfig }) {

  const ubicacion = useLocation();

  const menu = [
    { nombre: 'Agenda', ruta: '/', icono: <Calendar size={20} />, notif: notifCitasAdmin, onClick: manejarClickCitas, mostrar: empresaConfig?.usa_citas },
    { nombre: 'Servicios', ruta: '/servicios', icono: <Briefcase size={20} />, mostrar: empresaConfig?.usa_citas },
    { nombre: 'Pedidos', ruta: '/pedidos', icono: <ShoppingBag size={20} />, notif: notificacionesAdmin, onClick: manejarClickPedidos, mostrar: empresaConfig?.usa_inventario },
    { nombre: 'Inventario', ruta: '/inventario', icono: <Package size={20} />, mostrar: empresaConfig?.usa_inventario },
    { nombre: 'Clientes', ruta: '/clientes', icono: <Users size={20} />, mostrar: true },
    { nombre: 'Ventas', ruta: '/ventas', icono: <DollarSign size={20} />, mostrar: empresaConfig?.usa_inventario },
    { nombre: 'Admins', ruta: '/admins', icono: <Shield size={20} />, mostrar: true }, 
    { nombre: 'Ajustes', ruta: '/ajustes', icono: <Settings size={20} />, mostrar: true },
  ].filter(item => item.mostrar !== false);

  const colorPlan = empresaConfig?.plan === 'advance' ? '#fbbf24' : empresaConfig?.plan === 'pro' ? '#38bdf8' : '#94a3b8';
  const bgPlan = empresaConfig?.plan === 'advance' ? 'rgba(251, 191, 36, 0.15)' : empresaConfig?.plan === 'pro' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)';

  return (
    <div className="admin-sidebar" style={{ width: '250px', background: '#0f172a', minHeight: '100vh', padding: '20px 0', color: 'white', flexShrink: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: '30px', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ minHeight: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
          {empresaConfig?.logo_url 
            ? <img src={empresaConfig.logo_url} alt="Logo Empresa" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
            : <h2 style={{ fontSize: '24px', letterSpacing: '1px', color: '#38bdf8', margin: 0 }}>CRM ADMIN</h2>}
        </div>
        
        {empresaConfig?.plan && (
          <div style={{ background: bgPlan, color: colorPlan, border: `1px solid ${colorPlan}`, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            PLAN {empresaConfig.plan}
          </div>
        )}
      </div>
      
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