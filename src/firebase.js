import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyATvJ-9f7LxeEMtqUvfM9Dqi478ii4rbiM",
  authDomain: "tuv-prufstelle-pro.firebaseapp.com",
  projectId: "tuv-prufstelle-pro",
  storageBucket: "tuv-prufstelle-pro.firebasestorage.app",
  messagingSenderId: "550991092545",
  appId: "1:550991092545:web:c858e58bf1b826cd7ddfc0",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
