export const getBackendOriginalUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL !== undefined) {
        return import.meta.env.VITE_BACKEND_URL;
    }
    // If not set, check if we are running the frontend on a different port than the backend
    if (window.location.hostname === 'localhost' && window.location.port === '5173') {
        return 'http://localhost:4000';
    }
    // Otherwise, we assume the frontend is served BY the backend, so we use relative paths!
    return '';
};
