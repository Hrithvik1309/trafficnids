// src/services/firebase.js
// ─────────────────────────────────────────────────────────────
//  Firebase — Firestore (database) + optional Auth
//  Collections used:
//    threat_logs  — every IP scan result
//    alerts       — auto-created for high-risk scans (score > 80)
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  where,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// ── Collection refs ──────────────────────────────────────────
export const threatLogsRef  = collection(db, 'threat_logs')
export const alertsRef      = collection(db, 'alerts')

// ── Write a scan result ──────────────────────────────────────
export async function saveThreatLog(data) {
  return addDoc(threatLogsRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
}

// ── Write an alert (called when riskScore > 80) ──────────────
export async function saveAlert(data) {
  return addDoc(alertsRef, {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  })
}

// ── Real-time listener: last 100 threat logs ─────────────────
export function subscribeThreatLogs(callback) {
  const q = query(threatLogsRef, orderBy('createdAt', 'desc'), limit(100))
  return onSnapshot(q, snapshot => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(docs)
  })
}

// ── Real-time listener: unread alerts ────────────────────────
export function subscribeAlerts(callback) {
  const q = query(alertsRef, orderBy('createdAt', 'desc'), limit(50))
  return onSnapshot(q, snapshot => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(docs)
  })
}

// ── Real-time listener: traffic logs ─────────────────────────
export function subscribeTrafficLogs(callback) {
  const q = query(collection(db, 'traffic_logs'), orderBy('timestamp', 'desc'), limit(100))
  return onSnapshot(q, snapshot => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(docs)
  })
}

// ── One-time fetch for stats ──────────────────────────────────
export async function getThreatStats() {
  const snap = await getDocs(threatLogsRef)
  const docs = snap.docs.map(d => d.data())
  return {
    total:    docs.length,
    high:     docs.filter(d => d.riskScore >= 80).length,
    medium:   docs.filter(d => d.riskScore >= 40 && d.riskScore < 80).length,
    clean:    docs.filter(d => d.riskScore < 40).length,
  }
}
