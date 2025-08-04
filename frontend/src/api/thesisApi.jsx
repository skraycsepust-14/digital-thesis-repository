// frontend/src/api/thesisApi.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/theses';

// Function to get a list of all pending theses
export const getPendingTheses = async (token) => {
    try {
        const config = {
            headers: {
                'x-auth-token': token,
            },
        };
        const response = await axios.get(`${API_URL}/pending`, config);
        return response.data;
    } catch (err) {
        console.error('Error fetching pending theses:', err);
        throw err;
    }
};

// Function to get a list of all theses submitted by the current user
export const getMyTheses = async (token) => {
    try {
        const config = {
            headers: {
                'x-auth-token': token,
            },
        };
        const response = await axios.get(`${API_URL}/my-theses`, config);
        return response.data;
    } catch (err) {
        console.error('Error fetching user theses:', err);
        throw err;
    }
};

// Function to update the status of a thesis (approve or reject)
export const updateThesisStatus = async (thesisId, action, token) => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
        };

        const response = await axios.put(`${API_URL}/${action}/${thesisId}`, {}, config);
        return { success: true, data: response.data };
    } catch (err) {
        console.error(`Error updating thesis status for action "${action}":`, err);
        return { success: false, error: err.response.data.msg || 'An error occurred.' };
    }
};