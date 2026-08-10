import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./firebase";

// Instancia secundaria de Firebase, usada exclusivamente para crear cuentas
// nuevas (Auth) sin cerrar la sesión del usuario que está haciendo el alta
// (el afiliador). Si usáramos la instancia principal, createUserWithEmailAndPassword
// iniciaría sesión automáticamente como el usuario recién creado y desconectaría
// al afiliador de su propia sesión.
const SECONDARY_APP_NAME = "Secondary";

const secondaryApp = getApps().some((app) => app.name === SECONDARY_APP_NAME)
  ? getApp(SECONDARY_APP_NAME)
  : initializeApp(firebaseConfig, SECONDARY_APP_NAME);

export const secondaryAuth = getAuth(secondaryApp);
export default secondaryApp;
