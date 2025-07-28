// frontend/src/components/ErrorBoundary.jsx
import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="container mt-5">
                    <div className="alert alert-danger text-center" role="alert">
                        <h4 className="alert-heading">Something went wrong.</h4>
                        <p>We're sorry, but an unexpected error occurred. Please try again later.</p>
                        <hr />
                        <p className="mb-0">Details: {this.state.error && this.state.error.toString()}</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;