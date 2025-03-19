import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider  } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const googleLoginBtn = document.getElementById('googleLogin');

// Google login function
document.addEventListener('DOMContentLoaded', function() {
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', googleLogin);
    }
});


window.signUp = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password).then(() => {
        alert('Signup successful');
    }).catch(err => alert(err.message));
};

window.login = () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password).then(() => {
        alert('Login successful');
        window.location.href = "home.html";
    }).catch(err => alert(err.message));
};

window.logout = () => {
    signOut(auth).then(() => {
        alert('Logged out');
    });
};


if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                alert(`Google login successful. Welcome, ${user.displayName}`);
                window.location.href = "home.html";
            })
            .catch((error) => {
                console.error("Error during Google sign-in", error);
                alert("Error during Google login: " + error.message);
            });
    });
}


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


// Updated D3 v7 force layout
document.addEventListener('DOMContentLoaded', function() {
    const backgroundNode = document.getElementById("background");

    if (backgroundNode) {
        let width = backgroundNode.clientWidth;
        let height = backgroundNode.clientHeight;

        const num = 300, base = 4, dif = 12;

        const nodes = d3.range(num).map(() => ({ radius: Math.random() * dif + base }));
        const root = nodes[0];
        const colors = ['#009cde', '#46c8b2', '#f5d800', '#ff8b22', '#ff6859', '#fc4d77'];

        root.radius = 0;
        root.fx = width / 2;
        root.fy = height / 2;

        const simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(-12))  // stronger repulsion
            .force('collision', d3.forceCollide().radius(d => d.radius + 2).strength(7)) // stronger collision force
            .force('x', d3.forceX(width / 2).strength(0.02))  // gentle horizontal centering
            .force('y', d3.forceY(height / 2).strength(0.02)) // gentle vertical centering
            .on('tick', ticked);
    

        const canvas = d3.select("#background").append("canvas")
            .attr("width", width)
            .attr("height", height)
            .node();

        const context = canvas.getContext("2d");

        d3.select(canvas)
            .on("mousemove", event => {
                const [x, y] = d3.pointer(event);
                root.fx = x;
                root.fy = y;
                simulation.alpha(1).restart();
            });

        function ticked() {
            context.clearRect(0, 0, width, height);
            nodes.forEach((d, i) => {
                context.beginPath();
                context.fillStyle = colors[i % colors.length];
                context.globalAlpha = 0.6;
                context.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
                context.fill();
            });
        }

        window.addEventListener("resize", () => {
            width = backgroundNode.clientWidth;
            height = backgroundNode.clientHeight;
            canvas.width = width;
            canvas.height = height;
            simulation.force('center', d3.forceCenter(width / 2, height / 2));
            simulation.alpha(1).restart();
        });
    } else {
        console.error('Element #background not found');
    }
});