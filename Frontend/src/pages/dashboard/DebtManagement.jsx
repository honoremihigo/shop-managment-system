// src/pages/DebtManagement/DebtManagement.jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Plus,
  ChevronDown,
  User,
  Phone,
  Package,
} from 'lucide-react';
import {
  fetchAllDebts,
  makePayment,
  createLegacyDebt,
} from '../../services/main/debtService';
import { fetchAllProducts } from '../../services/main/productService';
import { useAuth } from '../../context/AuthContext';

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

/* ─── Searchable Product Select (local definition) ─── */
const SearchableProductSelect = ({ options, value, onChange, disabledIds = [] }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const available = options.filter((p) => !disabledIds.includes(p.id) || p.id === value);
  const filtered = available.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find((p) => p.id === value);

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
          {selected ? selected.name : 'Select product'}
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
              <p className="px-3 py-2 text-xs text-secondary">No products found</p>
            ) : (
              filtered.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    onChange(product.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-primary-container/20 transition-colors ${
                    product.id === value ? 'bg-primary-container/30 font-medium' : ''
                  }`}
                >
                  {product.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DebtManagement = () => {
  const { user } = useAuth();

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Payment modal
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Legacy debt modal
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [legacyProductId, setLegacyProductId] = useState('');
  const [legacyCustomerName, setLegacyCustomerName] = useState('');
  const [legacyCustomerPhone, setLegacyCustomerPhone] = useState('');
  const [legacyQuantity, setLegacyQuantity] = useState('');
  const [legacyPrice, setLegacyPrice] = useState('');
  const [legacyError, setLegacyError] = useState('');
  const [legacyLoading, setLegacyLoading] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch debts
  const loadDebts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchAllDebts(page);
      if (res.success) {
        setDebts(res.debts);
        setTotalItems(res.totalItems);
        setTotalPages(res.totalPages);
        setCurrentPage(res.currentPage);
      } else {
        setError('Failed to load debts');
      }
    } catch {
      setError('Failed to load debts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all products for legacy dropdown
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const prods = await fetchAllProducts();
      setAllProducts(prods);
    } catch {
      setError('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadDebts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    loadProducts();
  }, []);

  // Stats
  const totalOutstanding = useMemo(
    () =>
      debts
        .filter((d) => d.status === 'pending')
        .reduce((sum, d) => sum + (parseFloat(d.totalAmount) - parseFloat(d.paidAmount)), 0),
    [debts]
  );
  const pendingCount = useMemo(
    () => debts.filter((d) => d.status === 'pending').length,
    [debts]
  );
  const paidCount = useMemo(
    () => debts.filter((d) => d.status === 'paid').length,
    [debts]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return debts;
    return debts.filter(
      (d) =>
        d.customerName?.toLowerCase().includes(q) ||
        d.customerPhone?.includes(q) ||
        d.sale?.stock?.product?.name?.toLowerCase().includes(q) ||
        d.product?.name?.toLowerCase().includes(q) // legacy debts
    );
  }, [debts, search]);

  // Payment handlers
  const openPayment = (debt) => {
    setSelectedDebt(debt);
    setPaymentAmount('');
    setPaymentError('');
    setPaymentOpen(true);
  };

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError('Enter a valid amount');
      return;
    }
    const remaining = parseFloat(selectedDebt.totalAmount) - parseFloat(selectedDebt.paidAmount);
    if (amount > remaining) {
      setPaymentError(`Amount cannot exceed remaining ${fmt(remaining)}`);
      return;
    }
    setPaymentLoading(true);
    try {
      await makePayment(selectedDebt.id, paymentAmount);
      setSuccessMsg('Payment recorded');
      setPaymentOpen(false);
      loadDebts(currentPage);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Error');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Legacy debt handlers
  const openLegacy = () => {
    setLegacyProductId('');
    setLegacyCustomerName('');
    setLegacyCustomerPhone('');
    setLegacyQuantity('');
    setLegacyPrice('');
    setLegacyError('');
    setLegacyOpen(true);
  };

  const handleLegacyCreate = async () => {
    if (!legacyProductId || !legacyQuantity || !legacyPrice) {
      setLegacyError('Product, quantity, and price are required');
      return;
    }
    if (parseFloat(legacyQuantity) <= 0 || parseFloat(legacyPrice) <= 0) {
      setLegacyError('Quantity and price must be positive');
      return;
    }
    setLegacyLoading(true);
    try {
      await createLegacyDebt({
        productId: legacyProductId,
        customerName: legacyCustomerName || undefined,
        customerPhone: legacyCustomerPhone || undefined,
        quantity: legacyQuantity,
        price: legacyPrice,
      });
      setSuccessMsg('Old debt recorded');
      setLegacyOpen(false);
      loadDebts(currentPage);
    } catch (err) {
      setLegacyError(err.response?.data?.message || 'Error');
    } finally {
      setLegacyLoading(false);
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

  if (loading && debts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans antialiased pb-24 sm:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-on-surface tracking-tight">Debts</h1>
          <p className="text-[11px] text-secondary mt-0.5">{totalItems} records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openLegacy}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
          >
            <Plus size={13} />
            Old Debt
          </button>
        </div>
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
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={CreditCard}
          label="Total"
          value={totalItems}
          accent="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending"
          value={pendingCount}
          accent="bg-warning-container/60"
          iconColor="text-warning"
          valueColor="text-warning"
        />
        <StatCard
          icon={DollarSign}
          label="Outstanding"
          value={fmt(totalOutstanding)}
          accent="bg-error-container/60"
          iconColor="text-error"
          valueColor="text-error"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, phone, or product..."
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

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-secondary bg-surface border border-outline-variant rounded-2xl">
          <CreditCard size={32} strokeWidth={1.2} className="opacity-25" />
          <p className="text-[12.5px]">{search ? 'No matching debts' : 'No debts recorded'}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-1.5">
            {filtered.map((debt) => {
              const remaining = parseFloat(debt.totalAmount) - parseFloat(debt.paidAmount);
              return (
                <div key={debt.id} className="bg-surface border border-outline-variant rounded-xl px-3.5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[12.5px] text-on-surface truncate">
                      {debt.customerName || 'Unknown'}
                    </p>
                    <p className="text-[10.5px] text-secondary">
                      {debt.sale?.stock?.product?.name || debt.product?.name || '—'} · {fmt(debt.totalAmount)}
                    </p>
                    <p className="text-[10.5px] text-secondary">
                      Paid: {fmt(debt.paidAmount)} · Remaining: {fmt(remaining)}
                    </p>
                    {debt.status === 'paid' ? (
                      <span className="text-[10px] text-success font-medium">Paid</span>
                    ) : (
                      <button onClick={() => openPayment(debt)} className="text-[10px] text-primary font-semibold mt-1 underline">
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">All Debts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-outline-variant bg-background/50">
                  <tr>
                    {['Customer', 'Phone', 'Product', 'Total', 'Paid', 'Remaining', 'Status', 'Action'].map(h => (
                      <th key={h} className={`py-2.5 px-2 text-[10px] font-semibold text-secondary uppercase tracking-wide ${h === 'Action' || h === 'Total' || h === 'Paid' || h === 'Remaining' ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(debt => {
                    const remaining = parseFloat(debt.totalAmount) - parseFloat(debt.paidAmount);
                    return (
                      <tr key={debt.id} className="border-b border-outline-variant/40 hover:bg-secondary-container/10 transition-colors">
                        <td className="py-2 px-2 text-on-surface font-medium text-[12px]">{debt.customerName || '—'}</td>
                        <td className="py-2 px-2 text-secondary text-[11px]">{debt.customerPhone || '—'}</td>
                        <td className="py-2 px-2 text-on-surface text-[11px]">{debt.sale?.stock?.product?.name || debt.product?.name || '—'}</td>
                        <td className="py-2 px-2 text-right text-on-surface font-medium">{fmt(debt.totalAmount)}</td>
                        <td className="py-2 px-2 text-right text-success">{fmt(debt.paidAmount)}</td>
                        <td className="py-2 px-2 text-right text-error font-medium">{fmt(remaining)}</td>
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold ${debt.status === 'paid' ? 'bg-success-container text-on-success-container' : 'bg-warning-container text-on-warning-container'}`}>
                            {debt.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          {debt.status !== 'paid' && (
                            <button onClick={() => openPayment(debt)} className="text-[11px] text-primary font-semibold hover:underline">
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-outline-variant/50 text-[10.5px] text-secondary">
              Showing {filtered.length} of {totalItems} debt{totalItems !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-secondary">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-1.5">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-secondary disabled:opacity-40 hover:bg-secondary-container/30 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-secondary disabled:opacity-40 hover:bg-secondary-container/30 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mobile FAB for legacy debt */}
      <button
        onClick={openLegacy}
        className="sm:hidden fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* ══════════ RECORD PAYMENT SHEET ══════════ */}
      <Sheet open={paymentOpen} onClose={() => setPaymentOpen(false)}>
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-on-surface">Record Payment</h2>
            <p className="text-[11.5px] text-secondary mt-0.5">
              {selectedDebt?.customerName || 'Customer'} · Remaining: {selectedDebt ? fmt(parseFloat(selectedDebt.totalAmount) - parseFloat(selectedDebt.paidAmount)) : ''}
            </p>
          </div>
          <button onClick={() => setPaymentOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all">
            <X size={15} />
          </button>
        </div>

        {paymentError && (
          <div className="mx-5 mt-3.5 px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl">{paymentError}</div>
        )}

        <div className="px-5 pt-4 space-y-3.5">
          <div>
            <label className="block text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1.5">Amount (RWF)</label>
            <input
              type="number"
              placeholder="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className={inputCls}
              min="0"
              step="any"
            />
          </div>
        </div>

        <div className="px-5 pt-4 pb-5 flex gap-2">
          <button onClick={() => setPaymentOpen(false)} className="flex-1 py-2.5 text-[12.5px] font-semibold text-secondary border border-outline-variant rounded-xl hover:bg-secondary-container/30 transition-all">
            Cancel
          </button>
          <button onClick={handlePayment} disabled={paymentLoading} className="flex-1 py-2.5 bg-primary text-on-primary text-[12.5px] font-bold rounded-xl hover:brightness-110 disabled:opacity-55 transition-all">
            {paymentLoading ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </Sheet>

      {/* ══════════ ADD OLD DEBT SHEET ══════════ */}
      <Sheet open={legacyOpen} onClose={() => setLegacyOpen(false)} maxWidth="max-w-[600px]">
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-on-surface">Add Old Debt</h2>
            <p className="text-[11.5px] text-secondary mt-0.5">Record a debt from before the system</p>
          </div>
          <button onClick={() => setLegacyOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all">
            <X size={15} />
          </button>
        </div>

        {legacyError && (
          <div className="mx-5 mt-3.5 px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl">{legacyError}</div>
        )}

        <div className="px-5 pt-4 space-y-3.5">
          <div>
            <label className="block text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1.5">Product</label>
            {productsLoading ? (
              <div className="text-secondary text-[12px]">Loading products…</div>
            ) : (
              <SearchableProductSelect
                options={allProducts}
                value={legacyProductId}
                onChange={setLegacyProductId}
              />
            )}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1.5">Customer Name</label>
              <input
                value={legacyCustomerName}
                onChange={(e) => setLegacyCustomerName(e.target.value)}
                className={inputCls}
                placeholder="Optional"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1.5">Phone</label>
              <input
                value={legacyCustomerPhone}
                onChange={(e) => setLegacyCustomerPhone(e.target.value)}
                className={inputCls}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1.5">Quantity (e.g. 2.5 kg)</label>
              <input
                type="number"
                step="any"
                value={legacyQuantity}
                onChange={(e) => setLegacyQuantity(e.target.value)}
                className={inputCls}
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1.5">Price per unit</label>
              <input
                type="number"
                step="any"
                value={legacyPrice}
                onChange={(e) => setLegacyPrice(e.target.value)}
                className={inputCls}
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-5 flex gap-2">
          <button onClick={() => setLegacyOpen(false)} className="flex-1 py-2.5 text-[12.5px] font-semibold text-secondary border border-outline-variant rounded-xl hover:bg-secondary-container/30 transition-all">
            Cancel
          </button>
          <button onClick={handleLegacyCreate} disabled={legacyLoading || productsLoading} className="flex-1 py-2.5 bg-primary text-on-primary text-[12.5px] font-bold rounded-xl hover:brightness-110 disabled:opacity-55 transition-all">
            {legacyLoading ? 'Saving…' : 'Record Debt'}
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default DebtManagement;