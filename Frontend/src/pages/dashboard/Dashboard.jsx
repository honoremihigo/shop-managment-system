// src/pages/Dashboard/Dashboard.jsx
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ShoppingCart,
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
} from '../../services/report/reportService'; // adjust path

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dailyRes, topRes, lowRes] = await Promise.all([
          getDashboardStats(),
          getDailySalesReport(7),
          getTopProducts(5),
          getLowStockProducts(10),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (dailyRes.success) setDailySales(dailyRes.data);
        if (topRes.success) setTopProducts(topRes.data);
        if (lowRes.success) setLowStock(lowRes.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const formatCurrency = (val) =>
    `$${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 font-sans antialiased">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-sm text-secondary mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* ---------- Stat Cards ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <DollarSign className="text-on-primary-container w-4 h-4" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-on-surface">
            {stats ? formatCurrency(stats.sales.today.totalRevenue) : '—'}
          </p>
          <p className="text-xs text-secondary mt-1">
            {stats?.sales.today.totalItems || 0} items sold
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-warning-container flex items-center justify-center">
              <AlertTriangle className="text-on-warning-container w-4 h-4" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-on-surface">
            {stats?.overview.lowStockCount || 0}
          </p>
          <p className="text-xs text-secondary mt-1">
            {stats?.overview.outOfStockCount || 0} out of stock
          </p>
        </div>

        {/* Monthly Sales */}
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary">This Month Sales</span>
            <div className="w-8 h-8 rounded-lg bg-success-container flex items-center justify-center">
              <TrendingUp className="text-on-success-container w-4 h-4" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-on-surface">
            {stats ? formatCurrency(stats.sales.thisMonth.totalRevenue) : '—'}
          </p>
          <p className="text-xs text-secondary mt-1">
            {stats?.sales.thisMonth.totalItems || 0} items
          </p>
        </div>

        {/* Monthly Purchases */}
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary">Month Purchases</span>
            <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">
              <ShoppingCart className="text-on-secondary-container w-4 h-4" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-on-surface">
            {stats ? formatCurrency(stats.purchases.thisMonth.totalAmount) : '—'}
          </p>
          <p className="text-xs text-secondary mt-1">
            {stats?.purchases.thisMonth.totalItems || 0} items
          </p>
        </div>
      </div>

      {/* ---------- Charts Row ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Sales Line Chart */}
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-3">Sales Last 7 Days</h2>
          <div className="h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
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
                  formatter={(value) => [`$${value}`, 'Revenue']}
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
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-3">Top Selling Products</h2>
          <div className="h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis dataKey="productName" type="category" tick={{ fontSize: 11 }} stroke="#64748B" width={110} />
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
          </div>
        </div>
      </div>

      {/* ---------- Low Stock Table ---------- */}
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