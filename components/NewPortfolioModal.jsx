'use client';
import { useState } from 'react';
import { PALETTE } from '@/lib/utils';

export default function NewPortfolioModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(name.trim(), color);
    setName('');
    setColor(PALETTE[0]);
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl p-5 w-72 shadow-2xl">
        <h3 className="text-[0.92rem] font-bold mb-3">New Portfolio</h3>
        <input
          autoFocus
          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-[0.84rem] mb-3 focus:outline-none focus:border-violet-500"
          placeholder="Portfolio name..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {PALETTE.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[0.77rem] font-semibold hover:bg-slate-200">Cancel</button>
          <button onClick={handleCreate} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[0.77rem] font-semibold hover:bg-slate-700">Create</button>
        </div>
      </div>
    </div>
  );
}
