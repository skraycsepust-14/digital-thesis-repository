// frontend/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faClock, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const AdminDashboardPage = () => {
    const [pendingTheses, setPendingTheses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // FIX: Import 'token' from useAuth hook
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const fetchPendingTheses = async () => {
        try {
            // FIX: Use the imported 'token' variable
            const response = await axios.get('http://localhost:5000/api/theses/pending', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setPendingTheses(response.data);
        } catch (err) {
            console.error('Error fetching pending theses:', err);
            setError('Failed to fetch pending theses. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // We only want to fetch if the user exists and has the correct role.
        // We also need to check for the token's existence to avoid a race condition.
        if (user && token && (user.role === 'admin' || user.role === 'supervisor')) {
            fetchPendingTheses();
        } else if (user) {
            // Redirect non-admin/supervisor users
            navigate('/dashboard');
        } else {
            // Handle cases where there's no user at all
            setLoading(false);
        }
    }, [user, token, navigate]); // FIX: Add 'token' to the dependency array

    const handleAction = async (thesisId, action) => {
        setIsSubmitting(true);
        try {
            // FIX: Use the imported 'token' variable
            await axios.put(`http://localhost:5000/api/theses/${thesisId}/${action}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            fetchPendingTheses();
        } catch (err) {
            console.error(`Error performing ${action} action:`, err);
            setError(`Failed to ${action} thesis. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <p className="text-secondary fs-5">Loading pending theses...</p>
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

    // This check is the final client-side protection
    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
        return <div className="container mt-5"><div className="alert alert-warning text-center">You do not have permission to view this page.</div></div>;
    }

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