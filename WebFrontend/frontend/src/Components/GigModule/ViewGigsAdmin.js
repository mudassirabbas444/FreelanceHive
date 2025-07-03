import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarAdmin from '../Includes/NavbarAdmin';
import { FaSearch, FaStar, FaRegClock, FaTag, FaThList, FaSlidersH, FaRegCalendarAlt, FaDollarSign, FaChevronRight } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/gig.css";

function ViewGigsAdmin() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    price: '',
    status: '',
  });
  const [priceRanges] = useState(['< $50', '$50 - $200', '$200+']);
  const [statuses] = useState(['pending', 'active', 'paused', 'deleted']);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Admin") {
      alert("Access denied. Please log in as an Admin.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        const filterString = JSON.stringify(filters);
        const response = await fetch(`http://localhost:4000/api/gigs?filters=${encodeURIComponent(filterString)}`);
        if (!response.ok) throw new Error('Failed to fetch gigs');
        const data = await response.json();
        setGigs(data);
      } catch (error) {
        console.error('Error fetching gigs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, [filters]);

  const handleSearchChange = (e) => setFilters({ ...filters, search: e.target.value });
  const handleCategoryChange = (e) => setFilters({ ...filters, category: e.target.value });
  const handlePriceChange = (e) => setFilters({ ...filters, price: e.target.value });
  const handleStatusChange = (e) => setFilters({ ...filters, status: e.target.value });

  const handleViewDetails = (gigId) => {
    navigate(`/gigAdmin/${gigId}`);
  };

  return (
    <div className="gig-container animate-fade-in">
      <NavbarAdmin />

      <div className="page-header">
        <h1>Manage Gigs</h1>
        <p>Monitor and moderate all service offerings</p>
      </div>

      <div className="filters-container">
        <div className="filters-header">
          <h2>Filters</h2>
          <button className="toggle-filters-btn" onClick={() => setShowFilters(!showFilters)}>
            <FaSlidersH /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters section */}
        <div className={`filters ${showFilters ? 'show-filters' : 'hide-filters'}`}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Search gigs..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="select-wrapper">
            <FaThList className="select-icon" />
            <select className="form-input" value={filters.category} onChange={handleCategoryChange}>
              <option value="">All Categories</option>
              <option value="Graphic Design">Graphic Design</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Writing & Translation">Writing & Translation</option>
              <option value="Video & Animation">Video & Animation</option>
              <option value="Programming & Tech">Programming & Tech</option>
              <option value="Music & Audio">Music & Audio</option>
              <option value="Business">Business</option>
            </select>
          </div>

          <div className="select-wrapper">
            <FaTag className="select-icon" />
            <select className="form-input" value={filters.price} onChange={handlePriceChange}>
              <option value="">All Price Ranges</option>
              {priceRanges.map((range, index) => (
                <option key={index} value={range}>{range}</option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <FaRegCalendarAlt className="select-icon" />
            <select className="form-input" value={filters.status} onChange={handleStatusChange}>
              <option value="">All Statuses</option>
              {statuses.map((status, index) => (
                <option key={index} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="gig-stats">
        <p>{gigs.length} gigs found</p>
      </div>

      <div className="gig-grid">
        {loading ? (
          Array(6).fill().map((_, index) => (
            <div key={`skeleton-${index}`} className="loading-card"></div>
          ))
        ) : gigs.length > 0 ? (
          gigs.map((gig) => (
            <Fade bottom key={gig._id}>
              <div className="gig-card" onClick={() => handleViewDetails(gig._id)}>
                {gig.images ? (
                  <img 
                    src={`http://localhost:4000${gig.images}`}
                    alt={gig.title}
                    className="gig-image"
                  />
                ) : (
                  <div className="gig-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                    <span style={{ color: '#a0aec0' }}>No Image</span>
                  </div>
                )}
                <div className="gig-content">
                  <div className="category-pill">
                    <FaTag className="me-2" />
                    {gig.category}
                  </div>
                  <h3 className="gig-title">{gig.title}</h3>
                  

                  <div className="gig-meta">
                    <div className="meta-item">
                      <span className="meta-label">Starting at</span>
                      <span className="meta-value">
                        <FaDollarSign style={{ marginRight: '4px', fontSize: '12px' }} />
                        {gig.pricePackages && gig.pricePackages[0]?.price}
                      </span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="meta-label">Delivery</span>
                      <span className="meta-value">
                        <FaRegClock style={{ marginRight: '4px', fontSize: '12px' }} />
                        {gig.pricePackages && gig.pricePackages[0]?.deliveryTime} days
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Status</span>
                      <span className={`status-badge ${gig.status.toLowerCase()}`}>
                        {gig.status}
                      </span>
                    </div>
                  </div>

                  <div className="gig-actions">
                    <button className="action-button primary-button"  style={{ marginRight: '4px', height:30, width:50  }}>
                      <FaChevronRight style={{ marginRight: '4px' }} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            </Fade>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h2>No Gigs Found</h2>
            <p>Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewGigsAdmin;
