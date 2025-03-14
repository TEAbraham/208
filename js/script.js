import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBnwybCXOLYyuUT5c_T07crYXPXvwY18v0",
    authDomain: "ap-statistics.firebaseapp.com",
    projectId: "ap-statistics",
    storageBucket: "ap-statistics.firebasestorage.app",
    messagingSenderId: "141435743547",
    appId: "1:141435743547:web:dfba9776ffef593d7b9b1e",
    measurementId: "G-Z6RGNYY4JN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Make Firebase available globally
window.auth = auth;
window.db = db;



function validateFields(email, password) {
  if (!email || !password) {
      alert("Email and password cannot be empty!");
      return false;
  }
  return true;
}

// Update signUp() function:
async function signUp() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  if (!validateFields(email, password)) return;

  try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      alert("Signup successful!");
      logActivity(userCredential.user.uid, "Signed Up");
  } catch (error) {
      alert(error.message);
  }
}


// Login function with redirect
async function login() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  if (!validateFields(email, password)) return;

  try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");

      // Log user activity
      logActivity(userCredential.user.uid, "Logged In");

      // Redirect to home.html after login
      window.location.href = "home.html"; 
  } catch (error) {
      alert(error.message);
  }
}



// Logout function with redirect
async function logout() {
  await signOut(auth);
  alert("Logged out!");

  // Redirect to index.html after logout
  window.location.href = "index.html";
}


// Track user authentication state and redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
      console.log(`User logged in: ${user.email}`);

      // Redirect logged-in users to home.html
      if (window.location.pathname.includes("index.html")) {
          window.location.href = "home.html";
      }
  } else {
      console.log("User logged out.");
  }
});


// Log user actions to Firestore
async function logActivity(userId, action) {
  try {
      await addDoc(collection(db, "activity"), {
          userId: userId,
          action: action,
          timestamp: serverTimestamp()
      });
  } catch (error) {
      console.error("Error logging activity:", error);
  }
}

// Save user quiz score
async function saveQuizScore(userId, score) {
  try {
      await addDoc(collection(db, "quizScores"), {
          userId: userId,
          score: score,
          timestamp: serverTimestamp()
      });
  } catch (error) {
      console.error("Error saving quiz score:", error);
  }
}

// Expose functions to global scope for button clicks
window.signUp = signUp;
window.login = login;
window.logout = logout;

