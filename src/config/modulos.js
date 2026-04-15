/**
 * SISTEMA DE MÓDULOS — Configuración central del SaaS
 *
 * Para agregar un nuevo módulo:
 *   1. Agrégalo en MODULOS_DISPONIBLES
 *   2. Agrégalo al plan correspondiente en MODULOS_POR_PLAN
 *   3. Crea la ruta y componente en App.jsx
 *   4. El Sidebar lo detecta automáticamente
 */

export const MODULOS_DISPONIBLES = [
  // ─── VENTAS ────────────────────────────────────────────────
  {
    id: 'tienda',
    nombre: 'Tienda / Catálogo',
    descripcion: 'Catálogo de productos y compras en línea para los clientes finales.',
    icono: 'Store',
    ruta: '/tienda-admin',
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
    nombre: 'Pedidos',
    descripcion: 'Gestión de órdenes de compra y su estado de entrega.',
    icono: 'ShoppingBag',
    ruta: '/pedidos',
    categoria: 'Ventas',
  },
  {
    id: 'domicilios',
    nombre: 'Domicilios',
    descripcion: 'Zonas de entrega, costos de envío y seguimiento de domicilios.',
    icono: 'Truck',
    ruta: '/domicilios',
    categoria: 'Ventas',
  },
  {
    id: 'cupones',
    nombre: 'Cupones / Descuentos',
    descripcion: 'Códigos promocionales, descuentos por porcentaje o valor fijo.',
    icono: 'Tag',
    ruta: '/cupones',
    categoria: 'Ventas',
  },
  {
    id: 'pos',
    nombre: 'Punto de Venta (POS)',
    descripcion: 'Caja rápida para registro de ventas presenciales.',
    icono: 'Monitor',
    ruta: '/pos',
    categoria: 'Ventas',
  },
  // ─── SERVICIOS ─────────────────────────────────────────────
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
    descripcion: 'Catálogo de servicios ofrecidos con duración y precios.',
    icono: 'Briefcase',
    ruta: '/servicios',
    categoria: 'Servicios',
  },
  // ─── GESTIÓN ───────────────────────────────────────────────
  {
    id: 'clientes',
    nombre: 'Clientes',
    descripcion: 'Base de datos de clientes, historial y gestión de contactos.',
    icono: 'Users',
    ruta: '/clientes',
    categoria: 'Gestión',
  },
  {
    id: 'empleados',
    nombre: 'Empleados',
    descripcion: 'Gestión de personal, turnos de trabajo y asignación de servicios.',
    icono: 'UserCheck',
    ruta: '/empleados',
    categoria: 'Gestión',
  },
  {
    id: 'fidelizacion',
    nombre: 'Fidelización',
    descripcion: 'Programa de puntos, clientes frecuentes y recompensas.',
    icono: 'Gift',
    ruta: '/fidelizacion',
    categoria: 'Gestión',
  },
  {
    id: 'admins',
    nombre: 'Multi-Admins',
    descripcion: 'Varios usuarios administradores con acceso al panel.',
    icono: 'Shield',
    ruta: '/admins',
    categoria: 'Gestión',
  },
  // ─── ANALÍTICA ─────────────────────────────────────────────
  {
    id: 'ventas',
    nombre: 'Ventas',
    descripcion: 'Dashboard de ventas, ingresos y comparativas.',
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
    id: 'reportes',
    nombre: 'Reportes PDF',
    descripcion: 'Exportación de reportes de ventas, inventario y clientes en PDF.',
    icono: 'FileText',
    ruta: '/reportes',
    categoria: 'Analítica',
  },
];

/**
 * Módulos que se activan automáticamente al seleccionar un plan.
 * El SuperAdmin puede ajustar manualmente después de elegir el plan.
 */
export const MODULOS_POR_PLAN = {
  'básico':  ['tienda', 'inventario', 'pedidos', 'clientes'],
  'pro':     ['tienda', 'inventario', 'pedidos', 'domicilios', 'cupones', 'clientes',
              'agenda', 'servicios', 'ventas', 'estadisticas', 'admins'],
  'advance': ['tienda', 'inventario', 'pedidos', 'domicilios', 'cupones', 'pos', 'clientes',
              'agenda', 'servicios', 'empleados', 'fidelizacion', 'admins',
              'ventas', 'estadisticas', 'reportes'],
};

/**
 * Descripción corta de cada plan para mostrar en el selector.
 */
export const INFO_PLANES = {
  'básico': {
    descripcion: 'Ideal para negocios pequeños que arrancan.',
    color: '#64748b',
    bg: '#f1f5f9',
  },
  'pro': {
    descripcion: 'Tienda + Agenda + Estadísticas + Domicilios.',
    color: '#2563eb',
    bg: '#eff6ff',
    popular: true,
  },
  'advance': {
    descripcion: 'Todo ilimitado: POS, Empleados, Fidelización, API.',
    color: '#fbbf24',
    bg: '#1e293b',
  },
};

/**
 * Devuelve el objeto de módulos (true/false) por defecto para un plan dado.
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
 * Soporta el nuevo formato (modulos JSONB) y el legacy (usa_inventario, usa_citas).
 */
export function moduloHabilitado(empresaConfig, moduloId) {
  if (empresaConfig?.modulos) {
    return empresaConfig.modulos[moduloId] === true;
  }
  // Compatibilidad con formato anterior
  if (['inventario', 'tienda', 'pedidos', 'ventas', 'domicilios'].includes(moduloId)) {
    return empresaConfig?.usa_inventario === true;
  }
  if (['agenda', 'servicios'].includes(moduloId)) {
    return empresaConfig?.usa_citas === true;
  }
  return moduloId === 'clientes';
}

/**
 * Devuelve los metadatos de un módulo por su ID.
 */
export function getModulo(moduloId) {
  return MODULOS_DISPONIBLES.find(m => m.id === moduloId);
}

/**
 * Genera una clave de licencia única.
 * Formato: LIC-XXXX-XXXX-XXXX
 */
export function generarLicencia() {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LIC-${segment()}-${segment()}-${segment()}`;
}
