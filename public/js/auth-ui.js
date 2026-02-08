// Auth UI Logic

// State
let currentTab = 'password';
let otpMethod = 'email';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (API.getAuthToken()) {
        window.location.href = '/dashboard.html';
        return;
    }

    // Setup listeners
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);

    const toggleLink = document.getElementById('toggle-form');
    if (toggleLink) toggleLink.addEventListener('click', toggleAuthMode);

    // FETCH CONFIG & INIT GOOGLE
    fetch('/api/auth/config')
        .then(res => res.json())
        .then(data => {
            const hasValidClientId = data.googleClientId &&
                data.googleClientId !== 'your_google_client_id_here' &&
                data.googleClientId.includes('.apps.googleusercontent.com');

            if (hasValidClientId) {
                console.log('✅ Google Auth: Initializing with Client ID');
                // Initialize Real Google Auth
                const gBtn = document.getElementById('g_id_onload');
                if (gBtn) gBtn.setAttribute('data-client_id', data.googleClientId);

                // Refresh Google scripts to pick up new ID (if library already loaded)
                if (window.google?.accounts?.id) {
                    window.google.accounts.id.initialize({
                        client_id: data.googleClientId,
                        callback: handleCredentialResponse
                    });
                    window.google.accounts.id.renderButton(
                        document.querySelector('.g_id_signin'),
                        { theme: 'outline', size: 'large', width: '300' }
                    );
                }
            } else {
                console.warn('⚠️ Google Auth: Missing or Invalid Client ID. Enable Demo Mode.');
                // Fallback to Demo Mode
                document.getElementById('google-demo-fallback').classList.remove('hidden');
                const realBtn = document.querySelector('.g_id_signin');
                if (realBtn) realBtn.classList.add('hidden');
            }
        })
        .catch(err => console.error('Failed to load auth config', err));
});

// SIMULATION: Google Login (Guest Auto-Login)
window.simulateGoogleLogin = async () => {
    Validation.showLoading();
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    // Create random guest credentials
    const randomId = Math.floor(Math.random() * 10000);
    const guestEmail = `guest_${randomId}@demo.local`;
    const guestPass = `demoPass${randomId}`;
    const guestUser = `Guest User ${randomId}`;

    try {
        // Attempt to register a new guest user
        await API.auth.register({
            username: guestUser,
            email: guestEmail,
            password: guestPass
        });

        // Success!
        Validation.hideLoading();
        // Show success message briefly then redirect
        const btn = document.querySelector('#google-demo-fallback button');
        if (btn) {
            btn.innerHTML = '✅ Signed In!';
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-success');
        }

        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 500);

    } catch (error) {
        Validation.hideLoading();
        console.error("Demo login failed", error);
        Validation.showAlert("Demo Login Failed. Please try again.", 'error');
    }
};

// Google Sign-In Callback
async function handleCredentialResponse(response) {
    try {
        Validation.showLoading();
        await API.auth.google(response.credential);
        window.location.href = '/dashboard.html';
    } catch (error) {
        Validation.hideLoading();
        Validation.showAlert(error.message || 'Google Sign-In failed', 'error');
    }
}

// Tab Switching
window.switchTab = (tab) => {
    currentTab = tab;

    // Update UI
    document.getElementById('tab-password').classList.toggle('btn-primary', tab === 'password');
    document.getElementById('tab-password').classList.toggle('btn-outline', tab !== 'password');

    document.getElementById('tab-otp').classList.toggle('btn-primary', tab === 'otp');
    document.getElementById('tab-otp').classList.toggle('btn-outline', tab !== 'otp');

    // Show/Hide Forms
    if (tab === 'password') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('otp-form').classList.add('hidden');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('otp-form').classList.remove('hidden');
    }
};

// OTP Method Toggle
window.toggleOtpMethod = () => {
    const method = document.querySelector('input[name="otp-method"]:checked').value;
    otpMethod = method;

    // Styling
    document.getElementById('radio-email-label').classList.toggle('bg-secondary', method === 'email');
    document.getElementById('radio-phone-label').classList.toggle('bg-secondary', method === 'phone');

    // Inputs
    if (method === 'email') {
        document.getElementById('group-otp-email').classList.remove('hidden');
        document.getElementById('group-otp-phone').classList.add('hidden');
    } else {
        document.getElementById('group-otp-email').classList.add('hidden');
        document.getElementById('group-otp-phone').classList.remove('hidden');
    }
};

// Send OTP
window.sendAuthOtp = async () => {
    const email = document.getElementById('otp-email-input').value;
    const phone = document.getElementById('otp-phone-input').value;

    const identifier = otpMethod === 'email' ? { email } : { phone };

    if (!identifier[otpMethod]) {
        Validation.showAlert(`Please enter your ${otpMethod}`, 'error');
        return;
    }

    try {
        const btn = document.getElementById('btn-send-otp');
        btn.textContent = 'Sending...';
        btn.disabled = true;

        await API.auth.sendOtp(identifier);

        Validation.showAlert(`Code sent to your ${otpMethod}!`, 'success');

        // Show Code Input
        document.getElementById('group-otp-code').classList.remove('hidden');
        document.getElementById('btn-send-otp').classList.add('hidden');
        document.getElementById('btn-verify-otp').classList.remove('hidden');

    } catch (error) {
        Validation.showAlert(error.message || 'Failed to send code', 'error');
        document.getElementById('btn-send-otp').textContent = 'Send Code';
        document.getElementById('btn-send-otp').disabled = false;
    }
};

// Verify OTP
window.verifyAuthOtp = async () => {
    const email = document.getElementById('otp-email-input').value;
    const phone = document.getElementById('otp-phone-input').value;
    const otp = document.getElementById('otp-code-input').value;

    const identifier = otpMethod === 'email' ? { email } : { phone };

    try {
        Validation.showLoading();
        await API.auth.verifyOtp(identifier, otp);
        window.location.href = '/dashboard.html';
    } catch (error) {
        Validation.hideLoading();
        Validation.showAlert(error.message || 'Invalid code', 'error');
    }
};

// Standard Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        Validation.showLoading();
        await API.auth.login({ email, password });
        window.location.href = '/dashboard.html';
    } catch (error) {
        Validation.hideLoading();
        Validation.showAlert(error.message || 'Login failed', 'error');
    }
}

// Register
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        Validation.showAlert('Passwords do not match', 'error');
        return;
    }

    try {
        Validation.showLoading();
        await API.auth.register({ username, email, password });
        window.location.href = '/dashboard.html';
    } catch (error) {
        Validation.hideLoading();
        Validation.showAlert(error.message || 'Registration failed', 'error');
    }
}

// Toggle Auth Mode (Login/Register)
let isLoginView = true;
function toggleAuthMode(e) {
    e.preventDefault();
    isLoginView = !isLoginView;

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTabs = document.getElementById('auth-tabs');
    const otpForm = document.getElementById('otp-form');

    const title = document.getElementById('form-title');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-form');

    if (isLoginView) {
        // Show Login (Password tab default)
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authTabs.classList.remove('hidden');
        otpForm.classList.add('hidden'); // Reset to password tab state basically
        switchTab('password'); // Reset to password tab

        title.textContent = 'Welcome Back';
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign Up';
    } else {
        // Show Register
        loginForm.classList.add('hidden');
        otpForm.classList.add('hidden');
        authTabs.classList.add('hidden'); // Hide tabs in register mode
        registerForm.classList.remove('hidden');

        title.textContent = 'Create Account';
        toggleText.textContent = 'Already have an account?';
        toggleLink.textContent = 'Sign In';
    }
}
