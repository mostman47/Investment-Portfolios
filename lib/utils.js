export function fmt$(n)   { if (n == null) return '—'; return '$' + (+n).toFixed(2); }
export function fmtPct(n) { if (n == null) return '—'; return (n >= 0 ? '+' : '') + (+n).toFixed(2) + '%'; }

export const SECTORS = [
  { value: 'fertilizer',   label: 'Fertilizer'   },
  { value: 'food',         label: 'Food/Agri'    },
  { value: 'vn',           label: 'Vietnam'      },
  { value: 'semiconductor',label: 'Semiconductor'},
  { value: 'tech',         label: 'Tech'         },
  { value: 'energy',       label: 'Energy'       },
  { value: 'quantum',      label: 'Quantum'      },
  { value: 'etf',          label: 'ETF'          },
  { value: 'auto',         label: 'Auto & EV'    },
  { value: 'finance',      label: 'Finance'      },
  { value: 'pharma',       label: 'Pharma'       },
  { value: 'conglomerate', label: 'Conglomerate' },
  { value: 'logistics',    label: 'Logistics'    },
  { value: 'aerospace',    label: 'Aerospace'    },
  { value: 'staples',      label: 'Staples'      },
  { value: 'drone',        label: 'Drone/UAV'    },
  { value: 'other',        label: 'Other'        },
];

const SECTOR_LABELS = {
  fertilizer: 'Fertilizer', food: 'Food/Agri', vn: 'Vietnam', other: 'Other',
  tech: 'Tech', semiconductor: 'Semiconductor', energy: 'Energy', quantum: 'Quantum',
  etf: 'ETF', auto: 'Auto & EV', finance: 'Finance', pharma: 'Pharma',
  conglomerate: 'Conglomerate', logistics: 'Logistics', aerospace: 'Aerospace',
  staples: 'Staples', drone: 'Drone/UAV',
};
export function getSectorLabel(s) { return SECTOR_LABELS[s] || s || '—'; }

export function pnlPct(stock) {
  if (!stock.buy_price || !stock.current_price) return null;
  return (stock.current_price - stock.buy_price) / stock.buy_price * 100;
}

export const PALETTE = ['#0ea5e9','#7c3aed','#10b981','#f59e0b','#ef4444','#6366f1','#ec4899','#14b8a6'];
