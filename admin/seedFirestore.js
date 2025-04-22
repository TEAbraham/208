// seedFirestore.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // update path if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedTestData() {
  const testUserId = "test123";

  // Create a fake student user
  await db.collection("users").doc(testUserId).set({
    displayName: "Test Student",
    email: "test@student.com"
  });

  // Create a fake unit completion for that student
  await db.collection("unit_completion").doc(`${testUserId}_unit1`).set({
    userId: testUserId,
    unit: "unit1",
    score: 50,
    totalAnswers: 17,
    completedAt: new Date()
  });

  console.log("✅ Test user and unit completion seeded!");
}

seedTestData().catch(console.error);
