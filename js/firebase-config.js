// Firebase configuration - Using environment variables
const firebaseConfig = {
  apiKey: "AIzaSyDFJQKYkWywoSprZqOtjqjoYAe7nkGOfEI",
  authDomain: "ecomiles-70c6e.firebaseapp.com",
  projectId: "ecomiles-70c6e",
  storageBucket: "ecomiles-70c6e.firebasestorage.app",
  messagingSenderId: "247523942180",
  appId: "1:247523942180:web:947f664f5de7f0c1759db1",
  measurementId: "G-2TP0NK67TX"
};


// Get actual config from environment variables (injected by server)
const actualConfig = {
    apiKey: window.FIREBASE_CONFIG?.apiKey || firebaseConfig.apiKey,
    authDomain: `${window.FIREBASE_CONFIG?.projectId || 'ecomiles-demo'}.firebaseapp.com`,
    projectId: window.FIREBASE_CONFIG?.projectId || firebaseConfig.projectId,
    storageBucket: `${window.FIREBASE_CONFIG?.projectId || 'ecomiles-demo'}.firebasestorage.app`,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: window.FIREBASE_CONFIG?.appId || firebaseConfig.appId
};

// Initialize Firebase
firebase.initializeApp(actualConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        const userData = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL
        };
        
        // Store user data in localStorage
        localStorage.setItem('ecomiles_user', JSON.stringify(userData));
        
        // Initialize user document in Firestore if it doesn't exist
        initializeUserData(user);
    } else {
        // User is signed out
        localStorage.removeItem('ecomiles_user');
    }
});

// Initialize user data in Firestore
async function initializeUserData(user) {
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            // Create new user document
            await userRef.set({
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                points: 0,
                totalDistance: 0,
                roadTaxSaved: 0,
                journeys: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error initializing user data:', error);
    }
}

// Utility functions
function getCurrentUser() {
    const userString = localStorage.getItem('ecomiles_user');
    return userString ? JSON.parse(userString) : null;
}

function isUserLoggedIn() {
    return getCurrentUser() !== null;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('ecomiles_user');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}
