
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFJQKYkWywoSprZqOtjqjoYAe7nkGOfEI",
  authDomain: "ecomiles-70c6e.firebaseapp.com",
  projectId: "ecomiles-70c6e",
  storageBucket: "ecomiles-70c6e.appspot.com", // FIXED this line
  messagingSenderId: "247523942180",
  appId: "1:247523942180:web:947f664f5de7f0c1759db1",
  measurementId: "G-2TP0NK67TX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Auth observer
auth.onAuthStateChanged((user) => {
  if (user) {
    const userData = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    };
    localStorage.setItem('ecomiles_user', JSON.stringify(userData));
    initializeUserData(user);
  } else {
    localStorage.removeItem('ecomiles_user');
  }
});

// Create user doc if not exist
async function initializeUserData(user) {
  try {
    const userRef = db.collection('users').doc(user.uid);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
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
  } catch (err) {
    console.error('Error initializing user data:', err);
  }
}

function getCurrentUser() {
  const str = localStorage.getItem('ecomiles_user');
  return str ? JSON.parse(str) : null;
}

function isUserLoggedIn() {
  return getCurrentUser() !== null;
}

function requireAuth() {
  if (!isUserLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  auth.signOut().then(() => {
    localStorage.removeItem('ecomiles_user');
    window.location.href = 'index.html';
  }).catch(err => {
    console.error('Error signing out:', err);
  });
}

