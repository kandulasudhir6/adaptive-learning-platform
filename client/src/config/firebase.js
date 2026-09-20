import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNnzdktU_ymVIKLQnjNq6yNQOkK530pHQ",
  authDomain: "privid-4373c.firebaseapp.com",
  projectId: "privid-4373c",
  storageBucket: "privid-4373c.firebasestorage.app",
  messagingSenderId: "133123592971",
  appId: "1:133123592971:web:a92b5a0ed4ee3ceef1c80e",
  measurementId: "G-X67KTZ4331"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Analytics (optional, ensure it doesn't break if blocked)
let analytics;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(console.error);

export default app;
