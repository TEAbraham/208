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

const tableBody = document.getElementById("dashboard-body");
const units = ["unit1", "unit2", "unit3", "unit4", "unit5", "unit6", "unit7", "unit8", "unit9"];

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "/mcq";

  const token = await user.getIdTokenResult();
  console.log("👤 User claims:", token.claims);
  if (!token.claims?.teacher) {
    alert("Access denied. You must be a teacher.");
    return location.href = "/mcq";
  }

  const [usersSnap, completionsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "unit_completion"))
  ]);

  const completions = {};
  completionsSnap.forEach(doc => {
    const data = doc.data();
    completions[`${data.userId}_${data.unit}`] = {
      answers: data.totalAnswers,
      timestamp: data.completedAt?.toDate()
    };
  });

  usersSnap.forEach(doc => {
    const user = doc.data();
    const tr = document.createElement("tr");
    tr.dataset.uid = doc.id;

    const nameCell = document.createElement("td");
    nameCell.textContent = user.displayName || "Unnamed";
    tr.appendChild(nameCell);

    const emailCell = document.createElement("td");
    emailCell.textContent = user.email;
    tr.appendChild(emailCell);

    for (const unit of units) {
      const cell = document.createElement("td");
      const key = `${doc.id}_${unit}`;
      const data = completions[key];

      if (data) {
        cell.innerHTML = `✅ ${data.answers} <br> 🕒 ${data.timestamp.toLocaleDateString()}`;
      } else {
        cell.textContent = "";
      }
      tr.appendChild(cell);
    }

    tableBody.appendChild(tr);
  });
});

// Export CSV
const exportBtn = document.getElementById("export-csv");
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const rows = [["Student", "Email", ...units]];
    const trs = document.querySelectorAll("#dashboard-body tr");

    trs.forEach(tr => {
      const row = [];
      tr.querySelectorAll("td").forEach(td => {
        row.push(td.textContent.replaceAll("\n", " ").trim());
      });
      rows.push(row);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-dashboard.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Row click → student view
const dashboardTable = document.getElementById("dashboard-body");
if (dashboardTable) {
  dashboardTable.addEventListener("click", e => {
    const tr = e.target.closest("tr");
    if (!tr || !tr.dataset.uid) return;
    window.open(`/admin/student.html?uid=${tr.dataset.uid}`, '_blank');
  });
}
