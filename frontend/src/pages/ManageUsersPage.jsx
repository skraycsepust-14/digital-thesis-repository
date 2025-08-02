// frontend/src/pages/ManageUsersPage.jsx

// This component is the administrative page for managing users.
// Only users with the 'admin' role can access this page.
// It fetches all user data and allows the administrator to change user roles.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserShield, faSpinner } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from '../components/ConfirmModal'; // Import the new ConfirmModal component
import '../styles/ManageUsers.css';

const ManageUsersPage = () => {
    // State to hold the list of all users
    const [users, setUsers] = useState([]);
    
    // State for loading, error handling, and the confirmation modal
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingRoleUserId, setUpdatingRoleUserId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ userId: null, newRole: '' });
    const [successMessage, setSuccessMessage] = useState(null);

    // Get user and authentication token from the AuthContext
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // Function to fetch all user data from the protected backend endpoint
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch user data. Please ensure you have administrative access.');
        } finally {
            setLoading(false);
        }
    };

    // This effect runs once on component mount and whenever user or token changes.
    // It handles initial data fetching and client-side access control.
    useEffect(() => {
        // Redirect non-admin users immediately.
        if (!user || user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }

        if (token) {
            fetchUsers();
        }
    }, [user, token, navigate]);

    // Function to open the confirmation modal before updating a user's role
    const handleRoleChange = (userId, newRole) => {
        setModalData({ userId, newRole });
        setShowModal(true);
    };

    // The function that performs the actual role update after modal confirmation
    const confirmRoleChange = async () => {
        setShowModal(false);
        const { userId, newRole } = modalData;
        setUpdatingRoleUserId(userId);
        setSuccessMessage(null);
        setError(null);

        try {
            await axios.put(
                `http://localhost:5000/api/users/${userId}/role`,
                { role: newRole },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            // On success, show a success message and then re-fetch users
            setSuccessMessage(`User role updated to '${newRole}'.`);
            await fetchUsers();
        } catch (err) {
            console.error('Failed to update user role:', err);
            const errMsg = err.response?.data?.msg || 'Failed to update user role.';
            setError(errMsg);
        } finally {
            setUpdatingRoleUserId(null);
        }
    };

    // Render loading state while data is being fetched
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary me-2" />
                <p className="text-secondary fs-5">Loading users...</p>
            </div>
        );
    }
    
    return (
        <div className="container mt-5">
            {/* Display success or error messages if they exist */}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="card shadow-sm p-4 user-management-container">
                <h2 className="card-title text-center mb-4 user-management-header">
                    <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                    User Management
                </h2>
                {users.length === 0 ? (
                    <div className="card-body text-center">
                        <p className="text-muted">No users found.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table user-management-table">
                            <thead>
                                <tr>
                                    <th scope="col">Username</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Role</th>
                                    <th scope="col">Join Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((userItem) => (
                                    <tr key={userItem._id}>
                                        <td>{userItem.username}</td>
                                        <td>{userItem.email}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <select
                                                    className="form-select role-select"
                                                    value={userItem.role}
                                                    onChange={(e) => handleRoleChange(userItem._id, e.target.value)}
                                                    disabled={userItem._id === user.id || updatingRoleUserId === userItem._id}
                                                >
                                                    <option value="user">user</option>
                                                    <option value="supervisor">supervisor</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                                {updatingRoleUserId === userItem._id && (
                                                    <FontAwesomeIcon icon={faSpinner} spin className="ms-2 text-primary" />
                                                )}
                                            </div>
                                        </td>
                                        <td>{new Date(userItem.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* The custom confirmation modal component */}
            <ConfirmModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={confirmRoleChange}
                title="Confirm Role Change"
                message={`Are you sure you want to change the role of this user to '${modalData.newRole}'?`}
            />
        </div>
    );
};

export default ManageUsersPage;
