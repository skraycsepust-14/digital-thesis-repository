import React, { useEffect, useState } from 'react';

const Snackbar = ({ message, type, duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) {
                onClose();
            }
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    let alertType = 'bg-secondary';
    let textColor = 'text-white';

    switch (type) {
        case 'success':
            alertType = 'bg-success';
            break;
        case 'error':
            alertType = 'bg-danger';
            break;
        case 'warning':
            alertType = 'bg-warning';
            break;
        case 'info':
            alertType = 'bg-info';
            break;
        default:
            alertType = 'bg-secondary';
            break;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1050, // Higher than Bootstrap's modal backdrop
            transition: 'transform 300ms ease-in-out',
        }}>
            <div className={`alert ${alertType} alert-dismissible fade show mb-0`} role="alert">
                <strong className={textColor}>{message}</strong>
            </div>
        </div>
    );
};

export default Snackbar;