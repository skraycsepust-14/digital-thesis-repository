// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faFileAlt,
    faClock,
    faCheckCircle,
    faTimesCircle,
    faChevronLeft,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import '../styles/DashboardPage.css'; // NEW: Import the custom CSS for this page

const THESES_PER_PAGE = 5; // CHANGED: Now show 5 theses per page

const DashboardPage = () => {
    const [userTheses, setUserTheses] = useState([]);
    const [isFetchingTheses, setIsFetchingTheses] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const { user, isAuthenticated, token, loading } = useAuth();

    const fetchUserTheses = async () => {
        setIsFetchingTheses(true);
        try {
            const response = await axios.get('http://localhost:5000/api/theses/me');
            setUserTheses(response.data);
            setError(null);
            setCurrentPage(1); // Reset to first page when new theses are fetched
        } catch (err) {
            console.error('Error fetching user theses:', err);
            setError('Failed to fetch your theses. Please try again later.');
            setUserTheses([]);
        } finally {
            setIsFetchingTheses(false);
        }
    };

    useEffect(() => {
        if (!loading && isAuthenticated) {
            fetchUserTheses();
        }

        if (!loading && !isAuthenticated) {
            setUserTheses([]);
            setIsFetchingTheses(false);
            setCurrentPage(1);
        }
    }, [isAuthenticated, loading]);

    // Calculate theses to display for the current page
    const indexOfLastThesis = currentPage * THESES_PER_PAGE;
    const indexOfFirstThesis = indexOfLastThesis - THESES_PER_PAGE;
    const currentTheses = userTheses.slice(indexOfFirstThesis, indexOfLastThesis);
    const totalPages = Math.ceil(userTheses.length / THESES_PER_PAGE);

    // Functions for navigating between pages
    const goToNextPage = () => {
        setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
    };

    const goToPrevPage = () => {
        setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    };

    if (loading || isFetchingTheses) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <p className="text-secondary fs-5">Loading your theses...</p>
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

    return (
        <div className="container mt-5">
            <div className="card shadow-sm p-4 dashboard-content-card"> {/* Added custom class for potential future styling */}
                <h2 className="card-title text-center mb-4">
                    <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                    {user?.username}'s Dashboard
                </h2>

                {/* New Link to another section/page on the dashboard */}
                <div className="text-center mb-4">
                    <Link to="/another-dashboard-section" className="btn btn-secondary">
                        Go to Another Dashboard Section
                    </Link>
                </div>


                {userTheses && userTheses.length === 0 ? (
                    <div className="card-body text-center">
                        <p className="text-muted">You have not submitted any theses yet.</p>
                        <Link to="/upload-thesis" className="btn btn-primary mt-3">
                            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                            Upload Your First Thesis
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Changed this div to 'thesis-cards-horizontal' for custom flexbox styling */}
                        <div className="thesis-cards-horizontal">
                            {currentTheses.map((thesis) => (
                                // Removed col-lg-6 and added 'thesis-card-item' for custom sizing
                                <div key={thesis._id} className="thesis-card-item">
                                    <div className="card h-100 shadow-sm border-0">
                                        <div className="card-body d-flex flex-column">
                                            <Link to={`/thesis/${thesis._id}`} className="text-decoration-none">
                                                <h5 className="card-title fw-bold text-primary mb-2">{thesis.title}</h5>
                                            </Link>
                                            <p className="card-text mb-1">
                                                <span className="fw-semibold">Author:</span> {thesis.authorName}
                                            </p>
                                            <p className="card-text mb-1">
                                                <span className="fw-semibold">Department:</span> {thesis.department}
                                            </p>
                                            <p className={`card-text fw-bold ${getStatusColor(thesis.status)} mt-auto`}>
                                                {getStatusIcon(thesis.status)}
                                                Status: {thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {userTheses.length > THESES_PER_PAGE && (
                            <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} className="me-2" /> Previous Page
                                </button>
                                <span className="text-muted fw-bold">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    Next Page <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;

// Helper functions for status icons and colors (remain unchanged)
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