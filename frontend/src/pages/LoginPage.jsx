import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash, faSpinner, faKey } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import Snackbar from '../components/Snackbar'; // Import the new Snackbar component

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // State for handling loading indicators
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // State for Snackbar notification
    const [snackbar, setSnackbar] = useState({
        show: false,
        message: '',
        type: 'info'
    });

    const { login, loginWithGoogle, sendPasswordReset } = useAuth();
    const navigate = useNavigate();

    const showSnackbar = (message, type) => {
        setSnackbar({ show: true, message, type });
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, show: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                console.log('User role:', result.user?.role);
                if (result.user?.role === 'admin' || result.user?.role === 'supervisor') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                showSnackbar(result.error || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (err) {
            showSnackbar('An unexpected error occurred. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);

        try {
            const result = await loginWithGoogle();
            if (result.success) {
                console.log('User role:', result.user?.role);
                if (result.user?.role === 'admin' || result.user?.role === 'supervisor') {
                    navigate('/admin-dashboard');
                } else {
                        navigate('/dashboard');
                }
            } else {
                showSnackbar(result.error || 'Google sign-in failed.', 'error');
            }
        } catch (err) {
            showSnackbar('An unexpected error occurred during Google sign-in.', 'error');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        // Use a simple prompt as Snackbar can't take user input
        const emailToReset = prompt('Enter your email address to reset your password:');
    
        if (emailToReset) {
            const result = await sendPasswordReset(emailToReset);
            if (result.success) {
                showSnackbar(result.message, 'success');
            } else {
                showSnackbar(result.error, 'error');
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-4">
                    <div className="card shadow-sm p-4">
                        <h2 className="card-title text-center mb-4">Login</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">
                                    Email
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                    </span>
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-control"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading || isGoogleLoading}
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <FontAwesomeIcon icon={faLock} />
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        className="form-control"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading || isGoogleLoading}
                                    />
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        disabled={isLoading || isGoogleLoading}
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mb-3">
                                <Link to="#" className="text-decoration-none" onClick={handleForgotPassword}>
                                    <FontAwesomeIcon icon={faKey} className="me-1" /> Forgot Password?
                                </Link>
                            </div>
                            <div className="d-grid gap-2">
                                <button type="submit" className="btn btn-primary" disabled={isLoading || isGoogleLoading}>
                                    {isLoading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Logging in...
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </button>
                            </div>
                        </form>
                        <div className="d-flex align-items-center my-3">
                            <hr className="flex-grow-1" />
                            <span className="mx-2 text-muted">Or</span>
                            <hr className="flex-grow-1" />
                        </div>
                        <div className="text-center">
                            <button
                                className="btn btn-outline-danger w-100"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading || isGoogleLoading}
                            >
                                {isGoogleLoading ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Signing in...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faGoogle} className="me-2" /> Sign In with Google
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-center mt-3 mb-0">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-decoration-none">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            {snackbar.show && (
                <Snackbar
                    message={snackbar.message}
                    type={snackbar.type}
                    onClose={handleSnackbarClose}
                />
            )}
        </div>
    );
};

export default LoginPage;