import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../CSS/login.css"; // Import the CSS file
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Buyer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        sessionStorage.setItem("user", JSON.stringify(result.user));
        if (result.user.role === "Seller") navigate("/sellerGigs");
        else if (result.user.role === "Admin") navigate("/adminGigs");
        else navigate("/gigs");
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="image-section">
        <img
          src="/images/background.jpeg"
          alt="Login Illustration"
          className="login-image"
        />
        <div className="image-overlay">
          <h2 className="overlay-title">Freelance Hive</h2>
          <p className="overlay-subtitle">Connect. Create. Succeed.</p>
        </div>
      </div>
      
      <div className="form-section">
        <div className="form-header">
          <h1 className="main-title">Welcome Back</h1>
          <p className="subtitle">Log in to access your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} className="input-icon" />
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} className="input-icon" />
              Password
            </label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="input-field"
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="password-toggle-btn"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span 
              className="forgot-password" 
              onClick={() => navigate("/forget-password")}
            >
              Forgot password?
            </span>
          </div>
          
          <div className="form-group">
            <label htmlFor="role">
              <User size={18} className="input-icon" />
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"} 
            {!isLoading && <ArrowRight size={18} className="button-icon" />}
          </button>
          
          <div className="signup-prompt">
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="signup-link"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;