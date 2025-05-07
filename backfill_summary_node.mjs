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
    const uid = data.userId;
    const difficulty = (data.difficulty || "medium").toLowerCase();
    const reward = rewardPoints[difficulty] ?? 2;
    const penalty = penaltyPoints[difficulty] ?? -1;

    if (!userData[uid]) {
      userData[uid] = {
        userId: uid,
        totalCorrect: 0,
        totalAttempted: 0,
        totalPointsEarned: 0,
        totalPointsPossible: 0
      };
    }

    userData[uid].totalAttempted++;
    if (data.correct) userData[uid].totalCorrect++;
    userData[uid].totalPointsEarned += data.correct ? reward : penalty;
    userData[uid].totalPointsPossible += reward;
  });

  // Add email via Firebase Auth
  for (const uid of Object.keys(userData)) {
    try {
      const user = await admin.auth().getUser(uid);
      userData[uid].email = user.email;
    } catch (err) {
      console.error(`❌ Failed to fetch user ${uid}:`, err.message);
      userData[uid].email = "(unknown)";
    }

    userData[uid].lastUpdated = new Date();
    await db.collection("student_summary").doc(uid).set(userData[uid]);
    console.log(`✅ Wrote summary for ${uid}`);
  }

  console.log("🎉 Backfill with emails complete.");
}

backfillSummaryWithEmails();
