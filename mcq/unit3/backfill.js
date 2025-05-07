import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, setDoc, doc, query, where, getDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { firebaseConfig } from "../../js/firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ⚙️ Change unit here if needed
const unit = "unit3";

// Reward and penalty mapping
const rewardPoints = { easy: 1, medium: 2, hard: 3 };
const penaltyPoints = { easy: -3, medium: -2, hard: -1 };

async function backfillUnitCompletion() {
  const allAnswers = await getDocs(query(
    collection(db, "student_answers"),
    where("questionId", ">=", `${unit}_`),
    where("questionId", "<", `${unit}_\uf8ff`)
  ));

  const grouped = {};

  // Group answers by userId
  allAnswers.forEach(docSnap => {
    const data = docSnap.data();
    const uid = data.userId;
    if (!grouped[uid]) grouped[uid] = [];
    grouped[uid].push(data);
  });

  for (const uid in grouped) {
    const answers = grouped[uid];
    let score = 0;
    let answerCount = 0;

    for (const a of answers) {
      const difficulty = (a.difficulty || "medium").toLowerCase();
      const reward = rewardPoints[difficulty] ?? 2;
      const penalty = penaltyPoints[difficulty] ?? -1;
      const delta = a.correct ? reward : penalty;

      if (score < 25) {
        score = Math.min(25, score + delta);
        answerCount++;
      }
    }

    const docRef = doc(db, "unit_completion", `${uid}_${unit}`);
    const alreadyExists = await getDoc(docRef);

    if (!alreadyExists.exists() && score >= 25) {
      await setDoc(docRef, {
        userId: uid,
        unit,
        score: 25,
        totalAnswers: answerCount,
        completedAt: new Date()
      });
      console.log(`✅ Backfilled ${uid} for ${unit}`);
    } else {
      console.log(`⚠️ Skipped ${uid} — score=${score}, exists=${alreadyExists.exists()}`);
    }
  }

  console.log("🎉 Backfill complete.");
}

backfillUnitCompletion();
