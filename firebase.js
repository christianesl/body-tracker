import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLvlpL7JZOusvHFe0iL371-bCjbtcmnuw",
  authDomain: "body-metrics-b28f8.firebaseapp.com",
  projectId: "body-metrics-b28f8",
  storageBucket: "body-metrics-b28f8.firebasestorage.app",
  messagingSenderId: "576389429637",
  appId: "1:576389429637:web:439c92af4ab8402d9cacec"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);