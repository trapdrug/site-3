import { useState } from 'react';
import { receive } from '../api';
import { fmtDate } from '../format';

export default function Shipments({ snapshot, shipmentsAll, onChange }: { snapshot: any; shipmentsAll: any[]; onChange: () => void }) {
  const [msg, setMsg] = useState('');
  const list = shipmentsAll.length ? shipmentsAll : (snapshot?.shipments_expected || []);
  const now = snapshot?.now;

  async function doReceive(id: string) {
    setMsg('');
    try {
      await receive(id);
      setMsg(`Поставка ${id} получена`);
      onChange();
    } catch (e: any) {
      setMsg(`Ошибка: ${e.message}${e.hint ? ' — ' + e.hint : ''}`);
    }
  }

  return (
    <div className="card">
      <h3>Поставки</h3>
      {msg && <div className="info">{msg}</div>}
      <table className="tbl">
        <thead><tr><th>ID</th><th>Поставщик</th><th>SKU</th><th>qty</th><th>expected_at</th><th>статус</th><th></th></tr></thead>
        <tbody>
          {list.map((s: any) => {
            const overdue = s.status === 'expected' && now && new Date(s.expected_at) < new Date(now);
            return (
              <tr key={s.shipment_id}>
                <td><b>{s.shipment_id}</b></td>
                <td>{s.supplier || '—'}</td>
                <td>{s.sku}</td>
                <td>{s.quantity}</td>
                <td>{fmtDate(s.expected_at)} {overdue && <span className="badge badge-red">просрочена</span>}</td>
                <td>{s.status}</td>
                <td>{s.status === 'expected' ? <button className="small" onClick={() => doReceive(s.shipment_id)}>Получить</button> : <span className="muted">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
