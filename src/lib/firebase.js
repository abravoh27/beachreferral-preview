import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
apiKey: "AIzaSyAIRv3Mx8JzUip4pnGoqPeUaS9f84CpM8s",
  authDomain: "beachreferrals.firebaseapp.com",
  projectId: "beachreferrals",
  storageBucket: "beachreferrals.firebasestorage.app",
  messagingSenderId: "238187059920",
  appId: "1:238187059920:web:e555d804fd0cd1935ddcd5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;