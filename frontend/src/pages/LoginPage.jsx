// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Correct import: faGoogle from the 'brands' package, other icons from 'solid'
import { faEnvelope, faLock, faEye, faEyeSlash, faSpinner, faKey } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import Swal from 'sweetalert2'; // For elegant pop-ups

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // New state for handling loading indicators
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Get the new functions from the context
    const { login, loginWithGoogle, sendPasswordReset } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true); // Set loading state to true

        try {
            const result = await login(email, password);
            console.log('Login result:', result);
            if (result.success) {
                console.log('User role:', result.user?.role);
                if (result.user?.role === 'admin' || result.user?.role === 'supervisor') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsGoogleLoading(true); // Set loading state for Google button

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
                setError(result.error || 'Google sign-in failed.');
            }
        } catch (err) {
            setError('An unexpected error occurred during Google sign-in.');
        } finally {
            setIsGoogleLoading(false); // Reset loading state
        }
    };

    const handleForgotPassword = async () => {
        const { value: emailToReset } = await Swal.fire({
            title: 'Forgot Password?',
            input: 'email',
            inputLabel: 'Enter your email address',
            inputPlaceholder: 'Enter your email address...',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Send Reset Link'
        });
    
        if (emailToReset) {
            const result = await sendPasswordReset(emailToReset);
            if (result.success) {
                Swal.fire('Success', result.message, 'success');
            } else {
                Swal.fire('Error', result.error, 'error');
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
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}
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
                            {/* Moved the Forgot Password link to be before the Login button */}
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
                        {/* 'Or' separator */}
                        <div className="d-flex align-items-center my-3">
                            <hr className="flex-grow-1" />
                            <span className="mx-2 text-muted">Or</span>
                            <hr className="flex-grow-1" />
                        </div>
                        {/* New Google Sign-In Button */}
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
                        {/* Registration link moved to the bottom */}
                        <p className="text-center mt-3 mb-0">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-decoration-none">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
