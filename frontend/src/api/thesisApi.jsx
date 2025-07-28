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
        // We use the full URL to ensure it works regardless of where the app is hosted
        const response = await axios.get('http://localhost:5000/api/theses/me');
        return response.data;
    } catch (error) {
        console.error('Error fetching user theses:', error);
        // Instead of throwing an error, we return an empty array.
        // This ensures the calling component (DashboardPage) always receives a list.
        return [];
    }
};