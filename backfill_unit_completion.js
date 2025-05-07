import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { firebaseConfig } from "./js/firebase-config.js"; // ✅ Adjust if needed

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async user => {
  if (!user) {
    alert("You must be logged in to run the backfill.");
    return;
  }

  if (!confirm("Run backfill to populate missing emails in unit_completion?")) return;

  const snapshot = await getDocs(collection(db, "unit_completion"));
  console.log(`🔍 Found ${snapshot.size} unit_completion docs`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;

    if (!data.email && data.userId) {
      try {
        const userRef = doc(db, "users", data.userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const email = userData.email;

          if (email) {
            await updateDoc(doc(db, "unit_completion", id), { email });
            console.log(`✅ Updated ${id} with email: ${email}`);
          } else {
            console.warn(`⚠️ No email found in user profile for ${data.userId}`);
          }
        } else {
          console.warn(`❌ No user doc found for ${data.userId}`);
        }
      } catch (err) {
        console.error(`💥 Error updating ${id}:`, err);
      }
    }
  }

  alert("🎉 Backfill complete. Check console for details.");
});
