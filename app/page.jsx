'use client';
import Sidebar from '@/components/Sidebar';
import PortfolioView from '@/components/PortfolioView';
import NewPortfolioModal from '@/components/NewPortfolioModal';
import Toast from '@/components/Toast';
import { usePortfolios } from '@/hooks/usePortfolios';

export default function Home() {
  const p = usePortfolios();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      {/* Topbar */}
      <header className="bg-slate-900 text-slate-50 px-4 py-2.5 flex items-center gap-2.5 flex-shrink-0">
        <h1 className="text-[0.95rem] font-bold">📈 Investment Portfolios</h1>
        <span className="text-[0.72rem] text-slate-500 ml-auto">
          {p.state.portfolios.length} portfolio{p.state.portfolios.length !== 1 ? 's' : ''}
        </span>
      </header>

      {/* Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          state={p.state}
          activePortfolio={p.activePortfolio}
          tokens={p.tokens}
          resetTokens={p.resetTokens}
          aiStatus={p.aiStatus}
          refreshing={p.refreshing}
          selectPortfolio={p.selectPortfolio}
          setModalOpen={p.setModalOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <PortfolioView
            activePortfolio={p.activePortfolio}
            refreshing={p.refreshing}
            refreshPrices={p.refreshPrices}
            deletePortfolio={p.deletePortfolio}
            renamePortfolio={p.renamePortfolio}
            updateStock={p.updateStock}
            removeStock={p.removeStock}
            addStock={p.addStock}
          />
        </main>
      </div>

      {p.modalOpen && (
        <NewPortfolioModal
          onClose={() => p.setModalOpen(false)}
          onCreate={p.createPortfolio}
        />
      )}

      <Toast toast={p.toast} />
    </div>
  );
}
