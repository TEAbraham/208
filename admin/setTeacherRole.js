const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json"))
});

const email = "tabraham@thsrocks.us"; // 👈 your teacher email

admin.auth().getUserByEmail(email)
  .then(user => {
    return admin.auth().setCustomUserClaims(user.uid, { teacher: true });
  })
  .then(() => {
    console.log(`✅ Teacher role granted to ${email}`);
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Error setting custom claim:", error);
    process.exit(1);
  });
