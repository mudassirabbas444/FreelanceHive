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
import NavbarBuyer from '../Includes/NavbarBuyer';
import { 
  ShoppingOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  DollarOutlined,
  StarOutlined,
  FileTextOutlined,
  MessageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import '../../CSS/buyerDashboardModern.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const BuyerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('week');
  const [dateRange, setDateRange] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    orderStats: {
      activeOrders: 12,
      completedOrders: 45,
      canceledOrders: 3,
      totalSpent: 2500,
      trend: { percentage: 8.5, direction: 'up' }
    },
    requestStats: {
      activeRequests: 5,
      completedRequests: 15,
      rejectedRequests: 2,
      totalRequests: 22,
      trend: { percentage: 12.3, direction: 'up' }
    },
    interactionStats: {
      totalReviews: 38,
      averageRating: 4.5,
      totalMessages: 156,
      activeChats: 8,
      trend: { percentage: 5.7, direction: 'up' }
    },
    orderHistory: [],
    requestActivity: [],
    spendingData: [],
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
      { rating: '5 Stars', count: 20 },
      { rating: '4 Stars', count: 12 },
      { rating: '3 Stars', count: 4 },
      { rating: '2 Stars', count: 1 },
      { rating: '1 Star', count: 1 }
    ];
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000);
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

        const response = await fetch(`http://localhost:4000/api/buyer/dashboard/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();

      // Enhance data with mock time series
      const enhancedData = {
        ...data,
        orderStats: {
          ...data.orderStats,
          trend: { percentage: 8.5, direction: 'up' }
        },
        requestStats: {
          ...data.requestStats,
          trend: { percentage: 12.3, direction: 'up' }
        },
        interactionStats: {
          ...data.interactionStats,
          trend: { percentage: 5.7, direction: 'up' }
        },
        spendingData: generateMockTimeSeriesData(30, 500, 200),
        orderHistory: generateMockTimeSeriesData(30, 20, 10),
        requestActivity: generateMockTimeSeriesData(30, 10, 5),
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
      title: 'Total Spent',
      value: `$${dashboardData.orderStats.totalSpent.toLocaleString()}`,
      icon: <DollarOutlined />,
      trend: dashboardData.orderStats.trend,
      iconClass: 'icon-primary'
    },
    {
      title: 'Active Orders',
      value: dashboardData.orderStats.activeOrders,
      icon: <ShoppingOutlined />,
      trend: dashboardData.requestStats.trend,
      iconClass: 'icon-warning'
    },
    {
      title: 'Completed Orders',
      value: dashboardData.orderStats.completedOrders,
      icon: <CheckCircleOutlined />,
      trend: { percentage: 15.8, direction: 'up' },
      iconClass: 'icon-success'
    },
    {
      title: 'Average Rating',
      value: `${dashboardData.interactionStats.averageRating}/5`,
      icon: <StarOutlined />,
      trend: dashboardData.interactionStats.trend,
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
      <NavbarBuyer />
      <div className="buyer-dashboard-modern">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dashboard-header">
            <h1 className="dashboard-title">Buyer Dashboard</h1>
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
            {/* Spending Overview */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Spending Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.spendingData}>
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

            {/* Order History */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Order History</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.orderHistory}>
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

            {/* Rating Distribution */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Rating Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS[2]}>
                    {dashboardData.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
      </div>

            {/* Request Activity */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Request Activity</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.requestActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[3]}
                    strokeWidth={2}
              />
                </LineChart>
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
                <div className="activity-title">Order Placed with Zainab Malik</div>
                <div className="activity-time">2 hours ago</div>
              </div>
              <span className="status-badge status-active">Active</span>
            </div>
            <div className="activity-item">
              <div className="activity-icon" style={{ backgroundColor: COLORS[1] }}>
                <CheckCircleOutlined />
              </div>
              <div className="activity-content">
                <div className="activity-title">Order Completed with Ahmed Hassan</div>
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

export default BuyerDashboard; 