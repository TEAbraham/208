import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
    onAuthStateChanged, signInWithPopup, GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');

export function buildLogo(svg, scaleFactor = 1) {
  const rectWidth = 340 * scaleFactor;
  const rectHeight = 385 * scaleFactor;
  const rectX = 200 * scaleFactor;
  const rectY = 200 * scaleFactor;

  svg.append("rect")
    .attr("x", rectX)
    .attr("y", rectY)
    .attr("width", rectWidth)
    .attr("height", rectHeight)
    .attr("fill", "white")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 5 * scaleFactor);

  const arcLeft = d3.arc()
    .innerRadius(rectHeight / 2 - 0.01)
    .outerRadius(rectHeight / 2)
    .startAngle(-Math.PI)
    .endAngle(-2 * Math.PI);

  const arcRight = d3.arc()
    .innerRadius(rectHeight / 2 - 0.01)
    .outerRadius(rectHeight / 2)
    .startAngle(Math.PI)
    .endAngle(2 * Math.PI);

  const arcTop = d3.arc()
    .innerRadius(rectHeight / 2 - 0.01)
    .outerRadius(rectHeight / 2)
    .startAngle(-1.05)
    .endAngle(1.05);

  svg.append("path")
    .attr("d", arcLeft)
    .attr("transform", `translate(${rectX - 200 * scaleFactor}, ${rectY + rectHeight / 2})`)
    .attr("fill", "none")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 5 * scaleFactor)
    .transition()
    .duration(1500)
    .attr("transform", `translate(${rectX + 25 * scaleFactor}, ${rectY + rectHeight / 2})`);

  svg.append("path")
    .attr("d", arcRight)
    .attr("transform", `translate(${rectX + rectWidth + 200 * scaleFactor}, ${rectY + rectHeight / 2})`)
    .attr("fill", "none")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 5 * scaleFactor)
    .transition()
    .duration(1500)
    .attr("transform", `translate(${rectX + rectWidth - 25 * scaleFactor}, ${rectY + rectHeight / 2})`);

  svg.append("path")
    .attr("d", arcTop)
    .attr("transform", `translate(${rectX + rectWidth / 2}, ${rectY - 200 * scaleFactor})`)
    .attr("fill", "white")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 5 * scaleFactor)
    .transition()
    .duration(1500)
    .attr("transform", `translate(${rectX + rectWidth / 2}, ${rectY + rectHeight / 2})`);

    svg.append("rect")
      .attr("x", 130 * scaleFactor)
      .attr("y", 300 * scaleFactor)
      .attr("width", rectWidth / 3)
      .attr("height", rectHeight)
      .attr("fill", "white");

    svg.append("rect")
      .attr("x", 160 * scaleFactor + rectWidth)
      .attr("y", 300 * scaleFactor)
      .attr("width", rectWidth / 3)
      .attr("height", rectHeight)
      .attr("fill", "white");
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector("#bg-animation")) {
    buildLogo(d3.select("#bg-animation"), 1);
  }

  if (document.querySelector("#logo")) {
    const miniLogo = d3.select("#logo")
      .append("svg")
      .attr("width", 100)
      .attr("height", 100)
      .style("margin-left", "0px")
      .style("vertical-align", "middle");

    buildLogo(miniLogo, 0.1);
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
  const redirectURL = localStorage.getItem("redirectAfterLogin");
  if (redirectURL) {
    localStorage.removeItem("redirectAfterLogin");
    window.location.href = redirectURL;
  }

signInWithEmailAndPassword(auth, email, password).then(() => {
    alert('Login successful');
    window.location.href = "home.html";
  }).catch(err => alert(err.message));
};

window.loginWithGoogle = () => {
signInWithPopup(auth, provider).then(() => {
    alert('Google sign-in successful');
    window.location.href = "home.html";
  }).catch(err => alert(err.message));
};

window.logout = (redirectTo = "index.html") => {
  signOut(auth).then(() => {
    alert('Logged out');
    window.location.href = redirectTo;
  });
};

onAuthStateChanged(auth, user => {
  const currentPage = window.location.pathname.split("/").pop();
  const logoutButton = document.getElementById('logoutButton');

  if (user) {
    if (logoutButton) logoutButton.style.display = 'block';
  } else {
    if (currentPage !== "index.html" && currentPage !== "") {
      window.location.href = "index.html";
    }
    if (logoutButton) logoutButton.style.display = 'none';
  }
});

