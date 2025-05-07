import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore, collection, query, where, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from "../js/firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const tableBody = document.getElementById("student-body");
const unitFilter = document.getElementById("unit-filter");
const chartCanvas = document.getElementById("scoreChart");
const studentHeader = document.getElementById("student-name");
const summaryDiv = document.getElementById("summary");

const uid = new URLSearchParams(window.location.search).get("uid");
if (!uid) window.location.href = "/admin/";

let allAnswers = [];

onAuthStateChanged(auth, async user => {
  if (!user) return window.location.href = "/mcq";

  // Fetch student's answers
  const snapshot = await getDocs(query(
    collection(db, "student_answers"),
    where("userId", "==", uid)
  ));

  allAnswers = snapshot.docs.map(doc => doc.data());
  renderStudentAnswers("all");
});

unitFilter.addEventListener("change", e => {
  renderStudentAnswers(e.target.value);
});

async function renderStudentAnswers(unit) {
  const filtered = unit === "all"
    ? allAnswers
    : allAnswers.filter(q => q.questionId.startsWith(`${unit}_`));

  // Table
  tableBody.innerHTML = "";
  filtered.forEach(data => {
    const [unitId, questionNum] = data.questionId.split("_");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${questionNum}</td>
      <td>${unitId}</td>
      <td>${data.difficulty}</td>
      <td>${data.selected}</td>
      <td>${data.correct ? "✅" : "❌"}</td>
      <td>${new Date(data.timestamp?.toDate?.() || data.timestamp).toLocaleString()}</td>
    `;
    tableBody.appendChild(tr);
  });

  // Chart
  const scoreByUnit = {};
  filtered.forEach(q => {
    const unitKey = q.questionId.split("_")[0];
    const diff = q.difficulty || "medium";
    const pts = q.correct
      ? { easy: 1, medium: 2, hard: 3 }[diff]
      : { easy: -3, medium: -2, hard: -1 }[diff];
    scoreByUnit[unitKey] = (scoreByUnit[unitKey] || 0) + pts;
  });

  const labels = Object.keys(scoreByUnit);
  const dataPoints = labels.map(u => scoreByUnit[u]);

  if (!labels.length) {
    chartCanvas.parentElement.style.display = "none";
  } else {
    chartCanvas.parentElement.style.display = "block";
    if (window.chartInstance) window.chartInstance.destroy();
    window.chartInstance = new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: "Score by Unit", data: dataPoints }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }

  const totalScore = dataPoints.reduce((a, b) => a + b, 0);
  summaryDiv.textContent = `Total Score: ${totalScore}, Questions Answered: ${filtered.length}`;

  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    const student = userDoc.data();
    studentHeader.textContent = `History for ${student.displayName || uid}`;
  }
}
