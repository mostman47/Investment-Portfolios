'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_PORTFOLIOS, PALETTE } from '@/lib/portfolios';
import { AI_DEFAULTS } from '@/lib/data';

const STORAGE_KEY = 'cowork_portfolios_v4';
const TOKEN_KEY   = 'cowork_ai_tokens_v1';

function uid() { return 'p' + Date.now(); }

function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.portfolios?.length) return parsed;
    }
  } catch(e) {}
  return null;
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e) {}
}

function loadTokens() {
  if (typeof window === 'undefined') return { calls: 0, inTokens: 0, outTokens: 0 };
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return { calls: 0, inTokens: 0, outTokens: 0 };
}

function saveTokens(t) {
  try { localStorage.setItem(TOKEN_KEY, JSON.stringify(t)); } catch(e) {}
}

// Client-side Anthropic call (API key from env, baked at build time)
async function callClaude(prompt) {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('No ANTHROPIC API key. Add NEXT_PUBLIC_ANTHROPIC_API_KEY to .env.local');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Anthropic error: ' + err);
  }

  const data = await res.json();
  return {
    text: data.content?.[0]?.text || '',
    inputTokens:  data.usage?.input_tokens  || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

export function usePortfolios() {
  const [state, setState] = useState({ activeId: null, portfolios: [] });
  const [tokens, setTokens] = useState({ calls: 0, inTokens: 0, outTokens: 0 });
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const toastTimer = useRef(null);

  useEffect(() => {
    // Always clear localStorage on page load so fresh PRICE_UPDATES from lib/data.js are used
    localStorage.removeItem(STORAGE_KEY);
    const initial = { activeId: INITIAL_PORTFOLIOS[0].id, portfolios: INITIAL_PORTFOLIOS };
    setState(initial);
    setTokens(loadTokens());
  }, []);

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const update = useCallback((updater) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const selectPortfolio   = useCallback((id) => update(s => ({ ...s, activeId: id })), [update]);
  const deletePortfolio   = useCallback((id) => update(s => {
    const portfolios = s.portfolios.filter(p => p.id !== id);
    return { ...s, portfolios, activeId: portfolios[0]?.id || null };
  }), [update]);
  const renamePortfolio   = useCallback((id, name) => update(s => ({
    ...s, portfolios: s.portfolios.map(p => p.id === id ? { ...p, name: name.trim() || 'Unnamed' } : p)
  })), [update]);
  const updateStock       = useCallback((pid, idx, field, value) => update(s => ({
    ...s, portfolios: s.portfolios.map(p =>
      p.id !== pid ? p : { ...p, stocks: p.stocks.map((st, i) => i !== idx ? st : { ...st, [field]: value }) }
    )
  })), [update]);
  const removeStock       = useCallback((pid, idx) => update(s => ({
    ...s, portfolios: s.portfolios.map(p =>
      p.id !== pid ? p : { ...p, stocks: p.stocks.filter((_, i) => i !== idx) }
    )
  })), [update]);

  const createPortfolio = useCallback((name, color) => {
    const np = { id: uid(), name, color, lastRefresh: null, dataSource: null, stocks: [] };
    update(s => ({ ...s, portfolios: [...s.portfolios, np], activeId: np.id }));
    setModalOpen(false);
  }, [update]);

  const addStock = useCallback((pid, { ticker, company, sector, buy_price, alloc_pct, risk, notes }) => {
    const def = AI_DEFAULTS[ticker] || {};
    const stock = {
      ticker, company, sector,
      buy_price: buy_price || null,
      current_price: null, day_change_pct: null,
      pe_ratio: def.pe_ratio ?? null,
      alloc_pct: alloc_pct || null,
      risk: risk || def.risk || null,
      buy_target: def.buy_target ?? null,
      sell_target: def.sell_target ?? null,
      notes: notes || def.notes || '',
    };
    update(s => ({
      ...s, portfolios: s.portfolios.map(p =>
        p.id !== pid ? p : { ...p, stocks: [...p.stocks, stock] }
      )
    }));
    showToast(`✓ ${ticker} added`);
  }, [update, showToast]);

  const resetTokens = useCallback(() => {
    const t = { calls: 0, inTokens: 0, outTokens: 0 };
    setTokens(t); saveTokens(t);
    showToast('AI usage reset');
  }, [showToast]);

  const refreshPrices = useCallback(async () => {
    const active = state.portfolios.find(p => p.id === state.activeId);
    if (!active || active.stocks.length === 0) { showToast('No stocks to refresh.'); return; }
    if (refreshing) return;

    setRefreshing(true);
    setAiStatus('Fetching prices...');
    showToast('🤖 AI refreshing prices...', 'ai');

    try {
      const tickers = active.stocks.map(s => s.ticker);
      const tickerList = tickers.join(', ');

      // Try Yahoo Finance from client
      let yahooRaw = null;
      setAiStatus('Calling Yahoo Finance...');
      try {
        const yRes = await fetch(
          `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(tickers.join(','))}`,
          { signal: AbortSignal.timeout(6000) }
        );
        const text = await yRes.text();
        if (text.includes('regularMarketPrice')) yahooRaw = text;
      } catch(e) {}

      const dataSource = yahooRaw ? 'yahoo+ai' : 'ai';
      setAiStatus('Asking Claude...');

      const prompt = yahooRaw
        ? `You are a financial data parser. Parse this Yahoo Finance JSON for stocks: ${tickerList}.

Return ONLY a valid JSON array (no markdown, no explanation):
[{"symbol":"TICKER","current_price":<number>,"day_change_pct":<number>,"pe_ratio":<number|null>,"risk_level":"<low|medium|high|vhigh>","buy_target":<number>,"sell_target":<number>}]

Yahoo Finance data:
${yahooRaw.slice(0, 8000)}`
        : `You are a financial analyst. Best estimates for these stocks as of today: ${tickerList}.

Return ONLY a valid JSON array (no markdown, no explanation):
[{"symbol":"TICKER","current_price":<number>,"day_change_pct":<number>,"pe_ratio":<number|null>,"risk_level":"<low|medium|high|vhigh>","buy_target":<number>,"sell_target":<number>}]`;

      const { text, inputTokens, outputTokens } = await callClaude(prompt);

      setTokens(prev => {
        const next = { calls: prev.calls + 1, inTokens: prev.inTokens + inputTokens, outTokens: prev.outTokens + outputTokens };
        saveTokens(next); return next;
      });

      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('No JSON in AI response');
      const quotes = JSON.parse(match[0]);

      let updated = 0;
      update(s => ({
        ...s, portfolios: s.portfolios.map(p => {
          if (p.id !== s.activeId) return p;
          const stocks = p.stocks.map(st => {
            const q = quotes.find(q => q.symbol?.toUpperCase() === st.ticker.toUpperCase());
            if (!q) return st;
            updated++;
            return {
              ...st,
              current_price:  q.current_price  != null ? +q.current_price  : st.current_price,
              day_change_pct: q.day_change_pct != null ? +q.day_change_pct : st.day_change_pct,
              pe_ratio:       q.pe_ratio       != null ? +q.pe_ratio       : st.pe_ratio,
              risk:           q.risk_level || st.risk,
              buy_target:     q.buy_target  != null ? +q.buy_target  : st.buy_target,
              sell_target:    q.sell_target != null ? +q.sell_target : st.sell_target,
            };
          });
          return { ...p, stocks, lastRefresh: new Date().toISOString(), dataSource };
        })
      }));

      const src = dataSource === 'yahoo+ai' ? 'Yahoo Finance + AI' : 'AI estimate';
      showToast(`✓ Updated ${updated} stocks via ${src}`, 'ai');
      setAiStatus(`Done · ${src}`);
    } catch(e) {
      showToast('Error: ' + e.message, 'error');
      setAiStatus('Error - try again');
    } finally {
      setRefreshing(false);
    }
  }, [state, refreshing, update, showToast]);

  return {
    state,
    activePortfolio: state.portfolios.find(p => p.id === state.activeId) || null,
    tokens, resetTokens,
    toast, showToast,
    modalOpen, setModalOpen,
    refreshing, aiStatus,
    selectPortfolio, createPortfolio, deletePortfolio, renamePortfolio,
    updateStock, removeStock, addStock,
    refreshPrices,
    PALETTE,
  };
}
