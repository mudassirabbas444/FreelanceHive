import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import WithdrawalForm from './WithdrawalForm';
import '../../CSS/Wallet.css';
import NavbarBuyer from "../Includes/NavbarBuyer";
import NavbarSeller from "../Includes/NavbarSeller"; 
import NavbarAdmin from "../Includes/NavbarAdmin";
import { FaWallet, FaMoneyBillWave, FaHistory, FaLock, FaShieldAlt } from 'react-icons/fa';

const stripePromise = loadStripe('pk_test_51RFQzsFGXfJNzhXi7V8UqvhlkNQz6Tm8m4aKn8YhR8okKgxNIUIKbH23CqyF4Aw6h2JRJ6odoXd8Xwu7xxFHbw9700T9lDkqrz');

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setError('User not logged in');
      setLoading(false);
      return;
    }
    fetchWalletBalance();
  }, [userId]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/wallet/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }
      const data = await response.json();
      setBalance(data.balance || 0);
      setError(null);
    } catch (err) {
      setError('Failed to fetch wallet balance');
      console.error('Error fetching wallet balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) return <div className="loading">Loading wallet...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!userId) return <div className="error">Please log in to view your wallet</div>;
  const renderNavbar = () => {
    if (user?.role === "Buyer") {
      return <NavbarBuyer />;
    } else if (user?.role === "Seller") {
      return <NavbarSeller />;
    } }
  return (
    <div>
    {renderNavbar()}
    <div className="wallet-container" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#f8f9fa'
    }}>
      <div className="wallet-header" style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          color: '#2d3436',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <FaWallet size={40} color="#1dbf73" />
          My Wallet
        </h2>
        <div className="balance-display" style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'inline-block'
        }}>
          <span className="balance-label" style={{
            fontSize: '1.2rem',
            color: '#636e72',
            marginRight: '1rem'
          }}>Available Balance:</span>
          <span className="balance-amount" style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1dbf73'
          }}>{formatAmount(balance)}</span>
        </div>
      </div>

      <div className="wallet-features" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="feature-card" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <FaMoneyBillWave size={30} color="#1dbf73" style={{ marginBottom: '1rem' }} />
          <h3 style={{
            color: '#2d3436',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>Instant Withdrawals</h3>
          <p style={{
            color: '#636e72',
            fontSize: '0.95rem',
            lineHeight: '1.5'
          }}>Get your money in your bank account within 24 hours</p>
        </div>
        <div className="feature-card" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <FaLock size={30} color="#1dbf73" style={{ marginBottom: '1rem' }} />
          <h3 style={{
            color: '#2d3436',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>Secure Transactions</h3>
          <p style={{
            color: '#636e72',
            fontSize: '0.95rem',
            lineHeight: '1.5'
          }}>Your money is protected with bank-level security</p>
        </div>
        <div className="feature-card" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <FaHistory size={30} color="#1dbf73" style={{ marginBottom: '1rem' }} />
          <h3 style={{
            color: '#2d3436',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>Transaction History</h3>
          <p style={{
            color: '#636e72',
            fontSize: '0.95rem',
            lineHeight: '1.5'
          }}>Track all your withdrawals and deposits</p>
        </div>
      </div>

      <div className="wallet-actions" style={{
        textAlign: 'center',
        marginTop: '2rem'
      }}>
        <button 
          className="withdraw-button"
          onClick={() => setShowWithdrawalForm(true)}
          disabled={balance <= 0}
          style={{
            backgroundColor: balance <= 0 ? '#ccc' : '#1dbf73',
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: balance <= 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (balance > 0) e.target.style.backgroundColor = '#19a463';
          }}
          onMouseOut={(e) => {
            if (balance > 0) e.target.style.backgroundColor = '#1dbf73';
          }}
        >
          <FaMoneyBillWave /> Withdraw Funds
        </button>
      </div>

      {showWithdrawalForm && (
        <div className="withdrawal-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="withdrawal-content" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            position: 'relative'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#2d3436',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaShieldAlt color="#1dbf73" /> Withdraw Funds
            </h3>
            <p style={{
              color: '#636e72',
              marginBottom: '1.5rem'
            }}>Available balance: {formatAmount(balance)}</p>
            <Elements stripe={stripePromise}>
              <WithdrawalForm 
                balance={balance}
                onSuccess={() => {
                  setShowWithdrawalForm(false);
                  fetchWalletBalance();
                }}
                onCancel={() => setShowWithdrawalForm(false)}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Wallet; 