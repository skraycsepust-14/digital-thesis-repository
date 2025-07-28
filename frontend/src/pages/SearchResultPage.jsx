// frontend/src/pages/SearchResultPage.jsx
import React, { useState, useEffect } from 'react'; // NEW: Import useState, useEffect
import { useSearch } from '../context/SearchContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // NEW: Import FontAwesomeIcon
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'; // NEW: Import chevron icons
import '../styles/SearchResultPage.css'; // Import your styles for this page

const RESULTS_PER_PAGE = 2; // Define how many search results to show per page

const SearchResultPage = () => {
    // Consume the search state from the SearchContext
    const { searchQuery, searchResults, isSearching, searchError } = useSearch();
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1); // NEW: State for current page

    // NEW: Reset currentPage whenever searchResults or searchQuery changes
    // This ensures that when a new search is performed or results are updated,
    // the pagination resets to the first page.
    useEffect(() => {
        setCurrentPage(1);
    }, [searchResults, searchQuery]);

    // Function to handle click on a thesis result
    const handleThesisClick = (thesisId) => {
        navigate(`/thesis/${thesisId}`);
    };

    // NEW: Calculate results to display for the current page
    const indexOfLastResult = currentPage * RESULTS_PER_PAGE;
    const indexOfFirstResult = indexOfLastResult - RESULTS_PER_PAGE;
    const currentResultsToDisplay = searchResults.slice(indexOfFirstResult, indexOfLastResult);
    const totalPages = Math.ceil(searchResults.length / RESULTS_PER_PAGE);

    // NEW: Functions for navigating between pages
    const goToNextPage = () => {
        setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
    };

    const goToPrevPage = () => {
        setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    };

    // Only render this component if a search has been performed
    if (!searchQuery && searchResults.length === 0 && !isSearching && !searchError) {
        return null;
    }

    return (
        <div className="search-results-page container mt-4">
            {isSearching && (
                <div className="alert alert-info text-center" role="alert">
                    Searching for "{searchQuery}"...
                </div>
            )}

            {searchError && (
                <div className="alert alert-danger" role="alert">
                    Error: {searchError}
                </div>
            )}

            {!isSearching && !searchError && searchQuery && searchResults.length === 0 && (
                <div className="alert alert-warning text-center" role="alert">
                    No results found for "{searchQuery}".
                </div>
            )}

            {!isSearching && searchResults.length > 0 && (
                <>
                    {/* NEW: Display total results count */}
                    <h2 className="mb-3">Results for "{searchQuery}" ({searchResults.length} found)</h2>
                    <div className="list-group">
                        {/* CHANGED: Map over currentResultsToDisplay for pagination */}
                        {currentResultsToDisplay.map((thesis) => (
                            <div
                                key={thesis.id}
                                className="list-group-item list-group-item-action mb-3 rounded shadow-sm"
                                onClick={() => handleThesisClick(thesis.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <h5 className="mb-1 text-primary">{thesis.title}</h5>
                                <p className="mb-1 text-muted"><strong>Author:</strong> {thesis.author}</p>
                                <small className="text-success">
                                    Relevance Score: {thesis.relevance_score.toFixed(4)} (Lower is more relevant)
                                </small>
                            </div>
                        ))}
                    </div>

                    {/* NEW: Pagination Controls */}
                    {searchResults.length > RESULTS_PER_PAGE && ( // Only show controls if there's more than one page
                        <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
                            <button
                                className="btn btn-outline-primary"
                                onClick={goToPrevPage}
                                disabled={currentPage === 1}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} className="me-2" /> Previous Page
                            </button>
                            <span className="text-muted fw-bold">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="btn btn-outline-primary"
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                            >
                                Next Page <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SearchResultPage;