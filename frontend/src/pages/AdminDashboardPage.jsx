// frontend/src/pages/AdminDashboardPage.jsx

// This component is the admin dashboard where administrators and supervisors can
// approve or reject pending theses. It fetches pending theses from a protected
// backend endpoint and provides buttons to perform actions on them.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faClock, faCheckCircle, faTimesCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
// Import the new API functions from thesisApi.js
import { getPendingTheses, updateThesisStatus } from '../api/thesisApi';

const AdminDashboardPage = () => {
    // State to store the list of pending theses
    const [pendingTheses, setPendingTheses] = useState([]);
    
    // State for loading and error handling
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State to disable buttons during submission to prevent multiple clicks
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get user and authentication token from the AuthContext
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Function to fetch pending theses from the backend using the new API function
    const fetchPendingTheses = async () => {
        try {
            // Call the new API function with the token
            const theses = await getPendingTheses(token);
            setPendingTheses(theses);
        } catch (err) {
            console.error('Error fetching pending theses:', err);
            setError('Failed to fetch pending theses. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Use a useEffect hook to fetch data when the component mounts or
    // when the user or token changes.
    useEffect(() => {
        // Check for user and token to avoid fetching with invalid credentials
        if (user && token && (user.role === 'admin' || user.role === 'supervisor')) {
            fetchPendingTheses();
        } else if (user) {
            // If a user is logged in but lacks the required role, redirect them
            navigate('/dashboard');
        } else {
            // If no user is logged in, finish loading state and let
            // the main routing handle the unauthenticated user.
            setLoading(false);
        }
    }, [user, token, navigate]); // Dependencies ensure this effect runs when user or token changes

    // Function to handle the approval or rejection of a thesis using the new API function
    const handleAction = async (thesisId, action) => {
        setIsSubmitting(true);
        try {
            // Call the new API function with the thesis ID, action, and token
            const result = await updateThesisStatus(thesisId, action, token);
            if (result.success) {
                // After a successful action, refetch the pending theses to update the list
                fetchPendingTheses();
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error(`Error performing ${action} action:`, err);
            setError(`Failed to ${action} thesis. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render loading state while data is being fetched
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-secondary me-2" />
                <p className="text-secondary fs-5">Loading pending theses...</p>
            </div>
        );
    }

    // Render an error message if an error occurred during fetching
    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center">{error}</div>
            </div>
        );
    }

    // Final client-side check to ensure only authorized users see the content.
    // The backend also performs this check, but this provides a better UX.
    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
        return <div className="container mt-5"><div className="alert alert-warning text-center">You do not have permission to view this page.</div></div>;
    }

    // Render the main dashboard content
    return (
        <div className="container mt-5">
            <div className="card shadow-sm p-4">
                <h2 className="card-title text-center mb-4">
                    <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                    Pending Theses for Review
                </h2>
                {pendingTheses.length === 0 ? (
                    <div className="card-body text-center">
                        <p className="text-muted">No theses are currently pending review.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {pendingTheses.map((thesis) => (
                            <div key={thesis._id} className="col-lg-6">
                                <div className="card h-100 shadow-sm border-0">
                                    <div className="card-body">
                                        <h5 className="card-title fw-bold text-primary mb-2">{thesis.title}</h5>
                                        <p className="card-text mb-1">
                                            <span className="fw-semibold">Author:</span> {thesis.authorName}
                                        </p>
                                        <p className="card-text mb-1">
                                            <span className="fw-semibold">Department:</span> {thesis.department}
                                        </p>
                                        <p className="card-text mb-1">
                                            <span className="fw-semibold">Submitted:</span> {new Date(thesis.submissionDate).toLocaleDateString()}
                                        </p>
                                        <p className="card-text text-muted mt-2">
                                            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                                            Status: <span className="text-warning fw-bold">{thesis.status}</span>
                                        </p>

                                        <div className="mt-3 d-flex justify-content-around">
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleAction(thesis._id, 'approve')}
                                                disabled={isSubmitting}
                                            >
                                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleAction(thesis._id, 'reject')}
                                                disabled={isSubmitting}
                                            >
                                                <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboardPage;
