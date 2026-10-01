import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, WeekData } from "./types";

const COLLECTION_NAME = "weeks";

export function getWeekId(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export function getWeekDates(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function formatDateTR(date: Date): string {
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWeekRange(start: Date, end: Date): string {
  return `${formatDateTR(start)} - ${formatDateTR(end)}`;
}

export async function saveWeekData(weekData: WeekData): Promise<void> {
  // Always save to localStorage as reliable backup
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`week_${weekData.id}`, JSON.stringify(weekData));
    } catch (e) {
      console.warn("localStorage save error:", e);
    }
  }

  // If Firebase is configured with real credentials, save to Firestore
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.includes("your_project")) {
    try {
      const docRef = doc(db, COLLECTION_NAME, weekData.id);
      await setDoc(docRef, weekData);
    } catch (e) {
      console.warn("Firebase save error:", e);
    }
  }
}

export function getLocalWeekData(weekId: string): WeekData | null {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`week_${weekId}`);
      if (saved) return JSON.parse(saved) as WeekData;
    } catch (e) {
      console.warn("localStorage read error:", e);
    }
  }
  return null;
}

export async function getWeekData(weekId: string): Promise<WeekData | null> {
  // Check local first
  const local = getLocalWeekData(weekId);
  if (local) return local;

  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.includes("your_project")) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("id", "==", weekId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return snapshot.docs[0].data() as WeekData;
    } catch (e) {
      console.warn("Firebase get error:", e);
    }
  }
  return null;
}

export function subscribeToWeekData(
  weekId: string,
  callback: (data: WeekData | null) => void
): Unsubscribe {
  // 1. Immediately provide locally stored data or null
  const localData = getLocalWeekData(weekId);
  callback(localData);

  // 2. If Firebase credentials are real, sync with Firestore in background
  const hasRealFirebase =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.includes("your_project") &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("your_api");

  if (hasRealFirebase) {
    try {
      const docRef = doc(db, COLLECTION_NAME, weekId);
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as WeekData;
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(`week_${weekId}`, JSON.stringify(data));
              } catch {}
            }
            callback(data);
          }
        },
        (error) => {
          console.warn("Firestore subscription error:", error);
        }
      );
    } catch (e) {
      console.warn("Firebase onSnapshot init error:", e);
    }
  }

  // Fallback no-op unsubscribe
  return () => {};
}

export async function deleteWeekData(weekId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, weekId);
  await deleteDoc(docRef);
}

export function createNewStudent(name: string, gradeLevel: import("./types").GradeLevel = "5"): Student {
  return {
    id: crypto.randomUUID(),
    name,
    gradeLevel,
    grades: {},
    homework: {},
  };
}

const MASTER_STUDENTS_KEY = "ogretmen_ajandasi_master_students";
const MASTER_DOC_ID = "master_list";
const MASTER_COLLECTION = "app_config";

// Get master students list (permanent list of all registered students)
export function getMasterStudents(): Student[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(MASTER_STUDENTS_KEY);
      if (saved) return JSON.parse(saved) as Student[];
    } catch (e) {
      console.warn("Error reading master students:", e);
    }
  }
  return [];
}

// Save master students list both to localStorage and cloud Firestore
export async function saveMasterStudents(students: Student[]): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MASTER_STUDENTS_KEY, JSON.stringify(students));
    } catch (e) {
      console.warn("Error saving master students to localStorage:", e);
    }
  }

  // Also permanently sync to Firestore so ANY device / live URL gets all students!
  try {
    const docRef = doc(db, MASTER_COLLECTION, MASTER_DOC_ID);
    await setDoc(docRef, { students, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn("Error syncing master students to Firestore:", e);
  }
}

// Subscribe to global master student list from Firestore
export function subscribeToMasterStudents(
  callback: (students: Student[]) => void
): Unsubscribe {
  // First callback with local cache
  const local = getMasterStudents();
  callback(local);

  try {
    const docRef = doc(db, MASTER_COLLECTION, MASTER_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const cloudData = snapshot.data();
          const cloudStudents = (cloudData.students || []) as Student[];
          if (cloudStudents.length > 0) {
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(MASTER_STUDENTS_KEY, JSON.stringify(cloudStudents));
              } catch {}
            }
            callback(cloudStudents);
          } else if (local.length > 0) {
            // If cloud is empty but local has students, upload local to cloud!
            saveMasterStudents(local);
          }
        } else if (local.length > 0) {
          // Document does not exist yet on cloud, seed it from local
          saveMasterStudents(local);
        }
      },
      (error) => {
        console.warn("Firestore master students subscription error:", error);
      }
    );
  } catch (e) {
    console.warn("Firebase onSnapshot master students error:", e);
  }

  return () => {};
}

export function createNewWeekData(date: Date): WeekData {
  const { start, end } = getWeekDates(date);
  // Prepopulate week with existing registered students, keeping grades clean for the new week
  const masterStudents = getMasterStudents();
  const weekStudents = masterStudents.map((s) => ({
    id: s.id,
    name: s.name,
    gradeLevel: s.gradeLevel || "5",
    grades: {},
    homework: {},
  }));

  return {
    id: getWeekId(date),
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    students: weekStudents,
    classHomework: {},
    createdAt: new Date().toISOString(),
  };
}
