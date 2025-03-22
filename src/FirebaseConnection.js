
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
//import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
//import AsyncStorage from "@react-native-async-storage/async-storage";

import { initializeAuth, browserLocalPersistence,  indexedDBLocalPersistence } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyBLt7O25g68gNV8KXidaQu6pg4bm4_ij48",
  authDomain: "apptest-15232.firebaseapp.com",
  projectId: "apptest-15232",
  storageBucket: "apptest-15232.firebasestorage.app",
  messagingSenderId: "750323858789",
  appId: "1:750323858789:web:6aa5970a4ef008917c758c",
  measurementId: "G-2G05QNZ0C4"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

const auth = initializeAuth(app, {
  //Comando para realizar a persistencia do login no caso do uso do dispositivo moveis
  //persistence: browserLocalPersistence(AsyncStorage)
  
  //Comando para realizar a persistencia do login no caso do uso do Web
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
})



export { db, auth };