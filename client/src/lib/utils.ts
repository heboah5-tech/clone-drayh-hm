import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "./db/supabase";
import { doc, setDoc, serverTimestamp } from "./db/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const onlyNumbers = (value: string) => {
  return value.replace(/[^\d٠-٩]/g, "");
};

const HEARTBEAT_MS = 25_000;
const presenceState = new Map<
  string,
  { interval: number; channel: any; offlineHandler: () => void }
>();

const writePresence = async (userId: string, online: boolean) => {
  try {
    await setDoc(
      doc(null, "pays", userId),
      { online, lastSeen: serverTimestamp() },
      { merge: true },
    );
  } catch (error) {
    console.error("Error updating presence:", error);
  }
};

// Maintains a real-time "online" flag on the visitor's pays row, equivalent to
// the previous Firebase Realtime DB onDisconnect mechanism. Uses Supabase
// Presence (so the dashboard can see live joins/leaves) plus a periodic
// heartbeat that updates `lastSeen`, plus a best-effort beforeunload write.
export const setupOnlineStatus = (userId: string) => {
  if (!userId || !supabase) return;
  if (presenceState.has(userId)) return;

  void writePresence(userId, true);

  const channel = supabase.channel(`presence:visitors`, {
    config: { presence: { key: userId } },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      // no-op; presence is observed by the dashboard
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId,
          onlineAt: new Date().toISOString(),
        });
      }
    });

  const interval = window.setInterval(() => {
    void writePresence(userId, true);
  }, HEARTBEAT_MS);

  const offlineHandler = () => {
    void writePresence(userId, false);
    try {
      void channel.untrack();
    } catch {}
  };

  window.addEventListener("beforeunload", offlineHandler);
  window.addEventListener("pagehide", offlineHandler);

  presenceState.set(userId, { interval, channel, offlineHandler });
};

export const setUserOffline = async (userId: string) => {
  if (!userId || !supabase) return;
  const state = presenceState.get(userId);
  if (state) {
    window.clearInterval(state.interval);
    window.removeEventListener("beforeunload", state.offlineHandler);
    window.removeEventListener("pagehide", state.offlineHandler);
    try {
      await state.channel.untrack();
      await supabase.removeChannel(state.channel);
    } catch {}
    presenceState.delete(userId);
  }
  await writePresence(userId, false);
};
