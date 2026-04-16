import { Link, useLocation } from 'react-router-dom';
import {
  Calendar, Package, Users, ShoppingBag, DollarSign, Shield,
  Settings, Briefcase, Store, BarChart2, Truck, Tag, Monitor,
  UserCheck, Gift, FileText, LogOut, ChevronRight, LayoutDashboard
} from 'lucide-react';
import { moduloHabilitado } from '../config/modulos';

const ICONOS = {
  Calendar, Package, Users, ShoppingBag, DollarSign, Shield,
  Settings, Briefcase, Store, BarChart2, Truck, Tag, Monitor,
  UserCheck, Gift, FileText, LayoutDashboard,
};

const MENU_ITEMS = [
  // Principal
  { nombre: 'Dashboard',    ruta: '/',             icono: 'LayoutDashboard', moduloId: null,                               grupo: 'Principal' },
  // Servicios
  { nombre: 'Agenda',       ruta: '/agenda',       icono: 'Calendar',    moduloId: 'agenda',     notifKey: 'citas',    grupo: 'Servicios' },
  { nombre: 'Servicios',    ruta: '/servicios',    icono: 'Briefcase',   moduloId: 'servicios',                        grupo: 'Servicios' },
  // Ventas
  { nombre: 'Tienda',       ruta: '/tienda-admin', icono: 'Store',       moduloId: 'tienda',                           grupo: 'Ventas' },
  { nombre: 'Pedidos',      ruta: '/pedidos',      icono: 'ShoppingBag', moduloId: 'pedidos',    notifKey: 'pedidos',  grupo: 'Ventas' },
  { nombre: 'Inventario',   ruta: '/inventario',   icono: 'Package',     moduloId: 'inventario',                       grupo: 'Ventas' },
  { nombre: 'Domicilios',   ruta: '/domicilios',   icono: 'Truck',       moduloId: 'domicilios',                       grupo: 'Ventas' },
  { nombre: 'Cupones',      ruta: '/cupones',      icono: 'Tag',         moduloId: 'cupones',                          grupo: 'Ventas' },
  // Gestión
  { nombre: 'Clientes',     ruta: '/clientes',     icono: 'Users',       moduloId: 'clientes',                         grupo: 'Gestión' },
  { nombre: 'Empleados',    ruta: '/empleados',    icono: 'UserCheck',   moduloId: 'empleados',                        grupo: 'Gestión' },
  { nombre: 'Fidelización', ruta: '/fidelizacion', icono: 'Gift',        moduloId: 'fidelizacion',                     grupo: 'Gestión' },
  { nombre: 'Admins',       ruta: '/admins',       icono: 'Shield',      moduloId: 'admins',                           grupo: 'Gestión' },
  // Analítica
  { nombre: 'Ventas',       ruta: '/ventas',       icono: 'DollarSign',  moduloId: 'ventas',                           grupo: 'Analítica' },
  { nombre: 'Estadísticas', ruta: '/estadisticas', icono: 'BarChart2',   moduloId: 'estadisticas',                     grupo: 'Analítica' },
  { nombre: 'Reportes',     ruta: '/reportes',     icono: 'FileText',    moduloId: 'reportes',                         grupo: 'Analítica' },
  // Config (siempre visible)
  { nombre: 'Ajustes',      ruta: '/ajustes',      icono: 'Settings',    moduloId: null,                               grupo: 'Config' },
];

const GRUPO_COLORES = {
  Principal: '#7c3aed',
  Servicios: '#a78bfa',
  Ventas:    '#34d399',
  Gestión:   '#60a5fa',
  Analítica: '#fb923c',
  Config:    '#94a3b8',
};

const PLAN_CONFIG = {
  advance: { label: 'Advance', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  pro:     { label: 'Pro',     color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)' },
  básico:  { label: 'Básico',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
};

function Sidebar({ notificacionesAdmin, manejarClickPedidos, notifCitasAdmin, manejarClickCitas, empresaConfig, cerrarSesion, dark = false, color }) {
  const ubicacion = useLocation();

  const menuFiltrado = MENU_ITEMS
    .filter(item => item.moduloId === null || moduloHabilitado(empresaConfig, item.moduloId))
    .map(item => ({
      ...item,
      notif: item.notifKey === 'pedidos' ? notificacionesAdmin : item.notifKey === 'citas' ? notifCitasAdmin : 0,
      onClick: item.notifKey === 'pedidos' ? manejarClickPedidos : item.notifKey === 'citas' ? manejarClickCitas : undefined,
    }));

  const grupos = [...new Set(menuFiltrado.map(i => i.grupo))];
  const plan = empresaConfig?.plan || 'básico';
  const planCfg = PLAN_CONFIG[plan] || PLAN_CONFIG['básico'];
  const colorActivo = color || empresaConfig?.color_principal || '#38bdf8';
  const colorSec = empresaConfig?.color_secundario || '#0f172a';
  const colorTer = empresaConfig?.color_terciario || '#f59e0b';

  const sideBg = dark
    ? `linear-gradient(180deg, color-mix(in srgb, ${colorSec} 15%, black) 0%, color-mix(in srgb, ${colorSec} 5%, black) 100%)`
    : `linear-gradient(180deg, color-mix(in srgb, ${colorSec} 20%, #0f172a) 0%, color-mix(in srgb, ${colorSec} 5%, #020617) 100%)`;

  return (
    <div
      className="admin-sidebar"
      style={{
        width: '250px',
        background: sideBg,
        height: '100vh',
        color: 'white',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: dark ? `1px solid color-mix(in srgb, ${colorSec} 30%, black)` : `1px solid color-mix(in srgb, ${colorSec} 85%, black)`,
        overflow: 'hidden',
      }}
    >
      {/* ── Header: Logo + Empresa ─────────────────── */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '14px', minHeight: '52px' }}>
          {empresaConfig?.logo_url ? (
            <img
              src={empresaConfig.logo_url}
              alt="Logo"
              style={{ maxHeight: '52px', maxWidth: '180px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
            />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px', margin: '0 auto 6px',
                background: `linear-gradient(135deg, ${colorActivo}33, ${colorActivo}11)`,
                border: `1px solid ${colorActivo}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: '800', color: colorActivo,
              }}>
                {(empresaConfig?.nombre || 'A').charAt(0).toUpperCase()}
              </div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '0.3px' }}>
                {empresaConfig?.nombre || 'CRM Admin'}
              </p>
            </div>
          )}
        </div>

        {/* Badge del plan */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{
            background: planCfg.bg,
            color: planCfg.color,
            border: `1px solid ${planCfg.border}`,
            padding: '3px 12px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
          }}>
            Plan {planCfg.label}
          </span>
        </div>
      </div>

      {/* ── Navegación con grupos ──────────────────── */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {grupos.map((grupo, gi) => (
          <div key={grupo} style={{ marginBottom: gi < grupos.length - 1 ? '4px' : 0 }}>
            {/* Etiqueta de grupo */}
            <p style={{
              fontSize: '10px', fontWeight: '700', color: GRUPO_COLORES[grupo] || '#64748b',
              textTransform: 'uppercase', letterSpacing: '1.2px',
              margin: '0', padding: '10px 20px 6px',
              opacity: 0.7,
            }}>
              {grupo}
            </p>

            {menuFiltrado.filter(i => i.grupo === grupo).map((item) => {
              const activo = ubicacion.pathname === item.ruta;
              const Icono = ICONOS[item.icono] || Settings;
              return (
                <Link
                  key={item.nombre}
                  to={item.ruta}
                  onClick={item.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '11px',
                    padding: '9px 18px 9px 20px',
                    margin: '1px 10px',
                    borderRadius: '9px',
                    color: activo ? 'white' : '#94a3b8',
                    background: activo
                      ? `linear-gradient(90deg, ${colorActivo}22, ${colorActivo}11)`
                      : 'transparent',
                    textDecoration: 'none',
                    borderLeft: activo ? `3px solid ${colorActivo}` : '3px solid transparent',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!activo) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e2e8f0'; }}}
                  onMouseLeave={e => { if (!activo) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: activo ? `${colorActivo}22` : 'rgba(255,255,255,0.05)',
                    transition: 'all 0.15s',
                  }}>
                    <Icono size={16} color={activo ? colorActivo : 'currentColor'} />
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: activo ? '600' : '400', flex: 1, letterSpacing: '0.1px' }}>
                    {item.nombre}
                  </span>
                  {item.notif > 0 ? (
                    <span style={{
                      background: '#ef4444', color: 'white', borderRadius: '10px',
                      padding: '1px 7px', fontSize: '10px', fontWeight: '700',
                      minWidth: '18px', textAlign: 'center',
                    }}>
                      {item.notif}
                    </span>
                  ) : activo ? (
                    <ChevronRight size={13} color={colorActivo} opacity={0.6} />
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer: cerrar sesión ─────────────────── */}
      {cerrarSesion && (
        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={cerrarSesion}
            style={{
              width: '100%', padding: '10px 16px',
              background: 'rgba(239,68,68,0.1)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '9px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '13px', fontWeight: '600',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5'; }}
          >
            <LogOut size={15} /> Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
