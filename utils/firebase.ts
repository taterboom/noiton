// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.fc_apiKey,
  authDomain: process.env.fc_authDomain,
  projectId: process.env.fc_projectId,
  storageBucket: process.env.fc_storageBucket,
  messagingSenderId: process.env.fc_messagingSenderId,
  appId: process.env.fc_appId,
  measurementId: process.env.fc_measurementId,
};

export let app:any;
export let db:any;

const initFirebase = () => {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  // const analytics = getAnalytics(app);
  db = getFirestore();
};

if (typeof window !== 'undefined') {
  initFirebase();
}
