document.addEventListener('DOMContentLoaded', () => {
  if (isUserLoggedIn()) {
    redirectToDashboard();
    return;
  }
  initializeLogin();
});

function isUserLoggedIn() {
  return auth.currentUser !== null;
}

function redirectToDashboard() {
  const userType = localStorage.getItem('ecomiles_login_type') || 'user';
  window.location.href = userType === 'driver' 
    ? 'driver-dashboard.html' 
    : 'dashboard.html';
}

function initializeLogin() {
  // Set up both buttons if they exist
  const userSignInBtn = document.getElementById('userSignInBtn');
  const driverSignInBtn = document.getElementById('driverSignInBtn');
  const googleSignInBtn = document.getElementById('googleSignInBtn');

  if (userSignInBtn && driverSignInBtn) {
    // Dual button version (passenger/driver)
    userSignInBtn.addEventListener('click', () => handleGoogleSignIn('user'));
    driverSignInBtn.addEventListener('click', () => handleGoogleSignIn('driver'));
  } else if (googleSignInBtn) {
    // Single button version
    googleSignInBtn.addEventListener('click', () => handleGoogleSignIn('user'));
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      showStatus('Login successful! Redirecting...', 'success');
      setTimeout(redirectToDashboard, 1500);
    }
  });
}

async function handleGoogleSignIn(userType = 'user') {
  // Store login type
  localStorage.setItem('ecomiles_login_type', userType);
  
  // Get the appropriate button
  let signInBtn;
  if (userType === 'driver') {
    signInBtn = document.getElementById('driverSignInBtn') || document.getElementById('googleSignInBtn');
  } else {
    signInBtn = document.getElementById('userSignInBtn') || document.getElementById('googleSignInBtn');
  }

  if (!signInBtn) {
    console.error('Sign in button not found');
    showError('System error. Please refresh the page.');
    return;
  }

  try {
    // Store original button state
    const originalText = signInBtn.innerHTML;
    const originalDisabled = signInBtn.disabled;
    
    // Update button state
    signInBtn.disabled = true;
    signInBtn.innerHTML = '<span class="spinner">⏳</span> Signing in...';
    hideError();
    showStatus('Opening Google sign-in...', 'info');

    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    console.error('Login error:', error);
    
    // Reset button state
    if (signInBtn) {
      signInBtn.disabled = originalDisabled;
      if (userType === 'driver') {
        signInBtn.innerHTML = '<span>🚌</span> Continue as Driver';
      } else if (userType === 'user') {
        signInBtn.innerHTML = '<span>🚶</span> Continue as Passenger';
      } else {
        signInBtn.innerHTML = '<span>🔐</span> Sign in with Google';
      }
    }
    
    hideStatus();

    let msg = 'Login failed. Please try again.';
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        msg = 'Popup closed. Please try again.'; break;
      case 'auth/popup-blocked':
        msg = 'Popup blocked. Please allow popups for this site.'; break;
      case 'auth/network-request-failed':
        msg = 'Network error. Please check your connection.'; break;
      case 'auth/too-many-requests':
        msg = 'Too many attempts. Try again later.'; break;
      case 'auth/cancelled-popup-request':
        msg = 'Sign-in process cancelled.'; break;
    }
    showError(msg);
  }
}

function showError(message) {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }
}

function hideError() {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
}

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('loginStatus');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
    statusDiv.style.background = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
    statusDiv.style.color = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460';
  }
}

function hideStatus() {
  const statusDiv = document.getElementById('loginStatus');
  if (statusDiv) {
    statusDiv.classList.add('hidden');
  }
}
