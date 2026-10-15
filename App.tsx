import { useCallback, useEffect, useState } from 'react';
import { snapshot as fetchSnapshot, shipments as fetchShipments, adminReset, isMockMode, onMockMode, API_BASE } from './api';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Shipments from './pages/Shipments';
import Scenario from './pages/Scenario';
import Production from './pages/Production';
import AiChat from './components/AiChat';
import { fmtDate } from './format';

type Tab = 'dash' | 'orders' | 'ships' | 'scenario' | 'prod' | 'ai';

export default function App() {
  const [tab, setTab] = useState<Tab>('dash');
  const [snap, setSnap] = useState<any>(null);
  const [ships, setShips] = useState<any[]>([]);
  const [mock, setMock] = useState(isMockMode());
  const [msg, setMsg] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const s = await fetchSnapshot();
      setSnap(s);
      try {
        const sh = await fetchShipments();
        setShips(sh);
      } catch { setShips(s?.shipments_expected || []); }
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setMsg('Не удалось загрузить snapshot: ' + e.message);
    }
  }, []);

  useEffect(() => {
    load();
    return onMockMode(setMock);
  }, [load]);

  async function reset(fixture: 'simple' | 'extended') {
    setMsg('');
    try {
      await adminReset(fixture);
      await load();
      setMsg(`Сброшено к ${fixture}`);
    } catch (e: any) {
      setMsg('Reset: ' + e.message);
    }
  }

  const air = snap?.stock?.find((s: any) => s.sku === 'FG-AIR');
  const plus = snap?.stock?.find((s: any) => s.sku === 'FG-PLUS');

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Сенсорика • цифровой двойник</h1>
          <div className="muted">учебное время {snap ? fmtDate(snap.now) : '02.11 09:00'} МСК • API: {API_BASE}</div>
        </div>
        <div className="top-actions">
          <button className="ghost" onClick={() => reset('simple')}>Сброс к простому примеру</button>
          <button className="ghost" onClick={() => reset('extended')}>Сброс к расширенному</button>
          <button className="ghost" onClick={load}>Обновить</button>
        </div>
      </header>

      {mock && <div className="mock-banner">ДЕМО-МОК, API недоступен — цифры из локального мока (seed-03.json)</div>}
      {msg && <div className="info">{msg}</div>}

      <section className="kpi-row">
        <div className="kpi"><span>Air физически</span><b>{air?.on_hand ?? '—'}</b></div>
        <div className="kpi"><span>Air свободно</span><b>{air?.free ?? '—'}</b></div>
        <div className="kpi"><span>Air резерв</span><b>{air?.reserved ?? '—'}</b></div>
        <div className="kpi"><span>Plus физически</span><b>{plus?.on_hand ?? '—'}</b></div>
        <div className="kpi"><span>Plus свободно</span><b>{plus?.free ?? '—'}</b></div>
        <div className="kpi"><span>Plus резерв</span><b>{plus?.reserved ?? '—'}</b></div>
        <div className="kpi"><span>активных заказов</span><b>{snap?.kpi?.active_orders ?? '—'}</b></div>
        <div className="kpi"><span>поставок в пути</span><b>{snap?.kpi?.expected_shipments ?? '—'}</b></div>
        <div className={`kpi ${(snap?.kpi?.at_risk || 0) > 0 ? 'kpi-danger' : ''}`}>
          <span>заказов в риске</span><b>{snap?.kpi?.at_risk ?? '—'}</b>
        </div>
      </section>

      <nav className="tabs">
        {([
          ['dash', 'Склад'],
          ['orders', 'Заказы'],
          ['ships', 'Поставки'],
          ['scenario', 'Сценарии задержки'],
          ['prod', 'Производство'],
          ['ai', 'ИИ-аналитик'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} className={tab === id ? 'tab active' : 'tab'} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      <div className="layout">
        <main className="main">
          {tab === 'dash' && <Dashboard snapshot={snap} shipmentsAll={ships} />}
          {tab === 'orders' && <Orders snapshot={snap} onChange={load} />}
          {tab === 'ships' && <Shipments snapshot={snap} shipmentsAll={ships} onChange={load} />}
          {tab === 'scenario' && <Scenario snapshot={snap} />}
          {tab === 'prod' && <Production />}
          {tab === 'ai' && <AiChat refreshKey={refreshKey} />}
        </main>
        <aside className="side">
          <AiChat refreshKey={refreshKey} />
        </aside>
      </div>

      <footer className="muted footer">
        Демо-сценарий 3 мин: 1) KPI склада → 2) ORD-003 риск → 3) задержка IN-AIR-01 → 4) вопрос ИИ → 5) производство Plus.
        Даты в МСК ДД.ММ ЧЧ:ММ. Дату ПК не используем.
      </footer>
    </div>
  );
}
