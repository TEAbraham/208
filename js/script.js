import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider  } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
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
// Google provider instance
const provider = new GoogleAuthProvider();
// Google login function
const googleLoginBtn = document.getElementById('googleLogin');

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


document.addEventListener('DOMContentLoaded', function() {
  var backgroundNode = d3.select("#background").node();

  if (backgroundNode) {
      var width = backgroundNode.clientWidth,
          height = backgroundNode.clientHeight;

      var num = 300,
          base = 4,
          dif = 12;

      var nodes = d3.range(num).map(function() { return {radius: Math.random() * dif + base }; }),
          root = nodes[0],
          color = ['#009cde', '#46c8b2', '#f5d800', '#ff8b22', '#ff6859', '#fc4d77'];

      root.radius = 0;
      root.fixed = true;
      root.px = width/2;
      root.py = height/2;

      var force = d3.layout.force()
          .gravity(0.015)
          .charge(function(d, i) { return i ? 0 : - (height + width); })
          .nodes(nodes)
          .size([width, height]);

      force.start();

      var canvas = d3.select("#background").append("canvas")
          .attr("width", width)
          .attr("height", height);

      var context = canvas.node().getContext("2d");

      force.on("tick", function(e) {
        var q = d3.geom.quadtree(nodes),
            i,
            d,
            n = nodes.length;

        for (i = 1; i < n; ++i) q.visit(collide(nodes[i]));

        context.clearRect(0, 0, width, height);
        force.size([width, height]);
        for (i = 1; i < n; ++i) {
          context.fillStyle = color[i % color.length];
          context.globalAlpha = 0.6;
          d = nodes[i];
          context.moveTo(d.x, d.y);
          context.beginPath();
          context.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
          context.fill();
        }
      });

      canvas.on("mousemove", move);
      canvas.on("touchmove", move);

      function move() {
        var p1 = d3.mouse(this);
        root.px = p1[0];
        root.py = p1[1];
        force.resume();
      };

      function collide(node) {
        var r = node.radius + 16,
            nx1 = node.x - r,
            nx2 = node.x + r,
            ny1 = node.y - r,
            ny2 = node.y + r;
        return function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = node.radius + quad.point.radius + 7;
            if (l < r) {
              l = (l - r) / l * .5;
              node.x -= x *= l;
              node.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        };
      }

      $(window).on("resize", function () {
        width = d3.select("#background").node().clientWidth,
        height = d3.select("#background").node().clientHeight;
        canvas.attr("width", width).attr("height", height);
        force.start();
      });

  } else {
      console.error('Element #background not found');
  }
});
