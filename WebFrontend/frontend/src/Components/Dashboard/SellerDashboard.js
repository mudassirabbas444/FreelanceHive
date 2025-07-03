import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DatePicker, Select, Spin, Alert } from 'antd';
import NavbarSeller from '../Includes/NavbarSeller';
import { 
  ShoppingOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  PauseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StarOutlined,
  MessageOutlined
} from '@ant-design/icons';
import '../../CSS/sellerDashboardModern.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SellerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('week');
  const [dateRange, setDateRange] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    gigStats: {
      totalGigs: 0,
      activeGigs: 0,
      pausedGigs: 0,
      deletedGigs: 0,
      totalImpressions: 0,
      totalClicks: 0,
      trend: { percentage: 7.2, direction: 'up' }
    },
    orderStats: {
      inProgress: 0,
      completed: 0,
      canceled: 0,
      averageRating: 0,
      trend: { percentage: 5.8, direction: 'up' }
    },
    paymentStats: {
      totalPayments: 0,
      pendingPayments: 0,
      completedPayments: 0,
      canceledPayments: 0,
      escrowBalance: 0,
      totalRevenue: 0,
      trend: { percentage: 12.4, direction: 'up' }
    },
    revenueData: [],
    orderTrendData: [],
    gigPerformanceData: [],
    ratingDistribution: []
  });

  // Generate mock time series data
  const generateMockTimeSeriesData = (days, baseValue, variance) => {
    return Array.from({ length: days }).map((_, index) => ({
      date: new Date(Date.now() - (days - 1 - index) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      value: baseValue + Math.random() * variance - variance / 2
    }));
  };

  // Generate mock rating distribution
  const generateRatingDistribution = () => {
    return [
      { rating: '5 Stars', count: 25 },
      { rating: '4 Stars', count: 15 },
      { rating: '3 Stars', count: 5 },
      { rating: '2 Stars', count: 2 },
      { rating: '1 Star', count: 1 }
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
        if (!user || !user.id) {
          setError('User not found. Please login again.');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:4000/api/seller/dashboard/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();

      // Enhance data with mock time series
      const enhancedData = {
        ...data,
        revenueData: generateMockTimeSeriesData(30, 1000, 500),
        orderTrendData: generateMockTimeSeriesData(30, 50, 20),
        gigPerformanceData: generateMockTimeSeriesData(30, 100, 30),
        ratingDistribution: generateRatingDistribution()
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
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  // Stat cards data
  const statCards = useMemo(() => [
    {
      title: 'Total Revenue',
      value: `$${dashboardData.paymentStats.totalRevenue.toLocaleString()}`,
      icon: <DollarOutlined />,
      trend: dashboardData.paymentStats.trend,
      iconClass: 'icon-primary'
    },
    {
      title: 'Active Gigs',
      value: dashboardData.gigStats.activeGigs,
      icon: <ShoppingOutlined />,
      trend: dashboardData.gigStats.trend,
      iconClass: 'icon-success'
    },
    {
      title: 'Orders in Progress',
      value: dashboardData.orderStats.inProgress,
      icon: <ClockCircleOutlined />,
      trend: dashboardData.orderStats.trend,
      iconClass: 'icon-warning'
    },
    {
      title: 'Average Rating',
      value: `${dashboardData.orderStats.averageRating}/5`,
      icon: <StarOutlined />,
      trend: { percentage: 4.2, direction: 'up' },
      iconClass: 'icon-info'
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
     <NavbarSeller />
      <div className="seller-dashboard-modern">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dashboard-header">
            <h1 className="dashboard-title">Seller Dashboard</h1>
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

            {/* Order Trend Chart */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Order Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.orderTrendData}>
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
                  <Bar dataKey="value" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
      </div>

            {/* Rating Distribution */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Rating Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.ratingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="count"
                    label={({rating, count}) => `${rating}: ${count}`}
                  >
                    {dashboardData.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
      </div>

          {/* Recent Activity */}
          <div className="activity-list">
            <h3 className="chart-title">Recent Activity</h3>
            <div className="activity-item">
              <div className="activity-icon" style={{ backgroundColor: COLORS[0] }}>
                <ShoppingOutlined />
              </div>
              <div className="activity-content">
                <div className="activity-title">New order from Zainab Malik</div>
                <div className="activity-time">2 hours ago</div>
              </div>
              <span className="status-badge status-active">Active</span>
            </div>
            <div className="activity-item">
              <div className="activity-icon" style={{ backgroundColor: COLORS[1] }}>
                <CheckCircleOutlined />
              </div>
              <div className="activity-content">
                <div className="activity-title">Order completed for Ahmed Hassan</div>
                <div className="activity-time">Yesterday</div>
              </div>
              <span className="status-badge status-completed">Completed</span>
            </div>
            <div className="activity-item">
              <div className="activity-icon" style={{ backgroundColor: COLORS[2] }}>
                <MessageOutlined />
              </div>
              <div className="activity-content">
                <div className="activity-title">Message from Fatima Khan</div>
                <div className="activity-time">2 days ago</div>
              </div>
              <span className="status-badge status-pending">Pending Reply</span>
            </div>
      </div>
        </motion.div>
    </div>
    </>
  );
};

export default SellerDashboard; 