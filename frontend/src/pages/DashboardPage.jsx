// frontend/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileAlt,
    faClock,
    faCheckCircle,
    faTimesCircle,
    faSpinner,
    faEdit,
    faEye,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    const { user, token } = useAuth();
    const [theses, setTheses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserTheses = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const config = {
                headers: {
                    'x-auth-token': token,
                },
            };
            const response = await axios.get('http://localhost:5000/api/theses/my-theses', config);
            setTheses(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching user theses:', err);
            setError('Failed to fetch your theses. Please try again later.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && token) {
            fetchUserTheses();
        } else {
            setLoading(false);
        }
    }, [user, token]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-secondary" />
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
const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this thesis?')) return;
    try {
        await axios.delete(`http://localhost:5000/api/theses/${id}`, {
            headers: { 'x-auth-token': token }
        });
        setTheses(theses.filter(thesis => thesis._id !== id));
    } catch (err) {
        console.error('Delete failed:', err);
        alert('Failed to delete. Try again.');
    }
};

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4 text-primary">My Submissions</h2>
            {theses.length === 0 ? (
                <div className="alert alert-info text-center">You have not submitted any theses yet.</div>
            ) : (
                <div className="list-group">
                    {theses.map((thesis) => (
                        <div key={thesis._id} className="list-group-item list-group-item-action mb-2 shadow-sm">
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">{thesis.title}</h5>
                                <small className="text-muted">{new Date(thesis.submissionDate).toLocaleDateString()}</small>
                            </div>
                            <p className="mb-1 text-muted">Status: <span className="fw-bold">{thesis.status}</span></p>
                            <div className="d-flex justify-content-end mt-2">
                                {thesis.status === 'pending' && (
                                    <>
                                        <Link to={`/edit-thesis/${thesis._id}`} className="btn btn-sm btn-outline-secondary me-2">
                                            <FontAwesomeIcon icon={faEdit} className="me-1" /> Edit
                                        </Link>
                                        <button
  onClick={() => handleDelete(thesis._id)}
  className="btn btn-sm btn-outline-danger"
>
  <FontAwesomeIcon icon={faTrash} className="me-1" /> Delete
</button>
                                        
                                    </>
                                )}
                                {thesis.status !== 'pending' && (
                                    <Link to={`/thesis/${thesis._id}`} className="btn btn-sm btn-outline-primary">
                                        <FontAwesomeIcon icon={faEye} className="me-1" /> View
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;