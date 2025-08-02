// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { auth } from '../firebaseConfig'; // Import Firebase auth
import {
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';

// Create the Auth Context
export const AuthContext = createContext();

// Create the Auth Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(Cookies.get('token') || null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Helper function to set the Authorization header for all Axios requests
    const setAuthHeader = (authToken) => {
        if (authToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    // Helper function to load user data from the backend
    const loadUser = async (authToken) => {
        const currentToken = authToken || token;
        if (currentToken) {
            setAuthHeader(currentToken);
            try {
                // This endpoint needs to be able to handle BOTH JWT and Firebase tokens
                const res = await axios.get('http://localhost:5000/api/auth');
                setUser(res.data);
                setIsAuthenticated(true);
                return res.data;
            } catch (err) {
                console.error('AuthContext: Error loading user with stored token:', err.response?.data?.msg || err.message);
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
                Cookies.remove('token');
                setAuthHeader(null);
                return null;
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
        return null;
    };

    // This effect runs on component mount and whenever the token changes
    useEffect(() => {
        loadUser();
    }, []);

    // Function to handle user login with email/password
    const login = async (email, password) => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth', { email, password });
            const newToken = res.data.token;

            Cookies.set('token', newToken, { expires: 7 });
            setToken(newToken);
            const loadedUser = await loadUser(newToken);
            setIsAuthenticated(true);

            return { success: true, user: loadedUser };
        } catch (err) {
            console.error('AuthContext login: Login error:', err.response?.data?.msg || err.message);
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            Cookies.remove('token');
            setAuthHeader(null);
            return { success: false, error: err.response?.data?.msg || 'Login failed', user: null };
        } finally {
            setLoading(false);
        }
    };

    // New function to handle Google Sign-In
    const loginWithGoogle = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // Get the Firebase ID token
            const idToken = await result.user.getIdToken();

            // Send this ID token to your backend for verification
            const res = await axios.post('http://localhost:5000/api/auth/google', { idToken });
            const newToken = res.data.token; // Your backend should return your custom JWT
            
            Cookies.set('token', newToken, { expires: 7 });
            setToken(newToken);
            const loadedUser = await loadUser(newToken);
            setIsAuthenticated(true);
            
            return { success: true, user: loadedUser };
        } catch (err) {
            console.error('AuthContext login with Google: Login error:', err.response?.data?.msg || err.message);
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            Cookies.remove('token');
            setAuthHeader(null);
            return { success: false, error: err.message || 'Google login failed', user: null };
        } finally {
            setLoading(false);
        }
    };

    // Function to handle user registration
    const register = async (username, email, password) => {
        setLoading(true);
        try {
            const registerRes = await axios.post('http://localhost:5000/api/users', { username, email, password });
            const newToken = registerRes.data.token;

            Cookies.set('token', newToken, { expires: 7 });
            setToken(newToken);
            const loadedUser = await loadUser(newToken);
            setIsAuthenticated(true);

            return { success: true, user: loadedUser };
        } catch (err) {
            console.error('AuthContext register: Register error:', err.response?.data?.msg || err.message);
            Cookies.remove('token');
            setAuthHeader(null);
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            return { success: false, error: err.response?.data?.errors?.[0]?.msg || 'Registration failed', user: null };
        } finally {
            setLoading(false);
        }
    };

    // New function to handle password reset
    const sendPasswordReset = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'Password reset email sent. Check your inbox.' };
        } catch (error) {
            console.error('Password reset error:', error.message);
            return { success: false, error: error.message || 'Failed to send password reset email.' };
        }
    };

    // Function to handle user logout
    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        Cookies.remove('token');
        setAuthHeader(null);
        setLoading(false);
    };

    // Value provided to consumers of the context
    const authContextValue = {
        user,
        token,
        loading,
        login,
        loginWithGoogle, // Add the new function
        register,
        logout,
        isAuthenticated,
        sendPasswordReset, // Add the new function
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easier consumption of the AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};