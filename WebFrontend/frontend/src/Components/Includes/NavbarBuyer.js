// NavbarBuyer.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../CSS/navbar.css";
import { Home, ShoppingBag, Briefcase, MessageSquare, FileText, Lightbulb, User, LogOut, Wallet, CheckCircle2, BarChart2 } from "lucide-react";

function NavbarBuyer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (user) {
        try {
          const response = await fetch(`http://localhost:4000/api/verification/status/${user.id}`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const status = await response.json();
            setIsVerified(status.status === 'Approved');
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      }
    };

    checkVerificationStatus();
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <ul className="navbar-list">
        <li className="navbar-item1">
          <a href="/gigs" className="navbar-link logo-link">
            <span className="logo-text">FreelanceHive</span>
            {isVerified && (
              <span className="verified-badge" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#10B981',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginLeft: '8px'
              }}>
                <CheckCircle2 size={12} />
                Verified
              </span>
            )}
          </a>
        </li>
        <li className="navbar-item">
          <a href="/buyer/dashboard" className={`navbar-link ${location.pathname === "/buyer/dashboard" ? "active" : ""}`}>
            <BarChart2 size={18} className="nav-icon" />
            <span>Dashboard</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/orders" className={`navbar-link ${location.pathname === "/orders" ? "active" : ""}`}>
            <ShoppingBag size={18} className="nav-icon" />
            <span>My Orders</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/gigs" className={`navbar-link ${location.pathname === "/gigs" ? "active" : ""}`}>
            <Briefcase size={18} className="nav-icon" />
            <span>Gigs</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/chat" className={`navbar-link ${location.pathname === "/chat" ? "active" : ""}`}>
            <MessageSquare size={18} className="nav-icon" />
            <span>Chats</span>
            <span className="nav-notification">2</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/buyerRequests" className={`navbar-link ${location.pathname === "/buyerRequests" ? "active" : ""}`}>
            <FileText size={18} className="nav-icon" />
            <span>Buyer Requests</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/ideas" className={`navbar-link ${location.pathname === "/ideas" ? "active" : ""}`}>
            <Lightbulb size={18} className="nav-icon" />
            <span>Ideas</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/transactionHistory" className={`navbar-link ${location.pathname === "/transactionHistory" ? "active" : ""}`}>
            <Wallet size={18} className="nav-icon" />
            <span>Transactions</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/profile" className={`navbar-link ${location.pathname === "/profile" ? "active" : ""}`}>
            <User size={18} className="nav-icon" />
            <span>Profile</span>
          </a>
        </li>
        <li className="navbar-item">
          <button onClick={handleLogout} className="navbar-linkn">
            <LogOut size={18} className="nav-icon" />
            <span>Logout</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default NavbarBuyer;