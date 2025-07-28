// frontend/src/pages/ThesisDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faUser, faBuilding, faCalendar, faDownload, faClock, faCheckCircle, faTimesCircle, faSmile, faMeh, faFrown } from '@fortawesome/free-solid-svg-icons'; // New icons for sentiment

const ThesisDetailPage = () => {
    const { id } = useParams();
    const [thesis, setThesis] = useState(null);
    const [recommendations, setRecommendations] = useState([]); // NEW: State for recommendations
    const [loadingThesis, setLoadingThesis] = useState(true); // Renamed for clarity
    const [loadingRecommendations, setLoadingRecommendations] = useState(false); // NEW: State for recommendations loading
    const [thesisError, setThesisError] = useState(null); // Renamed for clarity
    const [recommendationsError, setRecommendationsError] = useState(null); // NEW: State for recommendations error

    // Define your Flask backend URL
    const API_BASE_URL = 'http://localhost:5002';

    // Effect to fetch thesis details when the component mounts or ID changes
    useEffect(() => {
        const fetchThesisDetails = async () => {
            setLoadingThesis(true);
            setThesisError(null);
            try {
                // CORRECTED: Use full API_BASE_URL
                const response = await axios.get(`${API_BASE_URL}/theses/${id}`);
                setThesis(response.data);
            } catch (err) {
                console.error('Error fetching thesis details:', err);
                setThesisError(err.response?.data?.error || 'Failed to fetch thesis details.');
            } finally {
                setLoadingThesis(false);
            }
        };

        if (id) {
            fetchThesisDetails();
        }
    }, [id]); // Re-run when ID changes (e.g., navigating from one recommendation to another)

    // NEW EFFECT: Fetch recommendations when thesis details are loaded
    useEffect(() => {
        const fetchRecommendations = async () => {
            // Only fetch if thesis data is available and has an _id
            if (!thesis || !thesis._id) {
                setRecommendations([]); // Clear previous recommendations if thesis is nullified
                return;
            }

            setLoadingRecommendations(true);
            setRecommendationsError(null);
            try {
                const response = await axios.post(`${API_BASE_URL}/recommend-theses`, {
                    thesis_id: thesis._id,
                    top_k: 5 // Request 5 recommendations
                });
                setRecommendations(response.data.recommendations);
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                setRecommendationsError(err.response?.data?.error || 'Failed to load recommendations. Please try again.');
            } finally {
                setLoadingRecommendations(false);
            }
        };

        fetchRecommendations();
    }, [thesis]); // Re-run this effect whenever the 'thesis' object changes

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <FontAwesomeIcon icon={faClock} className="text-warning me-2" />;
            case 'approved':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />;
            case 'rejected':
                return <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />;
            default:
                return <FontAwesomeIcon icon={faFileAlt} className="text-secondary me-2" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'text-warning';
            case 'approved':
                return 'text-success';
            case 'rejected':
                return 'text-danger';
            default:
                return 'text-secondary';
        }
    };

    const getSentimentInfo = (sentiment) => {
        switch (sentiment) {
            case 'Positive':
                return { icon: faSmile, color: 'text-success' };
            case 'Neutral':
            case 'No Sentiment': // Handle cases where sentiment might be "No Sentiment" from backend
                return { icon: faMeh, color: 'text-secondary' }; // Changed to text-secondary for clearer neutral
            case 'Negative':
                return { icon: faFrown, color: 'text-danger' };
            default:
                return { icon: faMeh, color: 'text-secondary' };
        }
    };

    if (loadingThesis) { // Use loadingThesis
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <p className="text-secondary fs-5">Loading thesis details...</p>
            </div>
        );
    }

    if (thesisError) { // Use thesisError
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center">{thesisError}</div>
            </div>
        );
    }

    if (!thesis) {
        return (
            <div className="container mt-5">
                <div className="alert alert-info text-center">Thesis details not found.</div>
            </div>
        );
    }

    // Ensure thesis.aiSentiment is handled gracefully if it's null/undefined
    const { icon: sentimentIcon, color: sentimentColor } = getSentimentInfo(thesis.aiSentiment || 'No Sentiment');
    const formattedStatus = thesis.status ? thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1) : 'Not Available';

    return (
        <div className="container mt-5">
            <div className="card shadow-lg p-4 mb-5"> {/* Added mb-5 for spacing below this card */}
                <div className="card-body">
                    <h2 className="card-title text-primary fw-bold mb-3">{thesis.title}</h2>
                    <hr />
                    <div className="mb-3">
                        <h5 className="card-subtitle mb-2 text-muted">
                            <FontAwesomeIcon icon={faUser} className="me-2" />
                            Author: {thesis.authorName || 'N/A'}
                        </h5>
                        <p className="card-text">
                            <FontAwesomeIcon icon={faBuilding} className="me-2" />
                            Department: {thesis.department || 'N/A'}
                        </p>
                        <p className="card-text">
                            <FontAwesomeIcon icon={faCalendar} className="me-2" />
                            Submission Year: {thesis.submissionYear || 'N/A'}
                        </p>
                        {thesis.publicationDate && ( // Added check for publicationDate
                            <p className="card-text">
                                <FontAwesomeIcon icon={faCalendar} className="me-2" />
                                Publication Date: {new Date(thesis.publicationDate).toLocaleDateString() || 'N/A'}
                            </p>
                        )}
                        <p className={`card-text fw-bold ${getStatusColor(thesis.status)} mt-3`}>
                            {getStatusIcon(thesis.status)}
                            Status: {formattedStatus}
                        </p>
                    </div>

                    <div className="mt-4">
                        <h4 className="fw-bold">Original Abstract</h4>
                        <p className="card-text text-break">{thesis.abstract || 'No abstract available.'}</p> {/* Added text-break */}
                    </div>

                    {/* Full Text Display - if available */}
                    {thesis.full_text && (
                        <div className="mt-4">
                            <h4 className="fw-bold">Full Text</h4>
                            <div className="card card-body bg-light border-secondary" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <p className="card-text text-break">{thesis.full_text}</p> {/* Added text-break */}
                            </div>
                        </div>
                    )}

                    {/* --- AI Analysis Section --- */}
                    <hr className="my-4" />
                    {thesis.analysisStatus === 'complete' ? (
                        <div className="ai-analysis-section">
                            <h3 className="text-primary fw-bold mb-3">AI Analysis</h3>

                            <div className="mt-3">
                                <h4 className="fw-bold">AI-Generated Summary</h4>
                                <p className="card-text">{thesis.aiSummary || 'Summary not available.'}</p>
                            </div>

                            <div className="mt-4">
                                <h4 className="fw-bold">Keywords</h4>
                                <div className="d-flex flex-wrap">
                                    {thesis.aiKeywords && thesis.aiKeywords.length > 0 ? (
                                        thesis.aiKeywords.map((keyword, index) => (
                                            <span key={index} className="badge bg-secondary text-light me-2 mb-2 p-2">
                                                {keyword}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-muted">No keywords found.</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="fw-bold">Sentiment</h4>
                                <p className={`card-text fw-bold ${sentimentColor}`}>
                                    <FontAwesomeIcon icon={sentimentIcon} className="me-2" />
                                    {thesis.aiSentiment || 'Sentiment not available.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-info text-center mt-4">
                            AI analysis is currently **{thesis.analysisStatus || 'not started'}**. Please check back later.
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        {thesis.filePath ? (
                            <a href={`http://localhost:5000/${thesis.filePath}`} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-lg">
                                <FontAwesomeIcon icon={faDownload} className="me-2" />
                                Download PDF
                            </a>
                        ) : (
                            <p className="text-muted">No PDF available for download.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* NEW: Recommendations Section */}
            <div className="card shadow-lg p-4 mb-5">
                <div className="card-body">
                    <h3 className="text-primary fw-bold mb-3">Recommended Theses</h3>
                    <hr />
                    {loadingRecommendations ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100px' }}>
                            <p className="text-secondary">Loading recommendations...</p>
                        </div>
                    ) : recommendationsError ? (
                        <div className="alert alert-danger text-center">{recommendationsError}</div>
                    ) : recommendations.length > 0 ? (
                        <div className="list-group">
                            {recommendations.map((rec) => (
                                <Link key={rec.id} to={`/thesis/${rec.id}`} className="list-group-item list-group-item-action flex-column align-items-start mb-2">
                                    <div className="d-flex w-100 justify-content-between">
                                        <h5 className="mb-1 text-primary">{rec.title}</h5>
                                        <small className="text-success">Similarity: {rec.similarity_score.toFixed(4)}</small>
                                    </div>
                                    <p className="mb-1 text-muted">By: {rec.author}</p>
                                    <p className="mb-1 text-secondary text-truncate" style={{ maxWidth: '100%' }}>{rec.abstract}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="alert alert-info text-center">No recommendations found for this thesis.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThesisDetailPage;