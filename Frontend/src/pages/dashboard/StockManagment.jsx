// src/pages/StockManagement/StockManagement.jsx
import { useEffect, useState, useMemo, useRef } from "react";
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
  Boxes,
  ChevronDown,
} from "lucide-react";
import {
  fetchStocks,
  addStock,
  updateStock,
  deleteStock,
  fetchAllProducts,
} from "../../services/main/stockService";
import { useAuth } from "../../context/AuthContext";

/* ─── Stat Card ─── */
const StatCard = ({
  icon: Icon,
  label,
  value,
  accent,
  iconColor,
  valueColor,
}) => (
  <div className="flex items-center gap-2.5 bg-surface border border-outline-variant rounded-xl px-3 py-2.5 shadow-sm">
    <div
      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}
    >
      <Icon size={13} className={iconColor} />
    </div>
    <div className="min-w-0">
      <p className="text-[9.5px] text-secondary font-semibold uppercase tracking-wide leading-none mb-0.5 truncate">
        {label}
      </p>
      <p
        className={`text-[17px] font-bold leading-tight ${valueColor || "text-on-surface"}`}
      >
        {value}
      </p>
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

/* ─── Bottom Sheet / Modal wrapper ─── */
const Sheet = ({ open, onClose, children, maxWidth = "max-w-[520px]" }) => {
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

/* ─── Searchable Product Select ─── */
const SearchableSelect = ({ options, value, onChange, disabledIds = [] }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const available = options.filter(
    (p) => !disabledIds.includes(p.id) || p.id === value,
  );
  const filtered = available.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = options.find((p) => p.id === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${inputCls} flex items-center justify-between text-left`}
      >
        <span className={selected ? "text-on-surface" : "text-secondary"}>
          {selected ? selected.name : "Select product"}
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
              <p className="px-3 py-2 text-xs text-secondary">
                No products found
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-primary-container/20 transition-colors ${
                    p.id === value ? "bg-primary-container/30 font-medium" : ""
                  }`}
                >
                  {p.name}
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
  "w-full px-3.5 py-2.5 bg-background border border-outline-variant rounded-xl text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all";

const fmt = (n) =>
  new Intl.NumberFormat("fr-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  }).format(n);

const StockManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  /* Create – bulk array */
  const [createOpen, setCreateOpen] = useState(false);
  const [newStocks, setNewStocks] = useState([
    { product_id: "", quantity: "", costPrice: "", sellingPrice: "" },
  ]);
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  /* Edit */
  const [editOpen, setEditOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [editForm, setEditForm] = useState({
    quantity: "",
    costPrice: "",
    sellingPrice: "",
  });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  /* Delete */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadStocks = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchStocks(page);
      setStocks(res.data);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
      setCurrentPage(res.currentPage);
    } catch {
      setError("Failed to load stock records");
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
      setError("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadStocks(currentPage);
  }, [currentPage]);

  useEffect(() => {
    loadProducts();
  }, []);

  const inStockCount = useMemo(
    () => stocks.filter((s) => s.quantity > 0).length,
    [stocks],
  );
  const lowStockCount = useMemo(
    () => stocks.filter((s) => s.quantity < 10).length,
    [stocks],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter(
      (s) =>
        s.product?.name?.toLowerCase().includes(q) ||
        s.product?.unit?.toLowerCase().includes(q),
    );
  }, [stocks, search]);

  /* ── Create helpers (bulk) ── */
  const openCreate = () => {
    setNewStocks([
      { product_id: "", quantity: "", costPrice: "", sellingPrice: "" },
    ]);
    setCreateError("");
    setCreateOpen(true);
  };

  const updateRow = (index, field, value) => {
    setNewStocks((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const removeRow = (index) => {
    if (newStocks.length === 1) return;
    setNewStocks((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setNewStocks((prev) => [
      ...prev,
      { product_id: "", quantity: "", costPrice: "", sellingPrice: "" },
    ]);
  };

  const handleCreate = async () => {
    const invalid = newStocks.some(
      (s) => !s.product_id || !s.quantity || !s.costPrice || !s.sellingPrice,
    );
    if (invalid) {
      setCreateError("All fields are required for each stock entry");
      return;
    }

    // Duplicate check
    const productIds = newStocks.map((s) => s.product_id);
    const dupes = productIds.filter(
      (id, idx) => productIds.indexOf(id) !== idx,
    );
    if (dupes.length > 0) {
      setCreateError(
        "You cannot select the same product twice in one submission.",
      );
      return;
    }

    setCreateLoading(true);
    setCreateError("");
    try {
      const payload = newStocks.map((s) => ({
        product_id: s.product_id,
        quantity: Number(s.quantity),
        costPrice: Number(s.costPrice),
        sellingPrice: Number(s.sellingPrice),
      }));
      await addStock(payload);
      setSuccessMsg(`${payload.length} stock record(s) added`);
      setCreateOpen(false);
      loadStocks(currentPage);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Error adding stock");
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── Edit handlers ── */
  const openEdit = (stock) => {
    setEditingStock(stock);
    setEditForm({
      quantity: stock.quantity || "",
      costPrice: stock.costPrice || "",
      sellingPrice: stock.sellingPrice || "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editForm.quantity && !editForm.costPrice && !editForm.sellingPrice) {
      setEditError("At least one field must be updated");
      return;
    }
    setEditLoading(true);
    try {
      await updateStock(editingStock.id, {
        quantity: editForm.quantity ? Number(editForm.quantity) : undefined,
        costPrice: editForm.costPrice ? Number(editForm.costPrice) : undefined,
        sellingPrice: editForm.sellingPrice
          ? Number(editForm.sellingPrice)
          : undefined,
      });
      setSuccessMsg("Stock updated");
      setEditOpen(false);
      loadStocks(currentPage);
    } catch (err) {
      setEditError(err.response?.data?.message || "Error updating stock");
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete handlers ── */
  const openDelete = (stock) => {
    setStockToDelete(stock);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteStock(stockToDelete.id);
      setSuccessMsg("Stock deleted");
      setDeleteOpen(false);
      loadStocks(currentPage);
    } catch {
      setError("Failed to delete stock");
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (loading && stocks.length === 0 && productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Helper for duplicate detection
  const getDisabledIds = (currentIndex) =>
    newStocks
      .filter((_, i) => i !== currentIndex)
      .map((s) => s.product_id)
      .filter(Boolean);

  return (
    <div className="relative space-y-4 font-sans antialiased pb-24 sm:pb-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-on-surface tracking-tight">
            Stock
          </h1>
          <p className="text-[11px] text-secondary mt-0.5">
            {totalItems} records
          </p>
        </div>
        <button
          onClick={openCreate}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={13} />
          Add stock
        </button>
      </div>

      {/* ─── Toast banners ─── */}
      {error && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl">
          <span className="flex items-center gap-2">
            <AlertTriangle size={12} />
            {error}
          </span>
          <button onClick={() => setError("")}>
            <X size={12} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-primary-container text-on-primary-container text-[11.5px] rounded-xl">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={Boxes}
          label="Total"
          value={totalItems}
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
          icon={AlertTriangle}
          label="Low stock"
          value={lowStockCount}
          accent="bg-error-container/60"
          iconColor="text-error"
          valueColor={lowStockCount > 0 ? "text-error" : "text-on-surface"}
        />
      </div>

      {/* ─── Search ─── */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by product name or unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8.5 pr-8 py-2.5 bg-surface border border-outline-variant rounded-xl text-[12.5px] text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          style={{ paddingLeft: "2.1rem" }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ─── Stock list ─── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-secondary bg-surface border border-outline-variant rounded-2xl">
          <Package size={32} strokeWidth={1.2} className="opacity-25" />
          <p className="text-[12.5px]">
            {search ? `No results for "${search}"` : "No stock records yet"}
          </p>
          <button
            onClick={openCreate}
            className="text-[11.5px] text-primary font-semibold hover:underline"
          >
            Add the first stock →
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden space-y-1.5">
            {filtered.map((stock) => (
              <div
                key={stock.id}
                className="bg-surface border border-outline-variant rounded-xl px-3.5 py-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-container/30 flex items-center justify-center flex-shrink-0">
                  <Package size={14} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[12.5px] text-on-surface truncate">
                      {stock.product?.name}
                    </p>
                    <StockBadge qty={stock.quantity} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10.5px] text-secondary">
                      Buy: {fmt(stock.costPrice)}
                    </span>
                    <span className="text-[10.5px] text-secondary">·</span>
                    <span className="text-[10.5px] text-secondary">
                      Sell: {fmt(stock.sellingPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(stock)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-all"
                  >
                    <Edit3 size={13} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => openDelete(stock)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/40 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">
                All stock entries
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-outline-variant bg-background/50">
                  <tr>
                    {[
                      "Product",
                      "Qty",
                      "Cost Price",
                      "Sell Price",
                      "Total Value",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide ${
                          h === "Actions" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((stock) => {
                    const totalVal = stock.quantity * stock.sellingPrice;
                    return (
                      <tr
                        key={stock.id}
                        className="border-b border-outline-variant/40 last:border-0 hover:bg-secondary-container/10 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[12.5px] text-on-surface">
                            {stock.product?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StockBadge qty={stock.quantity} />
                        </td>
                        <td className="py-3 px-4 text-[12px] text-on-surface">
                          {fmt(stock.costPrice)}
                        </td>
                        <td className="py-3 px-4 text-[12px] text-on-surface">
                          {fmt(stock.sellingPrice)}
                        </td>
                        <td className="py-3 px-4 text-[12px] text-on-surface font-medium">
                          {fmt(totalVal)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(stock)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-all"
                              title="Edit"
                            >
                              <Edit3 size={12} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => openDelete(stock)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/40 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-outline-variant/50 text-[10.5px] text-secondary">
              Showing {filtered.length} of {totalItems} record
              {totalItems !== 1 ? "s" : ""}
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
        onClick={openCreate}
        className="sm:hidden fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* ══════════ CREATE SHEET (improved) ══════════ */}
      {/* ══════════ CREATE SHEET (responsive) ══════════ */}
      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="max-w-[800px]"
      >
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-on-surface">Add Stock</h2>
            <p className="text-[11.5px] text-secondary mt-0.5">
              Enter one or more stock entries
            </p>
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
            <AlertTriangle size={11} />
            {createError}
          </div>
        )}

        <div className="px-5 pt-4 space-y-4">
          {newStocks.map((stock, index) => (
            <div
              key={index}
              className="border border-outline-variant rounded-xl p-3 bg-background/60 space-y-2 sm:space-y-0 sm:flex sm:gap-3 sm:items-end"
            >
              {/* Product – searchable */}
              <div className="sm:flex-1">
                <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                  Product
                </label>
                {productsLoading ? (
                  <div className="text-secondary text-[12px] p-2">Loading…</div>
                ) : (
                  <SearchableSelect
                    options={allProducts}
                    value={stock.product_id}
                    onChange={(val) => updateRow(index, "product_id", val)}
                    disabledIds={getDisabledIds(index)}
                  />
                )}
              </div>

              {/* Quantity, Cost, Sell in a compact row */}
              <div className="flex gap-2 sm:w-[340px]">
                <div className="flex-1">
                  <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                    Qty
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={stock.quantity}
                    onChange={(e) =>
                      updateRow(index, "quantity", e.target.value)
                    }
                    className={inputCls}
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                    Cost
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={stock.costPrice}
                    onChange={(e) =>
                      updateRow(index, "costPrice", e.target.value)
                    }
                    className={inputCls}
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[9.5px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                    Sell
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={stock.sellingPrice}
                    onChange={(e) =>
                      updateRow(index, "sellingPrice", e.target.value)
                    }
                    className={inputCls}
                    min="0"
                  />
                </div>
              </div>

              {/* Remove button when more than one row */}
              {newStocks.length > 1 && (
                <button
                  onClick={() => removeRow(index)}
                  className="self-end sm:self-center w-9 h-9 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-all flex-shrink-0"
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
            Add another stock entry
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
            disabled={createLoading || productsLoading}
            className="flex-1 py-2.5 bg-primary text-on-primary text-[12.5px] font-bold rounded-xl hover:brightness-110 disabled:opacity-55 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            {createLoading
              ? "Adding…"
              : `Add ${newStocks.length > 1 ? `${newStocks.length} entries` : "stock"}`}
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default StockManagement;
