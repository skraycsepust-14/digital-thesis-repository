import React, { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicroscope,
  faSpellCheck,
  faCopy,
  faSpinner,
  faCheckCircle,
  faExclamationCircle,
  faLightbulb,
  faKeyboard,
  faSmile,
  faMeh,
  faFrown,
  faTools,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/ThesisToolsPage.css";

const ThesisToolsPage = () => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [grammarIssues, setGrammarIssues] = useState([]);
  const [plagiarismResult, setPlagiarismResult] = useState(null);
  const [activeTab, setActiveTab] = useState("analyze");

  const API_BASE_URL = "http://localhost:5002";

  const handleAnalyzeText = async () => {
    setLoading(true);
    setError("");
    setAnalysisResult(null);
    setGrammarIssues([]);
    setPlagiarismResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        text: inputText,
      });
      setAnalysisResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Text analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckGrammar = async () => {
    setLoading(true);
    setError("");
    setGrammarIssues([]);
    setAnalysisResult(null);
    setPlagiarismResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/check-grammar`, {
        text: inputText,
      });
      setGrammarIssues(response.data.issues);
    } catch (err) {
      setError(err.response?.data?.error || "Grammar check failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPlagiarism = async () => {
    setLoading(true);
    setError("");
    setGrammarIssues([]);
    setAnalysisResult(null);
    setPlagiarismResult(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/check-plagiarism`, {
        text: inputText,
      });
      setPlagiarismResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Plagiarism check failed.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === "Positive") return faSmile;
    if (sentiment === "Negative") return faFrown;
    return faMeh;
  };

  return (
    <div
      className="thesis-tools-page container py-5 colorful-tabs"
      style={{ overflowY: "auto", maxHeight: "100vh" }}
    >
      <h2 className="text-center mb-4 text-gradient">
        <FontAwesomeIcon icon={faTools} className="me-2" /> Thesis AI Tools
      </h2>
      <p className="text-center text-white mb-5">
        Use AI to analyze text, correct grammar, and detect plagiarism.
      </p>

      <div className="card shadow mb-4 border-primary">
        <div className="card-header bg-primary text-white">
          <FontAwesomeIcon icon={faKeyboard} className="me-2" /> Paste Your
          Thesis Text
        </div>
        <div className="card-body">
          <textarea
            className="form-control"
            rows="8"
            placeholder="Enter or paste thesis content here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          ></textarea>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3 colorful-nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "analyze" ? "active bg-info text-white" : ""
            }`}
            onClick={() => setActiveTab("analyze")}
          >
            <FontAwesomeIcon icon={faMicroscope} className="me-1" /> Analyze
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "grammar" ? "active bg-success text-white" : ""
            }`}
            onClick={() => setActiveTab("grammar")}
          >
            <FontAwesomeIcon icon={faSpellCheck} className="me-1" /> Grammar
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "plagiarism" ? "active bg-warning text-dark" : ""
            }`}
            onClick={() => setActiveTab("plagiarism")}
          >
            <FontAwesomeIcon icon={faCopy} className="me-1" /> Plagiarism
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {activeTab === "analyze" && (
          <div className="tab-pane fade show active">
            <button
              className="btn btn-primary mb-3"
              onClick={handleAnalyzeText}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
              ) : (
                <FontAwesomeIcon icon={faMicroscope} className="me-2" />
              )}
              Analyze
            </button>

            {error && (
              <div className="alert alert-danger text-center">
                <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />{" "}
                {error}
              </div>
            )}

            {analysisResult && (
              <div className="card border-info">
                <div className="card-header bg-info text-white">
                  Text Analysis
                </div>
                <div className="card-body">
                  <p>
                    <strong>Summary:</strong> {analysisResult.summary || "N/A"}
                  </p>
                  <p>
                    <strong>Keywords:</strong>{" "}
                    {analysisResult.keywords?.join(", ") || "N/A"}
                  </p>
                  <p>
                    <strong>Sentiment:</strong>{" "}
                    <FontAwesomeIcon
                      icon={getSentimentIcon(analysisResult.sentiment)}
                      className="me-1"
                    />{" "}
                    {analysisResult.sentiment || "N/A"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "grammar" && (
          <div className="tab-pane fade show active">
            <button
              className="btn btn-success mb-3"
              onClick={handleCheckGrammar}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
              ) : (
                <FontAwesomeIcon icon={faSpellCheck} className="me-2" />
              )}
              Grammar Check
            </button>

            {error && (
              <div className="alert alert-danger text-center">
                <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />{" "}
                {error}
              </div>
            )}

            {grammarIssues.length > 0 ? (
              <div className="card border-success">
                <div className="card-header bg-success text-white">
                  Grammar Issues
                </div>
                <div className="card-body">
                  {grammarIssues.map((issue, idx) => (
                    <div key={idx} className="mb-3">
                      <p>
                        <strong>Issue:</strong> {issue.message}
                      </p>
                      <p>
                        <strong>Suggestions:</strong>{" "}
                        {issue.replacements.join(", ") || "None"}
                      </p>
                      <p className="text-muted">
                        <strong>Context:</strong> "{issue.context}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !loading &&
              inputText && (
                <div className="alert alert-success text-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" /> No
                  grammar issues found!
                </div>
              )
            )}
          </div>
        )}

        {activeTab === "plagiarism" && (
          <div className="tab-pane fade show active">
            <button
              className="btn btn-warning text-white mb-3"
              onClick={handleCheckPlagiarism}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
              ) : (
                <FontAwesomeIcon icon={faCopy} className="me-2" />
              )}
              Check Plagiarism
            </button>

            {error && (
              <div className="alert alert-danger text-center">
                <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />{" "}
                {error}
              </div>
            )}

            {plagiarismResult && (
              <div className="card border-warning">
                <div className="card-header bg-warning text-dark">
                  Plagiarism Result
                </div>
                <div className="card-body">
                  <p>
                    <strong>Score:</strong> {plagiarismResult.plagiarism_score}%
                  </p>
                  <p>
                    <strong>Status:</strong> {plagiarismResult.status}
                  </p>
                  <p>
                    <strong>Matched Source:</strong>{" "}
                    {plagiarismResult.matched_source}
                  </p>
                  <p className="text-muted">
                    <FontAwesomeIcon icon={faLightbulb} className="me-1" />{" "}
                    {plagiarismResult.note}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThesisToolsPage;
