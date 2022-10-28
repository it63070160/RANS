import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBlI0AhzF6KrzTzdzZBnQ9h-qf2iOs4IRE",
  authDomain: "rans-app-28cf1.firebaseapp.com",
  projectId: "rans-app-28cf1",
  storageBucket: "rans-app-28cf1.appspot.com",
  messagingSenderId: "515865571098",
  appId: "1:515865571098:web:74efcf0396508bba0786a3",
  measurementId: "G-PGNX3DH41B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export default db;
