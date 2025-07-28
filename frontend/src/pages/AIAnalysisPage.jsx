// frontend/src/pages/AIAnalysisPage.jsx (Updated: Compact "Back to Home" link)
import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faTools, faChartLine, faBookReader, faSpinner, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const AIAnalysisPage = () => {
    // State for Readability Analysis
    const [readabilityText, setReadabilityText] = useState('');
    const [readabilityResults, setReadabilityResults] = useState(null);
    const [readabilityLoading, setReadabilityLoading] = useState(false);
    const [readabilityError, setReadabilityError] = useState('');

    // State for Automated Tagging
    const [taggingText, setTaggingText] = useState('');
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [taggingLoading, setTaggingLoading] = useState(false);
    const [taggingError, setTaggingError] = useState('');


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

    // --- Automated Tagging Functions ---
    const handleTagSuggestion = async () => {
        setTaggingLoading(true);
        setSuggestedTags([]);
        setTaggingError('');
        try {
            const response = await axios.post(`${FLASK_API_URL}/suggest-tags`, { text: taggingText });
            setSuggestedTags(response.data.suggested_tags || []);
        } catch (error) {
            console.error('Error suggesting tags:', error);
            setTaggingError('Failed to suggest tags. Please try again.');
        } finally {
            setTaggingLoading(false);
        }
    };

    return (
        <div className="container mt-5 py-5">
            {/* START: Compact "Back to Home" link */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fw-bold text-dark m-0">AI Analysis Tools</h1>
                <Link to="/" className="btn btn-outline-secondary">
                    <FontAwesomeIcon icon={faTools} className="me-2" /> Back to Home
                </Link>
            </div>
            <p className="lead text-muted mb-5">
                Explore advanced AI-powered tools for thesis analysis, summarization, and insights.
            </p>
            {/* END: Compact "Back to Home" link */}

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

            {/* Automated Tagging / Keyword Suggestion Section */}
            <div className="card shadow-sm p-4 mb-5">
                <h3 className="mb-4 text-primary">
                    <FontAwesomeIcon icon={faLightbulb} className="me-2" /> Automated Tagging / Keyword Suggestion
                </h3>
                <p className="text-muted">
                    Paste text (e.g., an abstract) to get suggested relevant tags or keywords based on predefined categories.
                </p>
                <div className="mb-3">
                    <label htmlFor="taggingText" className="form-label">Enter text for tag suggestion:</label>
                    <textarea
                        className="form-control"
                        id="taggingText"
                        rows="6"
                        value={taggingText}
                        onChange={(e) => setTaggingText(e.target.value)}
                        placeholder="Paste thesis abstract, summary, or full text here..."
                    ></textarea>
                </div>
                <button
                    className="btn btn-info w-100 text-white"
                    onClick={handleTagSuggestion}
                    disabled={taggingLoading || !taggingText.trim()}
                >
                    {taggingLoading ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Suggesting Tags...
                        </>
                    ) : (
                        "Suggest Tags"
                    )}
                </button>

                {taggingError && <div className="alert alert-danger mt-3">{taggingError}</div>}

                {suggestedTags.length > 0 && (
                    <div className="mt-4 p-3 bg-light rounded">
                        <h5 className="text-secondary mb-3">Suggested Tags:</h5>
                        <div className="d-flex flex-wrap">
                            {suggestedTags.map((tag, index) => (
                                <span key={index} className="badge bg-secondary me-2 mb-2 p-2 fs-6">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <p className="text-muted mt-3 small">
                            Note: This is a conceptual suggestion based on keywords. For production, a trained ML model would be used.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnalysisPage;