import { Link, useLocation } from 'react-router-dom';
import { Calendar, Package, Users, ShoppingBag, DollarSign, Shield, Settings, Briefcase, Store, BarChart2 } from 'lucide-react';
import { moduloHabilitado } from '../config/modulos';

// Mapeo de ícono → componente Lucide para el Sidebar
const ICONOS = { Calendar, Package, Users, ShoppingBag, DollarSign, Shield, Settings, Briefcase, Store, BarChart2 };

/**
 * Definición de los ítems del menú del Admin.
 * Cada ítem declara a qué módulo pertenece (moduloId).
 * Si moduloId es null, siempre se muestra.
 */
const MENU_ITEMS = [
  { nombre: 'Agenda',        ruta: '/',            icono: 'Calendar',     moduloId: 'agenda',       notifKey: 'citas' },
  { nombre: 'Servicios',     ruta: '/servicios',   icono: 'Briefcase',    moduloId: 'servicios' },
  { nombre: 'Tienda',        ruta: '/tienda-admin',icono: 'Store',        moduloId: 'tienda' },
  { nombre: 'Pedidos',       ruta: '/pedidos',     icono: 'ShoppingBag',  moduloId: 'pedidos',      notifKey: 'pedidos' },
  { nombre: 'Inventario',    ruta: '/inventario',  icono: 'Package',      moduloId: 'inventario' },
  { nombre: 'Ventas',        ruta: '/ventas',      icono: 'DollarSign',   moduloId: 'ventas' },
  { nombre: 'Estadísticas',  ruta: '/estadisticas',icono: 'BarChart2',    moduloId: 'estadisticas' },
  { nombre: 'Clientes',      ruta: '/clientes',    icono: 'Users',        moduloId: 'clientes' },
  { nombre: 'Admins',        ruta: '/admins',      icono: 'Shield',       moduloId: 'admins' },
  { nombre: 'Ajustes',       ruta: '/ajustes',     icono: 'Settings',     moduloId: null },
];

function Sidebar({ notificacionesAdmin, manejarClickPedidos, notifCitasAdmin, manejarClickCitas, empresaConfig }) {
  const ubicacion = useLocation();

  // Filtra el menú según los módulos habilitados para esta empresa
  const menu = MENU_ITEMS
    .filter(item => item.moduloId === null || moduloHabilitado(empresaConfig, item.moduloId))
    .map(item => ({
      ...item,
      notif: item.notifKey === 'pedidos' ? notificacionesAdmin : item.notifKey === 'citas' ? notifCitasAdmin : 0,
      onClick: item.notifKey === 'pedidos' ? manejarClickPedidos : item.notifKey === 'citas' ? manejarClickCitas : undefined,
    }));

  const colorPlan = empresaConfig?.plan === 'advance' ? '#fbbf24' : empresaConfig?.plan === 'pro' ? '#38bdf8' : '#94a3b8';
  const bgPlan    = empresaConfig?.plan === 'advance' ? 'rgba(251,191,36,0.15)' : empresaConfig?.plan === 'pro' ? 'rgba(56,189,248,0.15)' : 'rgba(148,163,184,0.15)';

  return (
    <div className="admin-sidebar" style={{ width: '250px', background: '#0f172a', minHeight: '100vh', padding: '20px 0', color: 'white', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Logo y plan */}
      <div style={{ textAlign: 'center', marginBottom: '30px', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ minHeight: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
          {empresaConfig?.logo_url
            ? <img src={empresaConfig.logo_url} alt="Logo" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
            : <h2 style={{ fontSize: '22px', letterSpacing: '1px', color: '#38bdf8', margin: 0 }}>CRM ADMIN</h2>
          }
        </div>
        {empresaConfig?.plan && (
          <div style={{ background: bgPlan, color: colorPlan, border: `1px solid ${colorPlan}`, padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            PLAN {empresaConfig.plan}
          </div>
        )}
      </div>

      {/* Menú */}
      <nav className="admin-menu" style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
        {menu.map((item) => {
          const estaActivo = ubicacion.pathname === item.ruta;
          const Icono = ICONOS[item.icono] || Settings;
          return (
            <Link
              key={item.nombre}
              to={item.ruta}
              onClick={item.onClick}
              style={{
                padding: '13px 25px', display: 'flex', alignItems: 'center', gap: '14px',
                color: estaActivo ? 'white' : '#94a3b8',
                background: estaActivo ? '#1e293b' : 'transparent',
                textDecoration: 'none',
                borderLeft: estaActivo ? `4px solid ${empresaConfig?.color_principal || '#38bdf8'}` : '4px solid transparent',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <Icono size={18} />
              <span style={{ fontWeight: estaActivo ? 'bold' : 'normal', fontSize: '14px' }}>{item.nombre}</span>
              {item.notif > 0 && (
                <span style={{ position: 'absolute', right: '18px', background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold' }}>
                  {item.notif}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;
