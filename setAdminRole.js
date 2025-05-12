const admin = require("firebase-admin");

// ✅ Point to your service account key
const serviceAccount = require("./admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✅ Replace this with the actual UID you want to make admin
const uid = "cvBVSfct5rQaD0gz70OZsy34oAB2";

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Admin claim added to ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error setting admin claim:", error);
    process.exit(1);
  });
