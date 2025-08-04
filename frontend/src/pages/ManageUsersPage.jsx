import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/ManageUsersPage.css';

const ManageUsersPage = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [sortRole, setSortRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [sortRole]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { 'x-auth-token': token },
      });
      let sorted = res.data;
      if (sortRole) {
        sorted = sorted.filter((u) => u.role === sortRole);
      }
      // Fix: Fallback for missing names
      sorted.sort((a, b) =>
        (a.username || a.email).localeCompare(b.username || b.email)
      );
      setUsers(sorted);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { 'x-auth-token': token },
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Error deleting user');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${id}/role`,
        { role: newRole },
        { headers: { 'x-auth-token': token } }
      );
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="container manage-users">
      <h2 className="text-center">Manage Users</h2>
      <div className="d-flex justify-content-end mb-3">
        <select
          className="form-select w-auto"
          value={sortRole}
          onChange={(e) => setSortRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="user">User</option>
        </select>
      </div>
      <table className="table table-hover">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Change Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.username || 'N/A'}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <select
                  className="form-select form-select-sm"
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                >
                  <option value="user">user</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                {user._id === u._id ? (
                  <button className="btn btn-danger btn-sm" disabled title="You can't delete your own account">
                    Delete
                  </button>
                ) : (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUsersPage;
