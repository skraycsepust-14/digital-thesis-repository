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
import { CSVLink } from 'react-csv';

const COLORS = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948'];
const PAGE_SIZE = 4;

const AdminDashboardPage = () => {
    const { token } = useAuth();
    const [byDepartment, setByDepartment] = useState([]);
    const [byStatus, setByStatus] = useState([]);
    const [pendingTheses, setPendingTheses] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');
    const [selectedSupervisor, setSelectedSupervisor] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('analytics');
    const chartRef = useRef(null);
    const [sortOrder, setSortOrder] = useState('asc');
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { headers: { 'x-auth-token': token } };
                const [deptRes, statusRes, pendingRes, supervisorRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/theses/analytics/by-department', config),
                    axios.get('http://localhost:5000/api/theses/analytics/by-status', config),
                    axios.get('http://localhost:5000/api/theses/pending', config),
                    axios.get('http://localhost:5000/api/theses/supervisors')
                ]);
                setByDepartment(deptRes.data);
                setByStatus(statusRes.data);
                setPendingTheses(pendingRes.data);
                setSupervisors(supervisorRes.data);
            } catch (err) {
                console.error('Dashboard data fetch error:', err);
                setError('Failed to fetch dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchData();
    }, [token]);

    const filteredTheses = pendingTheses
        .filter(thesis => thesis.title.toLowerCase().includes(filter.toLowerCase()) &&
            (selectedSupervisor === '' || thesis.supervisor === selectedSupervisor))
        .sort((a, b) => sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));

    const totalPages = Math.ceil(filteredTheses.length / PAGE_SIZE);
    const paginatedTheses = filteredTheses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleExportPDF = () => {
        if (!chartRef.current) return;
        html2canvas(chartRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.addImage(imgData, 'PNG', 10, 10);
            pdf.save('thesis-analytics.pdf');
        });
    };

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const csvHeaders = [
        { label: 'Title', key: 'title' },
        { label: 'Author', key: 'authorName' },
        { label: 'Department', key: 'department' },
        { label: 'Year', key: 'submissionYear' },
        { label: 'Supervisor', key: 'supervisor' }
    ];

    if (loading) return <div className="admin-dashboard text-center">Loading dashboard...</div>;
    if (error) return <div className="admin-dashboard alert alert-danger text-center">{error}</div>;

    return (
        <div className="container admin-dashboard">
            <h2 className="mb-4 text-center">Admin Dashboard</h2>

            {notification && <div className="alert alert-success text-center">{notification}</div>}

            <div className="tabs d-flex justify-content-center mb-4">
                <button className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline-primary'} mx-2`} onClick={() => setActiveTab('analytics')}>Analytics</button>
                <button className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-outline-primary'} mx-2`} onClick={() => setActiveTab('list')}>Pending Theses</button>
            </div>

            {activeTab === 'analytics' && (
                <>
                    <div className="text-end mb-3">
                        <button className="btn btn-outline-secondary" onClick={handleExportPDF}>Export Analytics as PDF</button>
                    </div>
                    <div ref={chartRef} className="row analytics-section">
                        <div className="col-md-6 mb-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-body">
                                    <h5 className="card-title">Theses by Department</h5>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={byDepartment} barSize={50}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" animationDuration={1000}>
                                                {byDepartment.map((entry, index) => (
                                                    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <div className="card shadow-sm h-100">
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
                                                label
                                                animationDuration={800}
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
                    </div>
                </>
            )}

            {activeTab === 'list' && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <input
                            type="text"
                            className="form-control w-50"
                            placeholder="Search pending theses by title..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                        <select
                            className="form-select mx-2"
                            style={{ maxWidth: '200px' }}
                            value={selectedSupervisor}
                            onChange={(e) => setSelectedSupervisor(e.target.value)}
                        >
                            <option value="">All Supervisors</option>
                            {supervisors.map((sup, index) => (
                                <option key={index} value={sup}>{sup}</option>
                            ))}
                        </select>
                        <div>
                            <Link to="/upload" className="btn btn-primary me-2">Upload New Thesis</Link>
                            <CSVLink data={pendingTheses} headers={csvHeaders} filename="pending-theses.csv" className="btn btn-outline-primary">
                                Export CSV
                            </CSVLink>
                        </div>
                    </div>

                    <div className="text-end mb-3">
                        <button className="btn btn-sm btn-outline-dark" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                            Sort by Title ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                        </button>
                    </div>

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
                                                        showNotification('Thesis approved successfully');
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
                                                        showNotification('Thesis rejected');
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
                </>
            )}
        </div>
    );
};

export default AdminDashboardPage;
