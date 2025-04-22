import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, getIdTokenResult
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from "../js/firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const units = ["unit1", "unit2", "unit3", "unit4", "unit5", "unit6", "unit7", "unit8", "unit9"];
const tableBody = document.getElementById("dashboard-body");

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "/mcq"; // redirect to login if not signed in

  const token = await getIdTokenResult(user);
  if (token.claims?.teacher !== true) {
    alert("Access denied. You must be a teacher.");
    return location.href = "/mcq";
  }

  const [usersSnap, completionsSnap] = await Promise.all([
    getDocs(collection(db, "users")), // students in your system
    getDocs(collection(db, "unit_completion")) // their unit completions
  ]);

  const completions = {};
  completionsSnap.forEach(doc => {
    const data = doc.data();
    const key = `${data.userId}_${data.unit}`;
    completions[key] = {
      score: data.score,
      answers: data.totalAnswers,
      timestamp: data.completedAt?.toDate()
    };
  });

  usersSnap.forEach(doc => {
    const user = doc.data();
    const tr = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = user.displayName || "Unnamed";
    tr.appendChild(nameCell);

    const emailCell = document.createElement("td");
    emailCell.textContent = user.email;
    tr.appendChild(emailCell);

    for (const unit of units) {
      const cell = document.createElement("td");
      const data = completions[`${user.uid}_${unit}`];
      if (data) {
        cell.innerHTML = `✅ ${data.answers} 🕒 ${data.timestamp.toLocaleDateString()}`;
      } else {
        cell.textContent = "";
      }
      tr.appendChild(cell);
    }

    tableBody.appendChild(tr);
  });
});
