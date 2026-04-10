import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { DollarSign, TrendingUp, ShoppingBag, Award } from 'lucide-react';

function Ventas() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerDatos() {
      // Para el dashboard nos importan los pedidos finalizados (Entregados)
      const { data, error } = await supabase.from('pedidos').select('*').eq('estado', 'Entregado');
      if (!error) setPedidos(data);
      setCargando(false);
    }
    obtenerDatos();
  }, []);

  if (cargando) return <div>Calculando métricas...</div>;

  // --- MATEMÁTICAS DEL DASHBOARD ---
  const ingresosTotales = pedidos.reduce((suma, p) => suma + Number(p.total), 0);
  const totalVentas = pedidos.length;
  const ticketPromedio = totalVentas > 0 ? (ingresosTotales / totalVentas).toFixed(2) : 0;

  // Calculamos el producto más vendido
  const conteoProductos = {};
  pedidos.forEach(p => {
    p.productos.forEach(prod => {
      conteoProductos[prod.nombre] = (conteoProductos[prod.nombre] || 0) + prod.cantidad;
    });
  });
  const productoEstrella = Object.keys(conteoProductos).reduce((a, b) => conteoProductos[a] > conteoProductos[b] ? a : b, "Ninguno");

  const estilos = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' },
    card: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '20px' },
    iconBox: { width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
    label: { margin: '0 0 5px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' },
    value: { margin: 0, fontSize: '28px', fontWeight: '900', color: '#1e293b' }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '5px' }}>Dashboard de Ventas</h1>
      <p style={{ color: '#64748b' }}>Resumen financiero de tus pedidos completados.</p>

      <div style={estilos.grid}>
        
        {/* TARJETA 1 */}
        <div style={estilos.card}>
          <div style={{ ...estilos.iconBox, background: '#10b981' }}><DollarSign size={30} /></div>
          <div>
            <p style={estilos.label}>Ingresos Totales</p>
            <p style={estilos.value}>${ingresosTotales.toLocaleString()}</p>
          </div>
        </div>

        {/* TARJETA 2 */}
        <div style={estilos.card}>
          <div style={{ ...estilos.iconBox, background: '#3b82f6' }}><ShoppingBag size={30} /></div>
          <div>
            <p style={estilos.label}>Ventas Cerradas</p>
            <p style={estilos.value}>{totalVentas}</p>
          </div>
        </div>

        {/* TARJETA 3 */}
        <div style={estilos.card}>
          <div style={{ ...estilos.iconBox, background: '#8b5cf6' }}><TrendingUp size={30} /></div>
          <div>
            <p style={estilos.label}>Ticket Promedio</p>
            <p style={estilos.value}>${ticketPromedio}</p>
          </div>
        </div>

        {/* TARJETA 4 */}
        <div style={estilos.card}>
          <div style={{ ...estilos.iconBox, background: '#f59e0b' }}><Award size={30} /></div>
          <div>
            <p style={estilos.label}>Producto Estrella</p>
            <p style={{ ...estilos.value, fontSize: '18px' }}>{productoEstrella}</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Ventas;