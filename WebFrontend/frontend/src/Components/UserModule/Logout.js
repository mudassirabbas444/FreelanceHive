import React from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="logout-container">
      <h1>Logging out...</h1>
      <button onClick={handleLogout}>Confirm Logout</button>
    </div>
  );
};

export default Logout;
