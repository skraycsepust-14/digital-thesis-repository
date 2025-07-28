// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEnvelope, faUserTag, faCalendarAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import '../styles/ProfilePage.css'; // Import the custom CSS file

const ProfilePage = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { token } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/api/users/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setProfileData(response.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Failed to fetch profile data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary me-2" />
                <p className="text-secondary fs-5">Loading profile...</p>
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

    if (!profileData) {
        return (
            <div className="container mt-5">
                <div className="alert alert-info text-center">No profile data found.</div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="card mx-auto profile-card" style={{ maxWidth: '600px' }}>
                <div className="profile-header">
                    <FontAwesomeIcon icon={faUserCircle} />
                    <h2>{profileData.username}</h2>
                </div>
                <ul className="profile-details">
                    <li>
                        <FontAwesomeIcon icon={faEnvelope} className="fa-icon" />
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{profileData.email}</span>
                    </li>
                    <li>
                        <FontAwesomeIcon icon={faUserTag} className="fa-icon" />
                        <span className="detail-label">Role:</span>
                        <span className="detail-value text-capitalize">{profileData.role}</span>
                    </li>
                    <li>
                        <FontAwesomeIcon icon={faCalendarAlt} className="fa-icon" />
                        <span className="detail-label">Joined On:</span>
                        <span className="detail-value">{new Date(profileData.date).toLocaleDateString()}</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default ProfilePage;