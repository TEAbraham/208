import admin from "firebase-admin";
import { readFile } from "fs/promises";

const serviceAccount = JSON.parse(await readFile("./admin-key.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const rewardPoints = { easy: 1, medium: 2, hard: 3 };
const penaltyPoints = { easy: -3, medium: -2, hard: -1 };

async function backfillSummaryWithEmails() {
  const snapshot = await db.collection("student_answers").get();
  const userData = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const questionId = data.questionId;
    const qid = typeof questionId === "string" ? questionId.split("_") : [];
    const unit = (qid[0] || "unknown").toString();
    const uid = data.userId;
    const difficulty = (data.difficulty || "medium").toLowerCase();
    const reward = rewardPoints[difficulty] ?? 2;
    const penalty = penaltyPoints[difficulty] ?? -1;

    if (!uid) return;

    if (!userData[uid]) {
      userData[uid] = {
        userId: uid,
        totalCorrect: 0,
        totalAttempted: 0,
        totalPointsEarned: 0,
        totalPointsPossible: 0,
        units: {} // per-unit tracking
      };
    }

    const user = userData[uid];

    if (!user.units[unit]) {
      user.units[unit] = {
        points: 0,
        correct: 0,
        incorrect: 0,
        everAbove25: false
      };
    }

    const earned = data.correct ? reward : penalty;
    user.totalAttempted++;
    user.totalPointsEarned += earned;
    user.totalPointsPossible += reward;

    user.units[unit].points += earned;

    if (data.correct) {
      user.totalCorrect++;
      user.units[unit].correct++;
    } else {
      user.units[unit].incorrect++;
    }

    if (user.units[unit].points > 25) {
      user.units[unit].everAbove25 = true;
    }
  });

  for (const uid of Object.keys(userData)) {
    try {
      const user = await admin.auth().getUser(uid);
      userData[uid].email = user.email;
      userData[uid].lastUpdated = new Date();

      await db.collection("student_summary").doc(uid).set(userData[uid]);
      console.log(`✅ Wrote summary for ${uid}`);
    } catch (err) {
      console.error(`❌ Skipped ${uid}: ${err.message}`);
    }
  }

  console.log("🎉 Backfill with unit breakdown complete.");
}

backfillSummaryWithEmails();