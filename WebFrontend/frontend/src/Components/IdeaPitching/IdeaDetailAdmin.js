import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import NavbarAdmin from "../Includes/NavbarAdmin";

const IdeaDetailAdmin = () => {
    const { ideaId } = useParams();
    const navigate = useNavigate();
    const [ideaDetails, setIdeaDetails] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [rejectionFeedback, setRejectionFeedback] = useState("");
    const user = JSON.parse(sessionStorage.getItem("user"));

    useEffect(() => {
        if (!user || user.role !== "Admin") {
            setError("Access denied. Please log in as an Admin.");
            navigate("/");
            return;
        }
        fetchData();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [ideaRes, repliesRes] = await Promise.all([
                fetch(`http://localhost:4000/api/idea/${ideaId}`, {
                    headers: { "Authorization": `Bearer ${sessionStorage.getItem('token')}` }
                }),
                fetch(`http://localhost:4000/api/idea/${ideaId}/replies`, {
                    headers: { "Authorization": `Bearer ${sessionStorage.getItem('token')}` }
                })
            ]);

            if (!ideaRes.ok) throw new Error("Failed to fetch idea details");
            if (!repliesRes.ok) throw new Error("Failed to fetch replies");

            const ideaData = await ideaRes.json();
            const repliesData = await repliesRes.json();

            setIdeaDetails(ideaData);
            setReplies(repliesData);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [ideaId]);

    const handleReplyAdded = (newReply) => {
        setReplies(prevReplies => [...prevReplies, newReply]);
    };

    const handleAction = async (action) => {
        if (action === "reject" && !rejectionFeedback.trim()) {
            setError("Please provide feedback for rejection.");
            return;
        }

        if (!window.confirm(`Are you sure you want to ${action} this idea?`)) return;

        try {
            setSubmitting(true);
            setError(null);

            const response = await fetch(`http://localhost:4000/api/idea/${action}/${ideaId}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({ feedback: action === "reject" ? rejectionFeedback : null })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Failed to ${action} idea`);
            }

            navigate("/ideas", {
                state: { message: `Idea ${action}d successfully`, type: "success" }
            });
        } catch (error) {
            console.error("Error:", error);
            setError(error.message || "An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <NavbarAdmin />
                <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </Container>
            </>
        );
    }

    return (
        <>
            <NavbarAdmin />
            <Container className="mt-4">
                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <Card className="mb-4">
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h2 className="mb-0">{ideaDetails?.title}</h2>
                            <Button variant="outline-primary" onClick={() => navigate("/ideas")}>
                                Back to Ideas
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <p><strong>Description:</strong> {ideaDetails?.description}</p>
                                <p><strong>Category:</strong> {ideaDetails?.category}</p>
                            </Col>
                            <Col md={6}>
                                <p><strong>Budget:</strong> ${ideaDetails?.price}</p>
                                <p><strong>Delivery Time:</strong> {ideaDetails?.deliveryTime} days</p>
                                <p><strong>Status:</strong> 
                                    <span className={`badge bg-${ideaDetails?.status === "open" ? "success" : ideaDetails?.status === "rejected" ? "danger" : "secondary"}`}>
                                        {ideaDetails?.status}
                                    </span>
                                </p>
                            </Col>
                        </Row>

                        {ideaDetails?.status === "rejected" && ideaDetails?.feedback && (
                            <Alert variant="info" className="mt-3">
                                <strong>Rejection Feedback:</strong> {ideaDetails.feedback}
                            </Alert>
                        )}

                        {ideaDetails?.status === "pending" && (
                            <Card className="mt-4">
                                <Card.Header>
                                    <h3 className="mb-0">Moderate Idea</h3>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Rejection Feedback (required if rejecting)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={rejectionFeedback}
                                            onChange={(e) => setRejectionFeedback(e.target.value)}
                                            placeholder="Provide feedback explaining why the idea is being rejected..."
                                        />
                                    </Form.Group>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Button
                                            variant="success"
                                            onClick={() => handleAction("approve")}
                                            disabled={submitting}
                                        >
                                            {submitting ? "Processing..." : "Approve Idea"}
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleAction("reject")}
                                            disabled={submitting}
                                        >
                                            {submitting ? "Processing..." : "Reject Idea"}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </Card.Body>
                </Card>

            </Container>
        </>
    );
};

export default IdeaDetailAdmin;
