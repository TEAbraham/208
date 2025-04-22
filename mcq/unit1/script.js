import {
  getFirestore, collection, query, where, getDocs, doc, setDoc, addDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from "../../js/firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// UI Elements
const mcqContainer = document.getElementById("mcq-container");

const unitScore = document.getElementById("unit-score");
const questionTitle = document.getElementById("question-title");
const questionDifficulty = document.getElementById("question-difficulty");
const questionImages = document.getElementById("question-images");
const questionTables = document.getElementById("question-tables");
const questionText = document.getElementById("question-text");
const questionChoices = document.getElementById("question-choices");
const feedbackDiv = document.getElementById("feedback");
const correctDiv = document.getElementById("question-correct_answer");
const solutionDiv = document.getElementById("question-solution");
const explanationDiv = document.getElementById("question-explanations");

const submitBtn = document.getElementById("submit");
const nextBtn = document.getElementById("next-question");

let currentQuestion = null;
let selectedAnswer = null;
let allQuestions = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  mcqContainer.style.display = "block";

  const snapshot = await getDocs(query(
    collection(db, "mcq_questions"),
    where("unit", "==", "unit1")
  ));

  allQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  updateScore(user.uid);
  showNewQuestion();
});

function showNewQuestion() {
  selectedAnswer = null;
  const idx = Math.floor(Math.random() * allQuestions.length);
  currentQuestion = allQuestions[idx];
  renderQuestion(currentQuestion);
}

function updateScore(uid) {
  getDocs(query(collection(db, "student_answers"), where("userId", "==", uid)))
    .then(snapshot => {
      let score = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.questionId.startsWith("unit1_")) return;

        const rewardPoints = { easy: 1, medium: 2, hard: 3 };
        const penaltyPoints = { easy: -3, medium: -2, hard: -1 };

        const baseReward = rewardPoints[difficulty];
        const basePenalty = penaltyPoints[difficulty];

        // Lock score at 50 once reached
        if (score < 50) {
          const nextScore = score + (data.correct ? baseReward : basePenalty);
          score = Math.min(50, nextScore);
        }

      });

      unitScore.innerText = `Unit 1 Progress: ${score} / 50 pts`;
      if (score >= 50) {
        unitScore.innerText += " ✅ Complete!";
      }

    });
}

function renderQuestion(q) {
  questionTitle.textContent = q.title || "";
  questionDifficulty.textContent = `Difficulty: ${q.difficulty || "Medium"}`;
  questionText.innerHTML = q.question_text || "";

  if (window.MathJax) MathJax.typesetPromise();

  questionImages.innerHTML = "";
  (q.image_urls || []).forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.style.maxWidth = "400px";
    img.style.margin = "5px";
    questionImages.appendChild(img);
  });

  questionTables.innerHTML = "";
  (q.tables || []).forEach(html => {
    if (window.MathJax) MathJax.typesetPromise();
    const el = document.createElement("div");
    el.innerHTML = html;
    questionTables.appendChild(el);
  });

  questionChoices.innerHTML = "";
  (q.choices || []).forEach(choice => {
    const btn = document.createElement("button");
    btn.innerHTML = `<strong>${choice.letter}:</strong> ${choice.text}`;
    btn.className = "button-1 perspective";
    btn.style.display = "block";
    btn.style.marginBottom = "0.5em";
    btn.style.textAlign = "left";
    btn.dataset.letter = choice.letter;
    btn.onclick = () => {
      selectedAnswer = choice.letter;
      document.querySelectorAll("#question-choices button").forEach(b => b.style.background = "");
      btn.style.background = "#d0eaff";
    };
    questionChoices.appendChild(btn);
  });

  if (window.MathJax) MathJax.typesetPromise();


  feedbackDiv.innerText = "";
  correctDiv.style.visibility = "hidden";
  correctDiv.innerText = "";
  solutionDiv.style.visibility = "hidden";
  solutionDiv.innerText = "";

  nextBtn.style.display = "none";
}

submitBtn.onclick = async () => {
  if (!selectedAnswer || !currentQuestion) return alert("Please select an answer.");

  const correctLetterMatch = currentQuestion.correct_answer?.match(/Choice '([A-E])'/i);
  const correctLetter = correctLetterMatch ? correctLetterMatch[1] : null;
  const correct = selectedAnswer === correctLetter;


  await setDoc(doc(db, "student_answers", `${auth.currentUser.uid}_${currentQuestion.id}`), {
    userId: auth.currentUser.uid,
    questionId: currentQuestion.id,
    selected: selectedAnswer,
    correct,
    difficulty: currentQuestion.difficulty || "medium",
    timestamp: new Date()
  });

  feedbackDiv.innerText = correct ? "✅ Correct!" : "❌ Incorrect.";

  document.querySelectorAll("#question-choices button").forEach(btn => {
    const isCorrect = btn.dataset.letter === correctLetter;
    btn.style.background = isCorrect ? "#a6f3a6" : (btn.dataset.letter === selectedAnswer ? "#fdaaa0" : "");
  });

  correctDiv.innerText = currentQuestion.correct_answer || "";
  correctDiv.style.visibility = "visible";

  solutionDiv.innerText = currentQuestion.solution || "";
  solutionDiv.style.visibility = "visible";

  if (window.MathJax) MathJax.typesetPromise();

  updateScore(auth.currentUser.uid);
  nextBtn.style.display = "inline-block";
};

nextBtn.onclick = () => {
  showNewQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById("mcq-container");

  if (!container) return;

  // 🛡️ Block copy/cut/paste/right-click
  const blockAction = async (event, type) => {
    event.preventDefault();
    alert(`Sorry, ${type} is disabled during the quiz.`);
    await addDoc(collection(db, "user_violations"), {
      userId: auth.currentUser?.uid || "anonymous",
      event: type,
      timestamp: new Date(),
      page: "unit1"
    });
  };

  container.addEventListener("copy", e => blockAction(e, "copy"));
  container.addEventListener("cut", e => blockAction(e, "cut"));
  container.addEventListener("paste", e => blockAction(e, "paste"));
  container.addEventListener("contextmenu", e => blockAction(e, "right-click"));

  // 🛑 Block Print Shortcut
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "p") {
      e.preventDefault();
      alert("Printing is disabled during the quiz.");
      console.warn("Blocked print attempt");
    }
  });
});
