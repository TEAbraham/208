import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, 
    onAuthStateChanged, signInWithPopup, GoogleAuthProvider  
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Request Google Classroom scopes explicitly (correct place)
provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');

document.addEventListener('DOMContentLoaded', function() {
    const googleLoginBtn = document.getElementById('googleLogin');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            signInWithPopup(auth, provider).then(result => {
                const user = result.user;
                alert(`Google login successful. Welcome, ${user.displayName}`);
                window.location.href = "home.html";
            }).catch(error => {
                console.error("Error during Google sign-in", error);
                alert("Error during Google login: " + error.message);
            });
        });
    }
});

// Signup Function
window.signUp = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password).then(() => {
        alert('Signup successful');
    }).catch(err => alert(err.message));
};

// Email/Password Login Function
window.login = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password).then(() => {
        alert('Login successful');
        window.location.href = "home.html";
    }).catch(err => alert(err.message));
};

// Logout Function
window.logout = () => {
    signOut(auth).then(() => {
        alert('Logged out');
        window.location.href = "index.html";  // explicitly redirect to login page after logout
    });
};

// Auth state handling
onAuthStateChanged(auth, user => {
    const currentPage = window.location.pathname.split("/").pop();
    const logoutButton = document.getElementById('logoutButton');

    if (user) {
        if (currentPage === "index.html" || currentPage === "") {
            window.location.href = "home.html";
        }
        if (logoutButton) logoutButton.style.display = 'block';
    } else {
        if (currentPage !== "index.html" && currentPage !== "") {
            window.location.href = "index.html";
        }
        if (logoutButton) logoutButton.style.display = 'none';
    }
});
