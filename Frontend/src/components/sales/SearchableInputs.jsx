import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const defaultInputClass =
  'w-full px-3.5 py-2.5 bg-background border border-outline-variant rounded-xl text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all';

const SearchableStockSelect = ({
  options,
  value,
  onChange,
  disabledIds = [],
  className = defaultInputClass,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const available = options.filter(
    (s) => !disabledIds.includes(s.id) || s.id === value
  );
  const filtered = available.filter((s) =>
    s.product?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find((s) => s.id === value);

  // Reset scroll to top when search changes
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [search]);

  // Close on outside click / touch
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${className} flex items-center justify-between text-left`}
      >
        <span className={selected ? 'text-on-surface' : 'text-secondary'}>
          {selected
            ? `${selected.product?.name} (${selected.quantity} avail.)`
            : 'Select stock'}
        </span>
        <ChevronDown size={14} className="text-secondary flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div
          className="absolute z-10 mt-1 w-full bg-surface border border-outline-variant rounded-xl shadow-lg max-h-48 overflow-hidden"
          onTouchMove={(e) => e.stopPropagation()}
        >
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
          <div
            ref={listRef}
            className="overflow-y-auto max-h-36"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
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

export default SearchableStockSelect;