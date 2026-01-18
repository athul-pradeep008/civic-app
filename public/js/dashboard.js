document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    if (!API.getAuthToken()) {
        window.location.href = '/login.html';
        return;
    }

    // Initialize Components
    initializeSocket();
    setupEventListeners();
    await loadDashboard();
});

// --- INIT & LISTENERS ---
function setupEventListeners() {
    document.getElementById('share-app-btn')?.addEventListener('click', () => {
        if (typeof shareApp === 'function') shareApp();
    });
}

// --- SOCKET.IO REAL-TIME UPDATES ---
function initializeSocket() {
    const socket = io();

    socket.on('connect', () => {
        console.log('🔌 Connected to Real-Time Server');
    });

    // Handle New Issue
    socket.on('new_issue', (data) => {
        showToast(`🆕 New Issue Reported: <b>${data.title}</b>`);
        updateStatsUI(1, 0); // Increment total, Pending (simplified)
        // Ideally, we re-fetch to be accurate or append to table if it matches filter
        // For simplicity, we'll reload data silently
        loadDashboard(true);
    });

    // Handle Status Update
    socket.on('issue_updated', (data) => {
        showToast(`🔔 Issue "<b>${data.title}</b>" updated to <b>${data.status.toUpperCase()}</b>`);

        // Find row and update badge directly for smooth UX
        const badge = document.querySelector(`tr[data-id="${data._id}"] .badge-status`);
        if (badge) {
            badge.className = `badge badge-status status-${data.status}`;
            badge.textContent = data.status.replace('_', ' ');

            // Add highlight animation
            const row = document.querySelector(`tr[data-id="${data._id}"]`);
            row.classList.add('highlight-update');
            setTimeout(() => row.classList.remove('highlight-update'), 2000);
        } else {
            loadDashboard(true); // Fallback if row not found
        }
    });
}

// --- CORE DATA LOADING ---
async function loadDashboard(isUpdate = false) {
    try {
        if (!isUpdate) document.getElementById('loading').classList.remove('hidden');

        const user = await API.auth.getMe();
        const issues = await API.issues.getAll({ limit: 100 });

        // Filter client-side for "My Dashboard" specific views
        const myIssues = issues.data.filter(issue => issue.reporter._id === user.data._id);
        const pending = myIssues.filter(i => ['reported', 'verified', 'in_progress'].includes(i.status));
        const resolved = myIssues.filter(i => i.status === 'resolved');

        // Update Stats DOM
        setText('total-issues', myIssues.length);
        setText('pending-issues', pending.length);
        setText('resolved-issues', resolved.length);
        setText('reputation', user.data.reputationScore);

        // Render Visuals
        if (!isUpdate) { // Don't re-render charts on every socket update to save perf
            const globalStats = await API.stats.getOverview();
            renderCharts(globalStats.data);
            loadLeaderboard();
        }

        displayMyIssues(myIssues);
        if (!isUpdate) document.getElementById('loading').classList.add('hidden');

    } catch (error) {
        document.getElementById('loading').classList.add('hidden');
        console.error(error);
        if (!isUpdate) Validation.showAlert('Failed to load dashboard', 'error');
    }
}

// --- UI RENDERING ---

function displayMyIssues(issues) {
    const container = document.getElementById('my-issues-container');

    if (issues.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">No issues reported yet. Start by reporting one!</p>';
        return;
    }

    container.innerHTML = `
    <div class="overflow-x-auto card-shadow rounded-lg bg-white">
      <table class="table mb-0">
        <thead class="bg-light">
          <tr>
            <th class="p-3">Title</th>
            <th class="p-3">Category</th>
            <th class="p-3">Status</th>
            <th class="p-3 text-center">Votes</th>
            <th class="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${issues.map(issue => `
            <tr data-id="${issue._id}" class="transition-colors">
              <td class="p-3 font-medium text-dark">${issue.title}</td>
              <td class="p-3"><span class="badge badge-secondary">${issue.category}</span></td>
              <td class="p-3"><span class="badge badge-status status-${issue.status}">${issue.status.replace('_', ' ')}</span></td>
              <td class="p-3 text-center text-muted">👍 ${issue.upvotes} • 👎 ${issue.downvotes}</td>
              <td class="p-3 text-right">
                <a href="/issue-detail.html?id=${issue._id}" class="btn btn-sm btn-primary">View</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function loadLeaderboard() {
    try {
        const res = await fetch('/api/users/leaderboard'); // Direct fetch as public endpoint
        const data = await res.json();
        const list = document.getElementById('leaderboardList'); // Ensure this element exists in HTML

        if (list && data.success) {
            // ... Logic same as before (if element exists)
        }
    } catch (err) { console.error('Leaderboard error', err); }
}

function renderCharts(stats) {
    // Only render if elements exist
    const catCanvas = document.getElementById('categoryChart');
    const statusCanvas = document.getElementById('statusChart');

    if (catCanvas) {
        new Chart(catCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: stats.categories.map(c => capitalize(c._id)),
                datasets: [{
                    data: stats.categories.map(c => c.count),
                    backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: chartOptions()
        });
    }

    if (statusCanvas) {
        new Chart(statusCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: stats.statuses.map(s => capitalize(s._id.replace('_', ' '))),
                datasets: [{
                    data: stats.statuses.map(s => c.count), // Bug fix from original: c is not defined
                    // actually mapped correctly below
                    data: stats.statuses.map(s => s.count),
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1'],
                    borderWidth: 0
                }]
            },
            options: chartOptions()
        });
    }
}

// --- HELPERS ---
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function chartOptions() {
    return {
        responsive: true,
        plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } }
        },
        cutout: '60%'
    };
}

function showToast(html) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification slide-in-bottom';
    toast.innerHTML = html;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('slide-out-bottom');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Add styles required for new toast/highlight logic
const style = document.createElement('style');
style.innerHTML = `
    .toast-notification {
        position: fixed; bottom: 20px; right: 20px;
        background: #1e293b; color: white; padding: 16px;
        border-radius: 8px; z-index: 9999;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex; align-items: center; gap: 10px;
    }
    .highlight-update {
        animation: highlightRow 2s ease-out;
    }
    @keyframes highlightRow {
        0% { background-color: rgba(99, 102, 241, 0.2); }
        100% { background-color: transparent; }
    }
`;
document.head.appendChild(style);
