// frontend/src/pages/EditThesisPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/EditThesisPage.css';

const EditThesisPage = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        authorName: '',
        department: '',
        submissionYear: '',
        abstract: '',
        keywords: '',
        supervisor: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchThesis = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/theses/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                const { title, authorName, department, submissionYear, abstract, keywords, supervisor, status } = response.data;

                if (status !== 'pending') {
                    setError('Only pending theses can be edited.');
                } else {
                    setFormData({
                        title,
                        authorName,
                        department,
                        submissionYear,
                        abstract,
                        keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
                        supervisor
                    });
                    setStatus(status);
                }

                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch thesis:', err);
                setError('Error fetching thesis data.');
                setLoading(false);
            }
        };

        if (token) fetchThesis();
    }, [id, token]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5000/api/theses/${id}`, formData, {
                headers: { 'x-auth-token': token }
            });
            alert('Thesis updated successfully.');
            navigate('/dashboard');
        } catch (err) {
            console.error('Update failed:', err);
            alert('Failed to update thesis.');
        }
    };

    if (loading) return <div className="edit-thesis-container">Loading...</div>;
    if (error) return <div className="edit-thesis-error">{error}</div>;

    return (
        <div className="edit-thesis-container">
            <h2 className="edit-thesis-title">Edit Thesis</h2>
            <form className="edit-thesis-form" onSubmit={handleSubmit}>
                {['title', 'authorName', 'department', 'submissionYear', 'supervisor'].map(field => (
                    <div className="edit-thesis-field" key={field}>
                        <label>{field.replace(/([A-Z])/g, ' $1')}</label>
                        <input
                            type="text"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            required
                        />
                    </div>
                ))}

                <div className="edit-thesis-field">
                    <label>Abstract</label>
                    <textarea
                        name="abstract"
                        rows="4"
                        value={formData.abstract}
                        onChange={handleChange}
                        required
                    ></textarea>
                </div>

                <div className="edit-thesis-field">
                    <label>Keywords (comma-separated)</label>
                    <input
                        type="text"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button className="edit-thesis-button" type="submit">Update Thesis</button>
            </form>
        </div>
    );
};

export default EditThesisPage;
