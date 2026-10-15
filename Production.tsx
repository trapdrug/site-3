import { useEffect, useState } from 'react';
import { prodStatus, prodPlan, prodStart } from '../api';
import { fmtDate } from '../format';

export default function Production() {
  const [status, setStatus] = useState<any>(null);
  const [sku, setSku] = useState('FG-PLUS');
  const [qty, setQty] = useState(8);
  const [start, setStart] = useState('2026-11-02T09:00');
  const [plan, setPlan] = useState<any>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    try { setStatus(await prodStatus()); }
    catch (e: any) { setMsg('Ошибка статуса: ' + e.message); }
  }
  useEffect(() => { load(); }, []);

  async function doPlan() {
    setMsg('');
    try {
      const sf = start.includes('+') || start.endsWith('Z') ? start : `${start}:00+03:00`;
      const r = await prodPlan(sku, Number(qty), sf);
      setPlan(r);
    } catch (e: any) {
      setMsg(`Ошибка: ${e.message}${e.hint ? ' — ' + e.hint : ''}`);
    }
  }

  async function doStart() {
    setMsg('');
    try {
      const r = await prodStart(sku, Number(qty));
      setPlan(r);
      setMsg('Партия запущена (компоненты списаны)');
      load();
    } catch (e: any) {
      setMsg(`Ошибка: ${e.message}${e.hint ? ' — ' + e.hint : ''}`);
    }
  }

  function preset8plus() {
    setSku('FG-PLUS'); setQty(8); setStart('2026-11-02T09:00');
    setTimeout(() => {}, 0);
  }

  // Gantt: шкала 02–06.11, полоски div
  function Gantt({ timeline }: { timeline: any[] }) {
    if (!timeline?.length) return <div className="muted">Нет таймлайна</div>;
    const t0 = new Date('2026-11-02T09:00:00+03:00').getTime();
    const t1 = new Date('2026-11-06T17:00:00+03:00').getTime();
    const span = t1 - t0;
    const left = (iso: string) => `${Math.max(0, ((new Date(iso).getTime() - t0) / span) * 100)}%`;
    const width = (a: string, b: string) => `${Math.max(0.5, ((new Date(b).getTime() - new Date(a).getTime()) / span) * 100)}%`;
    return (
      <div className="gantt">
        <div className="gantt-scale"><span>02.11 09:00</span><span>04.11</span><span>06.11 17:00</span></div>
        {timeline.slice(0, 30).map((u: any) => (
          <div key={u.unit} className="gantt-row">
            <span className="gantt-label">#{u.unit}</span>
            <div className="gantt-track">
              <div className="g-asm" title={`Сборка ${fmtDate(u.assembly_start)}–${fmtDate(u.assembly_end)}`} style={{ left: left(u.assembly_start), width: width(u.assembly_start, u.assembly_end) }} />
              <div className="g-tst" title={`Тест ${fmtDate(u.test_start)}–${fmtDate(u.test_end)}`} style={{ left: left(u.test_start), width: width(u.test_start, u.test_end) }} />
            </div>
          </div>
        ))}
        {timeline.length > 30 && <div className="muted">… показано 30 из {timeline.length}</div>}
        <div className="muted"><span className="legend-asm">■</span> сборка <span className="legend-tst">■</span> тест (переносы за 17:00 → 09:00 след. дня)</div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h3>Производство — компоненты</h3>
        {status ? (
          <>
            <table className="tbl">
              <thead><tr><th>SKU</th><th>Название</th><th>остаток</th></tr></thead>
              <tbody>
                {status.component_stock.map((c: any) => (
                  <tr key={c.sku} className={c.on_hand === 0 || (c.sku === 'CMP-CO2' && c.on_hand < 8) ? 'row-risk' : ''}>
                    <td><b>{c.sku}</b></td><td>{c.name}</td>
                    <td>{c.on_hand} {c.sku === 'CMP-CO2' && c.on_hand < 8 && <span className="badge badge-red">нехватка CO2</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="two-col">
              <div>
                <h4>BOM</h4>
                <pre>{JSON.stringify(status.bom, null, 2)}</pre>
              </div>
              <div>
                <h4>Входящие компоненты</h4>
                <ul>
                  {(status.incoming || []).map((s: any) => (
                    <li key={s.shipment_id}>{s.shipment_id}: {s.sku} ×{s.quantity} — {fmtDate(s.expected_at)} ({s.status})</li>
                  ))}
                </ul>
                {status.active_batch && <div className="info">Активная партия: {JSON.stringify(status.active_batch)}</div>}
              </div>
            </div>
          </>
        ) : <div>Загрузка…</div>}
      </div>

      <div className="card">
        <h3>План партии</h3>
        <div className="toolbar">
          <label>SKU:
            <select value={sku} onChange={(e) => setSku(e.target.value)}>
              <option value="FG-PLUS">FG-PLUS</option>
              <option value="FG-AIR">FG-AIR</option>
            </select>
          </label>
          <label>Кол-во:<input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: 80 }} /></label>
          <label>Старт:<input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <button onClick={doPlan}>Спланировать</button>
          <button className="ghost" onClick={preset8plus}>8 Plus к 03.11 (проверка CO2)</button>
          <button onClick={doStart}>Запустить партию</button>
        </div>
        {msg && <div className="info">{msg}</div>}
        {plan && (
          <div>
            <div><b>{plan.feasible ? 'Выполнимо' : 'Невозможно'}</b> {plan.out_of_horizon && <span className="badge badge-red">вне горизонта 02–06.11</span>}</div>
            <div>{plan.explanation}</div>
            {plan.shortage?.length > 0 && (
              <table className="tbl">
                <thead><tr><th>Компонент</th><th>нужно</th><th>есть</th><th>дефицит</th></tr></thead>
                <tbody>
                  {plan.shortage.map((s: any) => (
                    <tr key={s.sku}><td>{s.sku}</td><td>{s.need}</td><td>{s.have}</td><td className="red">{s.deficit}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {plan.batch_ready_at && <div>Готовность партии: <b>{fmtDate(plan.batch_ready_at)}</b></div>}
            {plan.timeline?.length > 0 && <Gantt timeline={plan.timeline} />}
          </div>
        )}
      </div>
    </div>
  );
}
