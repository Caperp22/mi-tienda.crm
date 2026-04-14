import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { ShoppingCart, Sun, Moon, X, ShoppingBag, Plus, Minus, Bell, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Tienda({ usuario, esTemaOscuro, setEsTemaOscuro, cerrarSesion, notificaciones, setNotificaciones, empresaId, empresaNombre, empresaConfig }) {
  const navigate = useNavigate();
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [productos, setProductos] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem('miCarrito');
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  });

  useEffect(() => {
    localStorage.setItem('miCarrito', JSON.stringify(carrito));
  }, [carrito]);

  const miNumeroWhatsApp = "521234567890"; 
  const imgFallback = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80';

  useEffect(() => {
    async function obtenerProductos() {
      if (!empresaId) return; // Si no hay empresa seleccionada, no traemos nada
      const { data, error } = await supabase.from('productos').select('*').eq('empresa_id', empresaId).gt('stock', 0);
      if (!error) setProductos(data);
    }
    obtenerProductos();
  }, [empresaId]);

  function agregarAlCarrito(producto) {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      if (existe.cantidad >= producto.stock) {
        return Swal.fire('Aviso', 'No hay más stock disponible', 'warning');
      }
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    const Toast = Swal.mixin({ toast: true, position: 'top', showConfirmButton: false, timer: 1500 });
    Toast.fire({ icon: 'success', title: 'Agregado al carrito' });
  }

  function quitarDelCarrito(id) { setCarrito(carrito.filter(item => item.id !== id)); }

  function actualizarCantidad(id, nuevaCantidad, stock) {
    if (nuevaCantidad < 1) return; 
    if (nuevaCantidad > stock) return Swal.fire('Aviso', 'Límite de stock', 'warning');
    setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: nuevaCantidad } : item));
  }

  async function confirmarPedido() {
      if (carrito.length === 0) return Swal.fire('Carrito vacío', 'Agrega productos', 'info');
      
      // Validar que el usuario tenga sus datos de perfil llenos antes de comprar
      const nombre = usuario?.user_metadata?.nombre;
      const telefono = usuario?.user_metadata?.telefono;
      const direccion = usuario?.user_metadata?.direccion;

      if (!nombre || !telefono || !direccion) {
        Swal.fire({
          title: 'Faltan datos de envío',
          text: 'Por favor completa tu perfil (Nombre, Teléfono y Dirección) antes de realizar un pedido.',
          icon: 'warning',
          confirmButtonText: 'Ir a Mi Perfil'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/mi-perfil');
          }
        });
        return;
      }

      const totalCalculado = carrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);

      const { error } = await supabase.from('pedidos').insert([{
        cliente_email: usuario.email, 
        productos: carrito, 
        total: totalCalculado, 
        estado: 'Pendiente',
        empresa_id: empresaId
      }]);

      if (error) return Swal.fire('Error', 'Hubo un problema', 'error');

      // Armamos el mensaje de WhatsApp súper completo
      let textoMensaje = "🛍️ *¡Nuevo Pedido Confirmado!*\n\n";
      carrito.forEach(item => { textoMensaje += `▪️ ${item.cantidad}x ${item.nombre}\n`; });
      
      textoMensaje += `\n💰 *Total: $${totalCalculado}*\n`;
      textoMensaje += `--------------------------\n`;
      textoMensaje += `👤 *Cliente:* ${nombre} (${usuario.email})\n`;
      textoMensaje += `📞 *Teléfono:* ${telefono}\n`;
      textoMensaje += `📍 *Dirección de Envío:* ${direccion}`;

      setCarrito([]);
      setMostrarCarrito(false);
      Swal.fire({ icon: 'success', title: '¡Pedido Registrado!', timer: 2000, showConfirmButton: false });
      
      setTimeout(() => { 
        window.open(`https://wa.me/${miNumeroWhatsApp}?text=${encodeURIComponent(textoMensaje)}`, '_blank'); 
      }, 2000);
    }

  const totalCarrito = carrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
  const totalArticulos = carrito.reduce((suma, item) => suma + item.cantidad, 0);

  const estilos = {
    container: { minHeight: '100vh', color: esTemaOscuro ? '#f8fafc' : '#0f172a', transition: 'color 0.3s', overflowX: 'hidden' },
    navbar: { background: esTemaOscuro ? '#1e293b' : '#ffffff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#e5e7eb'}`, position: 'sticky', top: 0, zIndex: 100, transition: 'background-color 0.3s, border-color 0.3s' },
    navLinks: { color: esTemaOscuro ? '#e2e8f0' : '#4b5563', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' },
    heroSection: { padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#e2e8f0'}`, marginBottom: '30px' },
    heroTitle: { fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px 0' },
    heroSubtitle: { fontSize: '1.1rem', color: esTemaOscuro ? '#94a3b8' : '#64748b', margin: 0 },
    badge: { position: 'absolute', top: '-8px', right: '-8px', background: empresaConfig?.color_principal || '#ef4444', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },
    badgeNotif: { position: 'absolute', top: '-6px', right: '-6px', background: empresaConfig?.color_principal || '#3b82f6', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px', padding: '0 20px 60px 20px', maxWidth: '1200px', margin: '0 auto' },
    card: { background: esTemaOscuro ? '#1e293b' : '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: esTemaOscuro ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.05)', border: `1px solid ${esTemaOscuro ? '#334155' : '#f1f5f9'}`, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease' },
    productImage: { width: '100%', height: '240px', objectFit: 'cover' },
    cardContent: { padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 },
    productTitle: { margin: '0 0 5px 0', fontSize: '1.25rem', fontWeight: '700' },
    productDesc: { fontSize: '0.9rem', color: esTemaOscuro ? '#94a3b8' : '#64748b', marginBottom: '15px', lineHeight: '1.5' },
    productPrice: { fontSize: '1.5rem', fontWeight: '800', color: empresaConfig?.color_principal || '#10b981', margin: '0 0 8px 0' },
    btnPrimary: { width: '100%', padding: '14px', background: empresaConfig?.color_principal || '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 200, opacity: mostrarCarrito ? 1 : 0, visibility: mostrarCarrito ? 'visible' : 'hidden', transition: 'all 0.3s ease-in-out' },
    drawer: { position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '420px', height: '100vh', background: esTemaOscuro ? '#0f172a' : '#ffffff', zIndex: 201, transform: mostrarCarrito ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease-in-out', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', padding: '30px', boxSizing: 'border-box' },
    qtySelector: { display: 'flex', alignItems: 'center', background: esTemaOscuro ? '#1e293b' : '#f1f5f9', borderRadius: '8px', border: `1px solid ${esTemaOscuro ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' },
    qtyBtn: { background: 'none', border: 'none', padding: '6px 10px', color: esTemaOscuro ? '#f8fafc' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    qtyText: { fontWeight: '700', minWidth: '24px', textAlign: 'center', fontSize: '1rem' }
  };

  return (
    <div style={estilos.container}>
      <nav style={estilos.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {empresaConfig?.logo_url ? (
            <img src={empresaConfig.logo_url} alt={empresaNombre} style={{ height: '40px', objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{empresaNombre}</div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          {/* Renders Condicionales según el tipo de empresa */}
          {empresaConfig?.usa_inventario && (
            <>
              <Link to="/" style={{...estilos.navLinks, color: empresaConfig?.color_principal || '#3b82f6', fontWeight: 'bold'}}>Catálogo</Link>
              <Link to="/mis-pedidos" style={estilos.navLinks}>Mis Pedidos</Link>
            </>
          )}
          {empresaConfig?.usa_citas && (
            <>
              <Link to="/agendar" style={estilos.navLinks}>Agendar Cita</Link>
              <Link to="/mis-citas" style={estilos.navLinks}>Mis Citas</Link>
            </>
          )}
          
          <div style={{ borderLeft: `1px solid ${esTemaOscuro ? '#475569' : '#e5e7eb'}`, height: '24px', margin: '0 5px' }}></div>
          
          <button onClick={() => setEsTemaOscuro(!esTemaOscuro)} style={{ background: 'none', border: 'none', color: estilos.navLinks.color, cursor: 'pointer', padding: 0 }}>
            {esTemaOscuro ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          
          {/* --- INICIO DROPDOWN DE NOTIFICACIONES --- */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setMostrarNotif(!mostrarNotif)} style={{ background: 'none', border: 'none', color: estilos.navLinks.color, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <Bell size={22} />
              {Array.isArray(notificaciones) && notificaciones.length > 0 && (
                <span style={estilos.badgeNotif}>{notificaciones.length}</span>
              )}
            </button>

            {mostrarNotif && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 998 }} onClick={() => setMostrarNotif(false)}></div>
                
                <div style={{ position: 'absolute', top: '35px', right: '-10px', width: '320px', background: esTemaOscuro ? '#1e293b' : 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', border: `1px solid ${esTemaOscuro ? '#334155' : '#e2e8f0'}`, zIndex: 999, overflow: 'hidden' }}>
                  <div style={{ padding: '15px', fontWeight: 'bold', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#f1f5f9'}`, color: esTemaOscuro ? '#f8fafc' : '#0f172a' }}>
                    Notificaciones ({Array.isArray(notificaciones) ? notificaciones.length : 0})
                  </div>
                  
                  {!Array.isArray(notificaciones) || notificaciones.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No hay nada nuevo por aquí.</div>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notificaciones.map(n => (
                        <div key={n.id} onClick={() => {
                            navigate(n.ruta); 
                            setNotificaciones(notificaciones.filter(x => x.id !== n.id)); 
                            setMostrarNotif(false); 
                        }} style={{ padding: '15px', borderBottom: `1px solid ${esTemaOscuro ? '#334155' : '#f1f5f9'}`, cursor: 'pointer', fontSize: '13px', color: esTemaOscuro ? '#cbd5e1' : '#475569', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = esTemaOscuro ? '#334155' : '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ fontWeight: 'bold', color: n.ruta === '/mis-citas' ? '#4f46e5' : '#10b981', marginBottom: '4px' }}>
                              {n.ruta === '/mis-citas' ? '📅 Actualización de Cita' : '🛍️ Actualización de Pedido'}
                            </div>
                            <div>{n.texto}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {/* --- FIN DROPDOWN DE NOTIFICACIONES --- */}
          
          <div style={{ position: 'relative', cursor: 'pointer', color: estilos.navLinks.color }} onClick={() => setMostrarCarrito(true)}>
            <ShoppingCart size={22} />
            {totalArticulos > 0 && <span style={estilos.badge}>{totalArticulos}</span>}
          </div>
          
          <div style={{ borderLeft: `1px solid ${esTemaOscuro ? '#475569' : '#e5e7eb'}`, height: '24px', margin: '0 5px' }}></div>
          
          {/* --- NUEVO BOTÓN DE PERFIL AQUÍ --- */}
          <Link to="/mi-perfil" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
            <User size={18} /><span>{usuario?.user_metadata?.nombre || 'Mi Perfil'}</span>
          </Link>
          
          <button onClick={cerrarSesion} style={{ padding: '8px 16px', background: esTemaOscuro ? '#334155' : '#f3f4f6', color: estilos.navLinks.color, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', marginLeft: '5px' }}>Salir</button>
        </div>
      </nav>

      <section style={estilos.heroSection}>
        <h1 style={estilos.heroTitle}>Nuestra Colección</h1>
        <p style={estilos.heroSubtitle}>Encuentra tus productos favoritos al mejor precio.</p>
      </section>

      <div style={estilos.overlay} onClick={() => setMostrarCarrito(false)}></div>
      <div style={estilos.drawer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Tu Orden</h2>
          <button onClick={() => setMostrarCarrito(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: esTemaOscuro ? '#f8fafc' : '#0f172a' }}><X size={24} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '80px', color: '#94a3b8' }}>
              <ShoppingBag size={64} style={{ marginBottom: '16px', opacity: 0.3, margin: '0 auto' }} />
              <p style={{ fontSize: '1.1rem' }}>Tu carrito está vacío.</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: `1px solid ${esTemaOscuro ? '#1e293b' : '#f1f5f9'}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', margin: '0 0 10px 0', fontSize: '1.1rem' }}>{item.nombre}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={estilos.qtySelector}>
                      <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1, item.stock)} style={estilos.qtyBtn}><Minus size={14} /></button>
                      <span style={estilos.qtyText}>{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1, item.stock)} style={estilos.qtyBtn}><Plus size={14} /></button>
                    </div>
                    <p style={{ fontSize: '1rem', margin: 0, color: esTemaOscuro ? '#34d399' : '#10b981', fontWeight: 'bold' }}>${item.precio * item.cantidad}</p>
                  </div>
                </div>
                <button onClick={() => quitarDelCarrito(item.id)} style={{ background: esTemaOscuro ? '#334155' : '#fee2e2', color: esTemaOscuro ? '#f8fafc' : '#ef4444', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: '600', marginLeft: '15px' }}>Quitar</button>
              </div>
            ))
          )}
        </div>

        {carrito.length > 0 && (
          <div style={{ borderTop: `2px solid ${esTemaOscuro ? '#1e293b' : '#f1f5f9'}`, paddingTop: '30px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '800', marginBottom: '24px' }}>
              <span>Total:</span>
              <span style={{ color: empresaConfig?.color_principal || '#10b981' }}>${totalCarrito}</span>
            </div>
            <button onClick={confirmarPedido} style={{ ...estilos.btnPrimary, background: empresaConfig?.color_principal || '#10b981', padding: '16px', fontSize: '1.1rem' }}>Confirmar Pedido</button>
          </div>
        )}
      </div>

      <main style={estilos.grid}>
        {productos.map(p => (
          <div key={p.id} style={estilos.card} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <img src={p.imagen || imgFallback} style={estilos.productImage} alt={p.nombre} />
            <div style={estilos.cardContent}>
              <h3 style={estilos.productTitle}>{p.nombre}</h3>
              <p style={estilos.productDesc}>{p.descripcion || 'Sin descripción disponible.'}</p>
              <p style={estilos.productPrice}>${p.precio}</p>
              <p style={{ fontSize: '0.875rem', color: esTemaOscuro ? '#94a3b8' : '#64748b', marginBottom: '20px' }}>Stock disponible: {p.stock}</p>
              <button onClick={() => agregarAlCarrito(p)} style={estilos.btnPrimary}><ShoppingCart size={18} /> Agregar al carrito</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default Tienda;