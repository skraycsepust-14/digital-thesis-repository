// frontend/src/api/thesisApi.js
import axios from 'axios';

// Function to fetch public theses for the homepage
export const getPublicTheses = async () => {
    try {
        // We use the full URL to ensure it works regardless of where the app is hosted
        const response = await axios.get('http://localhost:5000/api/theses/public');
        return response.data;
    } catch (error) {
        console.error('Error fetching public theses:', error);
        // Instead of throwing an error, we return an empty array.
        // This ensures the calling component (HomePage) always receives a list.
        return [];
    }
};

// New function to fetch theses for the logged-in user
export const getUsersTheses = async () => {
    try {
        // The Authorization header is automatically attached by the AuthContext Axios interceptor
        const response = await axios.get('http://localhost:5000/api/theses/me');
        return response.data;
    } catch (error) {
        console.error('Error fetching user theses:', error);
        // Instead of throwing an error, we return an empty array.
        // This ensures the calling component (DashboardPage) always receives a list.
        return [];
    }
};

// New function to fetch pending theses for admin/supervisor
export const getPendingTheses = async () => {
    try {
        // This request also needs authentication and authorization.
        // The AuthContext sets up the Authorization header globally for axios.
        const response = await axios.get('http://localhost:5000/api/theses/pending');
        return response.data;
    } catch (error) {
        // It's important to handle the 401/403 errors gracefully on the frontend.
        console.error('Error fetching pending theses:', error.response?.data?.msg || error.message);
        // Return an empty array to prevent the component from crashing.
        return [];
    }
};

// New function to handle the approval or rejection of a thesis
export const updateThesisStatus = async (thesisId, action, token) => {
    try {
        // The endpoint URL dynamically changes based on the action ('approve' or 'reject')
        const response = await axios.put(`http://localhost:5000/api/theses/${thesisId}/${action}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`Error updating thesis status for action "${action}":`, error.response?.data?.msg || error.message);
        return { success: false, error: error.response?.data?.msg || 'Failed to update thesis status.' };
    }
};
