// src/pages/Dashboard/Dashboard.jsx
import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Layers,
  Box,
  Coins,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  getDashboardStats,
  getDailySalesReport,
  getTopProducts,
  getLowStockProducts,
} from '../../services/report/reportService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dailyError, setDailyError] = useState(''); // ★ new state for daily‑sales error

  useEffect(() => {
    const fetchData = async () => {
      // ---- Dashboard stats ----
      try {
        const statsRes = await getDashboardStats();
        if (statsRes.success) setStats(statsRes.data);
      } catch (err) {
        console.error('Dashboard stats failed:', err);
        setError('Failed to load dashboard stats');
      }

      // ---- Daily sales (chart + yesterday) ----
      try {
        const dailyRes = await getDailySalesReport(7);
        console.log('dailyRes', dailyRes); // keep for debugging

        // Handle two common response shapes:
        //   1) { success: true, data: [...] }
        //   2) The array directly (if axios interceptor unwraps data)
        const data = dailyRes?.success ? dailyRes.data : dailyRes;

        if (Array.isArray(data)) {
          setDailySales(data.map(d => ({ ...d, revenue: Number(d.revenue) })));
          setDailyError('');
        } else {
          throw new Error('Unexpected daily sales response format');
        }
      } catch (err) {
        console.error('Daily sales failed:', err);
        setDailyError(
          err?.response?.data?.message || err.message || 'Failed to load daily sales'
        );
        setDailySales([]);
      }

      // ---- Top products ----
      try {
        const topRes = await getTopProducts(5);
        if (topRes.success) setTopProducts(topRes.data);
      } catch (err) {
        console.error('Top products failed:', err);
      }

      // ---- Low stock ----
      try {
        const lowRes = await getLowStockProducts(10);
        if (lowRes.success) setLowStock(lowRes.data);
      } catch (err) {
        console.error('Low stock failed:', err);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Derived values from dailySales
  const yesterdayRevenue = useMemo(() => {
    if (dailySales.length >= 2) return dailySales[dailySales.length - 2]?.revenue || 0;
    return 0;
  }, [dailySales]);

  const yesterdayItems = useMemo(() => {
    if (dailySales.length >= 2) return dailySales[dailySales.length - 2]?.items || 0;
    return 0;
  }, [dailySales]);

  const yesterdaySalesCount = useMemo(() => {
    if (dailySales.length >= 2) return dailySales[dailySales.length - 2]?.sales || 0;
    return 0;
  }, [dailySales]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Currency formatter
  const formatCurrency = (val) =>
    new Intl.NumberFormat('fr-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(val);

  // Stat card component
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

  // Stats breakdown
  const overview = stats?.overview || {};
  const sales = stats?.sales || {};
  const purchases = stats?.purchases || {};
  const debt = stats?.debt || {};

  const netCollectedToday = (sales.today?.totalRevenue || 0) - (debt.todayOutstanding || 0);

  return (
    <div className="space-y-6 font-sans antialiased">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-sm text-secondary mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* General error banner */}
      {error && (
        <div className="px-4 py-2.5 bg-error-container text-on-error-container text-xs rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* ─── Overview ─── */}
      <section>
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <StatCard icon={Package} label="Total Products" value={overview.totalProducts ?? '—'} accent="bg-primary/10" iconColor="text-primary" />
          <StatCard icon={Layers} label="Stock Items" value={overview.totalStockItems ?? '—'} accent="bg-primary-container/60" iconColor="text-on-primary-container" />
          <StatCard icon={Coins} label="Stock Value" value={overview.stockValue !== undefined ? formatCurrency(overview.stockValue) : '—'} accent="bg-tertiary-container/60" iconColor="text-on-tertiary-container" />
          <StatCard icon={AlertTriangle} label="Low Stock" value={overview.lowStockCount ?? '—'} accent="bg-warning-container/60" iconColor="text-warning" valueColor={overview.lowStockCount > 0 ? 'text-warning' : 'text-on-surface'} />
          <StatCard icon={AlertCircle} label="Out of Stock" value={overview.outOfStockCount ?? '—'} accent="bg-error-container/60" iconColor="text-error" valueColor={overview.outOfStockCount > 0 ? 'text-error' : 'text-on-surface'} />
          <StatCard icon={CreditCard} label="Outstanding Debt" value={formatCurrency(debt.totalOutstanding || 0)} accent="bg-error-container/60" iconColor="text-error" valueColor="text-error" />
        </div>
      </section>

      {/* ─── Sales Performance ─── */}
      <section>
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">Sales Performance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Today */}
          <div className="bg-surface border border-outline-variant rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wide">Today</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign size={13} className="text-primary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Revenue</span>
                <span className="font-medium text-on-surface">
                  {sales.today?.totalRevenue !== undefined ? formatCurrency(sales.today.totalRevenue) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Items</span>
                <span className="text-on-surface">{sales.today?.totalItems ?? '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Sales</span>
                <span className="text-on-surface">{sales.today?.totalSales ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Net Collected Today */}
          <div className="bg-surface border border-outline-variant rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wide">Net Collected</span>
              <div className="w-7 h-7 rounded-lg bg-success-container/60 flex items-center justify-center">
                <TrendingUp size={13} className="text-success" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Today</span>
                <span className="font-medium text-on-surface">{formatCurrency(netCollectedToday)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">New debt</span>
                <span className="text-on-surface">{formatCurrency(debt.todayOutstanding || 0)}</span>
              </div>
            </div>
          </div>

          {/* Yesterday (now uses dailySales from the fixed fetch) */}
          <div className="bg-surface border border-outline-variant rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wide">Yesterday</span>
              <div className="w-7 h-7 rounded-lg bg-tertiary-container/60 flex items-center justify-center">
                <TrendingUp size={13} className="text-tertiary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Revenue</span>
                <span className="font-medium text-on-surface">{formatCurrency(yesterdayRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Items</span>
                <span className="text-on-surface">{yesterdayItems || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Sales</span>
                <span className="text-on-surface">{yesterdaySalesCount || '—'}</span>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-surface border border-outline-variant rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wide">This Week</span>
              <div className="w-7 h-7 rounded-lg bg-success-container/60 flex items-center justify-center">
                <TrendingUp size={13} className="text-success" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Revenue</span>
                <span className="font-medium text-on-surface">
                  {sales.thisWeek?.totalRevenue !== undefined ? formatCurrency(sales.thisWeek.totalRevenue) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Items</span>
                <span className="text-on-surface">{sales.thisWeek?.totalItems ?? '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Sales</span>
                <span className="text-on-surface">{sales.thisWeek?.totalSales ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-surface border border-outline-variant rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wide">This Month</span>
              <div className="w-7 h-7 rounded-lg bg-tertiary-container/60 flex items-center justify-center">
                <TrendingUp size={13} className="text-tertiary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Revenue</span>
                <span className="font-medium text-on-surface">
                  {sales.thisMonth?.totalRevenue !== undefined ? formatCurrency(sales.thisMonth.totalRevenue) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Items</span>
                <span className="text-on-surface">{sales.thisMonth?.totalItems ?? '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Sales</span>
                <span className="text-on-surface">{sales.thisMonth?.totalSales ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* This Year */}
          <div className="bg-surface border border-outline-variant rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wide">This Year</span>
              <div className="w-7 h-7 rounded-lg bg-secondary-container/60 flex items-center justify-center">
                <TrendingUp size={13} className="text-on-secondary-container" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Revenue</span>
                <span className="font-medium text-on-surface">
                  {sales.thisYear?.totalRevenue !== undefined ? formatCurrency(sales.thisYear.totalRevenue) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Items</span>
                <span className="text-on-surface">{sales.thisYear?.totalItems ?? '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Sales</span>
                <span className="text-on-surface">{sales.thisYear?.totalSales ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Purchases This Month ─── */}
      <section>
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">Purchases</h2>
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingCart size={16} className="text-secondary" />
            <span className="text-sm font-semibold text-on-surface">This Month</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-secondary">Total Purchases</p>
              <p className="text-on-surface font-medium">{purchases.thisMonth?.totalPurchases ?? '—'}</p>
            </div>
            <div>
              <p className="text-secondary">Total Items</p>
              <p className="text-on-surface font-medium">{purchases.thisMonth?.totalItems ?? '—'}</p>
            </div>
            <div>
              <p className="text-secondary">Total Amount</p>
              <p className="text-on-surface font-medium">
                {purchases.thisMonth?.totalAmount !== undefined ? formatCurrency(purchases.thisMonth.totalAmount) : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Sales Line Chart */}
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-3">Sales Last 7 Days</h2>

          {/* ★ Show daily sales error if any */}
          {dailyError && (
            <div className="mb-3 px-3 py-2 bg-error-container text-on-error-container text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={14} />
              {dailyError}
            </div>
          )}

          <div className="h-64 lg:h-72">
            {dailySales.length > 0 ? (
              <ResponsiveContainer key={JSON.stringify(dailySales)} width="100%" height="100%">
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F172A"
                    strokeWidth={2}
                    dot={{ fill: '#0F172A', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-secondary text-sm gap-1">
                {dailyError
                  ? 'Could not load chart data. Check the error above.'
                  : 'No sales data available for the last 7 days.'}
              </div>
            )}
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-3">Top Selling Products</h2>
          <div className="h-64 lg:h-72">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis
                    dataKey="productName"
                    type="category"
                    tick={{ fontSize: 11 }}
                    stroke="#64748B"
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="quantity" fill="#0F172A" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-secondary text-sm">
                No product data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Low Stock Table ─── */}
      <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-on-surface mb-1">Low Stock Alerts</h2>
        <p className="text-sm text-secondary mb-3">Items below 10 units</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-outline-variant">
              <tr>
                <th className="text-left py-2 px-2 text-xs font-medium text-secondary uppercase tracking-wide">Product</th>
                <th className="text-left py-2 px-2 text-xs font-medium text-secondary uppercase tracking-wide">Unit</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-secondary uppercase tracking-wide">Qty</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-secondary uppercase tracking-wide">Cost Price</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length > 0 ? (
                lowStock.map((item) => (
                  <tr key={item.id} className="border-b border-outline-variant/50 hover:bg-secondary-container/20 transition-colors">
                    <td className="py-2 px-2 text-on-surface font-medium">{item.product?.name}</td>
                    <td className="py-2 px-2 text-secondary">{item.product?.unit}</td>
                    <td className="py-2 px-2 text-right text-on-surface font-medium">{item.quantity}</td>
                    <td className="py-2 px-2 text-right text-secondary">{formatCurrency(item.costPrice)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-secondary text-sm">No low stock items – great job!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;