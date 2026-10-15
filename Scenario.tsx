import { useState } from 'react';
import { delayScenario } from '../api';
import { fmtDate } from '../format';

export default function Scenario({ snapshot }: { snapshot: any }) {
  const expected = snapshot?.shipments_expected || [];
  const [shipId, setShipId] = useState('IN-AIR-01');
  const [newDate, setNewDate] = useState('2026-11-05T10:00');
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState('');

  async function check(sid?: string, ndt?: string) {
    const id = sid || shipId;
    const local = ndt || newDate;
    setErr('');
    try {
      const iso = local.includes('+') || local.endsWith('Z') ? local : `${local}:00+03:00`;
      const r = await delayScenario(id, iso);
      setRes(r);
    } catch (e: any) {
      setErr(e.message + (e.hint ? ' — ' + e.hint : ''));
    }
  }

  function preset() {
    setShipId('IN-AIR-01');
    setNewDate('2026-11-05T10:00');
    check('IN-AIR-01', '2026-11-05T10:00');
  }

  const byId = (arr: any[], id: string) => arr.find((x) => x.order_id === id);
  const threatSet = new Set(res?.threatened || []);

  return (
    <div>
      <div className="card">
        <h3>Лаборатория задержки (сценарий на копии)</h3>
        <div className="toolbar">
          <label>Поставка:
            <select value={shipId} onChange={(e) => setShipId(e.target.value)}>
              {expected.map((s: any) => (
                <option key={s.shipment_id} value={s.shipment_id}>{s.shipment_id} ({s.sku} ×{s.quantity}, {fmtDate(s.expected_at)})</option>
              ))}
            </select>
          </label>
          <label>Новая дата (МСК):
            <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </label>
          <button onClick={() => check()}>Проверить задержку</button>
          <button className="ghost" onClick={preset}>IN-AIR-01 → 05.11 10:00</button>
        </div>
        <div className="muted">Расчёт на копии, склад не изменён. Эталон: IN-AIR-01 → 05.11 10:00 даёт ORD-003/005 в риске.</div>
        {err && <div className="error">{err}</div>}
      </div>

      {res && (
        <div className="two-col">
          <div className="card">
            <h3>Было</h3>
            <table className="tbl">
              <thead><tr><th>Заказ</th><th>готовность</th><th>риск</th></tr></thead>
              <tbody>
                {res.before.map((b: any) => (
                  <tr key={b.order_id}>
                    <td>{b.order_id}</td>
                    <td>{b.readiness ? fmtDate(b.readiness) : 'неизвестно'}</td>
                    <td>{b.atRisk ? <span className="badge badge-red">риск</span> : <span className="badge badge-green">ок</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Стало</h3>
            <table className="tbl">
              <thead><tr><th>Заказ</th><th>готовность</th><th>риск</th></tr></thead>
              <tbody>
                {res.after.map((a: any) => (
                  <tr key={a.order_id} className={threatSet.has(a.order_id) ? 'row-risk' : ''}>
                    <td><b>{a.order_id}</b>{threatSet.has(a.order_id) && <span className="badge badge-red">угроза</span>}</td>
                    <td>{a.readiness ? fmtDate(a.readiness) : 'неизвестно'}</td>
                    <td>{a.atRisk ? <span className="badge badge-red">риск</span> : <span className="badge badge-green">ок</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {res && (
        <div className="card">
          <h4>Угрозы: {res.threatened.length ? res.threatened.join(', ') : 'нет'}</h4>
          <div>{res.explanation}</div>
          {res.threatened.map((id: string) => {
            const b = byId(res.before, id);
            const a = byId(res.after, id);
            return <div key={id} className="error">{id}: было {b?.readiness ? fmtDate(b.readiness) : '—'} → стало {a?.readiness ? fmtDate(a.readiness) : 'неизвестно'}</div>;
          })}
          <div className="muted">Перезагрузите страницу — цифры склада прежние (база не меняется).</div>
        </div>
      )}
    </div>
  );
}
