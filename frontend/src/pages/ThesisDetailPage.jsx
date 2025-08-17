// Updated ThesisDetailPage.jsx with loading spinner, AI analysis auto-trigger, refresh button, and toast notifications
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faUser,
  faBuilding,
  faCalendar,
  faDownload,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faSmile,
  faMeh,
  faFrown,
  faSyncAlt,
} from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";
import "bootstrap/dist/css/bootstrap.min.css";

const ThesisDetailPage = () => {
  const { id } = useParams();
  const [thesis, setThesis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingThesis, setLoadingThesis] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [thesisError, setThesisError] = useState(null);
  const [recommendationsError, setRecommendationsError] = useState(null);

  const API_BASE_URL = "http://localhost:5002";

  useEffect(() => {
    const fetchThesisDetails = async () => {
      setLoadingThesis(true);
      setThesisError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/theses/${id}`);
        setThesis(response.data);
      } catch (err) {
        setThesisError(
          err.response?.data?.error || "Failed to fetch thesis details."
        );
      } finally {
        setLoadingThesis(false);
      }
    };

    if (id) fetchThesisDetails();
  }, [id]);

  useEffect(() => {
    if (thesis && thesis.analysisStatus !== "complete") {
      triggerAIAnalysis();
    }
  }, [thesis]);

  const triggerAIAnalysis = async () => {
    // If there is no full_text, alert the user and return.
    if (!thesis?.full_text) {
      setToastMsg("Cannot perform AI analysis: No full text available.");
      setTimeout(() => setToastMsg(""), 4000);
      return;
    }
    try {
      setLoadingAI(true);
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        text: thesis.full_text,
      });
      const updated = await axios.patch(
        `${API_BASE_URL}/theses/${thesis._id}`,
        {
          aiSummary: response.data.summary,
          aiKeywords: response.data.keywords,
          aiSentiment: response.data.sentiment,
          analysisStatus: "complete",
        }
      );
      setThesis(updated.data);
      setToastMsg("AI analysis completed successfully.");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setToastMsg("Failed to complete AI analysis.");
    } finally {
      setLoadingAI(false);
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!thesis || !thesis._id) return setRecommendations([]);
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      try {
        const response = await axios.post(`${API_BASE_URL}/recommend-theses`, {
          thesis_id: thesis._id,
          top_k: 5,
        });
        setRecommendations(response.data.recommendations);
      } catch (err) {
        setRecommendationsError(
          err.response?.data?.error || "Failed to load recommendations."
        );
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [thesis]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FontAwesomeIcon icon={faClock} className="text-warning me-2" />;
      case "approved":
        return (
          <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
        );
      case "rejected":
        return (
          <FontAwesomeIcon icon={faTimesCircle} className="text-danger me-2" />
        );
      default:
        return (
          <FontAwesomeIcon icon={faFileAlt} className="text-secondary me-2" />
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-warning";
      case "approved":
        return "text-success";
      case "rejected":
        return "text-danger";
      default:
        return "text-secondary";
    }
  };

  const getSentimentInfo = (sentiment) => {
    switch (sentiment) {
      case "Positive":
        return { icon: faSmile, color: "text-success" };
      case "Neutral":
      case "No Sentiment":
        return { icon: faMeh, color: "text-secondary" };
      case "Negative":
        return { icon: faFrown, color: "text-danger" };
      default:
        return { icon: faMeh, color: "text-secondary" };
    }
  };

  if (loadingThesis) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <ClipLoader size={60} color="#0d6efd" loading={true} />
      </div>
    );
  }

  if (thesisError) {
    return (
      <div className="alert alert-danger text-center mt-5">{thesisError}</div>
    );
  }

  if (!thesis) {
    return (
      <div className="alert alert-info text-center mt-5">Thesis not found.</div>
    );
  }

  const { icon: sentimentIcon, color: sentimentColor } = getSentimentInfo(
    thesis.aiSentiment || "No Sentiment"
  );

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4 mb-5">
        <div className="card-body">
          <h2 className="card-title text-primary fw-bold mb-3">
            {thesis.title}
          </h2>
          <hr />

          <div className="d-flex justify-content-between align-items-center">
            <div className="text-white">
              Status:{" "}
              <span className={getStatusColor(thesis.status)}>
                {getStatusIcon(thesis.status)}
                {thesis.status}
              </span>
            </div>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={triggerAIAnalysis}
              disabled={loadingAI}
            >
              <FontAwesomeIcon icon={faSyncAlt} className="me-2" />
              {loadingAI ? "Analyzing..." : "Refresh AI Analysis"}
            </button>
          </div>

          <p className="mt-3">
            <FontAwesomeIcon icon={faUser} className="me-2" />
            Author: {thesis.authorName || "N/A"}
          </p>
          <p>
            <FontAwesomeIcon icon={faBuilding} className="me-2" />
            Department: {thesis.department || "N/A"}
          </p>
          <p>
            <FontAwesomeIcon icon={faCalendar} className="me-2" />
            Year: {thesis.submissionYear || "N/A"}
          </p>

          <div className="mt-4">
            <h4 className="fw-bold">Abstract</h4>
            <p>{thesis.abstract || "No abstract available."}</p>
          </div>

          {thesis.full_text && (
            <>
              <h4 className="fw-bold mt-4">Full Text</h4>
              <div
                className="bg-light p-3 border rounded"
                style={{ maxHeight: 300, overflowY: "auto" }}
              >
                {thesis.full_text}
              </div>
            </>
          )}

          <hr className="my-4" />

          {thesis.analysisStatus === "complete" ? (
            <div>
              <h3 className="text-primary fw-bold mb-3">AI Analysis</h3>
              <h5 className="fw-bold">Summary</h5>
              <p>{thesis.aiSummary}</p>
              <h5 className="fw-bold mt-3">Keywords</h5>
              <div className="d-flex flex-wrap">
                {(thesis.aiKeywords || []).map((kw, i) => (
                  <span key={i} className="badge bg-secondary me-2 mb-2">
                    {kw}
                  </span>
                ))}
              </div>
              <h5 className="fw-bold mt-3">Sentiment</h5>
              <p className={`fw-bold ${sentimentColor}`}>
                <FontAwesomeIcon icon={sentimentIcon} className="me-2" />
                {thesis.aiSentiment || "N/A"}
              </p>
            </div>
          ) : (
            <div className="alert alert-info text-center mt-3">
              AI Analysis Status:{" "}
              <strong>{thesis.analysisStatus || "Pending"}</strong>
            </div>
          )}

          <div className="mt-4 text-center">
            {thesis.filePath ? (
              <a
                href={`http://localhost:5000/${thesis.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success"
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Download PDF
              </a>
            ) : (
              <p className="text-muted">No PDF available</p>
            )}
          </div>
        </div>
      </div>

      <div className="card shadow-lg p-4 mb-5">
        <div className="card-body">
          <h3 className="text-primary fw-bold mb-3">Recommended Theses</h3>
          {loadingRecommendations ? (
            <div className="text-center">
              <ClipLoader size={30} color="#0d6efd" loading={true} />
              <p className="text-muted mt-2">Loading recommendations...</p>
            </div>
          ) : recommendationsError ? (
            <div className="alert alert-danger text-center">
              {recommendationsError}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="list-group">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  to={`/thesis/${rec.id}`}
                  className="list-group-item list-group-item-action"
                >
                  <div className="d-flex justify-content-between">
                    <h5 className="mb-1 text-primary">{rec.title}</h5>
                    <small className="text-success">
                      Similarity: {rec.similarity_score.toFixed(4)}
                    </small>
                  </div>
                  <p className="mb-1 text-muted">By: {rec.author}</p>
                  <p className="text-truncate">{rec.abstract}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="alert alert-info text-center">
              No recommendations found.
            </div>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3">
          <div className="toast show bg-info text-white">
            <div className="toast-body">{toastMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisDetailPage;
