// src/pages/ProductManagement/ProductManagement.jsx
import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  X,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react';
import {
  fetchProducts,
  createProducts,
  updateProduct,
  deleteProduct,
} from '../../services/main/productService';
import { useAuth } from '../../context/AuthContext';   // still needed for user info if used elsewhere, but no role check now

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, accent, iconColor, valueColor }) => (
  <div className="flex items-center gap-2.5 bg-surface border border-outline-variant rounded-xl px-3 py-2.5 shadow-sm">
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={13} className={iconColor} />
    </div>
    <div className="min-w-0">
      <p className="text-[9.5px] text-secondary font-semibold uppercase tracking-wide leading-none mb-0.5 truncate">{label}</p>
      <p className={`text-[17px] font-bold leading-tight ${valueColor || 'text-on-surface'}`}>{value}</p>
    </div>
  </div>
);

/* ─── Stock Badge ─── */
const StockBadge = ({ qty }) => {
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[9.5px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-error inline-block" />
        Out
      </span>
    );
  if (qty < 10)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-container text-on-warning-container text-[9.5px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
        Low · {qty}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container/40 text-on-primary-container text-[9.5px] font-semibold">
      {qty}
    </span>
  );
};

const UNITS = [
  'piece', 'pack', 'bottle', 'can', 'carton', 'box', 'bag',
  'kg', 'g', 'L', 'ml', 'loaf',
];

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

const inputCls =
  'w-full px-3.5 py-2.5 bg-background border border-outline-variant rounded-xl text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all';

const fmt = (n) =>
  new Intl.NumberFormat('fr-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(n);

const ProductManagement = () => {
  // Remove admin role check – all users can now manage products
  // const { user } = useAuth();  // kept if you need user elsewhere, but not for role
  const { user } = useAuth();   // user object available if you need user info later

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  /* Create */
  const [createOpen, setCreateOpen] = useState(false);
  const [newProducts, setNewProducts] = useState([{ name: '', unit: 'piece' }]);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  /* Edit */
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', unit: '' });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  /* Delete */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch products
  const loadProducts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchProducts(page);
      setProducts(res.data);
      setTotalProducts(res.totalProducts);
      setTotalPages(res.totalPages);
      setCurrentPage(res.currentPage);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage]);

  // Stats
  const inStockCount = useMemo(
    () => products.filter((p) => p.stock && p.stock.quantity > 0).length,
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock && p.stock.quantity < 10).length,
    [products]
  );

  // Filter by search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  /* ── Create handlers (bulk) ── */
  const openCreate = () => {
    setNewProducts([{ name: '', unit: 'piece' }]);
    setCreateError('');
    setCreateOpen(true);
  };

  const updateRow = (i, field, val) =>
    setNewProducts((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

  const removeRow = (index) => {
    if (newProducts.length === 1) return;
    setNewProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setNewProducts((prev) => [...prev, { name: '', unit: 'piece' }]);
  };

  const handleCreate = async () => {
    if (newProducts.some((p) => !p.name.trim())) {
      setCreateError('All product names are required');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      await createProducts(newProducts);
      setSuccessMsg('Products created successfully');
      setCreateOpen(false);
      loadProducts(currentPage);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error creating products');
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── Edit handlers ── */
  const openEdit = (product) => {
    setEditingProduct(product);
    setEditForm({ name: product.name, unit: product.unit });
    setEditError('');
    setEditOpen(true);
  };

  const closeEdit = () => setEditOpen(false);

  const handleEdit = async () => {
    if (!editForm.name.trim()) {
      setEditError('Product name is required');
      return;
    }
    setEditLoading(true);
    try {
      await updateProduct(editingProduct.id, editForm);
      setSuccessMsg('Product updated');
      closeEdit();
      loadProducts(currentPage);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error updating product');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete handlers ── */
  const openDelete = (product) => {
    setProductToDelete(product);
    setDeleteOpen(true);
  };

  const closeDelete = () => setDeleteOpen(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      setSuccessMsg('Product deleted');
      closeDelete();
      loadProducts(currentPage);
    } catch {
      setError('Failed to delete product');
      closeDelete();
    } finally {
      setDeleteLoading(false);
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

  if (loading && products.length === 0) {
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
          <h1 className="text-[17px] font-bold text-on-surface tracking-tight">Products</h1>
          <p className="text-[11px] text-secondary mt-0.5">{totalProducts} total</p>
        </div>
        {/* Add button always visible now */}
        <button
          onClick={openCreate}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={13} />
          Add products
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
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={ShoppingBag}
          label="Total"
          value={totalProducts}
          accent="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={Package}
          label="In stock"
          value={inStockCount}
          accent="bg-primary-container/60"
          iconColor="text-on-primary-container"
        />
        <StatCard
          icon={TrendingDown}
          label="Low stock"
          value={lowStockCount}
          accent="bg-error-container/60"
          iconColor="text-error"
          valueColor={lowStockCount > 0 ? 'text-error' : 'text-on-surface'}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
        <input
          type="text"
          placeholder="Search products..."
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

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-secondary bg-surface border border-outline-variant rounded-2xl">
          <Package size={32} strokeWidth={1.2} className="opacity-25" />
          <p className="text-[12.5px]">{search ? `No results for "${search}"` : 'No products yet'}</p>
          <button onClick={openCreate} className="text-[11.5px] text-primary font-semibold hover:underline">
            Add the first product →
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-1.5">
            {filtered.map((product) => {
              const qty = product.stock?.quantity ?? 0;
              const price = product.stock?.sellingPrice ?? 0;
              return (
                <div
                  key={product.id}
                  className="bg-surface border border-outline-variant rounded-xl px-3.5 py-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-container/30 flex items-center justify-center flex-shrink-0">
                    <Package size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[12.5px] text-on-surface truncate">{product.name}</p>
                      <StockBadge qty={qty} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10.5px] text-secondary">{product.unit}</span>
                      <span className="text-[10.5px] text-secondary">·</span>
                      <span className="text-[10.5px] text-secondary">{fmt(price)}</span>
                    </div>
                  </div>
                  {/* Actions always visible */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(product)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-all"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => openDelete(product)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/40 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">All products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-outline-variant bg-background/50">
                  <tr>
                    <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide">Product</th>
                    <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide">Unit</th>
                    <th className="text-right py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide">Price (sell)</th>
                    <th className="text-right py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide">Quantity</th>
                    {/* Actions always visible */}
                    <th className="text-right py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const qty = product.stock?.quantity ?? 0;
                    const price = product.stock?.sellingPrice ?? 0;
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-outline-variant/40 last:border-0 hover:bg-secondary-container/10 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[12.5px] text-on-surface">{product.name}</span>
                        </td>
                        <td className="py-3 px-4 text-secondary text-[12px]">{product.unit}</td>
                        <td className="py-3 px-4 text-right text-on-surface text-[12px]">{fmt(price)}</td>
                        <td className="py-3 px-4 text-right">
                          <StockBadge qty={qty} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(product)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-all"
                              title="Edit"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => openDelete(product)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/40 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-outline-variant/50 text-[10.5px] text-secondary">
              Showing {filtered.length} of {totalProducts} product{totalProducts !== 1 ? 's' : ''}
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
      <button
        onClick={openCreate}
        className="sm:hidden fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* ══════════ CREATE SHEET (bulk) ══════════ */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="max-w-[640px]">
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-on-surface">Add Products</h2>
            <p className="text-[11.5px] text-secondary mt-0.5">Create one or multiple at once</p>
          </div>
          <button
            onClick={() => setCreateOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {createError && (
          <div className="mx-5 mt-3.5 px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl flex items-center gap-2">
            <AlertTriangle size={11} />{createError}
          </div>
        )}

        <div className="px-5 pt-4 space-y-3">
          {newProducts.map((prod, i) => (
            <div key={i} className="flex gap-2 items-end border border-outline-variant rounded-xl p-3 bg-background/60">
              <div className="flex-1">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Milk"
                  value={prod.name}
                  onChange={(e) => updateRow(i, 'name', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="w-32">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">Unit</label>
                <select
                  value={prod.unit}
                  onChange={(e) => updateRow(i, 'unit', e.target.value)}
                  className={inputCls}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {newProducts.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
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
            <Plus size={12} />Add another product
          </button>
        </div>

        <div className="px-5 pt-4 pb-5 flex gap-2">
          <button
            onClick={() => setCreateOpen(false)}
            className="flex-1 py-2.5 text-[12.5px] font-semibold text-secondary border border-outline-variant rounded-xl hover:bg-secondary-container/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={createLoading}
            className="flex-1 py-2.5 bg-primary text-on-primary text-[12.5px] font-bold rounded-xl hover:brightness-110 disabled:opacity-55 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            {createLoading ? 'Creating…' : `Create ${newProducts.length > 1 ? `${newProducts.length} products` : 'product'}`}
          </button>
        </div>
      </Sheet>

      {/* ══════════ EDIT SHEET ══════════ */}
      <Sheet open={editOpen} onClose={closeEdit}>
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-on-surface">Edit Product</h2>
            <p className="text-[11.5px] text-secondary mt-0.5 truncate max-w-[220px]">{editingProduct?.name}</p>
          </div>
          <button onClick={closeEdit} className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all">
            <X size={15} />
          </button>
        </div>

        {editError && (
          <div className="mx-5 mt-3.5 px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl">{editError}</div>
        )}

        <div className="px-5 pt-4 space-y-3.5">
          <Field label="Product name">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Unit">
            <select
              value={editForm.unit}
              onChange={(e) => setEditForm((p) => ({ ...p, unit: e.target.value }))}
              className={inputCls}
            >
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
        </div>

        <div className="px-5 pt-4 pb-5 flex gap-2">
          <button onClick={closeEdit} className="flex-1 py-2.5 text-[12.5px] font-semibold text-secondary border border-outline-variant rounded-xl hover:bg-secondary-container/30 transition-all">
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={editLoading}
            className="flex-1 py-2.5 bg-primary text-on-primary text-[12.5px] font-bold rounded-xl hover:brightness-110 disabled:opacity-55 transition-all"
          >
            {editLoading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </Sheet>

      {/* ══════════ DELETE SHEET ══════════ */}
      <Sheet open={deleteOpen} onClose={closeDelete}>
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-error-container flex items-center justify-center flex-shrink-0">
              <Trash2 size={15} className="text-error" />
            </div>
            <div>
              <h2 className="text-[14.5px] font-bold text-on-surface">Delete product?</h2>
              <p className="text-[11px] text-secondary mt-0.5">This cannot be undone</p>
            </div>
          </div>
          <button onClick={closeDelete} className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-0">
          <div className="bg-error-container/30 border border-error-container rounded-xl px-3.5 py-3 text-[12.5px] text-on-surface">
            You're about to permanently delete{' '}
            <span className="font-bold">{productToDelete?.name}</span>.
            All associated stock and sales data will also be removed.
          </div>
        </div>

        <div className="mx-5 mt-5 border-t border-outline-variant/50" />

        <div className="flex gap-2.5 justify-end px-5 py-5">
          <button onClick={closeDelete} disabled={deleteLoading} className="px-5 py-2.5 text-[13px] font-medium text-secondary border border-outline-variant rounded-lg hover:bg-secondary-container/30 hover:text-on-surface transition-all disabled:opacity-55">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-error text-on-error text-[13px] font-semibold rounded-lg hover:brightness-110 disabled:opacity-55 transition-all"
          >
            <Trash2 size={14} />
            {deleteLoading ? 'Deleting…' : 'Delete product'}
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default ProductManagement;