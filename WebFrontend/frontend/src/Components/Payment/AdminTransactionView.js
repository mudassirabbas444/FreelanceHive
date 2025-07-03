import React, { useState, useEffect } from 'react';
import NavbarAdmin from "../Includes/NavbarAdmin";
import { Card, Row, Col, Statistic, Spin, Alert, Select, DatePicker, Table, Button, Tag } from 'antd';
import { 
  DollarOutlined, 
  TransactionOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import '../../CSS/transactions.css';

const { RangePicker } = DatePicker;

const AdminTransactionView = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    userId: '',
    type: '',
    status: '',
    dateRange: null,
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0
  });
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    transactionsByType: [],
    transactionsByStatus: {
      completed: 0,
      pending: 0,
      cancelled: 0,
      failed: 0
    }
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = filters.dateRange || [null, null];
      
      const queryParams = new URLSearchParams({
        type: filters.type,
        status: filters.status,
        startDate: startDate?.toISOString() || '',
        endDate: endDate?.toISOString() || '',
        page: filters.page,
        limit: filters.limit
      }).toString();
      
      const response = await fetch(`http://localhost:4000/api/transaction/user/${filters.userId || 'all'}?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        pages: data.totalPages || 0
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/transaction/stats/${filters.userId || 'all'}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction stats');
      }
      const data = await response.json();
      
      // Transform the data into the expected format
      const statusCounts = {
        completed: 0,
        pending: 0,
        cancelled: 0,
        failed: 0
      };

      // If transactionsByStatus is an array, process it
      if (Array.isArray(data.transactionsByStatus)) {
        data.transactionsByStatus.forEach(stat => {
          if (stat.status && stat.count) {
            statusCounts[stat.status.toLowerCase()] = stat.count;
          }
        });
      }

      setStats({
        totalTransactions: data.totalTransactions || 0,
        totalAmount: data.totalAmount || 0,
        transactionsByType: data.transactionsByType || [],
        transactionsByStatus: statusCounts
      });
    } catch (err) {
      console.error('Error fetching transaction stats:', err);
      setStats({
        totalTransactions: 0,
        totalAmount: 0,
        transactionsByType: [],
        transactionsByStatus: {
          completed: 0,
          pending: 0,
          cancelled: 0,
          failed: 0
        }
      });
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({
      ...prev,
      dateRange: dates,
      page: 1
    }));
  };

  const handleTableChange = (pagination) => {
    setFilters(prev => ({
      ...prev,
      page: pagination.current
    }));
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#10B981',
      pending: '#F59E0B',
      cancelled: '#EF4444',
      failed: '#EF4444'
    };
    return colors[status.toLowerCase()] || '#6B7280';
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type.replace(/_/g, ' ').toUpperCase()
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span className={amount < 0 ? 'negative' : 'positive'}>
          {formatAmount(Math.abs(amount))}
          {amount < 0 ? ' (Debit)' : ' (Credit)'}
        </span>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag icon={<UserOutlined />} color="blue">
          {role}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  return (
    <div className="transaction-page">
      <NavbarAdmin />
      <div className="transaction-container">
        <h1 className="page-title">Transaction Management</h1>

        {/* Stats Overview Section */}
        <div className="wallet-overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="wallet-card">
                <Statistic
                  title="Total Transactions"
                  value={stats.totalTransactions}
                  prefix={<TransactionOutlined />}
                  valueStyle={{ color: '#3B82F6' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="wallet-card">
                <Statistic
                  title="Total Amount"
                  value={Math.abs(stats.totalAmount)}
                  precision={2}
                  prefix={<DollarOutlined />}
                  valueStyle={{ 
                    color: stats.totalAmount < 0 ? '#EF4444' : '#10B981'
                  }}
                  suffix={stats.totalAmount < 0 ? ' (Debit)' : ' (Credit)'}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="wallet-card">
                <Statistic
                  title="Completed Transactions"
                  value={stats.transactionsByStatus.completed || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#10B981' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card className="wallet-card">
                <Statistic
                  title="Pending Transactions"
                  value={stats.transactionsByStatus.pending || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#F59E0B' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <Card className="filters-card">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8} md={6}>
                <Select
                  placeholder="Transaction Type"
                  style={{ width: '100%' }}
                  value={filters.type || undefined}
                  onChange={(value) => handleFilterChange('type', value)}
                  allowClear
                >
                  <Select.Option value="order_creation">Order Creation</Select.Option>
                  <Select.Option value="order_approval">Order Approval</Select.Option>
                  <Select.Option value="order_cancellation">Order Cancellation</Select.Option>
                  <Select.Option value="withdrawal">Withdrawal</Select.Option>
                  <Select.Option value="refund">Refund</Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Select
                  placeholder="Status"
                  style={{ width: '100%' }}
                  value={filters.status || undefined}
                  onChange={(value) => handleFilterChange('status', value)}
                  allowClear
                >
                  <Select.Option value="completed">Completed</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={12}>
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={handleDateRangeChange}
                  value={filters.dateRange}
                />
              </Col>
            </Row>
          </Card>
        </div>

        {/* Transactions Table */}
        <div className="transactions-section">
          <Card className="transactions-card">
            <Table
              columns={columns}
              dataSource={transactions}
              rowKey="_id"
              pagination={{
                current: pagination.page,
                total: pagination.total,
                pageSize: filters.limit,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} transactions`
              }}
              onChange={handleTableChange}
              scroll={{ x: true }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactionView; 