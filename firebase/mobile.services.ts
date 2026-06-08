// ============================================================
// FIREBASE SERVICES - Mobile App (User Side)
// ============================================================
// Temporary module declarations for Firebase packages without bundled TypeScript typings
// in this project setup.
declare module "firebase/firestore";
declare module "firebase/auth";

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { db, auth } from "./firebase.config";

// ============================================================
// CLOUDINARY IMAGE UPLOAD
// ============================================================
const CLOUDINARY_CLOUD_NAME = "dpcb2bzyg";
const CLOUDINARY_UPLOAD_PRESET = "peshraft";

export const uploadImageToCloudinary = async (uri: string): Promise<string> => {
  const formData = new FormData();
  // React Native needs this format for file upload
  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: "profile.jpg",
  } as any);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
};

// ============================================================
// AUTH SERVICES
// ============================================================

export const mobileSignIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const mobileSignUp = async (
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string,
  dateOfBirth: string
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: fullName });

  // Save to 'users' collection (member side)
  await addDoc(collection(db, "users"), {
    uid: user.uid,
    fullName,
    email,
    phoneNumber,
    dateOfBirth,
    member_image_url: "",
    createdAt: Timestamp.now(),
  });

  return user;
};

export const mobileSignOut = async () => {
  await signOut(auth);
};

export const mobileForgotPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const mobileChangePassword = async (
  oldPassword: string,
  newPassword: string
) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No user logged in");
  const credential = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

// ============================================================
// USER PROFILE
// ============================================================

export const getUserProfile = async (uid: string) => {
  // First check by uid field
  const q = query(collection(db, "users"), where("uid", "==", uid));
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  return null;
};

export const updateUserProfile = async (
  userId: string,
  data: any,
  imageUri?: string
) => {
  let updateData = { ...data };
  if (imageUri && imageUri.startsWith("file")) {
    updateData.member_image_url = await uploadImageToCloudinary(imageUri);
  }
  await updateDoc(doc(db, "users", userId), updateData);
  if (data.fullName && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: data.fullName });
  }
};

// ============================================================
// BOOKS
// ============================================================

// Helper: compute live rating + readers for one bookId from reviews/borrows
const computeBookStats = async (bookId: string) => {
  const [reviewsSnap, borrowsSnap] = await Promise.all([
    getDocs(query(collection(db, "reviews"), where("bookId", "==", bookId))),
    getDocs(query(collection(db, "borrows"), where("bookId", "==", bookId))),
  ]);
  const ratings = reviewsSnap.docs.map((d:any) => d.data().rating || 0);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
    : 0;
  return { rating: avgRating, readers: borrowsSnap.size };
};

export const getAllBooks = async (categoryFilter?: string) => {
  const snap = await getDocs(collection(db, "books"));
  let books = snap.docs.map((d:any) => ({ id: d.id, ...d.data() }));
  if (categoryFilter && categoryFilter !== "All") {
    books = books.filter((b: any) => b.category === categoryFilter);
  }
  // Enrich each book with live rating and readers count
  const enriched = await Promise.all(
    books.map(async (b: any) => {
      const stats = await computeBookStats(b.id);
      return { ...b, rating: stats.rating, readers: stats.readers };
    })
  );
  return enriched;
};

export const getBookById = async (bookId: string) => {
  const docSnap = await getDoc(doc(db, "books", bookId));
  if (!docSnap.exists()) return null;
  const stats = await computeBookStats(bookId);
  return { id: docSnap.id, ...docSnap.data(), rating: stats.rating, readers: stats.readers };
};

export const getCategories = async () => {
  const snap = await getDocs(collection(db, "categories"));
  return snap.docs.map((d:any) => ({ id: d.id, ...d.data() }));
};

// ============================================================
// BOOKSHELF (active borrows for current user)
// ============================================================

export const getUserBookshelf = async (uid: string) => {
  // Find user document id first
  const profile = await getUserProfile(uid);
  if (!profile) return [];
  const q = query(
    collection(db, "borrows"),
    where("userId", "==", profile.id),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d:any) => ({ id: d.id, ...d.data() }));
};

export const getUserHistory = async (uid: string) => {
  const profile = await getUserProfile(uid);
  if (!profile) return [];
  const q = query(
    collection(db, "borrows"),
    where("userId", "==", profile.id),
    where("status", "==", "returned")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d:any) => ({ id: d.id, ...d.data() }));
};

// ============================================================
// FAVORITE BOOKS
// ============================================================

export const getFavoriteBooks = async (uid: string) => {
  const q = query(
    collection(db, "favoriteBooks"),
    where("uid", "==", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d:any) => ({ id: d.id, ...d.data() }));
};

export const toggleFavoriteBook = async (uid: string, bookId: string) => {
  // Check if already favorited
  const q = query(
    collection(db, "favoriteBooks"),
    where("uid", "==", uid),
    where("bookId", "==", bookId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    // Remove from favorites
    await deleteDoc(doc(db, "favoriteBooks", snap.docs[0].id));
    return false; // not favorite anymore
  } else {
    // Add to favorites
    await addDoc(collection(db, "favoriteBooks"), {
      uid,
      bookId,
      createdAt: Timestamp.now(),
    });
    return true; // now favorite
  }
};

export const isBookFavorite = async (uid: string, bookId: string) => {
  const q = query(
    collection(db, "favoriteBooks"),
    where("uid", "==", uid),
    where("bookId", "==", bookId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

// ============================================================
// BOOK REQUESTS (Receive Book)
// ============================================================

export const sendReceiveBookRequest = async (requestData: {
  userId: string;
  bookId: string;
  bookTitle: string;
  author: string;
  userName: string;
  phoneNumber: string;
  email: string;
  member_image_url?: string;
  borrowUntil: string;
}) => {
  // Check if user already has pending request for this book
  const q = query(
    collection(db, "bookRequests"),
    where("userId", "==", requestData.userId),
    where("bookId", "==", requestData.bookId),
    where("type", "==", "receive"),
    where("status", "==", "pending")
  );
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error("You already have a pending request for this book");

  await addDoc(collection(db, "bookRequests"), {
    ...requestData,
    type: "receive",
    status: "pending",
    requestDate: Timestamp.now(),
  });
};

// ============================================================
// RETURN BOOK REQUEST
// ============================================================

export const sendReturnBookRequest = async (returnData: {
  borrowId: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  author: string;
  borrowerName: string;
  phoneNumber: string;
  email: string;
  member_image_url?: string;
  dateBorrowed: any;
  dueDate: any;
}) => {
  await addDoc(collection(db, "bookRequests"), {
    ...returnData,
    type: "return",
    status: "pending",
    requestDate: Timestamp.now(),
  });
};

// ============================================================
// REVIEWS
// ============================================================

export const getBookReviews = async (bookId: string) => {
  const q = query(
    collection(db, "reviews"),
    where("bookId", "==", bookId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d:any) => ({ id: d.id, ...d.data() }));
};

export const addBookReview = async (reviewData: {
  bookId: string;
  uid: string;
  userName: string;
  member_image_url?: string;
  rating: number;
  review: string;
  review_category: string;
}) => {
  // 1. Save the review
  await addDoc(collection(db, "reviews"), {
    ...reviewData,
    is_review_liked: false,
    review_date: Timestamp.now(),
  });

  // 2. Fetch ALL reviews for this book and recalculate average rating
  const reviewsSnap = await getDocs(
    query(collection(db, "reviews"), where("bookId", "==", reviewData.bookId))
  );
  const allRatings = reviewsSnap.docs.map((d:any) => d.data().rating || 0);
  const avgRating = allRatings.length
    ? Math.round((allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length) * 10) / 10
    : 0;

  // 3. Write updated average rating back to the book document
  await updateDoc(doc(db, "books", reviewData.bookId), {
    rating: avgRating,
  });
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export const getUserNotifications = async (uid: string) => {
  const profile = await getUserProfile(uid);
  const userId = profile?.id || uid;

  // Get notifications for this user OR all_users (news)
  const [userSnap, allSnap] = await Promise.all([
    getDocs(query(collection(db, "notifications"), where("member_id", "==", userId))),
    getDocs(query(collection(db, "notifications"), where("member_id", "==", "all_users"))),
  ]);

  const all = [
    ...userSnap.docs.map((d:any) => ({ id: d.id, ...d.data() })),
    ...allSnap.docs.map((d:any) => ({ id: d.id, ...d.data() })),
  ];

  // Sort by created_at descending
  return all.sort((a: any, b: any) => {
    const aTime = a.created_at?.seconds || 0;
    const bTime = b.created_at?.seconds || 0;
    return bTime - aTime;
  });
};

export const getDuetimeNotifications = async (uid: string) => {
  const notifications = await getUserNotifications(uid);
  return notifications.filter((n: any) => n.notification_type === "duetime");
};

export const getNewsNotifications = async () => {
  const snap = await getDocs(
    query(collection(db, "notifications"), where("member_id", "==", "all_users"))
  );
  return snap.docs.map((d:any) => ({ id: d.id, ...d.data() }));
};

// ============================================================
// FEEDBACK
// ============================================================

export const submitFeedback = async (feedbackData: {
  uid?: string;
  phone: string;
  email: string;
  feedback: string;
}) => {
  await addDoc(collection(db, "feedback"), {
    ...feedbackData,
    createdAt: Timestamp.now(),
  });
};