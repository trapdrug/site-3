import { fmtDate } from '../format';

export default function Dashboard({ snapshot, shipmentsAll }: { snapshot: any; shipmentsAll: any[] }) {
  if (!snapshot) return <div className="card">Загрузка…</div>;
  const now = snapshot.now;
  return (
    <div>
      <div className="card">
        <h3>Остатки склада</h3>
        <table className="tbl">
          <thead>
            <tr><th>SKU</th><th>on_hand</th><th>reserved</th><th>free</th><th>занятость</th></tr>
          </thead>
          <tbody>
            {snapshot.stock.map((s: any) => {
              const pct = s.on_hand > 0 ? Math.round((s.reserved / s.on_hand) * 100) : 0;
              return (
                <tr key={s.sku}>
                  <td><b>{s.sku}</b> <span className="muted">{s.sku === 'FG-AIR' ? 'Air (температура+влажность)' : 'Air Plus (+CO2)'}</span></td>
                  <td>{s.on_hand}</td>
                  <td>{s.reserved}</td>
                  <td><b>{s.free}</b></td>
                  <td>
                    <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                    <span className="muted">{pct}% в резерве</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="muted">свободно = on_hand − резерв; резерв = сумма reserved_qty активных. Время учебное: {fmtDate(now)} МСК.</div>
      </div>

      <div className="card">
        <h3>Ожидаемые поставки</h3>
        <table className="tbl">
          <thead><tr><th>ID</th><th>SKU</th><th>qty</th><th>expected_at</th><th>статус</th></tr></thead>
          <tbody>
            {(shipmentsAll.length ? shipmentsAll : snapshot.shipments_expected).map((s: any) => {
              const overdue = s.status === 'expected' && new Date(s.expected_at) < new Date(now);
              return (
                <tr key={s.shipment_id} className={overdue ? 'row-overdue' : ''}>
                  <td><b>{s.shipment_id}</b></td>
                  <td>{s.sku}</td>
                  <td>{s.quantity}</td>
                  <td>{fmtDate(s.expected_at)} {overdue && <span className="badge badge-red">просрочена</span>}</td>
                  <td>{s.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="muted">Просроченная без received — исключена из прогноза до уточнения даты.</div>
      </div>
    </div>
  );
}
