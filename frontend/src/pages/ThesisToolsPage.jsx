import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMicroscope, // For Text Analysis
    faSpellCheck, // For Grammar Check
    faCopy,       // For Plagiarism Check
    faSpinner,
    faCheckCircle,
    faExclamationCircle,
    faLightbulb, // For insights
    faKeyboard, // For input
    faSmile, faMeh, faFrown, // For sentiment icons
    faTools // Corrected: Added faTools import
} from '@fortawesome/free-solid-svg-icons';
import '../styles/ThesisToolsPage.css'; // Create this CSS file for styling

const ThesisToolsPage = () => {
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // State for Text Analysis
    const [analysisResult, setAnalysisResult] = useState(null);

    // State for Grammar Check
    const [grammarIssues, setGrammarIssues] = useState([]);

    // State for Plagiarism Check
    const [plagiarismResult, setPlagiarismResult] = useState(null);

    // Base URL for your Flask backend
    const API_BASE_URL = 'http://localhost:5002'; // Corrected: Using port 5002

    const handleAnalyzeText = async () => {
        setLoading(true);
        setError('');
        setAnalysisResult(null);
        setGrammarIssues([]); // Clear other results
        setPlagiarismResult(null); // Clear other results

        try {
            const response = await axios.post(`${API_BASE_URL}/analyze`, { text: inputText });
            setAnalysisResult(response.data);
        } catch (err) {
            console.error('Error calling text analysis service:', err);
            setError(err.response?.data?.error || 'Failed to perform text analysis.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckGrammar = async () => {
        setLoading(true);
        setError('');
        setGrammarIssues([]);
        setAnalysisResult(null); // Clear other results
        setPlagiarismResult(null); // Clear other results

        try {
            const response = await axios.post(`${API_BASE_URL}/check-grammar`, { text: inputText });
            setGrammarIssues(response.data.issues);
        } catch (err) {
            console.error('Error calling grammar checker AI service:', err);
            setError(err.response?.data?.error || 'Failed to check grammar. Ensure the backend service is running and LanguageTool is initialized.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckPlagiarism = async () => {
        setLoading(true);
        setError('');
        setPlagiarismResult(null);
        setAnalysisResult(null); // Clear other results
        setGrammarIssues([]); // Clear other results

        try {
            const response = await axios.post(`${API_BASE_URL}/check-plagiarism`, { text: inputText });
            setPlagiarismResult(response.data);
        } catch (err) {
            console.error('Error calling plagiarism checker AI service:', err);
            setError(err.response?.data?.error || 'Failed to check plagiarism. Backend service might be down or an internal error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const getSentimentIcon = (sentiment) => {
        if (sentiment === 'Positive') return faSmile;
        if (sentiment === 'Negative') return faFrown;
        return faMeh;
    };

    return (
        <div className="thesis-tools-page container my-5">
            <h2 className="text-center mb-4 text-primary">
                <FontAwesomeIcon icon={faTools} className="me-2" />Thesis AI Tools
            </h2>
            <p className="text-center text-muted mb-5">
                Utilize advanced AI capabilities to analyze your thesis text, check grammar, and perform conceptual plagiarism scans.
            </p>

            <div className="card shadow-sm mb-4">
                <div className="card-header bg-primary text-white">
                    <FontAwesomeIcon icon={faKeyboard} className="me-2" />
                    Enter Your Thesis Text
                </div>
                <div className="card-body">
                    <textarea
                        className="form-control"
                        rows="10"
                        placeholder="Paste your thesis abstract or a section of your text here for analysis..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={loading}
                    ></textarea>
                </div>
            </div>

            <div className="d-grid gap-3 d-md-flex justify-content-center mb-5">
                <button
                    className="btn btn-outline-primary btn-lg flex-grow-1"
                    onClick={handleAnalyzeText}
                    disabled={loading || !inputText.trim()}
                >
                    {loading && analysisResult === null ? <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> : <FontAwesomeIcon icon={faMicroscope} className="me-2" />}
                    Analyze Text
                </button>
                <button
                    className="btn btn-outline-success btn-lg flex-grow-1"
                    onClick={handleCheckGrammar}
                    disabled={loading || !inputText.trim()}
                >
                    {loading && grammarIssues.length === 0 && !error ? <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> : <FontAwesomeIcon icon={faSpellCheck} className="me-2" />}
                    Check Grammar
                </button>
                <button
                    className="btn btn-outline-warning btn-lg flex-grow-1"
                    onClick={handleCheckPlagiarism}
                    disabled={loading || !inputText.trim()}
                >
                    {loading && plagiarismResult === null ? <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> : <FontAwesomeIcon icon={faCopy} className="me-2" />}
                    Check Plagiarism
                </button>
            </div>

            {error && (
                <div className="alert alert-danger text-center mb-4" role="alert">
                    <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
                    {error}
                </div>
            )}

            {loading && !error && (analysisResult || grammarIssues.length > 0 || plagiarismResult) && (
                <div className="alert alert-info text-center mb-4" role="alert">
                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                    Processing...
                </div>
            )}

            {/* Display Text Analysis Results */}
            {analysisResult && (
                <div className="card shadow-sm mb-4 result-card">
                    <div className="card-header bg-info text-white">
                        <FontAwesomeIcon icon={faMicroscope} className="me-2" />
                        Text Analysis Results
                    </div>
                    <div className="card-body">
                        <h5 className="card-title">Summary:</h5>
                        <p className="card-text">{analysisResult.summary || 'No summary available.'}</p>
                        <hr />
                        <h5 className="card-title">Keywords:</h5>
                        <p className="card-text">
                            {analysisResult.keywords && analysisResult.keywords.length > 0
                                ? analysisResult.keywords.join(', ')
                                : 'No keywords found.'}
                        </p>
                        <hr />
                        <h5 className="card-title">Sentiment:</h5>
                        <p className="card-text">
                            <FontAwesomeIcon icon={getSentimentIcon(analysisResult.sentiment)} className="me-2" />
                            {analysisResult.sentiment || 'N/A'}
                        </p>
                    </div>
                </div>
            )}

            {/* Display Grammar Check Results */}
            {grammarIssues.length > 0 && (
                <div className="card shadow-sm mb-4 result-card">
                    <div className="card-header bg-success text-white">
                        <FontAwesomeIcon icon={faSpellCheck} className="me-2" />
                        Grammar Check Results ({grammarIssues.length} Issues)
                    </div>
                    <div className="card-body">
                        {grammarIssues.map((issue, index) => (
                            <div key={index} className="mb-3 p-3 border rounded bg-light">
                                <p className="mb-1"><strong>Issue:</strong> {issue.message}</p>
                                <p className="mb-1"><strong>Suggestions:</strong> {issue.replacements.length > 0 ? issue.replacements.join(', ') : 'No suggestions.'}</p>
                                <p className="mb-0 text-muted small"><strong>Context:</strong> "{issue.context}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {grammarIssues.length === 0 && !loading && !error && inputText.trim() && grammarIssues !== null && (
                <div className="alert alert-success text-center mb-4" role="alert">
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    No grammar issues found! Your text looks great.
                </div>
            )}


            {/* Display Plagiarism Check Results */}
            {plagiarismResult && (
                <div className="card shadow-sm mb-4 result-card">
                    <div className="card-header bg-warning text-white">
                        <FontAwesomeIcon icon={faCopy} className="me-2" />
                        Plagiarism Check Results
                    </div>
                    <div className="card-body">
                        <p className="card-text">
                            <strong>Plagiarism Score:</strong> {plagiarismResult.plagiarism_score}%
                        </p>
                        <p className="card-text">
                            <strong>Status:</strong> {plagiarismResult.status}
                        </p>
                        <p className="card-text">
                            <strong>Matched Source:</strong> {plagiarismResult.matched_source}
                        </p>
                        <p className="card-text text-muted small">
                            <FontAwesomeIcon icon={faLightbulb} className="me-1" />
                            {plagiarismResult.note}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThesisToolsPage;
