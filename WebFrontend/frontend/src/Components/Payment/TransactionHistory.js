import React, { useState, useEffect } from 'react';
import NavbarBuyer from "../Includes/NavbarBuyer";
import NavbarSeller from "../Includes/NavbarSeller"; 
import NavbarAdmin from "../Includes/NavbarAdmin";
import { Card, Row, Col, Statistic, Spin, Alert, Select, DatePicker, Button, Modal, Input, Form, message, Tooltip } from 'antd';
import { DollarOutlined, WalletOutlined, ClockCircleOutlined, CheckCircleOutlined, BankOutlined } from '@ant-design/icons';
import "../../CSS/transactions.css";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from "axios";
import WithdrawalForm from './WithdrawalForm';

const { RangePicker } = DatePicker;

const stripePromise = loadStripe('pk_test_51RFQzsFGXfJNzhXi7V8UqvhlkNQz6Tm8m4aKn8YhR8okKgxNIUIKbH23CqyF4Aw6h2JRJ6odoXd8Xwu7xxFHbw9700T9lDkqrz');

const DepositForm = ({ amount, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        try {
            const { error: submitError } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin,
                },
            });

            if (submitError) {
                setError(submitError.message);
            } else {
                onSuccess();
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {error && <div className="error-message">{error}</div>}
            <div className="deposit-form-actions">
                <Button onClick={onCancel}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                    Pay ${amount}
                </Button>
            </div>
        </form>
    );
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletInfo, setWalletInfo] = useState({
    available: 0,
    pending: 0,
    withdrawn: 0,
    total: 0,
    verified: 0
  });
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
  const [withdrawForm] = Form.useForm();
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateRange: null,
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0
  });

  // Get user info from session storage
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    if (!userId) {
      setError('User not logged in');
      setLoading(false);
      return;
    }
    
    fetchTransactions();
    fetchWalletInfo();
  }, [filters, userId, userRole]);

  const fetchWalletInfo = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/wallet/available/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet information');
      }
      const data = await response.json();
      console.log('Wallet data:', data); // Debug log
      setWalletInfo({
        available: Number(data.available) || 0,
        pending: Number(data.pending) || 0,
        withdrawn: Number(data.withdrawn) || 0,
        total: Number(data.total) || 0,
        verified: Number(data.verified) || 0
      });
    } catch (err) {
      console.error('Error fetching wallet info:', err);
      message.error('Failed to fetch wallet information');
    }
  };

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
        limit: filters.limit,
        role: userRole.toLowerCase()
      }).toString();
      
      const response = await fetch(`http://localhost:4000/api/transaction/user/${userId}?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch transactions');
      }
      const data = await response.json();
      console.log('Transaction data:', data); // Debug log
      setTransactions(data.transactions || []);
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        totalPages: data.totalPages || 0
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({
      ...prev,
      dateRange: dates,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount, type, transactionRole) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));

    // For order-related transactions
    if (type.includes('order')) {
      if (userRole === 'Buyer') {
        return `${formattedAmount} (${type === 'order_refund' ? 'Credit' : 'Debit'})`;
      } else if (userRole === 'Seller') {
        if (type === 'order_creation') {
          return `${formattedAmount} (Pending Earnings)`;
        } else if (type === 'order_completion') {
          return `${formattedAmount} (Completed Earnings)`;
        } else if (type === 'order_refund') {
          return `${formattedAmount} (Refunded)`;
        }
      }
    }
    
    // For direct transactions
    if (type === 'withdrawal') {
      return `${formattedAmount} (Debit)`;
    }
    if (type === 'deposit') {
      return `${formattedAmount} (Credit)`;
    }

    // Default case
    return `${formattedAmount} (${amount < 0 ? 'Debit' : 'Credit'})`;
  };

  const getAmountClassName = (amount, type, transactionRole) => {
    // For order-related transactions
    if (type.includes('order')) {
      if (userRole === 'Buyer') {
        return type === 'order_refund' ? 'positive' : 'negative';
      } else if (userRole === 'Seller') {
        if (type === 'order_creation') {
          return 'pending';
        } else if (type === 'order_completion') {
          return 'positive';
        } else if (type === 'order_refund') {
          return 'negative';
        }
      }
    }
    
    // For direct transactions
    if (type === 'withdrawal') {
      return 'negative';
    }
    if (type === 'deposit') {
      return 'positive';
    }

    // Default case
    return amount < 0 ? 'negative' : 'positive';
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      'order_creation': userRole === 'Seller' ? 'New Order' : 'Order Payment',
      'order_completion': 'Order Completed',
      'order_refund': 'Order Refund',
      'withdrawal': 'Withdrawal',
      'deposit': 'Deposit',
      'refund': 'Refund'
    };
    return labels[type] || type.replace(/_/g, ' ').toUpperCase();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#10B981',
      pending: '#F59E0B',
      cancelled: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const handleWithdraw = async (values) => {
    try {
      setWithdrawLoading(true);
      
      // Validate withdrawal amount against verified balance
      if (values.amount > walletInfo.verified) {
        message.error('Withdrawal amount exceeds verified balance');
        return;
      }

      const response = await fetch(`http://localhost:4000/api/wallet/withdraw/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(values.amount),
          bankDetails: values.bankDetails
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Withdrawal request failed');
      }

      const data = await response.json();
      message.success('Withdrawal request submitted successfully');
      setIsWithdrawModalVisible(false);
      withdrawForm.resetFields();
      fetchWalletInfo(); // Refresh wallet info
      fetchTransactions(); // Refresh transactions
    } catch (err) {
      message.error(err.message || 'Failed to process withdrawal request');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const showWithdrawModal = () => {
    setIsWithdrawModalVisible(true);
  };

  const handleCancelWithdraw = () => {
    setIsWithdrawModalVisible(false);
    withdrawForm.resetFields();
  };

  if (loading) return (
    <div className="loading-container">
      <Spin size="large" />
    </div>
  );
  
  if (error) return <Alert message={error} type="error" />;
  if (!userId) return <Alert message="Please log in to view your transactions" type="error" />;

  const renderNavbar = () => {
    switch (user?.role) {
      case "Buyer":
        return <NavbarBuyer />;
      case "Seller":
        return <NavbarSeller />;
      case "Admin":
        return <NavbarAdmin />;
      default:
        return null;
    }
  };

  return (
    <div className="transaction-page">
      {renderNavbar()}
      <div className="transaction-container">
        <h1 className="page-title">Transaction History & Wallet</h1>
        
        {/* Wallet Overview Section */}
        <div className="wallet-overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card className="wallet-card">
                <Statistic
                  title="Verified Balance"
                  value={walletInfo.verified}
                  precision={2}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#10B981' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <div className="balance-info">
                  <small>Available for withdrawal</small>
                </div>
                <div className="wallet-actions">
                  {walletInfo.verified > 0 && (
                    <Button
                      type="primary"
                      icon={<BankOutlined />}
                      onClick={showWithdrawModal}
                      className="withdraw-button"
                      style={{ marginTop: '1rem', width: '100%' }}
                    >
                      Withdraw Funds
                    </Button>
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="wallet-card">
                <Statistic
                  title="Pending Balance"
                  value={walletInfo.pending}
                  precision={2}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#F59E0B' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <div className="balance-info">
                  <small>Funds from completed orders (pending clearance)</small>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="wallet-card">
                <Statistic
                  title="Withdrawn Balance"
                  value={walletInfo.withdrawn}
                  precision={2}
                  prefix={<WalletOutlined />}
                  valueStyle={{ color: '#6B7280' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <div className="balance-info">
                  <small>Total funds withdrawn to date</small>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="wallet-card">
                <Statistic
                  title="Total Balance"
                  value={walletInfo.total}
                  precision={2}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3B82F6' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <div className="balance-info">
                  <small>Total earnings including pending and withdrawn</small>
                </div>
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
                  {userRole === 'Seller' ? (
                    <>
                      <Select.Option value="order_creation">New Orders</Select.Option>
                      <Select.Option value="order_completion">Completed Orders</Select.Option>
                      <Select.Option value="order_refund">Refunds</Select.Option>
                      <Select.Option value="withdrawal">Withdrawals</Select.Option>
                    </>
                  ) : (
                    <>
                      <Select.Option value="order_creation">Order Payments</Select.Option>
                      <Select.Option value="order_refund">Refunds</Select.Option>
                      <Select.Option value="deposit">Deposits</Select.Option>
                    </>
                  )}
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
                  <Select.Option value="failed">Failed</Select.Option>
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
            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td>{formatDate(transaction.timestamp)}</td>
                      <td>{getTransactionTypeLabel(transaction.type)}</td>
                      <td className={getAmountClassName(transaction.amount, transaction.type, transaction.role)}>
                        {formatAmount(transaction.amount, transaction.type, transaction.role)}
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(transaction.status) }}
                        >
                          {transaction.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{transaction.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <Button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </Card>
        </div>

        {/* Withdrawal Modal */}
        <Modal
          title="Withdraw Funds"
          open={isWithdrawModalVisible}
          onCancel={handleCancelWithdraw}
          footer={null}
          className="withdraw-modal"
        >
          <WithdrawalForm
            balance={walletInfo.verified}
            onSuccess={() => {
              setIsWithdrawModalVisible(false);
              fetchWalletInfo();
              fetchTransactions();
            }}
            onCancel={handleCancelWithdraw}
          />
        </Modal>
      </div>
    </div>
  );
};

export default TransactionHistory; 