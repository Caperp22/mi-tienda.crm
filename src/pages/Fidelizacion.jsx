import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { Gift, Star, Settings, Users, Plus, Minus } from 'lucide-react';

function Fidelizacion({ empresaId, dark = false, color = '#3b82f6' }) {
  const [config,   setConfig]   = useState({ puntos_por_compra: 10, valor_punto: 100, minimo_canje: 50 });
  const [ranking,  setRanking]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando,setGuardando]= useState(false);

  const t = {
    card:   dark ? 'rgba(255,255,255,0.04)' : 'white',
    border: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    borderL:dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    text:   dark ? '#f0f4ff'                : '#0f172a',
    sub:    dark ? '#94a3b8'                : '#64748b',
    input:  dark ? 'rgba(255,255,255,0.06)' : 'white',
    inputB: dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
    inputT: dark ? '#e2e8f0'                : '#1e293b',
    th:     dark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    row:    dark ? 'rgba(255,255,255,0.02)' : '#fafafa',
  };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${t.inputB}`, background: t.input, color: t.inputT, fontSize: '13.5px', boxSizing: 'border-box', outline: 'none' };

  useEffect(() => {
    async function cargar() {
      // Config del programa
      const { data: cfg } = await supabase.from('fidelizacion_config').select('*').eq('empresa_id', empresaId).maybeSingle();
      if (cfg) setConfig(cfg);

      // Clientes con puntos
      const { data: pts } = await supabase.from('puntos_fidelizacion')
        .select('*, clientes(nombre, correo)')
        .eq('empresa_id', empresaId)
        .order('puntos', { ascending: false })
        .limit(20);
      setRanking(pts || []);
      setCargando(false);
    }
    cargar();
  }, [empresaId]);

  async function guardarConfig(e) {
    e.preventDefault();
    setGuardando(true);
    const { error } = await supabase.from('fidelizacion_config').upsert({ ...config, empresa_id: empresaId }, { onConflict: 'empresa_id' });
    setGuardando(false);
    if (error) return Swal.fire('Error', error.message, 'error');
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Configuración guardada', showConfirmButton: false, timer: 1500 });
  }

  async function ajustarPuntos(clienteId, delta) {
    const item = ranking.find(r => r.cliente_id === clienteId);
    const nuevos = Math.max(0, (item?.puntos || 0) + delta);
    if (item) {
      await supabase.from('puntos_fidelizacion').update({ puntos: nuevos }).eq('id', item.id);
    } else {
      await supabase.from('puntos_fidelizacion').insert([{ empresa_id: empresaId, cliente_id: clienteId, puntos: Math.max(0, delta) }]);
    }
    const { data: pts } = await supabase.from('puntos_fidelizacion').select('*, clientes(nombre, correo)').eq('empresa_id', empresaId).order('puntos', { ascending: false }).limit(20);
    setRanking(pts || []);
  }

  const totalPuntos = ranking.reduce((s, r) => s + r.puntos, 0);

  if (cargando) return <p style={{ color: t.sub }}>Cargando programa de fidelización...</p>;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: t.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gift size={20} color={color} /> Fidelización
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: t.sub }}>Programa de puntos y recompensas para tus clientes frecuentes.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>

        {/* Configuración */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: t.text, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Settings size={14} color={color} /> Configuración
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: t.sub }}>Define cómo se acumulan y canjean los puntos.</p>

          <form onSubmit={guardarConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Puntos por cada $1.000 de compra</label>
              <input style={inp} type="number" min="1" value={config.puntos_por_compra} onChange={e => setConfig({ ...config, puntos_por_compra: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Valor de 1 punto en pesos ($)</label>
              <input style={inp} type="number" min="1" value={config.valor_punto} onChange={e => setConfig({ ...config, valor_punto: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: t.sub, display: 'block', marginBottom: '5px' }}>Mínimo puntos para canjear</label>
              <input style={inp} type="number" min="1" value={config.minimo_canje} onChange={e => setConfig({ ...config, minimo_canje: Number(e.target.value) })} />
            </div>
            <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '9px', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: t.sub }}>
                Con esta configuración: una compra de <strong style={{ color: t.text }}>$10.000</strong> = <strong style={{ color }}>{config.puntos_por_compra * 10} pts</strong> ≈ <strong style={{ color }}>${(config.puntos_por_compra * 10 * config.valor_punto).toLocaleString('es-CO')}</strong> de descuento
              </p>
            </div>
            <button type="submit" disabled={guardando} style={{ padding: '11px', border: 'none', borderRadius: '9px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 12px ${color}33` }}>
              {guardando ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </form>

          {/* Resumen */}
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '9px', padding: '12px', textAlign: 'center', border: `1px solid ${t.border}` }}>
              <p style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: '800', color }}>{ranking.length}</p>
              <p style={{ margin: 0, fontSize: '11px', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Users size={10} /> Clientes</p>
            </div>
            <div style={{ background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '9px', padding: '12px', textAlign: 'center', border: `1px solid ${t.border}` }}>
              <p style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: '800', color }}>{totalPuntos.toLocaleString()}</p>
              <p style={{ margin: 0, fontSize: '11px', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Star size={10} /> Puntos totales</p>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: t.text }}>Ranking de clientes</h2>
          {ranking.length === 0 ? (
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
              <Gift size={32} color={t.sub} style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, color: t.sub, fontSize: '13px' }}>Aún no hay puntos acumulados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ranking.map((r, i) => (
                <div key={r.id} style={{ background: t.card, border: `1px solid ${i === 0 ? `${color}40` : t.border}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? `${color}22` : dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: '800', fontSize: '13px', color: i < 3 ? color : t.sub }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 1px', fontWeight: '600', fontSize: '13px', color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.clientes?.nombre || r.clientes?.correo || 'Cliente'}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: t.sub }}>{r.clientes?.correo}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => ajustarPuntos(r.cliente_id, -10)} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: `1px solid ${t.border}`, width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub }}>
                      <Minus size={12} />
                    </button>
                    <div style={{ textAlign: 'center', minWidth: '50px' }}>
                      <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color }}>{r.puntos}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: t.sub }}>pts</p>
                    </div>
                    <button onClick={() => ajustarPuntos(r.cliente_id, 10)} style={{ background: `${color}18`, border: `1px solid ${color}40`, width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Fidelizacion;
