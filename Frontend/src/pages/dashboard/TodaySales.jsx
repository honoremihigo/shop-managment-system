// src/pages/TodaySales/TodaySales.jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Search,
  X,
  Plus,
  ChevronDown,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchTodaySales,
  fetchAllStocks,
  createBulkSales,
} from '../../services/main/saleService';

/* ─── Helpers ─── */
const fmt = (n) =>
  new Intl.NumberFormat('fr-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(n);

const inputCls =
  'w-full px-3.5 py-2.5 bg-background border border-outline-variant rounded-xl text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all';

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

/* ─── Bottom Sheet / Modal wrapper ─── */
const Sheet = ({ open, onClose, children, maxWidth = 'max-w-[520px]' }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${maxWidth} bg-surface border border-outline-variant shadow-2xl rounded-t-3xl sm:rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[92vh] overflow-y-auto`}
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
          {selected
            ? `${selected.product?.name} (${selected.quantity} avail.)`
            : 'Select stock'}
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

const TodaySales = () => {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalSales: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [newSales, setNewSales] = useState([
    { stockId: '', quantity: '', soldPrice: '', availableQty: 0 },
  ]);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [allStocks, setAllStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);

  // Payment method & customer
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const loadTodaySales = async () => {
    setLoading(true);
    try {
      const res = await fetchTodaySales();
      if (res.success) {
        setSales(res.data);
        setSummary(res.summary);
      } else {
        setError('Failed to load today’s sales');
      }
    } catch {
      setError('Failed to load today’s sales');
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
    loadTodaySales();
    loadStocks();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.stock?.product?.name?.toLowerCase().includes(q) ||
        s.user?.email?.toLowerCase().includes(q)
    );
  }, [sales, search]);

  /* ── Add helpers ── */
  const openAdd = () => {
    setNewSales([{ stockId: '', quantity: '', soldPrice: '', availableQty: 0 }]);
    setPaymentMethod('cash');
    setCustomerName('');
    setCustomerPhone('');
    setAddError('');
    setAddOpen(true);
  };

  const updateRow = (index, field, value) => {
    setNewSales((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleStockChange = (index, stockId, availableQty) => {
    setNewSales((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, stockId, availableQty } : row
      )
    );
  };

  const removeRow = (index) => {
    if (newSales.length === 1) return;
    setNewSales((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setNewSales((prev) => [
      ...prev,
      { stockId: '', quantity: '', soldPrice: '', availableQty: 0 },
    ]);
  };

  const handleAdd = async () => {
    const invalid = newSales.some(
      (s) => !s.stockId || !s.quantity || !s.soldPrice
    );
    if (invalid) {
      setAddError('All fields are required for each sale entry');
      return;
    }

    for (const sale of newSales) {
      if (parseFloat(sale.quantity) > sale.availableQty) {
        setAddError('Quantity exceeds available stock for one or more entries.');
        return;
      }
      if (parseFloat(sale.quantity) <= 0) {
        setAddError('Quantity must be at least 0');
        return;
      }
    }

    const stockIds = newSales.map((s) => s.stockId);
    const dupes = stockIds.filter((id, idx) => stockIds.indexOf(id) !== idx);
    if (dupes.length > 0) {
      setAddError('You cannot use the same stock item twice in one submission.');
      return;
    }

    if (paymentMethod === 'credit' && !customerName.trim()) {
      setAddError('Customer name is required for credit sales');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      const payload = {
        sales: newSales.map((s) => ({
          stockId: s.stockId,
          quantity: parseFloat(s.quantity),
          soldPrice: parseFloat(s.soldPrice),
        })),
        paymentMethod,
        customerName: paymentMethod === 'credit' ? customerName.trim() : undefined,
        customerPhone: paymentMethod === 'credit' ? customerPhone.trim() : undefined,
      };
      await createBulkSales(payload);
      setSuccessMsg('Sale recorded successfully');
      setAddOpen(false);
      loadTodaySales();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Error recording sale');
    } finally {
      setAddLoading(false);
    }
  };

  const getDisabledIds = (currentIndex) =>
    newSales
      .filter((_, i) => i !== currentIndex)
      .map((s) => s.stockId)
      .filter(Boolean);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative space-y-4 font-sans antialiased pb-24 sm:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-on-surface tracking-tight">Today’s Sales</h1>
          <p className="text-[11px] text-secondary mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={13} />
          Add Sale
        </button>
      </div>

      {/* Toast banners */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={ShoppingCart}
          label="Total Sales"
          value={summary.totalSales}
          accent="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={fmt(summary.totalRevenue)}
          accent="bg-success-container/60"
          iconColor="text-success"
          valueColor="text-success"
        />
      </div>

      {/* Search */}
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
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Sales list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-secondary bg-surface border border-outline-variant rounded-2xl">
          <ShoppingCart size={32} strokeWidth={1.2} className="opacity-25" />
          <p className="text-[12.5px]">{search ? `No results for "${search}"` : 'No sales recorded today'}</p>
          <button onClick={openAdd} className="text-[11.5px] text-primary font-semibold hover:underline">
            Record a sale →
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-1.5">
            {filtered.map((sale) => (
              <div key={sale.id} className="bg-surface border border-outline-variant rounded-xl px-3.5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[12.5px] text-on-surface truncate">
                    {sale.stock?.product?.name || 'Unknown'}
                  </p>
                  <p className="text-[10.5px] text-secondary">
                    {sale.quantity} × {fmt(sale.soldPrice)} = {fmt(sale.totalPrice)}
                  </p>
                  <p className="text-[10.5px] text-secondary">
                    {new Date(sale.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right text-on-surface text-[12px] font-medium">
                  {fmt(sale.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Today’s Transactions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-outline-variant bg-background/50">
                  <tr>
                    {['Product', 'Qty', 'Unit Price', 'Total', 'Method', 'Time', 'Seller'].map((h) => (
                      <th key={h} className={`py-2.5 px-2 text-[10px] font-semibold text-secondary uppercase tracking-wide ${h === 'Total' || h === 'Qty' || h === 'Unit Price' ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale) => (
                    <tr key={sale.id} className="border-b border-outline-variant/40 hover:bg-secondary-container/10 transition-colors">
                      <td className="py-2 px-2 text-on-surface font-medium text-[12px]">{sale.stock?.product?.name || '—'}</td>
                      <td className="py-2 px-2 text-right text-on-surface">{sale.quantity}</td>
                      <td className="py-2 px-2 text-right text-on-surface">{fmt(sale.soldPrice)}</td>
                      <td className="py-2 px-2 text-right text-on-surface font-medium">{fmt(sale.totalPrice)}</td>
                      <td className="py-2 px-2 text-on-surface">{sale.paymentMethod || 'cash'}</td>
                      <td className="py-2 px-2 text-secondary text-[11px]">
                        {new Date(sale.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 px-2 text-secondary text-[11px]">{sale.user?.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mobile FAB */}
      <button onClick={openAdd} className="sm:hidden fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all">
        <Plus size={20} />
      </button>

      {/* ══════════ ADD SALE SHEET (updated) ══════════ */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} maxWidth="max-w-[800px]">
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-on-surface">Record Sale</h2>
            <p className="text-[11.5px] text-secondary mt-0.5">Add one or more items</p>
          </div>
          <button onClick={() => setAddOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all">
            <X size={15} />
          </button>
        </div>

        {addError && (
          <div className="mx-5 mt-3.5 px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl flex items-center gap-2">
            <AlertTriangle size={11} />{addError}
          </div>
        )}

        <div className="px-5 pt-4 space-y-3">
          {/* Payment Method */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>

          {/* Customer fields for credit */}
          {paymentMethod === 'credit' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                  Customer Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jean Habimana"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  placeholder="0788..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Sale items */}
          {newSales.map((sale, index) => (
            <div key={index} className="border border-outline-variant rounded-xl p-3 bg-background/60 space-y-2 sm:space-y-0 sm:flex sm:gap-3 sm:items-end">
              <div className="sm:flex-1">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">Stock Item</label>
                {stocksLoading ? (
                  <div className="text-secondary text-[12px] p-2">Loading…</div>
                ) : (
                  <SearchableStockSelect
                    options={allStocks}
                    value={sale.stockId}
                    onChange={(stockId, availableQty) => handleStockChange(index, stockId, availableQty)}
                    disabledIds={getDisabledIds(index)}
                  />
                )}
              </div>
              <div className="flex gap-2 sm:w-[280px]">
                <div className="flex-1">
                  <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">Qty</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={sale.quantity}
                    onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                    className={inputCls}
                    min="0"
                  />
                  {sale.availableQty > 0 && (
                    <p className="text-[9px] text-secondary mt-0.5">Max: {sale.availableQty}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">Unit Price</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={sale.soldPrice}
                    onChange={(e) => updateRow(index, 'soldPrice', e.target.value)}
                    className={inputCls}
                    min="0"
                  />
                </div>
              </div>
              <div className="hidden sm:flex items-center sm:w-24">
                {sale.quantity && sale.soldPrice && (
                  <span className="text-[12px] font-medium text-on-surface">
                    = {fmt(parseFloat(sale.quantity) * parseFloat(sale.soldPrice))}
                  </span>
                )}
              </div>
              {newSales.length > 1 && (
                <button onClick={() => removeRow(index)} className="self-end sm:self-center w-9 h-9 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-all shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          <button onClick={addRow} className="text-[11.5px] text-primary font-semibold flex items-center gap-1 py-1 hover:underline">
            <Plus size={12} /> Add another item
          </button>
        </div>

        <div className="px-5 pt-4 pb-5 flex gap-2">
          <button onClick={() => setAddOpen(false)} className="flex-1 py-2.5 text-[12.5px] font-semibold text-secondary border border-outline-variant rounded-xl hover:bg-secondary-container/30 transition-all">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={addLoading || stocksLoading} className="flex-1 py-2.5 bg-primary text-on-primary text-[12.5px] font-bold rounded-xl hover:brightness-110 disabled:opacity-55 transition-all flex items-center justify-center gap-1.5">
            <ShoppingCart size={14} />
            {addLoading ? 'Recording…' : `Record ${newSales.length > 1 ? `${newSales.length} sales` : 'sale'}`}
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default TodaySales;