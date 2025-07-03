import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Container, Spinner, Form } from "react-bootstrap";
import NavbarBuyer from "../Includes/NavbarBuyer";
import { FaPlus, FaChevronRight, FaRegClock, FaRegCalendarAlt, FaExclamationCircle, FaTrash } from "react-icons/fa";
import { Fade } from 'react-reveal';
import "../../CSS/ideas.css";

const Ideas = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [showDeleted, setShowDeleted] = useState(false);
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000; 

    const fetchIdeas = useCallback(async () => {
        if (!user || !user.id) {
            setError("User information not found");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:4000/api/ideas/${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setIdeas([]);  // No ideas found
                    return;
                }
                const data = await response.json();
                throw new Error(data.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            setIdeas(data);
            setRetryCount(0); // Reset retry count on success
        } catch (error) {
            console.error("Error:", error);
            setError(error.message.includes("Failed to fetch")
                ? "Connection failed. Please check your internet connection."
                : error.message
            );

            // Retry logic with a limit
            if (retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                setTimeout(fetchIdeas, RETRY_DELAY);
            }
        } finally {
            setLoading(false);
        }
    }, [user, retryCount]);

    useEffect(() => {
        if (!user) {
            setError("Access denied. Please log in.");
            navigate("/");
            return;
        }

        if (user.role !== "Buyer") {
            navigate(user.role === "Admin" ? "/adminGigs" : user.role === "Seller" ? "/sellerGigs" : "/");
            return;
        }

        fetchIdeas();
    }, []); // Run only on mount

    const handleRetry = () => {
        setRetryCount(0);
        fetchIdeas();
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
            case 'deleted':
                return 'status-badge deleted';
            default:
                return 'status-badge default';
        }
    };

    // Filter ideas based on showDeleted toggle
    const filteredIdeas = ideas.filter(idea => showDeleted ? true : idea.status !== 'deleted');

    return (
        <div className="ideas-container">
            <NavbarBuyer />
            
            <div className="ideas-header">
                <h1>My Ideas</h1>
                <p>Manage and track your business ideas</p>
            </div>

            {error && (
                <div className="ideas-error-wrapper">
                    <Alert variant="danger" className="ideas-alert">
                        <FaExclamationCircle className="ideas-alert-icon" />
                        {error}
                        <div className="ideas-retry-wrapper">
                            <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={handleRetry}
                                disabled={loading}
                                className="ideas-retry-button"
                            >
                                {loading ? 'Retrying...' : 'Try Again'}
                            </Button>
                        </div>
                    </Alert>
                </div>
            )}

            {retryCount > 0 && loading && (
                <Alert variant="info" className="ideas-retry-alert">
                    <Spinner animation="border" size="sm" className="ideas-spinner" />
                    Retry attempt {retryCount} of {MAX_RETRIES}...
                </Alert>
            )}

            <div className="ideas-controls">
                <div className="ideas-stats">
                    <p className="ideas-count">{filteredIdeas.length} ideas found</p>
                    <Form.Check 
                        type="switch"
                        id="show-deleted"
                        label="Show deleted ideas"
                        checked={showDeleted}
                        onChange={(e) => setShowDeleted(e.target.checked)}
                        className="ideas-deleted-toggle"
                    />
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => navigate("/createIdea")}
                    disabled={loading}
                    className="ideas-create-button"
                >
                    <FaPlus className="ideas-button-icon" /> Create New Idea
                </Button>
            </div>

            {loading ? (
                <div className="ideas-grid">
                    {Array(6).fill().map((_, index) => (
                        <div key={`skeleton-${index}`} className="ideas-loading-card"></div>
                    ))}
                </div>
            ) : filteredIdeas.length === 0 ? (
                <div className="ideas-empty-state">
                    <div className="ideas-empty-icon">💡</div>
                    <h2>No Ideas Found</h2>
                    <p>{showDeleted ? "No deleted ideas found." : "Click 'Create New Idea' to get started!"}</p>
                    {!showDeleted && (
                        <button 
                            className="ideas-create-button ideas-create-button-empty" 
                            onClick={() => navigate("/createIdea")}
                        >
                            <FaPlus className="ideas-button-icon" /> Create New Idea
                        </button>
                    )}
                </div>
            ) : (
                <div className="ideas-grid">
                    {filteredIdeas.map((idea) => (
                        <Fade bottom key={idea.ideaId}>
                            <div className="ideas-card" onClick={() => navigate(`/idea/${idea.ideaId}`)}>
                                <div className="ideas-card-content">
                                    <div className="ideas-category">
                                        {idea.category}
                                    </div>
                                    <h3 className="ideas-title">{idea.title}</h3>
                                    <p className="ideas-description">
                                        {idea.description?.substring(0, 100)}
                                        {idea.description?.length > 100 ? "..." : ""}
                                    </p>
                                    
                                    <div className="ideas-meta">
                                        <div className="ideas-meta-item">
                                            <span className="ideas-meta-label">Status</span>
                                            <span className={`ideas-status ${getStatusBadgeClass(idea.status)}`}>
                                                {idea.status}
                                            </span>
                                        </div>
                                        <div className="ideas-meta-item">
                                            <span className="ideas-meta-label">Created</span>
                                            <span className="ideas-meta-value">
                                                <FaRegCalendarAlt className="ideas-meta-icon" />
                                                {new Date(idea.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="ideas-actions">
                                        <button className="ideas-view-button">
                                            <FaChevronRight className="ideas-button-icon" /> View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Fade>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Ideas;
