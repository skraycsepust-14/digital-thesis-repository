// frontend/src/pages/UploadThesisPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUpload,
    faHeading,
    faUser,
    faBuilding,
    faCalendar,
    faFilePdf,
    faAlignLeft,
    faSpinner,
    faTag,
    faChalkboardTeacher
} from '@fortawesome/free-solid-svg-icons';
import '../styles/UploadThesisPage.css';

const UploadThesisPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState(user?.username || '');
    const [department, setDepartment] = useState('');
    const [submissionYear, setSubmissionYear] = useState(new Date());
    const [abstract, setAbstract] = useState('');
    const [keywords, setKeywords] = useState('');
    const [supervisor, setSupervisor] = useState('');
    const [supervisors, setSupervisors] = useState([]);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(true);

    useEffect(() => {
        const fetchSupervisors = async () => {
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:5000/api/users/supervisors', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSupervisors(res.data);
                if (res.data.length > 0) {
                    setSupervisor(res.data[0]._id);
                }
            } catch (err) {
                console.error('Error fetching supervisors:', err);
                setError('Failed to load supervisors. Please try again.');
            } finally {
                setIsLoadingSupervisors(false);
            }
        };

        fetchSupervisors();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('authorName', authorName);
        formData.append('department', department);
        formData.append('submissionYear', submissionYear.getFullYear());
        formData.append('abstract', abstract);
        formData.append('keywords', keywords);
        formData.append('supervisor', supervisor);
        formData.append('thesisFile', file);

        try {
            await axios.post('http://localhost:5000/api/theses', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            setSuccess('Thesis submitted successfully! Redirecting you to the dashboard...');

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (err) {
            console.error('Submission error:', err.response || err);
            const errMsg = err.response?.data?.msg || err.response?.data?.errors?.[0]?.msg || 'Failed to submit thesis.';
            setError(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="upload-thesis-page-wrapper container mt-5"> {/* ADDED CLASS HERE */}
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card upload-card p-4">
                        <div className="upload-header">
                            <FontAwesomeIcon icon={faUpload} />
                            <h2>Upload Your Thesis</h2>
                            <p className="text-muted">
                                Please fill in the details below to submit your work for review.
                            </p>
                        </div>

                        {error && <div className="alert alert-danger">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}
                        {isLoadingSupervisors && !error && (
                            <div className="text-center text-muted mb-4">
                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                Loading supervisors...
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3 form-group">
                                <label htmlFor="title" className="form-label">Thesis Title</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FontAwesomeIcon icon={faHeading} /></span>
                                    <input
                                        type="text"
                                        id="title"
                                        className="form-control"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3 form-group">
                                    <label htmlFor="authorName" className="form-label">Author's Name</label>
                                    <div className="input-group">
                                        <span className="input-group-text"><FontAwesomeIcon icon={faUser} /></span>
                                        <input
                                            type="text"
                                            id="authorName"
                                            className="form-control"
                                            value={authorName}
                                            onChange={(e) => setAuthorName(e.target.value)}
                                            required
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6 mb-3 form-group">
                                    <label htmlFor="department" className="form-label">Department</label>
                                    <div className="input-group">
                                        <span className="input-group-text"><FontAwesomeIcon icon={faBuilding} /></span>
                                        <input
                                            type="text"
                                            id="department"
                                            className="form-control"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3 form-group">
                                    <label htmlFor="supervisor" className="form-label">Supervisor</label>
                                    <div className="input-group">
                                        <span className="input-group-text"><FontAwesomeIcon icon={faChalkboardTeacher} /></span>
                                        <select
                                            id="supervisor"
                                            className="form-select"
                                            value={supervisor}
                                            onChange={(e) => setSupervisor(e.target.value)}
                                            required
                                            disabled={isLoadingSupervisors}
                                        >
                                            <option value="" disabled>Select a Supervisor</option>
                                            {supervisors.map((sup) => (
                                                <option key={sup._id} value={sup._id}>
                                                    {sup.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-6 mb-3 form-group">
                                    <label htmlFor="submissionYear" className="form-label">Submission Year</label>
                                    <div className="input-group">
                                        <span className="input-group-text"><FontAwesomeIcon icon={faCalendar} /></span>
                                        <DatePicker
                                            selected={submissionYear}
                                            onChange={(date) => setSubmissionYear(date)}
                                            showYearPicker
                                            dateFormat="yyyy"
                                            className="form-control"
                                            id="submissionYear"
                                            maxDate={new Date()}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3 form-group">
                                <label htmlFor="keywords" className="form-label">Keywords (comma separated)</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FontAwesomeIcon icon={faTag} /></span>
                                    <input
                                        type="text"
                                        id="keywords"
                                        className="form-control"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-4 form-group">
                                <label htmlFor="abstract" className="form-label">Abstract</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FontAwesomeIcon icon={faAlignLeft} /></span>
                                    <textarea
                                        id="abstract"
                                        className="form-control"
                                        rows="5"
                                        value={abstract}
                                        onChange={(e) => setAbstract(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mb-4 form-group">
                                <label htmlFor="thesisFile" className="form-label">Upload Thesis File (PDF)</label>
                                <div className="input-group">
                                    <span className="input-group-text"><FontAwesomeIcon icon={faFilePdf} /></span>
                                    <input
                                        type="file"
                                        id="thesisFile"
                                        className="form-control"
                                        accept="application/pdf"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="d-grid gap-2">
                                <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting || isLoadingSupervisors}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Thesis'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadThesisPage;