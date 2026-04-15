import { clsx, type ClassValue } from "clsx"
import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp as rtdbServerTimestamp,
  set,
} from "firebase/database";
import { twMerge } from "tailwind-merge"
import { database, db } from "./firebase";
import { doc, serverTimestamp as firestoreServerTimestamp, setDoc } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const onlyNumbers = (value: string) => {
  return value.replace(/[^\d٠-٩]/g, '');
};

export const setupOnlineStatus = (userId: string) => {
  if (!userId || !db || !database) return;

  const userStatusRef = ref(database, `/status/${userId}`);
  const userDocRef = doc(db, "pays", userId);
  const updateFirestorePresence = (online: boolean) => {
    return setDoc(
      userDocRef,
      {
        online,
        lastSeen: firestoreServerTimestamp(),
      },
      { merge: true },
    );
  };

  onDisconnect(userStatusRef)
    .set({
      state: "offline",
      lastChanged: rtdbServerTimestamp(),
    })
    .then(() => {
      set(userStatusRef, {
        state: "online",
        lastChanged: rtdbServerTimestamp(),
      });

      updateFirestorePresence(true).catch((error) =>
        console.error("Error updating Firestore online state:", error)
      );
    })
    .catch((error) => console.error("Error setting onDisconnect:", error));

  onValue(userStatusRef, (snapshot) => {
    const status = snapshot.val();
    if (status?.state === "online" || status?.state === "offline") {
      updateFirestorePresence(status.state === "online").catch((error) =>
        console.error("Error syncing Firestore online state:", error)
      );
    }
  });
};

export const setUserOffline = async (userId: string) => {
  if (!userId || !db || !database) return;

  try {
    await setDoc(doc(db, "pays", userId), {
      online: false,
      lastSeen: firestoreServerTimestamp(),
    }, { merge: true });

    await set(ref(database, `/status/${userId}`), {
      state: "offline",
      lastChanged: rtdbServerTimestamp(),
    });
  } catch (error) {
    console.error("Error setting user offline:", error);
  }
};
