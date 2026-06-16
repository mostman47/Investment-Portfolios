'use client';

const TYPE_STYLES = {
  error: 'bg-red-600',
  ai:    'bg-violet-600',
  '':    'bg-slate-900',
};

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 text-white px-4 py-1.5 rounded-full text-[0.77rem] font-semibold z-50 whitespace-nowrap shadow-lg transition-opacity ${TYPE_STYLES[toast.type] || TYPE_STYLES['']}`}>
      {toast.msg}
    </div>
  );
}
