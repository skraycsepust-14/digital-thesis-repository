import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext'; // New: Import the search context
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGraduationCap,
    faSignInAlt,
    faUserPlus,
    faSignOutAlt,
    faUpload,
    faUserCircle,
    faSearch,
    faUserShield,
    faUsers,
    faCaretDown,
    faEdit,
    faTools
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Navbar.css';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { searchQuery, setSearchQuery, handleSearch } = useSearch(); // Updated: Use search context
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const navbarRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const [isSticky, setIsSticky] = useState(false);

    // Renamed to handleFormSubmit to avoid confusion with the context function
    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            handleSearch(searchQuery.trim()); // Call the new async search function from context
            navigate('/search-result'); // Navigate to the home page to show results
            // Don't clear searchQuery here, let the user see what they searched for
            setIsMobileMenuOpen(false);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setIsProfileDropdownOpen(false);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
        setIsMobileMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        const handleClickOutside = (event) => {
            if (navbarRef.current && !navbarRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [navbarRef, profileDropdownRef]);

    const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

    return (
        <nav ref={navbarRef} className={`navbar navbar-expand-lg navbar-light ${isSticky ? 'sticky' : 'transparent'}`}>
            <div className="container">
                <NavLink to="/" className="navbar-brand d-flex align-items-center">
                    <FontAwesomeIcon icon={faGraduationCap} size="2x" className="me-2" />
                    <span className="fs-5 d-none d-md-block">Digital Thesis Repository</span>
                </NavLink>

                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={toggleMobileMenu}
                    aria-expanded={isMobileMenuOpen ? "true" : "false"}
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div
                    className={`navbar-collapse ${isMobileMenuOpen ? 'collapse show' : 'collapse'}`}
                    id="navbarNav"
                >
                    <form className="d-flex mx-auto my-2 my-lg-0 w-50" onSubmit={handleFormSubmit}>
                        <div className="input-group">
                            <span className="input-group-text bg-white text-primary border-0">
                                <FontAwesomeIcon icon={faSearch} />
                            </span>
                            <input
                                type="search"
                                className="form-control border-start-0"
                                placeholder="Search theses..."
                                aria-label="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </form>

                    <ul className="navbar-nav ms-auto">
                        {isAuthenticated ? (
                            <>
                                {isAdminOrSupervisor && (
                                    <>
                                        <li className="nav-item me-lg-2">
                                            <NavLink to="/admin-dashboard" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                                                <FontAwesomeIcon icon={faUserShield} className="me-1" />Thesis Management
                                            </NavLink>
                                        </li>
                                        <li className="nav-item me-lg-2">
                                            <NavLink to="/manage-users" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                                                <FontAwesomeIcon icon={faUsers} className="me-1" />User Management
                                            </NavLink>
                                        </li>
                                    </>
                                )}

                                {!isAdminOrSupervisor && (
                                    <li className="nav-item me-lg-2">
                                        <NavLink to="/upload-thesis" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                                            <FontAwesomeIcon icon={faUpload} className="me-1" />Upload Thesis
                                        </NavLink>
                                    </li>
                                )}

                                {/* New: Thesis Tools Page Link */}
                                <li className="nav-item me-lg-2">
                                    <NavLink to="/thesis-tools" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                                        <FontAwesomeIcon icon={faTools} className="me-1" />Thesis Tools
                                    </NavLink>
                                </li>

                                <li className="nav-item dropdown" ref={profileDropdownRef}>
                                    <button
                                        className="nav-link btn btn-link dropdown-toggle"
                                        onClick={toggleProfileDropdown}
                                        aria-expanded={isProfileDropdownOpen ? "true" : "false"}
                                    >
                                        <FontAwesomeIcon icon={faUserCircle} className="me-1" />
                                        {user?.username}
                                        <FontAwesomeIcon icon={faCaretDown} className="ms-2" />
                                    </button>
                                    <div className={`dropdown-menu dropdown-menu-end ${isProfileDropdownOpen ? 'show' : ''}`}>
                                        <NavLink
                                            to="/profile"
                                            className="dropdown-item"
                                            onClick={() => {
                                                setIsProfileDropdownOpen(false);
                                                setIsMobileMenuOpen(false);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faUserCircle} className="me-2" />View Profile
                                        </NavLink>
                                        <NavLink
                                            to="/edit-profile"
                                            className="dropdown-item"
                                            onClick={() => {
                                                setIsProfileDropdownOpen(false);
                                                setIsMobileMenuOpen(false);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faEdit} className="me-2" />Edit Profile
                                        </NavLink>
                                        <div className="dropdown-divider"></div>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                handleLogout();
                                                setIsProfileDropdownOpen(false);
                                                setIsMobileMenuOpen(false);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />Logout
                                        </button>
                                    </div>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item me-lg-2">
                                    <NavLink to="/login" className="nav-link btn btn-outline-primary" onClick={() => setIsMobileMenuOpen(false)}>
                                        <FontAwesomeIcon icon={faSignInAlt} className="me-1" />Login
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/register" className="nav-link btn btn-primary" onClick={() => setIsMobileMenuOpen(false)}>
                                        <FontAwesomeIcon icon={faUserPlus} className="me-1" />Register
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;