/**
 * SISTEMA DE MÓDULOS - Configuración central del SaaS
 *
 * Aquí defines todos los módulos disponibles en la plataforma,
 * qué planes los incluyen, y los metadatos para la UI.
 *
 * Para agregar un nuevo módulo:
 *   1. Agrega la entrada en MODULOS_DISPONIBLES
 *   2. Agrégalo al plan correspondiente en MODULOS_POR_PLAN
 *   3. Crea la ruta y el componente en App.jsx
 *   4. El Sidebar lo detecta automáticamente
 */

export const MODULOS_DISPONIBLES = [
  {
    id: 'tienda',
    nombre: 'Tienda / Catálogo',
    descripcion: 'Catálogo de productos y compras en línea para los clientes finales.',
    icono: 'Store',
    ruta: '/tienda',
    categoria: 'Ventas',
  },
  {
    id: 'inventario',
    nombre: 'Inventario',
    descripcion: 'Gestión de stock, control de productos y alertas de existencias.',
    icono: 'Package',
    ruta: '/inventario',
    categoria: 'Ventas',
  },
  {
    id: 'pedidos',
    nombre: 'Pedidos / Domicilios',
    descripcion: 'Gestión de órdenes de compra y entregas a domicilio.',
    icono: 'ShoppingBag',
    ruta: '/pedidos',
    categoria: 'Ventas',
  },
  {
    id: 'clientes',
    nombre: 'Clientes',
    descripcion: 'Base de datos de clientes, historial y gestión de contactos.',
    icono: 'Users',
    ruta: '/clientes',
    categoria: 'Gestión',
  },
  {
    id: 'agenda',
    nombre: 'Agenda / Citas',
    descripcion: 'Sistema de agendamiento de citas, calendario y gestión de horarios.',
    icono: 'Calendar',
    ruta: '/',
    categoria: 'Servicios',
  },
  {
    id: 'servicios',
    nombre: 'Servicios',
    descripcion: 'Catálogo de servicios ofrecidos y gestión de precios.',
    icono: 'Briefcase',
    ruta: '/servicios',
    categoria: 'Servicios',
  },
  {
    id: 'ventas',
    nombre: 'Ventas',
    descripcion: 'Dashboard de ventas, ingresos y reportes financieros.',
    icono: 'DollarSign',
    ruta: '/ventas',
    categoria: 'Analítica',
  },
  {
    id: 'estadisticas',
    nombre: 'Estadísticas',
    descripcion: 'Métricas avanzadas, gráficas y análisis del negocio.',
    icono: 'BarChart2',
    ruta: '/estadisticas',
    categoria: 'Analítica',
  },
  {
    id: 'admins',
    nombre: 'Gestión de Admins',
    descripcion: 'Múltiples usuarios administradores con diferentes permisos.',
    icono: 'Shield',
    ruta: '/admins',
    categoria: 'Configuración',
  },
];

/**
 * Módulos que se activan automáticamente al seleccionar un plan.
 * El SuperAdmin puede ajustar manualmente después de elegir el plan.
 */
export const MODULOS_POR_PLAN = {
  'básico': ['tienda', 'inventario', 'pedidos', 'clientes'],
  'pro':    ['tienda', 'inventario', 'pedidos', 'clientes', 'agenda', 'servicios', 'ventas', 'estadisticas'],
  'advance':['tienda', 'inventario', 'pedidos', 'clientes', 'agenda', 'servicios', 'ventas', 'estadisticas', 'admins'],
};

/**
 * Devuelve el objeto de módulos (true/false) por defecto para un plan dado.
 * Ejemplo: getModulosPorDefecto('pro') =>
 *   { tienda: true, inventario: true, ..., agenda: true, admins: false }
 */
export function getModulosPorDefecto(plan) {
  const activos = MODULOS_POR_PLAN[plan] || MODULOS_POR_PLAN['básico'];
  return MODULOS_DISPONIBLES.reduce((acc, mod) => {
    acc[mod.id] = activos.includes(mod.id);
    return acc;
  }, {});
}

/**
 * Verifica si un módulo está habilitado para una empresa.
 * Soporta tanto el nuevo formato (modulos JSONB) como el legacy (usa_inventario, usa_citas).
 */
export function moduloHabilitado(empresaConfig, moduloId) {
  if (empresaConfig?.modulos) {
    return empresaConfig.modulos[moduloId] === true;
  }
  // Compatibilidad con el formato anterior
  if (moduloId === 'inventario' || moduloId === 'tienda' || moduloId === 'pedidos' || moduloId === 'ventas') {
    return empresaConfig?.usa_inventario === true;
  }
  if (moduloId === 'agenda' || moduloId === 'servicios') {
    return empresaConfig?.usa_citas === true;
  }
  return moduloId === 'clientes'; // clientes siempre disponible
}

/**
 * Devuelve los metadatos de un módulo por su ID.
 */
export function getModulo(moduloId) {
  return MODULOS_DISPONIBLES.find(m => m.id === moduloId);
}
