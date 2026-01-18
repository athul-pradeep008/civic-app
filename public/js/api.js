const API_BASE_URL = (window.location.protocol === 'file:')
    ? 'http://localhost:5002/api' // Fallback for local file opening
    : '/api'; // Standard relative path for production/served apps

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Set auth token
const setAuthToken = (token) => {
    localStorage.setItem('token', token);
};

// Remove auth token
const removeAuthToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// Get current user
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// Set current user
const setCurrentUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();

    const headers = {
        ...options.headers,
    };

    // Add auth token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON if not FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                removeAuthToken();
                window.location.href = '/login.html';
            }
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Auth API
const authAPI = {
    register: async (userData) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (data.token) {
            setAuthToken(data.token);
            setCurrentUser(data.user);
        }

        return data;
    },

    login: async (credentials) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (data.token) {
            setAuthToken(data.token);
            setCurrentUser(data.user);
        }

        return data;
    },

    logout: async () => {
        await apiRequest('/auth/logout', { method: 'POST' });
        removeAuthToken();
    },

    getMe: async () => {
        return await apiRequest('/auth/me');
    },

    // Advanced Auth
    google: async (token) => {
        const data = await apiRequest('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
        if (data.token) {
            setAuthToken(data.token);
            setCurrentUser(data.user);
        }
        return data;
    },

    sendOtp: async (identifier) => {
        // identifier = { email: '...' } or { phone: '...' }
        return await apiRequest('/auth/otp/send', {
            method: 'POST',
            body: JSON.stringify(identifier),
        });
    },

    verifyOtp: async (identifier, otp) => {
        // identifier = { email, otp } or { phone, otp }
        const data = await apiRequest('/auth/otp/verify', {
            method: 'POST',
            body: JSON.stringify({ ...identifier, otp }),
        });
        if (data.token) {
            setAuthToken(data.token);
            setCurrentUser(data.user);
        }
        return data;
    },
};

// Issues API
const issuesAPI = {
    create: async (formData) => {
        return await apiRequest('/issues', {
            method: 'POST',
            body: formData, // FormData for file upload
        });
    },

    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/issues${queryString ? '?' + queryString : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/issues/${id}`);
    },

    getNearby: async (longitude, latitude, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(
            `/issues/nearby/${longitude}/${latitude}${queryString ? '?' + queryString : ''}`
        );
    },

    update: async (id, updateData) => {
        return await apiRequest(`/issues/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    },

    delete: async (id) => {
        return await apiRequest(`/issues/${id}`, {
            method: 'DELETE',
        });
    },
};

// Votes API
const votesAPI = {
    vote: async (issueId, voteType) => {
        return await apiRequest(`/votes/${issueId}`, {
            method: 'POST',
            body: JSON.stringify({ voteType }),
        });
    },

    getUserVote: async (issueId) => {
        return await apiRequest(`/votes/${issueId}`);
    },
};

// Admin API
const adminAPI = {
    getStats: async () => {
        return await apiRequest('/admin/stats');
    },

    updateIssueStatus: async (issueId, status, adminNotes) => {
        return await apiRequest(`/admin/issues/${issueId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, adminNotes }),
        });
    },

    deleteIssue: async (issueId) => {
        return await apiRequest(`/admin/issues/${issueId}`, {
            method: 'DELETE',
        });
    },

    getUsers: async () => {
        return await apiRequest('/admin/users');
    },
};

// Stats API
const statsAPI = {
    getOverview: async () => {
        return await apiRequest('/stats/overview');
    }
};

// Export API functions
window.API = {
    auth: authAPI,
    issues: issuesAPI,
    votes: votesAPI,
    admin: adminAPI,
    stats: statsAPI,
    getAuthToken,
    setAuthToken,
    removeAuthToken,
    getCurrentUser,
    setCurrentUser,
};
