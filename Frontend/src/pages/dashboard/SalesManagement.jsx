// src/pages/SaleManagement/SaleManagement.jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  DollarSign,
  Package,
} from 'lucide-react';
import {
  fetchSales,
  fetchAllStocks,
  createBulkSales,
} from '../../services/main/saleService';
import { useAuth } from '../../context/AuthContext';

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, accent, iconColor, valueColor }) => (
  <div className="flex items-center gap-2.5 bg-surface border border-outline-variant rounded-xl px-3 py-2.5 shadow-sm">
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={13} className={iconColor} />
    </div>
    <div className="min-w-0">
      <p className="text-[9.5px] text-secondary font-semibold uppercase tracking-wide leading-none mb-0.5 truncate">
        {label}
      </p>
      <p className={`text-[17px] font-bold leading-tight ${valueColor || 'text-on-surface'}`}>
        {value}
      </p>
    </div>
  </div>
);

/* ─── Status Badge for Sale (optional) – no stock badge needed here, but we can reuse) ─── */

/* ─── Bottom Sheet / Modal wrapper ─── */
const Sheet = ({ open, onClose, children, maxWidth = 'max-w-[520px]' }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`
          w-full ${maxWidth} bg-surface border border-outline-variant shadow-2xl
          rounded-t-3xl sm:rounded-2xl
          animate-in fade-in slide-in-from-bottom-4 duration-200
          max-h-[92vh] overflow-y-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>
        {children}
      </div>
    </div>
  );
};

/* ─── Field wrapper ─── */
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-semibold text-secondary uppercase tracking-widest">
      {label}
    </label>
    {children}
  </div>
);

/* ─── Searchable Stock Select ─── */
const SearchableStockSelect = ({ options, value, onChange, disabledIds = [] }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const available = options.filter(
    (s) => !disabledIds.includes(s.id) || s.id === value
  );
  const filtered = available.filter((s) =>
    s.product?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find((s) => s.id === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${inputCls} flex items-center justify-between text-left`}
      >
        <span className={selected ? 'text-on-surface' : 'text-secondary'}>
          {selected ? `${selected.product?.name} (${selected.quantity} avail.)` : 'Select stock'}
        </span>
        <ChevronDown size={14} className="text-secondary flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-outline-variant rounded-xl shadow-lg max-h-48 overflow-hidden">
          <div className="p-2 border-b border-outline-variant">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 bg-background border border-outline-variant rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/20"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-36">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-secondary">No stock found</p>
            ) : (
              filtered.map((stock) => (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => {
                    onChange(stock.id, stock.quantity);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-primary-container/20 transition-colors flex justify-between ${
                    stock.id === value ? 'bg-primary-container/30 font-medium' : ''
                  }`}
                >
                  <span>{stock.product?.name}</span>
                  <span className="text-secondary">{stock.quantity}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const inputCls =
  'w-full px-3.5 py-2.5 bg-background border border-outline-variant rounded-xl text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all';

const fmt = (n) =>
  new Intl.NumberFormat('fr-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(n);

const ChevronDown = ({ size = 14, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SaleManagement = () => {
  const { user } = useAuth();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Stock list for add form
  const [allStocks, setAllStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);

  // Add modal – bulk
  const [addOpen, setAddOpen] = useState(false);
  const [newSales, setNewSales] = useState([
    { stockId: '', quantity: '', soldPrice: '', availableQty: 0 },
  ]);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Detail view (optional, just show a small info card on row click? We'll skip for brevity)

  const loadSales = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchSales(page);
      setSales(res.data);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
      setCurrentPage(res.currentPage);
    } catch {
      setError('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const loadStocks = async () => {
    setStocksLoading(true);
    try {
      const stocks = await fetchAllStocks();
      setAllStocks(stocks);
    } catch {
      setError('Failed to load stock list');
    } finally {
      setStocksLoading(false);
    }
  };

  useEffect(() => {
    loadSales(currentPage);
  }, [currentPage]);

  useEffect(() => {
    loadStocks();
  }, []);

  // Stats
  const todayTotal = useMemo(
    () => sales.reduce((sum, s) => sum + parseFloat(s.totalPrice || 0), 0),
    [sales]
  );
  const todaySalesCount = useMemo(() => sales.length, [sales]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.stock?.product?.name?.toLowerCase().includes(q) ||
        s.user?.email?.toLowerCase().includes(q)
    );
  }, [sales, search]);

  /* ── Add handlers ── */
  const openAdd = () => {
    setNewSales([{ stockId: '', quantity: '', soldPrice: '', availableQty: 0 }]);
    setAddError('');
    setAddOpen(true);
  };

  const updateRow = (index, field, value) => {
    setNewSales(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleStockChange = (index, stockId, availableQty) => {
    setNewSales(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, stockId, availableQty } : row
      )
    );
  };

  const removeRow = (index) => {
    if (newSales.length === 1) return;
    setNewSales(prev => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setNewSales(prev => [
      ...prev,
      { stockId: '', quantity: '', soldPrice: '', availableQty: 0 },
    ]);
  };

  const handleAdd = async () => {
    // Validate
    const invalid = newSales.some(
      (s) => !s.stockId || !s.quantity || !s.soldPrice
    );
    if (invalid) {
      setAddError('All fields are required for each sale entry');
      return;
    }

    // Check quantity against available stock
    for (const sale of newSales) {
      if (parseInt(sale.quantity) > sale.availableQty) {
        setAddError(
          `Quantity exceeds available stock for one or more entries.`
        );
        return;
      }
      if (parseInt(sale.quantity) <= 0) {
        setAddError('Quantity must be at least 1');
        return;
      }
    }

    // Duplicate stock check
    const stockIds = newSales.map((s) => s.stockId);
    const dupes = stockIds.filter((id, idx) => stockIds.indexOf(id) !== idx);
    if (dupes.length > 0) {
      setAddError('You cannot use the same stock item twice in one submission.');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      const payload = newSales.map((s) => ({
        stockId: s.stockId,
        quantity: parseInt(s.quantity),
        soldPrice: parseFloat(s.soldPrice),
      }));
      const res = await createBulkSales(payload);
      setSuccessMsg(`${res.count} sale(s) recorded`);
      setAddOpen(false);
      loadSales(currentPage);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Error recording sale');
    } finally {
      setAddLoading(false);
    }
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (loading && sales.length === 0 && stocksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // helper for duplicate disabled IDs in the add form
  const getDisabledIds = (currentIndex) =>
    newSales
      .filter((_, i) => i !== currentIndex)
      .map((s) => s.stockId)
      .filter(Boolean);

  return (
    <div className="relative space-y-4 font-sans antialiased pb-24 sm:pb-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-on-surface tracking-tight">Sales</h1>
          <p className="text-[11px] text-secondary mt-0.5">{totalItems} transactions</p>
        </div>
        <button
          onClick={openAdd}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={13} />
          New sale
        </button>
      </div>

      {/* ─── Toast banners ─── */}
      {error && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl">
          <span className="flex items-center gap-2"><AlertTriangle size={12} />{error}</span>
          <button onClick={() => setError('')}><X size={12} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-primary-container text-on-primary-container text-[11.5px] rounded-xl">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X size={12} /></button>
        </div>
      )}

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={ShoppingCart}
          label="Total Sales (this page)"
          value={todaySalesCount}
          accent="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue (this page)"
          value={fmt(todayTotal)}
          accent="bg-success-container/60"
          iconColor="text-success"
          valueColor="text-success"
        />
      </div>

      {/* ─── Search ─── */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
        <input
          type="text"
          placeholder="Search by product or seller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8.5 pr-8 py-2.5 bg-surface border border-outline-variant rounded-xl text-[12.5px] text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          style={{ paddingLeft: '2.1rem' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ─── Sales list ─── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-secondary bg-surface border border-outline-variant rounded-2xl">
          <ShoppingCart size={32} strokeWidth={1.2} className="opacity-25" />
          <p className="text-[12.5px]">{search ? `No results for "${search}"` : 'No sales recorded yet'}</p>
          <button onClick={openAdd} className="text-[11.5px] text-primary font-semibold hover:underline">
            Record a sale →
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden space-y-1.5">
            {filtered.map((sale) => (
              <div
                key={sale.id}
                className="bg-surface border border-outline-variant rounded-xl px-3.5 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[12.5px] text-on-surface truncate">
                    {sale.stock?.product?.name || 'Unknown'}
                  </p>
                  <p className="text-[10.5px] text-secondary">
                    {sale.quantity} × {fmt(sale.soldPrice)} = {fmt(sale.totalPrice)}
                  </p>
                  <p className="text-[10.5px] text-secondary">
                    {new Date(sale.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="text-right text-on-surface text-[12px] font-medium">
                  {fmt(sale.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">
                All Sales
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-outline-variant bg-background/50">
                  <tr>
                    {['Product', 'Qty', 'Unit Price', 'Total', 'Date', 'Seller'].map((h) => (
                      <th
                        key={h}
                        className={`py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide ${
                          h === 'Total' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-outline-variant/40 last:border-0 hover:bg-secondary-container/10 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[12.5px] text-on-surface">
                          {sale.stock?.product?.name || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[12px] text-on-surface">{sale.quantity}</td>
                      <td className="py-3 px-4 text-[12px] text-on-surface">{fmt(sale.soldPrice)}</td>
                      <td className="py-3 px-4 text-right text-[12px] font-medium">
                        {fmt(sale.totalPrice)}
                      </td>
                      <td className="py-3 px-4 text-secondary text-[11.5px]">
                        {new Date(sale.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 text-secondary text-[11.5px]">
                        {sale.user?.email || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-outline-variant/50 text-[10.5px] text-secondary">
              Showing {filtered.length} of {totalItems} transactions
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-secondary disabled:opacity-40 hover:bg-secondary-container/30 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-secondary disabled:opacity-40 hover:bg-secondary-container/30 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Mobile FAB ─── */}
      <button
        onClick={openAdd}
        className="sm:hidden fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* ══════════ ADD SALE SHEET (bulk) ══════════ */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} maxWidth="max-w-[740px]">
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-on-surface">Record Sale</h2>
            <p className="text-[11.5px] text-secondary mt-0.5">
              Add one or more items to the sale
            </p>
          </div>
          <button
            onClick={() => setAddOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {addError && (
          <div className="mx-5 mt-3.5 px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl flex items-center gap-2">
            <AlertTriangle size={11} />{addError}
          </div>
        )}

        <div className="px-5 pt-4 space-y-3">
          {newSales.map((sale, index) => (
            <div
              key={index}
              className="flex gap-3 items-end border border-outline-variant rounded-xl p-3 bg-background/60"
            >
              {/* Stock selector */}
              <div className="flex-1 min-w-0">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                  Stock Item
                </label>
                {stocksLoading ? (
                  <div className="text-secondary text-[12px] p-2">Loading…</div>
                ) : (
                  <SearchableStockSelect
                    options={allStocks}
                    value={sale.stockId}
                    onChange={(stockId, availableQty) =>
                      handleStockChange(index, stockId, availableQty)
                    }
                    disabledIds={getDisabledIds(index)}
                  />
                )}
              </div>
              <div className="w-24 sm:w-28">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                  Qty
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={sale.quantity}
                  onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                  className={inputCls}
                  min="1"
                  max={sale.availableQty}
                />
                {sale.availableQty > 0 && (
                  <p className="text-[9px] text-secondary mt-0.5">Max: {sale.availableQty}</p>
                )}
              </div>
              <div className="w-24 sm:w-28">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                  Unit Price
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={sale.soldPrice}
                  onChange={(e) => updateRow(index, 'soldPrice', e.target.value)}
                  className={inputCls}
                  min="0"
                />
              </div>
              <div className="w-24 hidden sm:flex items-center justify-end">
                {sale.quantity && sale.soldPrice && (
                  <span className="text-[12px] font-medium text-on-surface">
                    = {fmt(parseFloat(sale.quantity) * parseFloat(sale.soldPrice))}
                  </span>
                )}
              </div>
              {newSales.length > 1 && (
                <button
                  onClick={() => removeRow(index)}
                  className="w-9 h-10 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-all flex-shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addRow}
            className="text-[11.5px] text-primary font-semibold flex items-center gap-1 py-1 hover:underline"
          >
            <Plus size={12} />
            Add another item
          </button>
        </div>

        <div className="px-5 pt-4 pb-5 flex gap-2">
          <button
            onClick={() => setAddOpen(false)}
            className="flex-1 py-2.5 text-[12.5px] font-semibold text-secondary border border-outline-variant rounded-xl hover:bg-secondary-container/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={addLoading || stocksLoading}
            className="flex-1 py-2.5 bg-primary text-on-primary text-[12.5px] font-bold rounded-xl hover:brightness-110 disabled:opacity-55 transition-all flex items-center justify-center gap-1.5"
          >
            <ShoppingCart size={14} />
            {addLoading ? 'Recording…' : `Record ${newSales.length > 1 ? `${newSales.length} sales` : 'sale'}`}
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default SaleManagement;