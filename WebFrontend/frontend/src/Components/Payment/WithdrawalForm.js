import React, { useState } from 'react';
import '../../CSS/Wallet.css';
import { FaUniversity, FaUser, FaMoneyBillWave, FaLock } from 'react-icons/fa';

const WithdrawalForm = ({ balance, onSuccess, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // List of Pakistani banks
  const banks = [
    "HBL - Habib Bank Limited",
    "UBL - United Bank Limited",
    "MCB - Muslim Commercial Bank",
    "ABL - Allied Bank Limited",
    "JS Bank",
    "Bank Alfalah",
    "Meezan Bank",
    "Faysal Bank",
    "Bank of Punjab",
    "Sindh Bank",
    "Bank of Khyber",
    "First Women Bank",
    "SBP - State Bank of Pakistan",
    "Askari Bank",
    "Soneri Bank",
    "Silk Bank",
    "Standard Chartered Bank",
    "Summit Bank",
    "Al Baraka Bank",
    "Dubai Islamic Bank",
    "Other Bank"
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    setProcessing(true);
    setError(null);

    try {
      // Create withdrawal request
      const response = await fetch('http://localhost:4000/api/wallet/create-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: JSON.parse(sessionStorage.getItem('user')).id,
          amount: parseFloat(amount),
          bankDetails: {
            accountNumber,
            accountHolderName,
            bankName
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process withdrawal');
      }

      const result = await response.json();
      alert('Withdrawal processed successfully! New balance: ' + result.newBalance);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAccountNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    setAccountNumber(value);
  };

  return (
    <form onSubmit={handleSubmit} className="withdrawal-form" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#ff7675',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      
      <div className="form-group" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <label htmlFor="amount" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#2d3436',
          fontWeight: '500'
        }}>
          <FaMoneyBillWave color="#1dbf73" /> Amount to Withdraw
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          max={balance}
          step="0.01"
          required
          style={{
            padding: '0.8rem',
            borderRadius: '8px',
            border: '1px solid #dfe6e9',
            fontSize: '1rem'
          }}
        />
      </div>

      <div className="form-group" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <label htmlFor="bankName" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#2d3436',
          fontWeight: '500'
        }}>
          <FaUniversity color="#1dbf73" /> Bank Name
        </label>
        <select
          id="bankName"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          required
          style={{
            padding: '0.8rem',
            borderRadius: '8px',
            border: '1px solid #dfe6e9',
            fontSize: '1rem',
            backgroundColor: 'white',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232d3436' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.8rem center',
            backgroundSize: '1.2rem',
            paddingRight: '2.5rem'
          }}
        >
          <option value="">Select your bank</option>
          {banks.map((bank, index) => (
            <option key={index} value={bank}>{bank}</option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <label htmlFor="accountHolderName" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#2d3436',
          fontWeight: '500'
        }}>
          <FaUser color="#1dbf73" /> Account Holder Name
        </label>
        <input
          type="text"
          id="accountHolderName"
          value={accountHolderName}
          onChange={(e) => setAccountHolderName(e.target.value)}
          placeholder="Enter account holder name"
          required
          style={{
            padding: '0.8rem',
            borderRadius: '8px',
            border: '1px solid #dfe6e9',
            fontSize: '1rem'
          }}
        />
      </div>

      <div className="form-group" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <label htmlFor="accountNumber" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#2d3436',
          fontWeight: '500'
        }}>
          <FaLock color="#1dbf73" /> Bank Account Number
        </label>
        <input
          type="text"
          id="accountNumber"
          value={accountNumber}
          onChange={handleAccountNumberChange}
          placeholder="Enter your bank account number"
          maxLength="20"
          required
          style={{
            padding: '0.8rem',
            borderRadius: '8px',
            border: '1px solid #dfe6e9',
            fontSize: '1rem'
          }}
        />
      </div>

      <div className="form-actions" style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
          disabled={processing}
          style={{
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid #dfe6e9',
            backgroundColor: 'white',
            color: '#2d3436',
            cursor: 'pointer',
            flex: 1,
            fontSize: '1rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f1f2f6'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="submit-button"
          disabled={processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || !accountNumber || !accountHolderName || !bankName}
          style={{
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || !accountNumber || !accountHolderName || !bankName ? '#ccc' : '#1dbf73',
            color: 'white',
            cursor: processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || !accountNumber || !accountHolderName || !bankName ? 'not-allowed' : 'pointer',
            flex: 1,
            fontSize: '1rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            if (!processing && amount && parseFloat(amount) > 0 && parseFloat(amount) <= balance && accountNumber && accountHolderName && bankName) {
              e.target.style.backgroundColor = '#19a463';
            }
          }}
          onMouseOut={(e) => {
            if (!processing && amount && parseFloat(amount) > 0 && parseFloat(amount) <= balance && accountNumber && accountHolderName && bankName) {
              e.target.style.backgroundColor = '#1dbf73';
            }
          }}
        >
          {processing ? 'Processing...' : 'Withdraw'}
        </button>
      </div>
    </form>
  );
};

export default WithdrawalForm; 