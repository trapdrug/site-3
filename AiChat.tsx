import { useState } from 'react';
import { aiAsk } from '../api';

const CHIPS = [
  'Можно ли отдать 5 Plus новому клиенту?',
  'Почему ORD-003 нельзя отгрузить целиком?',
  'Что будет при задержке IN-AIR-01?',
  'Когда придёт IN-UNKNOWN?',
];

export default function AiChat({ refreshKey }: { refreshKey: number }) {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [facts, setFacts] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showFacts, setShowFacts] = useState(false);

  async function ask(question: string) {
    const qq = question.trim();
    if (!qq) return;
    setLoading(true);
    setErr('');
    try {
      // авто-сценарий: если спрашивают про задержку IN-AIR-01 — прикладываем scenario для точности
      let scenario: any = undefined;
      if (/задерж/i.test(qq) && /IN-AIR-01/i.test(qq)) {
        scenario = { shipment_id: 'IN-AIR-01', new_expected_at: '2026-11-05T10:00:00+03:00' };
      }
      const r = await aiAsk(qq, scenario);
      setAnswer(r.answer || '');
      setFacts(r.facts_used || null);
    } catch (e: any) {
      setErr(e.message + (e.hint ? ' — ' + e.hint : ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-chat" data-refresh={refreshKey}>
      <h3>ИИ-аналитик</h3>
      <div className="chips">
        {CHIPS.map((c) => (
          <button key={c} className="chip" onClick={() => { setQ(c); ask(c); }}>
            {c}
          </button>
        ))}
      </div>
      <div className="ai-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Спросите про склад, заказы, задержки…"
          onKeyDown={(e) => { if (e.key === 'Enter') ask(q); }}
        />
        <button onClick={() => ask(q)} disabled={loading}>{loading ? '…' : 'Спросить'}</button>
      </div>
      {err && <div className="error">{err}</div>}
      {answer && (
        <div className="ai-answer">
          <div>{answer}</div>
          {facts && (
            <div className="facts">
              <button className="link" onClick={() => setShowFacts(!showFacts)}>
                {showFacts ? 'скрыть' : 'на каких данных основан'}
              </button>
              {showFacts && <pre>{JSON.stringify(facts, null, 2)}</pre>}
            </div>
          )}
        </div>
      )}
      {!answer && !loading && <div className="muted">Ответы только по facts API/мока, обновляются после каждого изменения склада.</div>}
    </div>
  );
}
