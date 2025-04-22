import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from "../../js/firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const mcqContainer = document.getElementById("mcq-container");
const questionText = document.getElementById("question-text");
const questionImages = document.getElementById("question-images");
const choicesDiv = document.getElementById("choices");
const submitBtn = document.getElementById("submit");
const feedbackDiv = document.getElementById("feedback");

let selectedAnswer = null;
let currentQuestion = null;

onAuthStateChanged(auth, async user => {
  if (!user) return;

  mcqContainer.style.display = "block";

  const qSnap = await getDocs(query(
    collection(db, "mcq_questions"),
    where("unit", "==", "unit1")
  ));

  const questions = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  currentQuestion = questions[Math.floor(Math.random() * questions.length)];

  renderQuestion(currentQuestion);
});

function renderQuestion(q) {
  questionText.innerText = q.question_text;

  // ✅ Tell MathJax to re-render LaTeX
  if (window.MathJax) {
    MathJax.typesetPromise();
  }

  // Render images
  questionImages.innerHTML = "";
  if (q.image_urls) {
    q.image_urls.forEach(url => {
      const img = document.createElement("img");
      img.src = url;
      img.style.maxWidth = "300px";
      img.style.margin = "5px";
      questionImages.appendChild(img);
    });
  }

  // Render choices
  choicesDiv.innerHTML = "";
  selectedAnswer = null;
  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.innerText = `${choice.letter}: ${choice.text}`;
    btn.onclick = () => {
      selectedAnswer = choice.letter;
      document.querySelectorAll("#choices button").forEach(b => b.style.background = "");
      btn.style.background = "lightblue";
    };
    choicesDiv.appendChild(btn);
  });

  feedbackDiv.innerText = "";
}

submitBtn.onclick = async () => {
  if (!selectedAnswer || !currentQuestion) {
    alert("Please select an answer.");
    return;
  }

  const correct = currentQuestion.correct_answer.includes(selectedAnswer);

  await setDoc(doc(db, "student_answers", `${auth.currentUser.uid}_${currentQuestion.id}`), {
    userId: auth.currentUser.uid,
    questionId: currentQuestion.id,
    selected: selectedAnswer,
    correct,
    difficulty: currentQuestion.difficulty || "medium",
    timestamp: new Date()
  });

  feedbackDiv.innerText = correct ? "✅ Correct!" : "❌ Incorrect.";
};
