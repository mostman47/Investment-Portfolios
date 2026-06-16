'use client';
import { useState } from 'react';
import { fmt$, fmtPct, getSectorLabel, SECTORS, pnlPct } from '@/lib/utils';
import { AI_DEFAULTS } from '@/lib/data';

const RISK_STYLES = {
  low:    'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high:   'bg-red-100 text-red-800',
  vhigh:  'bg-pink-100 text-pink-900',
};
const RISK_LABELS = { low:'Low', medium:'Medium', high:'High', vhigh:'Very High' };

function SectorBadge({ sector }) {
  return (
    <span className={`badge b-${sector || 'other'} inline-block text-[0.6rem] px-1.5 py-0.5 rounded-full font-semibold mt-0.5`}>
      {getSectorLabel(sector)}
    </span>
  );
}

function AddStockForm({ portfolio, addStock }) {
  const [form, setForm] = useState({
    ticker: '', company: '', sector: 'semiconductor',
    buy_price: '', alloc_pct: '', risk: 'medium', notes: '',
  });

  function handleAdd() {
    const ticker = form.ticker.trim().toUpperCase();
    if (!ticker) return;
    const def = AI_DEFAULTS[ticker] || {};
    addStock(portfolio.id, {
      ticker,
      company:   form.company.trim() || def.company || '',
      sector:    form.sector,
      buy_price: form.buy_price ? +form.buy_price : null,
      alloc_pct: form.alloc_pct ? +form.alloc_pct : null,
      risk:      form.risk || null,
      notes:     form.notes.trim() || '',
    });
    setForm({ ticker: '', company: '', sector: 'semiconductor', buy_price: '', alloc_pct: '', risk: 'medium', notes: '' });
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <h4 className="text-[0.75rem] font-bold text-slate-700 mb-2">➕ Add Stock</h4>
      <div className="flex flex-wrap gap-2 items-end">
        {[
          { label:'Ticker', key:'ticker', type:'text', cls:'w-16', placeholder:'NTR', upper:true },
          { label:'Company', key:'company', type:'text', cls:'w-32', placeholder:'Nutrien Ltd.' },
        ].map(({label, key, type, cls, placeholder, upper}) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-[0.6rem] text-slate-400 uppercase tracking-wider">{label}</label>
            <input
              type={type}
              className={`${cls} px-2 py-1 border border-slate-200 rounded-md text-[0.77rem] bg-slate-50 focus:outline-none focus:border-violet-500 focus:bg-white`}
              placeholder={placeholder}
              value={form[key]}
              onChange={e => set(key, upper ? e.target.value.toUpperCase() : e.target.value)}
            />
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <label className="text-[0.6rem] text-slate-400 uppercase tracking-wider">Sector</label>
          <select
            className="px-2 py-1 border border-slate-200 rounded-md text-[0.77rem] bg-slate-50 focus:outline-none focus:border-violet-500"
            value={form.sector} onChange={e => set('sector', e.target.value)}
          >
            {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {[
          { label:'Buy $', key:'buy_price', placeholder:'45.00', cls:'w-16' },
          { label:'Alloc %', key:'alloc_pct', placeholder:'20', cls:'w-14' },
        ].map(({label, key, placeholder, cls}) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-[0.6rem] text-slate-400 uppercase tracking-wider">{label}</label>
            <input
              type="number"
              className={`${cls} px-2 py-1 border border-slate-200 rounded-md text-[0.77rem] bg-slate-50 focus:outline-none focus:border-violet-500 focus:bg-white`}
              placeholder={placeholder}
              value={form[key]} onChange={e => set(key, e.target.value)}
            />
          </div>
        ))}

        <div className="flex flex-col gap-1">
          <label className="text-[0.6rem] text-slate-400 uppercase tracking-wider">Risk</label>
          <select
            className="px-2 py-1 border border-slate-200 rounded-md text-[0.77rem] bg-slate-50 focus:outline-none focus:border-violet-500"
            value={form.risk} onChange={e => set('risk', e.target.value)}
          >
            <option value="">—</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="vhigh">Very High</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-[0.6rem] text-slate-400 uppercase tracking-wider">Notes</label>
          <input
            type="text"
            className="w-full px-2 py-1 border border-slate-200 rounded-md text-[0.77rem] bg-slate-50 focus:outline-none focus:border-violet-500 focus:bg-white"
            placeholder="Investment thesis..."
            value={form.notes} onChange={e => set('notes', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[0.6rem] opacity-0">Add</label>
          <button onClick={handleAdd} className="px-4 py-1.5 bg-violet-600 text-white rounded-md text-[0.77rem] font-semibold hover:bg-violet-700 transition-colors">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioView({
  activePortfolio, refreshing, refreshPrices, deletePortfolio,
  renamePortfolio, updateStock, removeStock, addStock,
}) {
  if (!activePortfolio) {
    return <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select or create a portfolio.</div>;
  }

  const p = activePortfolio;
  const totalAlloc = p.stocks.reduce((a, s) => a + (s.alloc_pct || 0), 0);
  const allocOk = p.stocks.length === 0 || (totalAlloc >= 95 && totalAlloc <= 105);
  const lastRef = p.lastRefresh ? new Date(p.lastRefresh).toLocaleString() : 'Never';

  const withPnl = p.stocks.filter(s => s.buy_price && s.current_price);
  const avgPnl  = withPnl.length > 0
    ? withPnl.reduce((a, s) => a + pnlPct(s), 0) / withPnl.length
    : null;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <input
            className="text-lg font-bold text-slate-900 bg-transparent border-2 border-transparent rounded-md px-1.5 py-0.5 hover:border-slate-300 hover:bg-white focus:outline-none focus:border-indigo-500 focus:bg-white max-w-xs transition-colors"
            value={p.name}
            onChange={e => renamePortfolio(p.id, e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.67rem] text-slate-400">
            Updated: {lastRef}
            {p.dataSource === 'yahoo+ai' && <span className="ml-1 text-[0.6rem] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Yahoo+AI</span>}
            {p.dataSource === 'ai'       && <span className="ml-1 text-[0.6rem] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold">AI est.</span>}
          </span>
          <button
            onClick={refreshPrices}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[0.77rem] font-semibold hover:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className={`w-3 h-3 flex-shrink-0 ${refreshing ? 'spinning' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            AI Refresh Prices
          </button>
          <button
            onClick={() => { if (confirm('Delete this portfolio?')) deletePortfolio(p.id); }}
            className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-[0.74rem] font-semibold hover:bg-red-200 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Stocks',   value: p.stocks.length,                          cls: 'text-blue-600' },
          { label: 'Alloc Total', value: totalAlloc + '%',                      cls: allocOk ? '' : 'text-amber-600' },
          { label: 'Avg P&L',  value: avgPnl == null ? '—' : (avgPnl >= 0 ? '+' : '') + avgPnl.toFixed(2) + '%',
            cls: avgPnl == null ? '' : avgPnl >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'AI Model', value: 'Haiku 4.5',                             cls: 'text-violet-600 text-[0.7rem]' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-3 py-2 flex-1 min-w-24 shadow-sm">
            <div className="text-[0.61rem] text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className={`text-base font-bold text-slate-900 ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      {!allocOk && p.stocks.length > 0 && (
        <div className="text-[0.71rem] px-2.5 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          ⚠️ Alloc total is {totalAlloc}% — should be 100%
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '1080px' }}>
          <thead className="bg-slate-50">
            <tr>
              {['Stock','Buy $','Current $','P&L','Alloc %','P/E','Risk','Target Buy / Sell','Notes',''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[0.61rem] uppercase tracking-wider text-slate-500 border-b border-slate-200 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.stocks.length === 0 && (
              <tr><td colSpan={10} className="text-center py-8 text-slate-400 text-sm">No stocks yet.</td></tr>
            )}
            {p.stocks.map((st, i) => {
              const pl = pnlPct(st);
              return (
                <tr key={i} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">
                    <a href={`https://finance.yahoo.com/quote/${st.ticker}`} target="_blank" rel="noreferrer"
                       className="font-bold text-[0.87rem] text-blue-600 hover:text-blue-800 border-b border-dashed border-blue-300">
                      {st.ticker}
                    </a>
                    <div className="text-[0.67rem] text-slate-400 mt-0.5">{st.company}</div>
                    <SectorBadge sector={st.sector} />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="w-16 px-1.5 py-1 border border-slate-200 rounded text-[0.77rem] bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      value={st.buy_price ?? ''} placeholder="—"
                      onChange={e => updateStock(p.id, i, 'buy_price', e.target.value ? +e.target.value : null)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {st.current_price != null ? (
                      <>
                        <div className="font-semibold text-slate-900 text-[0.79rem]">{fmt$(st.current_price)}</div>
                        {st.day_change_pct != null && (
                          <div className={`text-[0.73rem] font-semibold ${st.day_change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {fmtPct(st.day_change_pct)}
                          </div>
                        )}
                      </>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    {pl != null
                      ? <span className={`font-semibold text-[0.79rem] ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pl >= 0 ? '+' : ''}{pl.toFixed(2)}%
                        </span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-3 py-2">
                    {st.alloc_pct != null ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 rounded-full bg-slate-200 flex-1 min-w-[35px] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: Math.min(st.alloc_pct, 100) + '%', background: p.color }} />
                        </div>
                        <span className="text-[0.73rem] font-semibold text-slate-700 w-8 text-right">{st.alloc_pct}%</span>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-[0.79rem]">
                    {st.pe_ratio != null ? (+st.pe_ratio).toFixed(1) + 'x' : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="px-1.5 py-1 border border-slate-200 rounded text-[0.77rem] bg-slate-50 focus:outline-none focus:border-indigo-500"
                      value={st.risk || ''} onChange={e => updateStock(p.id, i, 'risk', e.target.value)}
                    >
                      <option value="">—</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="vhigh">Very High</option>
                    </select>
                    {st.risk && (
                      <span className={`block mt-0.5 text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full w-fit ${RISK_STYLES[st.risk] || ''}`}>
                        {RISK_LABELS[st.risk]}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1 min-w-[88px]">
                      {[['buy', 'buy_target', 'text-green-600'], ['sell', 'sell_target', 'text-red-600']].map(([lbl, field, cls]) => (
                        <div key={field} className="flex items-center gap-1 text-[0.7rem]">
                          <span className={`w-6 font-bold flex-shrink-0 ${cls}`}>{lbl.charAt(0).toUpperCase() + lbl.slice(1)}</span>
                          <input
                            type="number"
                            className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-[0.7rem] bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                            value={st[field] ?? ''} placeholder="—"
                            onChange={e => updateStock(p.id, i, field, e.target.value ? +e.target.value : null)}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      className="w-40 px-1.5 py-1 border border-slate-200 rounded text-[0.77rem] bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      value={st.notes || ''} placeholder="Thesis..."
                      onChange={e => updateStock(p.id, i, 'notes', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeStock(p.id, i)}
                      className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[0.7rem] font-semibold hover:bg-red-200 transition-colors"
                    >✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AddStockForm portfolio={p} addStock={addStock} />
    </>
  );
}
