import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
    return useContext(SearchContext);
};

export const SearchProvider = ({ children }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);
        setSearchError(null);
        setIsSearching(true);
        setSearchResults([]);

        const url = 'http://localhost:5002/semantic-search';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSearchResults(data.results);

        } catch (error) {
            console.error('Error during semantic search:', error);
            setSearchError('Failed to perform search. Please check the backend service.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const value = {
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        searchError,
        handleSearch
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};