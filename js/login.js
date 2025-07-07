// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    if (isUserLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Initialize login functionality
    initializeLogin();
});

function initializeLogin() {
    const signInBtn = document.getElementById('googleSignInBtn');
    const errorDiv = document.getElementById('loginError');
    const statusDiv = document.getElementById('loginStatus');
    
    signInBtn.addEventListener('click', handleGoogleSignIn);
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user) {
            showStatus('Login successful! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    });
}

async function handleGoogleSignIn() {
    const signInBtn = document.getElementById('googleSignInBtn');
    const errorDiv = document.getElementById('loginError');
    const statusDiv = document.getElementById('loginStatus');
    
    try {
        // Disable button and show loading state
        signInBtn.disabled = true;
        signInBtn.innerHTML = '<span>⏳</span> Signing in...';
        
        hideError();
        showStatus('Opening Google sign-in...', 'info');
        
        // Sign in with Google popup
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        if (user) {
            showStatus('Sign-in successful! Setting up your account...', 'success');
            
            // User data will be automatically stored via the auth state observer
            // in firebase-config.js, so we just need to wait for redirect
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Re-enable button
        signInBtn.disabled = false;
        signInBtn.innerHTML = '<span>🔐</span> Sign in with Google';
        
        hideStatus();
        
        // Handle specific error cases
        let errorMessage = 'Failed to sign in. Please try again.';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign-in was cancelled. Please try again.';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups for this site.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Your account has been disabled. Please contact support.';
                break;
            default:
                if (error.message) {
                    errorMessage = error.message;
                }
        }
        
        showError(errorMessage);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.add('hidden');
}

function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('loginStatus');
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
    
    // Update styling based on type
    if (type === 'success') {
        statusDiv.style.background = '#d4edda';
        statusDiv.style.color = '#155724';
    } else if (type === 'error') {
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
    } else {
        statusDiv.style.background = '#d1ecf1';
        statusDiv.style.color = '#0c5460';
    }
}

function hideStatus() {
    const statusDiv = document.getElementById('loginStatus');
    statusDiv.classList.add('hidden');
}
