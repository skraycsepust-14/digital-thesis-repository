// frontend/src/pages/EditProfilePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserEdit, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';

const EditProfilePage = () => {
    const { user, token, setUser } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Redirect if user is not authenticated
        if (!user) {
            navigate('/login');
            return;
        }

        // Fetch current user data to pre-populate the form
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/users/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const { username, email } = response.data;
                setFormData({ username, email });
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, token, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage(''); // Clear message on new input
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await axios.put(
                'http://localhost:5000/api/users/profile',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Update user in context with new data
            setUser(response.data);
            setMessage('Profile updated successfully!');
            setError('');
        } catch (err) {
            console.error('Error updating profile:', err);
            const errMsg = err.response?.data?.msg || 'Failed to update profile. Please try again.';
            setError(errMsg);
            setMessage('');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary me-2" />
                <p className="text-secondary fs-5">Loading profile data...</p>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: '600px' }}>
                <h2 className="card-title text-center mb-4">
                    <FontAwesomeIcon icon={faUserEdit} className="me-2 text-primary" />
                    Edit Profile
                </h2>
                <div className="card-body">
                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                ) : (
                                    <FontAwesomeIcon icon={faSave} className="me-2" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;