// Admin panel utilities
window.AdminUtils = {
    async getStatistics() {
        try {
            const result = await API.admin.getStats();
            return result.data;
        } catch (error) {
            Validation.showAlert('Failed to load statistics', 'error');
            throw error;
        }
    },

    async updateIssueStatus(issueId, status, notes) {
        try {
            const result = await API.admin.updateIssueStatus(issueId, status, notes);
            Validation.showAlert('Status updated successfully', 'success');
            return result.data;
        } catch (error) {
            Validation.showAlert(error.message || 'Failed to update status', 'error');
            throw error;
        }
    },

    async deleteIssue(issueId) {
        if (!confirm('Are you sure you want to delete this issue?')) {
            return false;
        }

        try {
            await API.admin.deleteIssue(issueId);
            Validation.showAlert('Issue deleted successfully', 'success');
            return true;
        } catch (error) {
            Validation.showAlert(error.message || 'Failed to delete issue', 'error');
            throw error;
        }
    },

    async getResolutionDraft(title, category, description) {
        try {
            const res = await fetch(`${API_BASE_URL}/ai/suggest-resolution`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API.getAuthToken()}`
                },
                body: JSON.stringify({ title, category, description })
            });
            const result = await res.json();
            return result.data;
        } catch (error) {
            Validation.showAlert('AI Suggestion failed', 'error');
            throw error;
        }
    }
};
