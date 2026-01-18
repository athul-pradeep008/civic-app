// Check if user is authenticated
const isAuthenticated = () => {
    return !!API.getAuthToken();
};

// Check if user is admin
const isAdmin = () => {
    const user = API.getCurrentUser();
    return user && user.role === 'admin';
};

// Redirect to login if not authenticated
const requireAuth = () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
};

// Redirect to dashboard if already authenticated
const redirectIfAuthenticated = () => {
    if (isAuthenticated()) {
        window.location.href = '/dashboard.html';
    }
};

// Toggle mobile menu
const toggleMobileMenu = () => {
    const menu = document.querySelector('.navbar-menu');
    const toggle = document.querySelector('.navbar-toggle');
    if (menu) {
        menu.classList.toggle('active');
        const isActive = menu.classList.contains('active');
        if (toggle) {
            toggle.innerHTML = isActive ? '✕' : '☰';
        }
    }
};

// Update navigation based on auth status
const updateNavigation = () => {
    const container = document.querySelector('.navbar .container');
    const user = API.getCurrentUser();

    if (!container) return;

    // Add toggle button if it doesn't exist
    if (!document.querySelector('.navbar-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'navbar-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.addEventListener('click', toggleMobileMenu);
        container.appendChild(toggleBtn);
    }

    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;

    if (user) {
        authLinks.innerHTML = `
      <li><a href="/dashboard.html">Dashboard</a></li>
      <li><a href="/report-issue.html">Report Issue</a></li>
      <li><a href="/issues.html">Browse Issues</a></li>
      <li><a href="/index.html#pricing">Pricing</a></li>
      <li><a href="#" class="share-trigger text-primary-light">🚀 Share</a></li>
      ${user.role === 'admin' ? '<li><a href="/admin.html">Admin</a></li>' : ''}
      <li class="nav-user-flex">
        <img src="${user.profileImage}" class="nav-avatar" alt="Profile">
        <span class="nav-username">Hi, ${user.username}</span>
      </li>
      <li><button class="btn btn-sm btn-outline" id="logout-btn">Logout</button></li>
    `;
    } else {
        authLinks.innerHTML = `
      <li><a href="/issues.html">Browse Issues</a></li>
      <li><a href="/index.html#pricing">Pricing</a></li>
      <li><a href="#" class="share-trigger text-primary-light">🚀 Share</a></li>
      <li><a href="/login.html">Login</a></li>
      <li><a href="/login.html" class="btn btn-sm btn-primary">Get Started</a></li>
    `;
    }

    // Attach listeners
    authLinks.querySelectorAll('.share-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof shareApp === 'function') shareApp();
        });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Close menu when clicking a link
    authLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            const menu = document.querySelector('.navbar-menu');
            if (menu && menu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });
};

// Handle logout
const handleLogout = async () => {
    try {
        await API.auth.logout();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API call fails
        API.removeAuthToken();
        window.location.href = '/';
    }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});
