'use client';

const PRICE_IN  = 0.80;
const PRICE_OUT = 4.00;

export default function Sidebar({
  state, activePortfolio, tokens, resetTokens,
  aiStatus, refreshing, selectPortfolio, setModalOpen,
}) {
  const cost = ((tokens.inTokens * PRICE_IN + tokens.outTokens * PRICE_OUT) / 1_000_000).toFixed(4);

  return (
    <aside className="w-48 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
      <div className="px-3 pt-3 pb-1 text-[0.61rem] uppercase tracking-widest text-slate-400 font-bold">
        Portfolios
      </div>

      <nav className="flex-1 overflow-y-auto min-h-0">
        {state.portfolios.map(p => {
          const isActive = p.id === state.activeId;
          const tag =
            p.name === 'AI Infrastructure' ? <span className="ml-1 text-[0.55rem] bg-violet-100 text-violet-700 px-1 py-0.5 rounded font-bold">AI</span> :
            p.name === 'Quantum Computing' ? <span className="ml-1 text-[0.55rem]">⚛️</span> :
            p.name === 'High Risk'         ? <span className="ml-1 text-[0.55rem]">🔥</span> :
            p.name === 'Defense HALO'      ? <span className="ml-1 text-[0.55rem]">🛡️</span> : null;

          return (
            <button
              key={p.id}
              onClick={() => selectPortfolio(p.id)}
              className={`w-full flex items-center gap-1.5 px-3 py-2 text-[0.79rem] text-left border-l-[3px] transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-800 font-semibold border-blue-400'
                  : 'text-slate-600 border-transparent hover:bg-slate-50'}`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="flex-1 truncate">{p.name}{tag}</span>
              <span className={`text-[0.64rem] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                {p.stocks.length}
              </span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => setModalOpen(true)}
        className="mx-2.5 my-1.5 p-1.5 text-[0.75rem] text-slate-500 border border-dashed border-slate-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
      >
        + New Portfolio
      </button>

      {/* AI Token Tracker */}
      <div className="border-t border-slate-200 p-3 bg-gradient-to-br from-slate-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-wider text-violet-700">
            <span className={`w-1.5 h-1.5 rounded-full bg-violet-600 ${refreshing ? 'ai-pulse' : 'opacity-0'}`} />
            AI Usage
          </div>
          <button onClick={resetTokens} className="text-[0.6rem] text-slate-400 hover:text-slate-600">Reset</button>
        </div>
        <div className="space-y-1">
          {[
            ['Calls',    tokens.calls.toLocaleString(),        ''],
            ['In tok',   tokens.inTokens.toLocaleString(),     ''],
            ['Out tok',  tokens.outTokens.toLocaleString(),    ''],
            ['Cost',     '$' + cost,                            'text-violet-700'],
          ].map(([lbl, val, cls]) => (
            <div key={lbl} className="flex justify-between items-center">
              <span className="text-[0.66rem] text-slate-400">{lbl}</span>
              <span className={`text-[0.72rem] font-bold text-slate-700 tabular-nums ${cls}`}>{val}</span>
            </div>
          ))}
        </div>
        <div className="mt-1.5 text-center text-[0.6rem] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
          Haiku 4.5
        </div>
        {aiStatus && (
          <div className="mt-1 text-center text-[0.65rem] text-violet-600 italic min-h-[14px]">
            {aiStatus}
          </div>
        )}
      </div>
    </aside>
  );
}
