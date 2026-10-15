import { useState } from 'react';
import { createOrder, reserve, ship, orders as fetchOrders } from '../api';
import { fmtDate } from '../format';
import { RiskBadge, StatusBadge } from '../components/Badges';

export default function Orders({ snapshot, onChange }: { snapshot: any; onChange: () => void }) {
  const [skuFilter, setSkuFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [showClosed, setShowClosed] = useState(false);
  const [closed, setClosed] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ customer: '', sku: 'FG-AIR', quantity: 5, due_at: '2026-11-03T17:00' });

  if (!snapshot) return <div className="card">Загрузка…</div>;
  let list: any[] = snapshot.orders_active || [];
  if (skuFilter !== 'all') list = list.filter((o) => o.sku === skuFilter);
  if (riskFilter === 'risk') list = list.filter((o) => o.atRisk);
  if (riskFilter === 'ok') list = list.filter((o) => !o.atRisk);
  if (riskFilter === 'short') list = list.filter((o) => (o.shortage || 0) > 0);

  async function loadClosed() {
    try {
      const all = await fetchOrders('all');
      setClosed(all.filter((o: any) => o.status !== 'active'));
    } catch (e: any) {
      setMsg('Не удалось загрузить закрытые: ' + e.message);
    }
  }

  async function doReserve(id: string) {
    const v = prompt(`Резерв для ${id}: сколько?`, '1');
    if (v === null) return;
    const qty = Number(v);
    setMsg('');
    try {
      await reserve(id, qty);
      setMsg(`Резерв ${qty} для ${id} — ок`);
      onChange();
    } catch (e: any) {
      setMsg(`Ошибка: ${e.message}${e.hint ? ' — ' + e.hint : ''}`);
    }
  }

  async function doShip(id: string) {
    const v = prompt(`Отгрузка для ${id}: сколько?`, '1');
    if (v === null) return;
    const qty = Number(v);
    setMsg('');
    try {
      await ship(id, qty);
      setMsg(`Отгружено ${qty} для ${id}`);
      onChange();
    } catch (e: any) {
      setMsg(`Ошибка: ${e.message}${e.hint ? ' — ' + e.hint : ''}`);
    }
  }

  async function doCreate() {
    setMsg('');
    try {
      const due_at = form.due_at.includes('+') || form.due_at.endsWith('Z') ? form.due_at : `${form.due_at}:00+03:00`;
      await createOrder({ customer: form.customer || 'Новый клиент', sku: form.sku, quantity: Number(form.quantity), due_at });
      setShowNew(false);
      setMsg('Заказ создан');
      onChange();
    } catch (e: any) {
      setMsg(`Ошибка: ${e.message}${e.hint ? ' — ' + e.hint : ''}`);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <label>SKU:
          <select value={skuFilter} onChange={(e) => setSkuFilter(e.target.value)}>
            <option value="all">все</option>
            <option value="FG-AIR">FG-AIR</option>
            <option value="FG-PLUS">FG-PLUS</option>
          </select>
        </label>
        <label>Риск:
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="all">все</option>
            <option value="risk">в риске</option>
            <option value="ok">в срок</option>
            <option value="short">с нехваткой</option>
          </select>
        </label>
        <button onClick={() => setShowNew(true)}>+ заказ</button>
        <label className="muted">
          <input type="checkbox" checked={showClosed} onChange={(e) => { setShowClosed(e.target.checked); if (e.target.checked) loadClosed(); }} />
          показать shipped/cancelled
        </label>
      </div>

      {msg && <div className="info">{msg}</div>}

      {showNew && (
        <div className="card">
          <h3>Новый заказ</h3>
          <div className="form-grid">
            <label>Клиент<input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Новый клиент" /></label>
            <label>SKU
              <select value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}>
                <option value="FG-AIR">FG-AIR (Air)</option>
                <option value="FG-PLUS">FG-PLUS (Air Plus)</option>
              </select>
            </label>
            <label>Кол-во<input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></label>
            <label>Срок (МСК)<input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></label>
          </div>
          <div className="toolbar">
            <button onClick={doCreate}>Создать</button>
            <button className="ghost" onClick={() => setShowNew(false)}>Отмена</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Активные заказы ({list.length})</h3>
        <table className="tbl">
          <thead>
            <tr><th>ID</th><th>Клиент</th><th>SKU</th><th>qty</th><th>reserved</th><th>shipped</th><th>осталось</th><th>готовность</th><th>риск</th><th>действия</th></tr>
          </thead>
          <tbody>
            {list.map((o: any) => (
              <tr key={o.order_id} className={o.atRisk ? 'row-risk' : ''}>
                <td><b>{o.order_id}</b></td>
                <td>{o.customer}</td>
                <td>{o.sku}</td>
                <td>{o.quantity}</td>
                <td>{o.reserved_qty}</td>
                <td>{o.shipped_qty}</td>
                <td>{o.remaining}</td>
                <td>{o.readiness ? fmtDate(o.readiness) : <span className="badge badge-red">неизвестно — не хватает {o.shortage}</span>}</td>
                <td><RiskBadge atRisk={o.atRisk} shortage={o.shortage} /></td>
                <td>
                  <button className="small" onClick={() => doReserve(o.order_id)}>Резерв</button>{' '}
                  <button className="small" onClick={() => doShip(o.order_id)}>Отгрузить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showClosed && (
        <div className="card muted-card">
          <h3>Закрытые (серым)</h3>
          <table className="tbl">
            <thead><tr><th>ID</th><th>Клиент</th><th>SKU</th><th>qty</th><th>статус</th></tr></thead>
            <tbody>
              {closed.map((o: any) => (
                <tr key={o.order_id} className="row-closed">
                  <td>{o.order_id}</td><td>{o.customer}</td><td>{o.sku}</td><td>{o.quantity}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
