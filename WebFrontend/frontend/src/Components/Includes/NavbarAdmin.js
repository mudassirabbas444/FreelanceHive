// NavbarAdmin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../CSS/navbar.css";
import { BarChart2, ShoppingBag, Briefcase, MessageSquare, FileText, Lightbulb, User,Users, LogOut, Wallet } from "lucide-react";


function NavbarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <ul className="navbar-list">
      <li className="navbar-item1">
          <a href="/adminGigs" className="navbar-link logo-link">
            <span className="logo-text">FreelanceHive</span>
            <span className="Admin-badge"></span>
          </a>
        </li>
      <li className="navbar-item">
          <a href="/admin/dashboard" className={`navbar-link ${location.pathname === "/admin/dashboard" ? "active" : ""}`}>
            <BarChart2 size={18} className="nav-icon" />
            <span>Dashboard</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/adminOrders" className={`navbar-link ${location.pathname === "/adminOrders" ? "active" : ""}`}>
            <ShoppingBag size={18} className="nav-icon" />
            <span>Orders</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/adminGigs" className={`navbar-link ${location.pathname === "/adminGigs" ? "active" : ""}`}>
            <Briefcase size={18} className="nav-icon" />
            <span>Gigs</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/allBuyerRequests" className={`navbar-link ${location.pathname === "/allBuyerRequests" ? "active" : ""}`}>
            <FileText size={18} className="nav-icon" />
            <span>Buyer Requests</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/users" className={`navbar-link ${location.pathname === "/users" ? "active" : ""}`}>
            <Users size={18} className="nav-icon" />
            <span>Users</span>
          </a>
        </li>
        <li className="navbar-item">
          <a href="/admin/transactions" className={`navbar-link ${location.pathname === "/admin/transactions" ? "active" : ""}`}>
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

export default NavbarAdmin;
