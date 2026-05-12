// src/pages/PurchaseManagement/PurchaseManagement.jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  DollarSign,
  Package,
  Calendar,
  User,
  ChevronDown,
} from 'lucide-react';
import {
  fetchPurchases,
  fetchPurchaseById,
  createPurchase,
} from '../../services/main/purchaseService';
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

/* ─── Bottom Sheet Modal ─── */
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

/* ─── Searchable Product Select ─── */
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

const PurchaseManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({ totalAmount: 0, totalPurchases: 0, totalItems: 0 });

  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Add purchase modal
  const [addOpen, setAddOpen] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [supplyDate, setSupplyDate] = useState(new Date().toISOString().slice(0, 10));
  const [newItems, setNewItems] = useState([
    { productId: '', quantity: '', price: '' },
  ]);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // View purchase detail modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPurchase, setViewPurchase] = useState(null);

  const loadPurchases = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchPurchases(page);
      if (res.success) {
        setPurchases(res.data);                 // array of purchases
        setTotalItems(res.totalItems);
        setTotalPages(res.totalPages);
        setCurrentPage(res.currentPage);
        setSummary(res.summary || {});          // summary object from backend
      } else {
        setError('Failed to load purchases');
      }
    } catch {
      setError('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

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
    loadPurchases(currentPage);
  }, [currentPage]);

  useEffect(() => {
    loadProducts();
  }, []);

  // Search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter(
      (p) =>
        p.supplier?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q)
    );
  }, [purchases, search]);

  // Helpers to compute totals from each purchase's purchasedItems array
  const getPurchaseTotal = (purchase) => {
    return purchase.purchasedItems
      ? purchase.purchasedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0)
      : 0;
  };

  const getPurchaseItemCount = (purchase) => {
    return purchase.purchasedItems
      ? purchase.purchasedItems.reduce((sum, item) => sum + item.quantity, 0)
      : 0;
  };

  /* ── Add helpers ── */
  const openAdd = () => {
    setSupplier('');
    setSupplyDate(new Date().toISOString().slice(0, 10));
    setNewItems([{ productId: '', quantity: '', price: '' }]);
    setAddError('');
    setAddOpen(true);
  };

  const updateItem = (index, field, value) => {
    setNewItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removeItem = (index) => {
    if (newItems.length === 1) return;
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setNewItems((prev) => [...prev, { productId: '', quantity: '', price: '' }]);
  };

  const handleAdd = async () => {
    if (!supplier || !supplyDate || newItems.some((item) => !item.productId || !item.quantity || !item.price)) {
      setAddError('All fields are required (supplier, date, product, quantity, price)');
      return;
    }

    const invalidQty = newItems.some((item) => parseInt(item.quantity) <= 0 || parseFloat(item.price) <= 0);
    if (invalidQty) {
      setAddError('Quantity and price must be positive numbers');
      return;
    }

    const productIds = newItems.map((i) => i.productId);
    const dupes = productIds.filter((id, idx) => productIds.indexOf(id) !== idx);
    if (dupes.length > 0) {
      setAddError('Duplicate product selected. Please combine quantities for the same product.');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      const payload = {
        supplier,
        supply_date: supplyDate,
        items: newItems.map((item) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
        })),
      };
      await createPurchase(payload);
      setSuccessMsg('Purchase recorded successfully');
      setAddOpen(false);
      loadPurchases(currentPage);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Error creating purchase');
    } finally {
      setAddLoading(false);
    }
  };

  /* ── View helpers ── */
  const openView = async (purchase) => {
    try {
      const res = await fetchPurchaseById(purchase.id);
      if (res.success) {
        setViewPurchase(res.data);
        setViewOpen(true);
      } else {
        setError('Failed to load purchase details');
      }
    } catch {
      setError('Failed to load purchase details');
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setViewPurchase(null);
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const getDisabledProductIds = (currentIndex) =>
    newItems
      .filter((_, i) => i !== currentIndex)
      .map((item) => item.productId)
      .filter(Boolean);

  if (loading && purchases.length === 0) {
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
          <h1 className="text-[17px] font-bold text-on-surface tracking-tight">Purchases</h1>
          <p className="text-[11px] text-secondary mt-0.5">{totalItems} total</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
          >
            <Plus size={13} />
            New Purchase
          </button>
        )}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatCard
          icon={DollarSign}
          label="Total Amount"
          value={fmt(summary.totalAmount || 0)}
          accent="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={ShoppingCart}
          label="Purchases"
          value={summary.totalPurchases || 0}
          accent="bg-success-container/60"
          iconColor="text-success"
        />
        <StatCard
          icon={Package}
          label="Items"
          value={summary.totalItems || 0}
          accent="bg-tertiary-container/60"
          iconColor="text-tertiary"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
        <input
          type="text"
          placeholder="Search by supplier or user..."
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

      {/* Purchase list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-secondary bg-surface border border-outline-variant rounded-2xl">
          <ShoppingCart size={32} strokeWidth={1.2} className="opacity-25" />
          <p className="text-[12.5px]">{search ? `No results for "${search}"` : 'No purchases recorded'}</p>
          {isAdmin && !search && (
            <button onClick={openAdd} className="text-[11.5px] text-primary font-semibold hover:underline">
              Record the first purchase →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-1.5">
            {filtered.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-surface border border-outline-variant rounded-xl px-3.5 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[12.5px] text-on-surface truncate">
                    {purchase.supplier || 'No supplier'}
                  </p>
                  <p className="text-[10.5px] text-secondary">
                    {new Date(purchase.supply_date).toLocaleDateString('en-GB')} · {getPurchaseItemCount(purchase)} item(s)
                  </p>
                  <p className="text-[10.5px] text-secondary">
                    Total: {fmt(getPurchaseTotal(purchase))}
                  </p>
                </div>
                <button
                  onClick={() => openView(purchase)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-all"
                >
                  <Eye size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">
                All Purchases
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-outline-variant bg-background/50">
                  <tr>
                    {['Date', 'Supplier', 'Items', 'Total', 'Recorded by', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className={`py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide ${
                          h === 'Total' || h === 'Items' || h === 'Actions' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-outline-variant/40 last:border-0 hover:bg-secondary-container/10 transition-colors"
                    >
                      <td className="py-3 px-4 text-[12px]">
                        {new Date(purchase.supply_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 text-on-surface font-medium text-[12.5px]">
                        {purchase.supplier || '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-[12px] text-on-surface">
                        {getPurchaseItemCount(purchase)}
                      </td>
                      <td className="py-3 px-4 text-right text-[12px] font-medium">
                        {fmt(getPurchaseTotal(purchase))}
                      </td>
                      <td className="py-3 px-4 text-secondary text-[11.5px]">
                        {purchase.user?.email || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openView(purchase)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-all"
                          title="View details"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-outline-variant/50 text-[10.5px] text-secondary">
              Showing {filtered.length} of {totalItems} purchase{totalItems !== 1 ? 's' : ''}
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

      {/* Mobile FAB */}
      {isAdmin && (
        <button
          onClick={openAdd}
          className="sm:hidden fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      )}

      {/* ══════════ ADD PURCHASE SHEET ══════════ */}
      {isAdmin && (
        <Sheet open={addOpen} onClose={() => setAddOpen(false)} maxWidth="max-w-[800px]">
          <div className="px-5 pt-5 pb-0 flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-on-surface">New Purchase</h2>
              <p className="text-[11.5px] text-secondary mt-0.5">
                Enter supplier, date, and items
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
            {/* Supplier & Date row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                  Supplier
                </label>
                <input
                  type="text"
                  placeholder="Supplier name"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="w-40">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={supplyDate}
                  onChange={(e) => setSupplyDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Items rows – responsive stacking */}
            <div className="space-y-3">
              {newItems.map((item, index) => (
                <div
                  key={index}
                  className="border border-outline-variant rounded-xl p-3 bg-background/60 space-y-2 sm:space-y-0 sm:flex sm:gap-2 sm:items-end"
                >
                  <div className="sm:flex-1">
                    <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                      Product
                    </label>
                    {productsLoading ? (
                      <div className="text-secondary text-[12px] p-2">Loading…</div>
                    ) : (
                      <SearchableProductSelect
                        options={allProducts}
                        value={item.productId}
                        onChange={(val) => updateItem(index, 'productId', val)}
                        disabledIds={getDisabledProductIds(index)}
                      />
                    )}
                  </div>
                  <div className="flex gap-2 sm:w-[200px]">
                    <div className="flex-1">
                      <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className={inputCls}
                        min="1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                        className={inputCls}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center sm:w-24">
                    {item.quantity && item.price && (
                      <span className="text-[12px] font-medium text-on-surface">
                        = {fmt(parseFloat(item.quantity) * parseFloat(item.price))}
                      </span>
                    )}
                  </div>
                  {newItems.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="self-end sm:self-center w-9 h-9 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-all flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addItem}
                className="text-[11.5px] text-primary font-semibold flex items-center gap-1 py-1 hover:underline"
              >
                <Plus size={12} />
                Add another item
              </button>
            </div>
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
              disabled={addLoading || productsLoading}
              className="flex-1 py-2.5 bg-primary text-on-primary text-[12.5px] font-bold rounded-xl hover:brightness-110 disabled:opacity-55 transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingCart size={14} />
              {addLoading ? 'Creating…' : 'Record Purchase'}
            </button>
          </div>
        </Sheet>
      )}

      {/* ══════════ VIEW PURCHASE DETAIL SHEET ══════════ */}
      <Sheet open={viewOpen} onClose={closeView} maxWidth="max-w-[640px]">
        {viewPurchase && (
          <>
            <div className="px-5 pt-5 pb-0 flex items-start justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-on-surface">Purchase Details</h2>
                <p className="text-[11.5px] text-secondary mt-0.5">
                  {viewPurchase.supplier ? `${viewPurchase.supplier} · ` : ''}
                  {new Date(viewPurchase.supply_date).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button
                onClick={closeView}
                className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 pt-4 space-y-4">
              <div className="flex items-center gap-4 text-[13px] text-secondary">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{new Date(viewPurchase.supply_date).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{viewPurchase.user?.email || '—'}</span>
                </div>
                {viewPurchase.supplier && (
                  <div className="flex items-center gap-1">
                    <Package size={12} />
                    <span>{viewPurchase.supplier}</span>
                  </div>
                )}
              </div>

              {/* Items table */}
              <div className="border border-outline-variant rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="border-b border-outline-variant bg-background/50">
                    <tr>
                      <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-secondary uppercase">Product</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-semibold text-secondary uppercase">Qty</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-semibold text-secondary uppercase">Unit Price</th>
                      <th className="text-right py-2.5 px-3 text-[10px] font-semibold text-secondary uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewPurchase.purchasedItems?.map((item) => (
                      <tr key={item.id} className="border-b border-outline-variant/30 last:border-0">
                        <td className="py-2 px-3 text-on-surface font-medium text-[12px]">
                          {item.product?.name || '—'}
                        </td>
                        <td className="py-2 px-3 text-right text-on-surface">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-on-surface">{fmt(item.price)}</td>
                        <td className="py-2 px-3 text-right text-on-surface font-medium">{fmt(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-primary-container/10">
                      <td colSpan="3" className="py-2 px-3 text-right text-[11px] font-semibold text-on-surface">
                        Total
                      </td>
                      <td className="py-2 px-3 text-right text-[11px] font-bold text-on-surface">
                        {fmt(viewPurchase.purchasedItems?.reduce((sum, i) => sum + parseFloat(i.totalPrice || 0), 0))}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="py-2 px-3 text-right text-[11px] text-secondary">
                        Total Items
                      </td>
                      <td className="py-2 px-3 text-right text-[11px] text-secondary">
                        {viewPurchase.purchasedItems?.reduce((sum, i) => sum + i.quantity, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-5 pt-4 pb-5 flex justify-end">
              <button
                onClick={closeView}
                className="px-5 py-2.5 text-[13px] font-medium text-secondary border border-outline-variant rounded-lg hover:bg-secondary-container/30 hover:text-on-surface transition-all"
              >
                Close
              </button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
};

export default PurchaseManagement;