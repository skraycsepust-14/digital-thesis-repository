// frontend/src/pages/SearchResultPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearch } from "../context/SearchContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faUser,
  faBuilding,
  faCalendar,
  faSortDown,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import "../styles/SearchResultPage.css";

const THESES_PER_PAGE_SEARCH = 5;

const SearchResultPage = () => {
  const { searchQuery, setSearchResults, searchResults } = useSearch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    supervisors: [],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    department: "",
    supervisor: "",
    submissionYear: "",
  });
  const [sortOption, setSortOption] = useState("relevance");

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [departmentsRes, supervisorsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/theses/departments"),
          axios.get("http://localhost:5000/api/theses/supervisors"),
        ]);
        setFilterOptions({
          departments: departmentsRes.data,
          supervisors: supervisorsRes.data,
        });
      } catch (err) {
        console.error("Error fetching filter options:", err);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const performSearch = async () => {
        setLoading(true);
        setError(null);
        try {
          const params = {
            ...selectedFilters,
            sort: sortOption,
            q: searchQuery,
          };
          const response = await axios.get(
            "http://localhost:5000/api/theses/search",
            { params }
          );
          setSearchResults(response.data);
          setLoading(false);
          setCurrentPage(1);
        } catch (err) {
          console.error("Search error:", err);
          setError("Failed to fetch search results. Please try again.");
          setLoading(false);
        }
      };
      performSearch();
    }
  }, [searchQuery, selectedFilters, sortOption, setSearchResults]);

  const indexOfLastThesis = currentPage * THESES_PER_PAGE_SEARCH;
  const indexOfFirstThesis = indexOfLastThesis - THESES_PER_PAGE_SEARCH;
  const currentThesesToDisplay = searchResults.slice(
    indexOfFirstThesis,
    indexOfLastThesis
  );
  const totalPages = Math.ceil(searchResults.length / THESES_PER_PAGE_SEARCH);

  const goToNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSelectedFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= 2000; i--) {
      years.push(i);
    }
    return years;
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          size="3x"
          className="text-primary"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  if (!searchQuery) {
    return (
      <div className="container mt-5 text-center">
        <p className="text-muted">Please use the search bar to find theses.</p>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4 text-primary">
        Search Results for "{searchQuery}"
      </h2>

      <div className="filters-sort-container mb-4 p-3 border rounded">
        <div className="row g-3 align-items-center">
          <div className="col-md-auto fw-bold text-secondary">
            <FontAwesomeIcon icon={faFilter} className="me-2" />
            Filter by:
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              name="department"
              value={selectedFilters.department}
              onChange={handleFilterChange}
            >
              <option value="">All Departments</option>
              {filterOptions.departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              name="supervisor"
              value={selectedFilters.supervisor}
              onChange={handleFilterChange}
            >
              <option value="">All Supervisors</option>
              {filterOptions.supervisors.map((sup) => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              name="submissionYear"
              value={selectedFilters.submissionYear}
              onChange={handleFilterChange}
            >
              <option value="">All Years</option>
              {getYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-auto ms-md-auto fw-bold text-secondary">
            <FontAwesomeIcon icon={faSortDown} className="me-2" />
            Sort by:
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={sortOption}
              onChange={handleSortChange}
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {searchResults.length > 0 ? (
        <>
          <div className="list-group thesis-list-vertical">
            {currentThesesToDisplay.map((thesis) => (
              <Link
                to={`/thesis/${thesis._id}`}
                key={thesis._id}
                className="list-group-item list-group-item-action public-thesis-line-item"
              >
                <span className="thesis-title">{thesis.title}</span>
                <span className="thesis-author d-none d-md-inline">
                  <FontAwesomeIcon icon={faUser} className="me-1" />
                  By: {thesis.authorName}
                </span>
                <span className="thesis-department d-none d-lg-inline">
                  <FontAwesomeIcon icon={faBuilding} className="me-1" />
                  Dept: {thesis.department}
                </span>
                <span className="thesis-year ms-auto">
                  <FontAwesomeIcon icon={faCalendar} className="me-1" />
                  {thesis.submissionYear}
                </span>
              </Link>
            ))}
          </div>
          {searchResults.length > THESES_PER_PAGE_SEARCH && (
            <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
              <button
                className="btn btn-outline-primary"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="me-2" />{" "}
                Previous Page
              </button>
              <span className="text-muted fw-bold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline-primary"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next Page{" "}
                <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-muted p-5 w-100">
          <p>
            No results found for your search query with the selected filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResultPage;
