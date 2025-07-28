// frontend/src/pages/ThesisDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faUser, faBuilding, faCalendar, faDownload, faClock, faCheckCircle, faTimesCircle, faSmile, faMeh, faFrown } from '@fortawesome/free-solid-svg-icons'; // New icons for sentiment

const ThesisDetailPage = () => {
    const { id } = useParams();
    const [thesis, setThesis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchThesisDetails = async () => {
            try {
                const response = await axios.get(`/api/theses/${id}`);
                setThesis(response.data);
            } catch (err) {
                console.error('Error fetching thesis details:', err);
                setError(err.response?.data?.msg || 'Failed to fetch thesis details.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchThesisDetails();
        }
    }, [id]);

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
                return { icon: faMeh, color: 'text-warning' };
            case 'Negative':
                return { icon: faFrown, color: 'text-danger' };
            default:
                return { icon: faMeh, color: 'text-secondary' };
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <p className="text-secondary fs-5">Loading thesis details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center">{error}</div>
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

    const { icon: sentimentIcon, color: sentimentColor } = getSentimentInfo(thesis.aiSentiment);
    const formattedStatus = thesis.status ? thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1) : 'Not Available';

    return (
        <div className="container mt-5">
            <div className="card shadow-lg p-4">
                <div className="card-body">
                    <h2 className="card-title text-primary fw-bold mb-3">{thesis.title}</h2>
                    <hr />
                    <div className="mb-3">
                        <h5 className="card-subtitle mb-2 text-muted">
                            <FontAwesomeIcon icon={faUser} className="me-2" />
                            Author: {thesis.authorName}
                        </h5>
                        <p className="card-text">
                            <FontAwesomeIcon icon={faBuilding} className="me-2" />
                            Department: {thesis.department}
                        </p>
                        <p className="card-text">
                            <FontAwesomeIcon icon={faCalendar} className="me-2" />
                            Submission Year: {thesis.submissionYear}
                        </p>
                        <p className={`card-text fw-bold ${getStatusColor(thesis.status)} mt-3`}>
                            {getStatusIcon(thesis.status)}
                            Status: {formattedStatus}
                        </p>
                    </div>

                    <div className="mt-4">
                        <h4 className="fw-bold">Original Abstract</h4>
                        <p className="card-text">{thesis.abstract}</p>
                    </div>

                    {/* --- New AI Analysis Section --- */}
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
                            AI analysis is currently **{thesis.analysisStatus}**. Please check back later.
                        </div>
                    )}

                    <div className="mt-4">
                        <a href={`http://localhost:5000/${thesis.filePath}`} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-lg">
                            <FontAwesomeIcon icon={faDownload} className="me-2" />
                            Download PDF
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThesisDetailPage;