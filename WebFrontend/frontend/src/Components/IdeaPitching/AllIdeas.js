import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert, Spinner, Row, Col, Navbar, Nav } from "react-bootstrap";
import { FaFilter, FaChevronRight, FaEye, FaEyeSlash, FaRegListAlt, FaSearch, FaStar, FaRegClock, FaTag, FaThList, FaSlidersH, FaRegCalendarAlt, FaDollarSign } from "react-icons/fa";
import { Fade } from 'react-reveal';
import { IoMdCafe } from "react-icons/io";
import "../../CSS/gig.css";
import NavbarSeller from "../Includes/NavbarSeller";

const AllIdeas = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        category: ""
    });
    const [showFilters, setShowFilters] = useState(false);

    const predefinedCategories = [
        "Web Development",
        "Mobile Development",
        "UI/UX Design",
        "Graphic Design",
        "Content Writing",
        "Digital Marketing",
        "Data Science",
        "Machine Learning",
        "Other"
    ];

    useEffect(() => {
        if (!user) {
            setError("Access denied. Please log in.");
            navigate("/");
            return;
        }
        
        if (!["Admin", "Seller"].includes(user.role)) {
            setError("Unauthorized: Invalid role.");
            navigate("/");
            return;
        }

        fetchIdeas();
    }, []); // Run only on mount

    const fetchIdeas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(`http://localhost:4000/api/ideas?${queryParams}`, {
                headers: { "Authorization": `Bearer ${sessionStorage.getItem('token')}` }
            });

            if (!response.ok) throw new Error("Failed to fetch ideas");

            const data = await response.json();
            setIdeas(data);
        } catch (error) {
            console.error("Error fetching ideas:", error);
            setError("Failed to fetch ideas. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            category: ""
        });
        fetchIdeas();
    };

    const handleViewDetails = (idea) => {
        if (!user || !user.role) {
            setError("Unauthorized: No role assigned.");
            return;
        }

        if (user.role === "Admin") {
            navigate(`/ideaAdmin/${idea.ideaId}`);
        } else if (user.role === "Seller") {
            navigate(`/ideaSeller/${idea.ideaId}`);
        } else {
            setError("Unauthorized: Invalid role.");
        }
    };

    const toggleFilters = () => {
        setShowFilters(prev => !prev);
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'status-badge pending';
            case 'approved':
                return 'status-badge approved';
            case 'rejected':
                return 'status-badge rejected';
            case 'closed':
                return 'status-badge closed';
            case 'open':
                return 'status-badge open';
            default:
                return 'status-badge default';
        }
    };

    return (
        <><NavbarSeller/>
        <div className="gig-container animate-fade-in">

            <div className="page-header">
                <h1>Explore Available Ideas</h1>
                <p>Find the perfect business opportunity for your needs</p>
            </div>

            <div className="filters-container">
                <div className="filters-header">
                    <h2>Filters</h2>
                    <button className="toggle-filters-btn" onClick={toggleFilters}>
                        <FaSlidersH /> {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>
                
                {showFilters && (
                    <div className="filters show-filters">
                        <div className="select-wrapper">
                            <FaThList className="select-icon" />
                            <Form.Select name="category" value={filters.category} onChange={handleFilterChange}>
                                <option value="">All Categories</option>
                                {predefinedCategories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>

                        <div className="filter-buttons">
                            <Button variant="secondary" onClick={clearFilters} className="action-button">
                                <FaFilter /> Clear Filters
                            </Button>
                            <Button variant="primary" onClick={fetchIdeas} className="action-button">
                                <FaFilter /> Apply Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="gig-stats">
                <p>{ideas.length} ideas found</p>
            </div>

            {loading ? (
                <div className="gig-grid">
                    {Array(6).fill().map((_, index) => (
                        <div key={`skeleton-${index}`} className="loading-card"></div>
                    ))}
                </div>
            ) : ideas.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💡</div>
                    <h2>No Ideas Found</h2>
                    <p>Try adjusting your filters or search terms</p>
                    <button 
                        className="action-button primary-button" 
                        style={{ marginTop: '1rem', width: 'auto' }}
                        onClick={clearFilters}
                    >
                        Reset Filters
                    </button>
                </div>
            ) : (
                <div className="gig-grid">
                    {ideas.map((idea) => (
                        <Fade bottom key={idea.ideaId}>
                            <div className="gig-card" onClick={() => handleViewDetails(idea)}>
                                <div className="gig-content">
                                    <div className="category-pill">
                                        <IoMdCafe style={{ marginRight: '4px' }} />
                                        {idea.category}
                                    </div>
                                    <h3 className="gig-title">{idea.title}</h3>
                                    <p className="gig-description">
                                        {idea.description?.substring(0, 100)}
                                        {idea.description?.length > 100 ? "..." : ""}
                                    </p>
                                    
                                    <div className="gig-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">Status</span>
                                            <span className={getStatusBadgeClass(idea.status)}>
                                                {idea.status}
                                            </span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">Created</span>
                                            <span className="meta-value">
                                                <FaRegCalendarAlt style={{ marginRight: '4px', fontSize: '12px' }} />
                                                {new Date(idea.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="gig-actions">
                                        <button className="action-button primary-button">
                                            <FaChevronRight style={{ marginRight: '4px' }} /> View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Fade>
                    ))}
                </div>
            )}
        </div>
        </>
    );
};

export default AllIdeas;
