// frontend/src/pages/ManageUsersPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserShield, faSpinner } from '@fortawesome/free-solid-svg-icons';
import '../styles/ManageUsers.css'; // NEW: Import the custom CSS file

const ManageUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingRoleUserId, setUpdatingRoleUserId] = useState(null); // New state to track loading per user

    const { user, token } = useAuth();
    const navigate = useNavigate();

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
            setError('Failed to fetch user data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Client-side role check for an extra layer of protection
        if (!user || user.role !== 'admin') {
            navigate('/dashboard'); // Redirect if not an admin
            return;
        }

        if (token) {
            fetchUsers();
        }
    }, [user, token, navigate]);

    // New function to handle role changes
    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to change the role of this user to '${newRole}'?`)) {
            return;
        }

        setUpdatingRoleUserId(userId);
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
            // Re-fetch users to update the list
            await fetchUsers();
        } catch (err) {
            console.error('Failed to update user role:', err);
            const errMsg = err.response?.data?.msg || 'Failed to update user role.';
            alert(errMsg);
        } finally {
            setUpdatingRoleUserId(null);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary me-2" />
                <p className="text-secondary fs-5">Loading users...</p>
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
                                        </td>
                                        <td>{new Date(userItem.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsersPage;