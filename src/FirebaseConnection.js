
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
//import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
//import AsyncStorage from "@react-native-async-storage/async-storage";

import { initializeAuth, browserLocalPersistence,  indexedDBLocalPersistence } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyCgYvTWAKRvMAOBwshxsVjduNd2KD8hD4A",
  authDomain: "bancodev-5ae1b.firebaseapp.com",
  projectId: "bancodev-5ae1b",
  storageBucket: "bancodev-5ae1b.firebasestorage.app",
  messagingSenderId: "366456197469",
  appId: "1:366456197469:web:adebb95170a21462e818b4",
  measurementId: "G-BBCZRSM3XG"
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



