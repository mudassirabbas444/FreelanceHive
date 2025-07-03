import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ShoppingOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  DollarOutlined,
  StarOutlined,
  UserOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  TeamOutlined,
  LockOutlined,
  StopOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { DatePicker, Spin, Alert, Select } from 'antd';
import NavbarAdmin from '../Includes/NavbarAdmin';
import '../../CSS/adminDashboardModern.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [timeFilter, setTimeFilter] = useState('week');
  const [dashboardData, setDashboardData] = useState({
    gigStats: {
      totalGigs: 0,
      activeGigs: 0,
      pausedGigs: 0,
      deletedGigs: 0,
      totalTraffic: 0,
      totalImpressions: 0,
      totalClicks: 0,
      trend: { percentage: 5.2, direction: 'up' }
    },
    orderStats: {
      inProgressOrders: 15,
      completedOrders: 45,
      canceledOrders: 8,
      averageRating: 4.5,
      totalOrders: 68,
      trend: { percentage: 3.1, direction: 'up' }
    },
    paymentStats: {
      totalPayments: 0,
      pendingPayments: 0,
      completedPayments: 0,
      canceledPayments: 0,
      escrowBalance: 0,
      totalRevenue: 0,
      trend: { percentage: 2.5, direction: 'up' }
    },
    userStats: {
      totalUsers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      deletedUsers: 0,
      buyers: 0,
      sellers: 0,
      admins: 0,
      trend: { percentage: 1.8, direction: 'up' }
    },
    revenueData: [],
    userGrowthData: [],
    orderStatusData: [],
    gigPerformanceData: [],
    buyerRequestData: []
  });

  // Mock data for charts
  const generateMockTimeSeriesData = (days, baseValue, variance) => {
    return Array.from({ length: days }).map((_, index) => ({
      date: new Date(Date.now() - (days - 1 - index) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      value: baseValue + Math.random() * variance - variance / 2
    }));
  };

  const generateBuyerRequestData = () => {
    return [
      { name: 'Pending Review', value: 12 },
      { name: 'In Discussion', value: 18 },
      { name: 'Agreement Phase', value: 8 },
      { name: 'Completed', value: 25 },
      { name: 'Rejected', value: 5 }
    ];
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [dateRange, timeFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (!user || !user.id || user.role !== "Admin") {
        setError('Unauthorized access. Admin privileges required.');
        setLoading(false);
        return;
      }

      let url = `http://localhost:4000/api/admin/dashboard/${user.id}`;
      if (dateRange) {
        const [startDate, endDate] = dateRange;
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      
      // Add default trend values to the data
      const dataWithDefaults = {
        ...data,
        gigStats: {
          ...data.gigStats,
          trend: data.gigStats?.trend || { percentage: 0, direction: 'up' }
        },
        orderStats: {
          ...data.orderStats,
          inProgressOrders: 15,
          completedOrders: 45,
          canceledOrders: 8,
          trend: data.orderStats?.trend || { percentage: 0, direction: 'up' }
        },
        paymentStats: {
          ...data.paymentStats,
          trend: data.paymentStats?.trend || { percentage: 0, direction: 'up' }
        },
        userStats: {
          ...data.userStats,
          trend: data.userStats?.trend || { percentage: 0, direction: 'up' }
        }
      };
      
      // Enhance the data with mock time series
      const enhancedData = {
        ...dataWithDefaults,
        revenueData: generateMockTimeSeriesData(30, 5000, 2000),
        userGrowthData: generateMockTimeSeriesData(30, 100, 20),
        orderStatusData: [
          { name: 'Completed', value: 45, color: '#10b981' },
          { name: 'In Progress', value: 15, color: '#3b82f6' },
          { name: 'Canceled', value: 8, color: '#ef4444' }
        ],
        gigPerformanceData: generateMockTimeSeriesData(30, 200, 50),
        buyerRequestData: generateBuyerRequestData()
      };

      setDashboardData(enhancedData);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleTimeFilterChange = (value) => {
    setTimeFilter(value);
  };

  // Chart colors
  const COLORS = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b'];

  // Stat cards data
  const statCards = useMemo(() => [
    {
      title: 'Total Revenue',
      value: `$${dashboardData.paymentStats.totalRevenue.toLocaleString()}`,
      icon: <DollarOutlined />,
      trend: dashboardData.paymentStats.trend || { percentage: 0, direction: 'up' },
      iconClass: 'icon-primary'
    },
    {
      title: 'Active Users',
      value: dashboardData.userStats.activeUsers.toLocaleString(),
      icon: <TeamOutlined />,
      trend: dashboardData.userStats.trend || { percentage: 0, direction: 'up' },
      iconClass: 'icon-success'
    },
    {
      title: 'Total Orders',
      value: dashboardData.orderStats.totalOrders.toLocaleString(),
      icon: <ShoppingOutlined />,
      trend: dashboardData.orderStats.trend || { percentage: 0, direction: 'up' },
      iconClass: 'icon-info'
    },
    {
      title: 'Active Gigs',
      value: dashboardData.gigStats.activeGigs.toLocaleString(),
      icon: <CheckCircleOutlined />,
      trend: dashboardData.gigStats.trend || { percentage: 0, direction: 'up' },
      iconClass: 'icon-warning'
    }
  ], [dashboardData]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  return (
    <>
      <NavbarAdmin />
      <div className="admin-dashboard-modern">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
      <div className="dashboard-header">
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <div className="dashboard-controls">
              <Select
                defaultValue="week"
                style={{ width: 120, marginRight: 16 }}
                onChange={handleTimeFilterChange}
              >
                <Option value="day">Today</Option>
                <Option value="week">This Week</Option>
                <Option value="month">This Month</Option>
                <Option value="year">This Year</Option>
              </Select>
          <RangePicker onChange={handleDateRangeChange} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card-header">
                  <div className={`card-icon ${stat.iconClass}`}>
                    {stat.icon}
                  </div>
                  <div className="stat-trend">
                    {stat.trend?.direction === 'up' ? (
                      <ArrowUpOutlined className="trend-up" />
                    ) : (
                      <ArrowDownOutlined className="trend-down" />
                    )}
                    <span>{stat.trend?.percentage || 0}%</span>
                  </div>
                </div>
                <h3 className="stat-title">{stat.title}</h3>
                <div className="stat-value">{stat.value}</div>
              </motion.div>
            ))}
      </div>
      
          {/* Charts Grid */}
          <div className="dashboard-grid">
            {/* Revenue Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Revenue Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.1}
              />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* User Growth Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">User Growth</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[1]}
                    strokeWidth={2}
              />
                </LineChart>
              </ResponsiveContainer>
      </div>

            {/* Order Status Distribution */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Order Status Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dashboardData.orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
      </div>

            {/* Gig Performance Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Gig Performance</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.gigPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[3]} />
                </BarChart>
              </ResponsiveContainer>
      </div>

            {/* Buyer Request Distribution */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Buyer Request Status</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.buyerRequestData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, value}) => `${name}: ${value}`}
                  >
                    {dashboardData.buyerRequestData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          '#4f46e5', // Primary
                          '#10b981', // Success
                          '#f59e0b', // Warning
                          '#3b82f6', // Info
                          '#ef4444'  // Danger
                        ][index % 5]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
      </div>
    </div>

          {/* Recent Activity Table */}
          <div className="table-container">
            <h3 className="chart-title">Recent Activity</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Order</td>
                  <td>New order placed</td>
                  <td>Muhammad Ali</td>
                  <td><span className="status-badge status-active">Completed</span></td>
                  <td>{new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td>Gig</td>
                  <td>New gig created</td>
                  <td>Fatima Khan</td>
                  <td><span className="status-badge status-pending">Pending</span></td>
                  <td>{new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td>Payment</td>
                  <td>Payment received</td>
                  <td>Ahmed Hassan</td>
                  <td><span className="status-badge status-active">Success</span></td>
                  <td>{new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td>Request</td>
                  <td>Buyer request submitted</td>
                  <td>Zainab Malik</td>
                  <td><span className="status-badge status-pending">In Review</span></td>
                  <td>{new Date().toLocaleDateString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
    </div>
    </>
  );
};

export default AdminDashboard;
