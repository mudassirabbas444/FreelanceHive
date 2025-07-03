import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarBuyer from '../Includes/NavbarBuyer';
import "../../CSS/gig.css";
// Import icons
import { FaSearch, FaStar,FaChevronRight, FaRegClock, FaTag, FaThList, FaSlidersH, FaRegCalendarAlt, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

function ViewGigs() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    price: '',
    status: '',
    sortBy: 'newest'
  });
  const [priceRanges] = useState(['< $50', '$50 - $200', '$200+']);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Buyer") {
      alert("Access denied. Please log in as a Buyer.");
      navigate("/");
    }
  }, [navigate]);

  // Fetch all gigs & track impressions uniquely
  useEffect(() => {
    const fetchGigs = async () => {
      setLoading(true);
      try {
        const filterString = JSON.stringify(filters);
        const response = await fetch(`http://localhost:4000/api/gigs?filters=${encodeURIComponent(filterString)}`);
        if (!response.ok) throw new Error('Failed to fetch gigs');

        const data = await response.json();
        setGigs(data);

        // Track unique impressions (Prevent multiple counts)
        const viewedGigs = JSON.parse(sessionStorage.getItem("viewedGigs")) || [];
        data.forEach((gig) => {
          if (!viewedGigs.includes(gig._id)) {
            fetch(`http://localhost:4000/api/gigs/${gig._id}/impression`, { method: "POST" });
            viewedGigs.push(gig._id);
          }
        });
        sessionStorage.setItem("viewedGigs", JSON.stringify(viewedGigs));
      } catch (error) {
        console.error("Error fetching gigs:", error);
      } finally {
        // Add slight delay to show loading animation
        setTimeout(() => setLoading(false), 600);
      }
    };

    fetchGigs();
  }, [filters]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    setFilters({ ...filters, category: e.target.value });
  };

  // Handle price range change
  const handlePriceChange = (e) => {
    setFilters({ ...filters, price: e.target.value });
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setFilters({ ...filters, sortBy: e.target.value });
  };

  // Toggle filters on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle gig click (track unique clicks)
  const handleViewDetails = (gigId) => {
    // Check if the user already clicked this gig in this session
    const clickedGigs = JSON.parse(sessionStorage.getItem("clickedGigs")) || [];

    if (!clickedGigs.includes(gigId)) {
      fetch(`http://localhost:4000/api/gigs/${gigId}/click`, { method: "POST" });
      clickedGigs.push(gigId);
      sessionStorage.setItem("clickedGigs", JSON.stringify(clickedGigs));
    }

    navigate(`/gigDetails/${gigId}`);
  };

  // Function to determine if a gig is new (less than 7 days old)
  const isNew = (createdAt) => {
    if (!createdAt) return false;
    const gigDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - gigDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Loading skeleton
  const renderSkeletons = () => {
    return Array(6).fill().map((_, index) => (
      <div key={`skeleton-${index}`} className="loading-card"></div>
    ));
  };

  // Check if any filters are applied
  const hasActiveFilters = () => {
    return filters.search || filters.category || filters.price || filters.status;
  };

  // Handle voice search
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setFilters({ ...filters, search: transcript });
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
  };

  return (
    <div className="view-gigs">
      <NavbarBuyer />
      <div className="gigs-container">
        {/* Search and filter section */}
        <div className="search-filters">
      <div className="filters-container">
        <div className="filters-header">
          <h2>Filters</h2>
          <button className="toggle-filters-btn" onClick={toggleFilters}>
            <FaSlidersH /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        <div className={`filters ${showFilters ? 'show-filters' : 'hide-filters'}`}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Search gigs semantically..."
              value={filters.search}
              onChange={handleSearchChange}
            />
            <button 
              className={`voice-search-btn ${isListening ? 'listening' : ''}`}
              onClick={startListening}
              title="Click to start voice search"
            >
              {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <div className="search-description">
              <small>Powered by NLP: Find gigs even with related terms & concepts</small>
            </div>
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
            <select className="form-input" value={filters.sortBy} onChange={handleSortChange}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priceAsc">Price (Low to High)</option>
              <option value="priceDesc">Price (High to Low)</option>
            </select>
              </div>
          </div>
        </div>
      </div>

        {/* Show recommendations if no filters are applied */}

          <div className="gigs-grid">
      <div className="gig-stats">
        <p>{gigs.length} gigs found</p>
      </div>

      <div className="gig-grid">
        {loading ? (
          renderSkeletons()
        ) : gigs.length > 0 ? (
          gigs
                  .filter((gig) => gig.status === "active")
            .map((gig) => (
            <div key={gig._id} className="gig-card" onClick={() => handleViewDetails(gig._id)}>
              {isNew(gig.createdAt) && <span className="badge badge-new">NEW</span>}
              
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
                <div className="category-pill">{gig.category}</div>
                <h3 className="gig-title">{gig.title}</h3>
                
            
                
                <div className="gig-meta">
                  <div className="meta-item">
                    <span className="meta-label">Starting at</span>
                    <span className="meta-value">${gig.pricePackages && gig.pricePackages[0]?.price}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Delivery</span>
                    <span className="meta-value">
                      <FaRegClock style={{ marginRight: '4px', fontSize: '12px' }} />
                      {gig.pricePackages && gig.pricePackages[0]?.deliveryTime} days
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
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h2>No Gigs Found</h2>
            <p>Try adjusting your filters or search terms</p>
            <button 
              className="action-button primary-button" 
              style={{ marginTop: '1rem', width: 'auto' }}
              onClick={() => setFilters({search: '', category: '', price: '', status: '', sortBy: 'newest'})}
            >
              Reset Filters
            </button>
                </div>
              )}
            </div>
          </div>

      </div>
    </div>
  );
}

export default ViewGigs;
