// Issue management utilities
window.IssueUtils = {
    async voteOnIssue(issueId, voteType, callback) {
        if (!API.getAuthToken()) {
            Validation.showAlert('Please login to vote', 'warning');
            return;
        }

        try {
            const result = await API.votes.vote(issueId, voteType);
            if (callback) callback(result.data);
            return result.data;
        } catch (error) {
            Validation.showAlert(error.message || 'Failed to vote', 'error');
            throw error;
        }
    },

    async getUserVote(issueId) {
        if (!API.getAuthToken()) return null;

        try {
            const result = await API.votes.getUserVote(issueId);
            return result.data;
        } catch (error) {
            console.error('Failed to get user vote:', error);
            return null;
        }
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    getCategoryIcon(category) {
        const icons = {
            pothole: '🕳️',
            streetlight: '💡',
            garbage: '🗑️',
            drainage: '🚰',
            water_supply: '💧',
            road_damage: '🛣️',
            traffic_signal: '🚦',
            park_maintenance: '🌳',
            graffiti: '🎨',
            other: '📋'
        };
        return icons[category] || '📋';
    }
};
