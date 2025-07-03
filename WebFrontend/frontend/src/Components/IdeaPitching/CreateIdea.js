import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLightbulb, FaTag, FaPaperPlane, FaArrowLeft, FaCheck } from 'react-icons/fa';
import "../../CSS/ideas.css";
import NavbarBuyer from "../Includes/NavbarBuyer";

const CreateIdea = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [ideaCount, setIdeaCount] = useState(0);
    const [error, setError] = useState(null);

    const categories = [
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

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: ""
    });

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user || user.role !== "Buyer") {
            alert("Access denied. Please log in as a Buyer.");
            navigate("/");
            return;
        }

        // Fetch idea count
        fetch(`http://localhost:4000/api/ideas/${user.id}`)
            .then(response => response.json())
            .then(ideas => {
                const openIdeas = ideas.filter(idea => idea.status === 'open');
                setIdeaCount(openIdeas.length);
            })
            .catch(err => {
                console.error("Error:", err);
                setError("Failed to fetch ideas count");
            });
    }, [navigate]);

    const validateInput = () => {
        if (!formData.title.trim() || !formData.description.trim() || !formData.category.trim()) {
            return "All fields are required.";
        }
        if (formData.title.trim().length < 5) {
            return "Title must be at least 5 characters long.";
        }
        if (/\d/.test(formData.title)) {
            return "Title cannot contain numbers.";
        }
        if (formData.title.length > 100) {
            return "Title cannot exceed 100 characters.";
        }
        if (formData.description.length < 20) {
            return "Description must be at least 20 characters long.";
        }
        if (formData.description.length > 500) {
            return "Description cannot exceed 500 characters.";
        }
        if (ideaCount >= 3) {
            return "You have reached the maximum limit of 3 open ideas.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateInput();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const user = JSON.parse(sessionStorage.getItem("user"));

            const response = await fetch("http://localhost:4000/api/create-idea", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    buyerId: user.id,
                    buyerName: user.name,
                    ...formData
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create idea");

            navigate("/ideas", { state: { message: "Idea submitted successfully!", type: "success" } });
        } catch (err) {
            console.error("Error:", err);
            setError(err.message || "Failed to submit idea");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <NavbarBuyer />
            
            <div className="create-idea-container">
                <div className="create-idea-header">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1>Submit New Idea</h1>
                    <p>Share your business idea with the community</p>
                </div>

                {error && (
                    <div className="error-message">
                        <FaCheck /> {error}
                    </div>
                )}

                <div className="create-idea-form-container">
                    <form onSubmit={handleSubmit} className="create-idea-form">
                        <div className="form-group">
                            <label>
                                <FaLightbulb className="form-icon" />
                                Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter a catchy title for your idea"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <FaTag className="form-icon" />
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="form-input"
                            >
                                <option value="">Select a category</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                <FaPaperPlane className="form-icon" />
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Provide a detailed description of your idea"
                                className="form-input form-textarea"
                                rows={6}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    <>
                                        <FaCheck /> Submit Idea
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateIdea;