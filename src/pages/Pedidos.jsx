import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Clock, Truck, CheckCircle, Eye, X } from 'lucide-react';

function Pedidos({ refreshPedidos, notificacionesAdmin, setNotificacionesAdmin }) {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const imagenesPlaceholder = {
    'Producto de prueba': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    'Producto 2': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'
  };

  const obtenerPedidos = useCallback(async () => {
    const { data, error } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
    if (!error) setPedidos(data);
  }, []);

  useEffect(() => {
    obtenerPedidos();
    if (notificacionesAdmin > 0) {
      setNotificacionesAdmin(0);
    }
  }, [refreshPedidos, notificacionesAdmin, obtenerPedidos, setNotificacionesAdmin]);

  // ¡MAGIA DE INVENTARIO!: Actualizamos la función cambiarEstado
  async function cambiarEstado(id, nuevoEstado) {
    // 1. Cambiamos el estado del pedido en la base de datos
    const { error } = await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
    
    if (error) {
      return Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    } 
    
    // 2. Si el pedido se marca como "Entregado", descontamos el stock
    if (nuevoEstado === 'Entregado') {
      // Buscamos el pedido exacto en nuestra lista actual para ver qué compró
      const pedidoAfectado = pedidos.find(p => p.id === id);
      
      if (pedidoAfectado) {
        // Recorremos cada producto que compró el cliente
        for (const prod of pedidoAfectado.productos) {
          
          // A. Consultamos el stock real que hay en la base de datos en este momento
          const { data: productoBD } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', prod.id)
            .single();

          if (productoBD) {
            // B. Calculamos el nuevo stock (Stock actual - Cantidad comprada)
            // (Usamos Math.max para asegurarnos de que el stock nunca baje de 0 por error)
            const nuevoStock = Math.max(0, productoBD.stock - prod.cantidad);

            // C. Guardamos el nuevo stock en el Inventario
            await supabase
              .from('productos')
              .update({ stock: nuevoStock })
              .eq('id', prod.id);
          }
        }
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Venta Cerrada!',
        text: 'El pedido fue entregado y el inventario se ha actualizado automáticamente.',
        timer: 3000,
        showConfirmButton: false
      });
    } else {
      // Mensaje normal si solo lo pasamos a "Enviado"
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      Toast.fire({ icon: 'success', title: `Movido a ${nuevoEstado}` });
    }

    // 3. Recargamos la lista para ver los cambios
    obtenerPedidos();
  }

  const pendientes = pedidos.filter(p => p.estado === 'Pendiente');
  const enviados = pedidos.filter(p => p.estado === 'Enviado');
  const entregados = pedidos.filter(p => p.estado === 'Entregado');

  const estilos = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px', height: 'calc(100vh - 180px)', alignItems: 'start' },
    columna: { background: '#f1f5f9', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '100%', overflow: 'hidden' },
    colHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', padding: '15px', borderBottom: '2px solid #e2e8f0', background: '#f1f5f9', zIndex: 10 },
    listaTarjetas: { padding: '15px', overflowY: 'auto', flex: 1 },
    card: { background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '15px', borderLeft: '4px solid #cbd5e1', display: 'flex', flexDirection: 'column' },
    btn: { width: '100%', padding: '8px', marginTop: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: 'white' },
    btnSecondary: { width: '100%', padding: '8px', marginTop: '10px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    modalBox: { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
    productoFila: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: '1px solid #e2e8f0' },
    imgMini: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '5px' }}>Gestión de Pedidos</h1>
      <p style={{ color: '#64748b', marginBottom: 0 }}>Administra el flujo de trabajo de las compras de tus clientes.</p>

      <div style={estilos.grid}>
        {/* PENDIENTES */}
        <div style={estilos.columna}>
          <div style={{ ...estilos.colHeader, color: '#d97706', borderColor: '#fcd34d' }}>
            <Clock /> Pendientes ({pendientes.length})
          </div>
          <div style={estilos.listaTarjetas}>
            {pendientes.map(p => (
              <div key={p.id} style={{ ...estilos.card, borderLeftColor: '#f59e0b' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>#{p.id} - {new Date(p.created_at).toLocaleDateString()}</p>
                <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>{p.cliente_email}</p>
                <p style={{ fontWeight: 'bold', color: '#10b981', margin: '0 0 10px 0' }}>Total: ${p.total}</p>
                <button onClick={() => setPedidoSeleccionado(p)} style={estilos.btnSecondary}>
                  <Eye size={16} /> Ver Detalles
                </button>
                <button onClick={() => cambiarEstado(p.id, 'Enviado')} style={{ ...estilos.btn, background: '#3b82f6' }}>Mandar a Envío →</button>
              </div>
            ))}
          </div>
        </div>

        {/* ENVIADOS */}
        <div style={estilos.columna}>
          <div style={{ ...estilos.colHeader, color: '#2563eb', borderColor: '#bfdbfe' }}>
            <Truck /> En Camino ({enviados.length})
          </div>
          <div style={estilos.listaTarjetas}>
            {enviados.map(p => (
              <div key={p.id} style={{ ...estilos.card, borderLeftColor: '#3b82f6' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>#{p.id}</p>
                <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>{p.cliente_email}</p>
                <p style={{ fontWeight: 'bold', color: '#10b981', margin: '0 0 10px 0' }}>Total: ${p.total}</p>
                <button onClick={() => setPedidoSeleccionado(p)} style={estilos.btnSecondary}>
                  <Eye size={16} /> Ver Detalles
                </button>
                <button onClick={() => cambiarEstado(p.id, 'Entregado')} style={{ ...estilos.btn, background: '#10b981' }}>Marcar Entregado ✓</button>
              </div>
            ))}
          </div>
        </div>

        {/* ENTREGADOS */}
        <div style={estilos.columna}>
          <div style={{ ...estilos.colHeader, color: '#059669', borderColor: '#a7f3d0' }}>
            <CheckCircle /> Entregados ({entregados.length})
          </div>
          <div style={estilos.listaTarjetas}>
            {entregados.map(p => (
              <div key={p.id} style={{ ...estilos.card, borderLeftColor: '#10b981', opacity: 0.8 }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>#{p.id}</p>
                <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{p.cliente_email}</p>
                <p style={{ fontWeight: 'bold', color: '#10b981', margin: '0 0 10px 0' }}>Cobrado: ${p.total}</p>
                <button onClick={() => setPedidoSeleccionado(p)} style={estilos.btnSecondary}>
                  <Eye size={16} /> Ver Detalles
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL EMERGENTE */}
      {pedidoSeleccionado && (
        <div style={estilos.overlay} onClick={() => setPedidoSeleccionado(null)}>
          <div style={estilos.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>Pedido #{pedidoSeleccionado.id}</h2>
                <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>{pedidoSeleccionado.cliente_email}</p>
              </div>
              <button onClick={() => setPedidoSeleccionado(null)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#475569', marginBottom: '10px' }}>Artículos Comprados:</h3>
              {pedidoSeleccionado.productos.map((prod, i) => (
                <div key={i} style={estilos.productoFila}>
                  <img src={imagenesPlaceholder[prod.nombre] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'} alt={prod.nombre} style={estilos.imgMini} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{prod.nombre}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{prod.cantidad} x ${prod.precio}</p>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '16px' }}>${prod.cantidad * prod.precio}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#475569' }}>TOTAL A COBRAR</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>${pedidoSeleccionado.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pedidos;