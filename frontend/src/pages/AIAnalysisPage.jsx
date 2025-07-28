// frontend/src/pages/AIAnalysisPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faTools, faChartLine, faTags, faBookReader, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const AIAnalysisPage = () => {
    const [readabilityText, setReadabilityText] = useState('');
    const [readabilityResults, setReadabilityResults] = useState(null);
    const [readabilityLoading, setReadabilityLoading] = useState(false);
    const [readabilityError, setReadabilityError] = useState('');

    const [topics, setTopics] = useState([]);
    const [topicModelingLoading, setTopicModelingLoading] = useState(false);
    const [topicModelingError, setTopicModelingError] = useState('');

    const FLASK_API_URL = "http://localhost:5002"; // Your Flask backend URL

    // --- Readability Analysis Functions ---
    const handleReadabilityAnalyze = async () => {
        setReadabilityLoading(true);
        setReadabilityResults(null);
        setReadabilityError('');
        try {
            const response = await axios.post(`${FLASK_API_URL}/readability`, { text: readabilityText });
            setReadabilityResults(response.data);
        } catch (error) {
            console.error('Error fetching readability scores:', error);
            setReadabilityError('Failed to get readability scores. Please try again.');
        } finally {
            setReadabilityLoading(false);
        }
    };

    // --- Topic Modeling Functions ---
    const handleTopicModeling = async () => {
        setTopicModelingLoading(true);
        setTopics([]);
        setTopicModelingError('');
        try {
            // Topic modeling analyzes the entire collection, so no specific input text is sent
            const response = await axios.get(`${FLASK_API_URL}/topic-modeling`);
            setTopics(response.data.topics || []); // Ensure it's an array
        } catch (error) {
            console.error('Error fetching topics:', error);
            setTopicModelingError('Failed to perform topic modeling. Please ensure theses are uploaded.');
        } finally {
            setTopicModelingLoading(false);
        }
    };

    return (
        <div className="container mt-5 py-5">
            <div className="card shadow-lg p-5 mb-5 text-center">
                <FontAwesomeIcon icon={faBrain} size="5x" className="text-primary mb-4" />
                <h1 className="mb-3 fw-bold text-dark">AI Analysis Tools</h1>
                <p className="lead text-muted mb-4">
                    Explore advanced AI-powered tools for thesis analysis, summarization, and insights.
                </p>
                <div className="mt-4">
                    <Link to="/" className="btn btn-outline-primary btn-lg">
                        <FontAwesomeIcon icon={faTools} className="me-2" /> Back to Home
                    </Link>
                </div>
            </div>

            {/* Readability Analysis Section */}
            <div className="card shadow-sm p-4 mb-5">
                <h3 className="mb-4 text-primary">
                    <FontAwesomeIcon icon={faBookReader} className="me-2" /> Readability Analysis
                </h3>
                <div className="mb-3">
                    <label htmlFor="readabilityText" className="form-label">Enter text to analyze readability:</label>
                    <textarea
                        className="form-control"
                        id="readabilityText"
                        rows="6"
                        value={readabilityText}
                        onChange={(e) => setReadabilityText(e.target.value)}
                        placeholder="Paste your thesis abstract, introduction, or any text here..."
                    ></textarea>
                </div>
                <button
                    className="btn btn-primary w-100"
                    onClick={handleReadabilityAnalyze}
                    disabled={readabilityLoading || !readabilityText.trim()}
                >
                    {readabilityLoading ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Analyzing...
                        </>
                    ) : (
                        "Analyze Readability"
                    )}
                </button>

                {readabilityError && <div className="alert alert-danger mt-3">{readabilityError}</div>}

                {readabilityResults && (
                    <div className="mt-4 p-3 bg-light rounded">
                        <h5 className="text-secondary mb-3">Readability Scores:</h5>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                Flesch Reading Ease: <span className="badge bg-info">{readabilityResults.flesch_reading_ease.toFixed(2)}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                Flesch-Kincaid Grade Level: <span className="badge bg-info">{readabilityResults.flesch_kincaid_grade.toFixed(2)}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                Gunning Fog Index: <span className="badge bg-info">{readabilityResults.gunning_fog.toFixed(2)}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                SMOG Index: <span className="badge bg-info">{readabilityResults.smog_index.toFixed(2)}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                Automated Readability Index: <span className="badge bg-info">{readabilityResults.automated_readability_index.toFixed(2)}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                Dale-Chall Readability Score: <span className="badge bg-info">{readabilityResults.dale_chall_readability_score.toFixed(2)}</span>
                            </li>
                        </ul>
                        <p className="text-muted mt-3 small">
                            Note: Lower Flesch Reading Ease means harder to read. Other scores indicate approximate grade levels.
                        </p>
                    </div>
                )}
            </div>

            {/* Topic Modeling Section */}
            <div className="card shadow-sm p-4">
                <h3 className="mb-4 text-primary">
                    <FontAwesomeIcon icon={faTags} className="me-2" /> Repository Topic Modeling
                </h3>
                <p className="text-muted">
                    Discover the main themes and topics present across all submitted theses in the repository.
                </p>
                <button
                    className="btn btn-success w-100"
                    onClick={handleTopicModeling}
                    disabled={topicModelingLoading}
                >
                    {topicModelingLoading ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Analyzing Topics...
                        </>
                    ) : (
                        "Generate Topics for Repository"
                    )}
                </button>

                {topicModelingError && <div className="alert alert-danger mt-3">{topicModelingError}</div>}

                {topics.length > 0 && (
                    <div className="mt-4 p-3 bg-light rounded">
                        <h5 className="text-secondary mb-3">Discovered Topics:</h5>
                        <ul className="list-group">
                            {topics.map((topic) => (
                                <li key={topic.id} className="list-group-item">
                                    <strong>Topic {topic.id + 1}:</strong> {topic.words}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnalysisPage;