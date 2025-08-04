// frontend/src/pages/AdminDashboardPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminDashboardPage.css';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#a9a9ff'];
const PAGE_SIZE = 4;

const AdminDashboardPage = () => {
    const { token } = useAuth();
    const [byDepartment, setByDepartment] = useState([]);
    const [byStatus, setByStatus] = useState([]);
    const [pendingTheses, setPendingTheses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAnalytics, setShowAnalytics] = useState(true);
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { headers: { 'x-auth-token': token } };
                const [deptRes, statusRes, pendingRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/theses/analytics/by-department', config),
                    axios.get('http://localhost:5000/api/theses/analytics/by-status', config),
                    axios.get('http://localhost:5000/api/theses/pending', config),
                ]);
                setByDepartment(deptRes.data);
                setByStatus(statusRes.data);
                setPendingTheses(pendingRes.data);
            } catch (err) {
                console.error('Dashboard data fetch error:', err);
                setError('Failed to fetch dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchData();
    }, [token]);

    const filteredTheses = pendingTheses.filter((thesis) =>
        thesis.title.toLowerCase().includes(filter.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTheses.length / PAGE_SIZE);
    const paginatedTheses = filteredTheses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleExportPDF = () => {
        if (!chartRef.current) return;
        html2canvas(chartRef.current).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.addImage(imgData, 'PNG', 10, 10);
            pdf.save('thesis-analytics.pdf');
        });
    };

    if (loading) return <div className="admin-dashboard text-center">Loading dashboard...</div>;
    if (error) return <div className="admin-dashboard alert alert-danger text-center">{error}</div>;

    return (
        <div className="container admin-dashboard">
            <h2 className="mb-4 text-center">Admin Dashboard</h2>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <input
                    type="text"
                    className="form-control w-50"
                    placeholder="Search pending theses by title..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <div>
                    <Link to="/upload-thesis" className="btn btn-primary me-2">Upload New Thesis</Link>
                    <button className="btn btn-secondary" onClick={() => setShowAnalytics(!showAnalytics)}>
                        {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                    </button>
                </div>
            </div>

            {showAnalytics && (
                <div ref={chartRef} className="row analytics-section">
                    <div className="col-md-6 mb-4">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title">Theses by Department</h5>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={byDepartment}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="_id" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 mb-4">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title">Theses by Status</h5>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={byStatus}
                                            dataKey="count"
                                            nameKey="_id"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            fill="#82ca9d"
                                            label
                                        >
                                            {byStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="text-end">
                        <button className="btn btn-outline-secondary" onClick={handleExportPDF}>Export Analytics as PDF</button>
                    </div>
                </div>
            )}

            <h4 className="mt-4 mb-3">Pending Theses</h4>
            <div className="row">
                {paginatedTheses.length === 0 ? (
                    <p className="text-muted">No matching theses found.</p>
                ) : (
                    paginatedTheses.map((thesis) => (
                        <div className="col-md-6 mb-4" key={thesis._id}>
                            <div className="card thesis-card">
                                <div className="card-body">
                                    <h5 className="thesis-title">{thesis.title}</h5>
                                    <p><strong>Author:</strong> {thesis.authorName}</p>
                                    <p><strong>Department:</strong> {thesis.department}</p>
                                    <p><strong>Year:</strong> {thesis.submissionYear}</p>
                                    <p><strong>Supervisor:</strong> {thesis.supervisor}</p>

                                    <div className="d-flex action-buttons">
                                        <button
                                            className="btn btn-success btn-sm me-2"
                                            onClick={async () => {
                                                await axios.put(`http://localhost:5000/api/theses/approve/${thesis._id}`, {}, {
                                                    headers: { 'x-auth-token': token }
                                                });
                                                setPendingTheses(prev => prev.filter(t => t._id !== thesis._id));
                                            }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={async () => {
                                                await axios.put(`http://localhost:5000/api/theses/reject/${thesis._id}`, {}, {
                                                    headers: { 'x-auth-token': token }
                                                });
                                                setPendingTheses(prev => prev.filter(t => t._id !== thesis._id));
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination d-flex justify-content-center mt-4">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            className={`btn mx-1 ${currentPage === i + 1 ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
