// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyATPVrn9wy1ip7wSXoJemOifYAEmKqr_uU",
  authDomain: "digital-thesis-repository.firebaseapp.com",
  projectId: "digital-thesis-repository",
  storageBucket: "digital-thesis-repository.firebasestorage.app",
  messagingSenderId: "702431868719",
  appId: "1:702431868719:web:6c333f7987e1644f7b53da",
  measurementId: "G-MH794X312Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);