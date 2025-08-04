// frontend/src/pages/AdminDashboardPage.jsx

// This component is the admin dashboard where administrators and supervisors can
// approve or reject pending theses and view analytics.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileAlt,
    faClock,
    faCheckCircle,
    faTimesCircle,
    faSpinner,
    faChartBar, // New icon for the analytics dashboard
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { getPendingTheses, updateThesisStatus } from '../api/thesisApi';

// Placeholder for a chart component. You can replace this with a real chart library
// like Chart.js, Recharts, or Nivo.
const Chart = ({ title, data }) => (
    <div className="card shadow-sm h-100">
        <div className="card-body">
            <h5 className="card-title text-center text-primary">{title}</h5>
            <div className="chart-placeholder text-center text-muted p-5">
                <p>Chart for "{title}"</p>
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    </div>
);

const AdminDashboardPage = () => {
    const [pendingTheses, setPendingTheses] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user, token } = useAuth();
    const navigate = useNavigate();

    const fetchPendingTheses = async () => {
        try {
            const theses = await getPendingTheses(token);
            setPendingTheses(theses);
        } catch (err) {
            console.error('Error fetching pending theses:', err);
            setError('Failed to fetch pending theses. Please try again later.');
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            // Updated API calls to fetch analytics data with authentication headers
            const config = {
                headers: {
                    'x-auth-token': token,
                },
            };
            const [thesesByDeptRes, thesesByStatusRes] = await Promise.all([
                axios.get('http://localhost:5000/api/theses/analytics/by-department', config),
                axios.get('http://localhost:5000/api/theses/analytics/by-status', config),
            ]);

            setAnalyticsData({
                thesesByDepartment: thesesByDeptRes.data,
                thesesByStatus: thesesByStatusRes.data,
            });
        } catch (err) {
            console.error('Error fetching analytics data:', err);
            // setError('Failed to fetch analytics data.');
        }
    };

    useEffect(() => {
        if (user && token && (user.role === 'admin' || user.role === 'supervisor')) {
            // Fetch both pending theses and analytics data
            Promise.all([fetchPendingTheses(), fetchAnalyticsData()])
                .finally(() => setLoading(false));
        } else if (user) {
            navigate('/dashboard');
        } else {
            setLoading(false);
        }
    }, [user, token, navigate]);

    const handleAction = async (thesisId, action) => {
        setIsSubmitting(true);
        try {
            const result = await updateThesisStatus(thesisId, action, token);
            if (result.success) {
                // Refetch both lists to update the dashboard
                await Promise.all([fetchPendingTheses(), fetchAnalyticsData()]);
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

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-secondary me-2" />
                <p className="text-secondary fs-5">Loading dashboard data...</p>
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

    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
        return <div className="container mt-5"><div className="alert alert-warning text-center">You do not have permission to view this page.</div></div>;
    }

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">
                <FontAwesomeIcon icon={faChartBar} className="me-2 text-primary" />
                Administrative Dashboard
            </h2>

            {/* Analytics Dashboard Section */}
            <section className="analytics-section mb-5">
                <h3 className="text-center text-secondary mb-4">Repository Analytics</h3>
                <div className="row g-4">
                    <div className="col-lg-6">
                        <Chart title="Theses by Department" data={analyticsData?.thesesByDepartment} />
                    </div>
                    <div className="col-lg-6">
                        <Chart title="Theses by Status" data={analyticsData?.thesesByStatus} />
                    </div>
                </div>
            </section>

            {/* Pending Theses for Review Section */}
            <div className="card shadow-sm p-4">
                <h3 className="card-title text-center mb-4">
                    <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                    Pending Theses for Review
                </h3>
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