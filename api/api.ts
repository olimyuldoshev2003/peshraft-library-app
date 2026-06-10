import { createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "../firebase/firebase.config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  addDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

// Define the type for a review
interface Review {
  id: string;
  bookId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: any;
}

// Get book reviews async thunk with serialized timestamp
export const getBookReviews = createAsyncThunk(
  "reviews/getBookReviews",
  async (bookId: string, { rejectWithValue }) => {
    try {
      const q = query(collection(db, "reviews"), where("bookId", "==", bookId));
      const snap = await getDocs(q);
      const reviews = snap.docs.map((doc: any) => {
        const data = doc.data();

        // Serialize the timestamp to a string
        let review_date = data.review_date;
        if (review_date && typeof review_date.toDate === "function") {
          review_date = review_date.toDate().toISOString();
        } else if (review_date && review_date.seconds) {
          review_date = new Date(review_date.seconds * 1000).toISOString();
        }

        return {
          id: doc.id,
          ...data,
          review_date, // Now this is a serializable string
        };
      });
        
      return reviews as Review[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch book reviews");
    }
  },
);

export const addBookReview = createAsyncThunk(
  "reviews/addBookReview",
  async (
    reviewData: {
      bookId: string;
      uid: string;
      userName: string;
      member_image_url?: string;
      rating: number;
      review: string;
      review_category: string;
    },
    { dispatch },
  ) => {
    // 1. Save the review
    await addDoc(collection(db, "reviews"), {
      ...reviewData,
      is_review_liked: false,
      review_date: Timestamp.now(),
    });

    // 2. Fetch ALL reviews for this book and recalculate average rating
    const reviewsSnap = await getDocs(
      query(
        collection(db, "reviews"),
        where("bookId", "==", reviewData.bookId),
      ),
    );
    const allRatings = reviewsSnap.docs.map((d: any) => d.data().rating || 0);
    const avgRating = allRatings.length
      ? Math.round(
          (allRatings.reduce((a: number, b: number) => a + b, 0) /
            allRatings.length) *
            10,
        ) / 10
      : 0;

    // 3. Write updated average rating back to the book document
    await updateDoc(doc(db, "books", reviewData.bookId), {
      rating: avgRating,
    });

    // 4. Refresh the book reviews
    await dispatch(getBookReviews(reviewData.bookId));
  },
);

// Helper: compute live rating + readers for one bookId from reviews/borrows
export const computeBookStats = createAsyncThunk(
  "books/computeBookStats",
  async (bookId: string, { rejectWithValue }) => {
    try {
      const [reviewsSnap, borrowsSnap] = await Promise.all([
        getDocs(
          query(collection(db, "reviews"), where("bookId", "==", bookId)),
        ),
        getDocs(
          query(collection(db, "borrows"), where("bookId", "==", bookId)),
        ),
      ]);

      const ratings = reviewsSnap.docs.map((d: any) => d.data().rating || 0);
      const avgRating = ratings.length
        ? Math.round(
            (ratings.reduce((a: number, b: number) => a + b, 0) /
              ratings.length) *
              10,
          ) / 10
        : 0;

      return {
        rating: avgRating,
        readers: borrowsSnap.size,
        bookId,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to compute book stats");
    }
  },
);

export const getAllBooks = createAsyncThunk(
  "books/getAllBooks",
  async (categoryFilter?: string, { rejectWithValue }) => {
    try {
      const snap = await getDocs(collection(db, "books"));
      let books = snap.docs.map((doc: any) => {
        const data = doc.data();
        
        // Serialize any timestamp fields in the book data
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === "function") {
          createdAt = createdAt.toDate().toISOString();
        } else if (createdAt && createdAt.seconds) {
          createdAt = new Date(createdAt.seconds * 1000).toISOString();
        }
        
        return { 
          id: doc.id, 
          ...data,
          createdAt
        };
      });
      
      // Apply category filter if provided
      if (categoryFilter && categoryFilter !== "All") {
        books = books.filter((b: any) => b.category === categoryFilter);
      }
      
      // Enrich each book with live rating and readers count
      const enriched = await Promise.all(
        books.map(async (b: any) => {
          const stats:any = await computeBookStats(b.id);
          return { ...b, rating: stats.rating, readers: stats.readers };
        })
      );
      
      return enriched;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch all books");
    }
  }
);

// Get book by id with stats
export const getBookById = createAsyncThunk(
  "books/getBookById",
  async (bookId: string, { rejectWithValue, dispatch }) => {
    try {
      const docSnap = await getDoc(doc(db, "books", bookId));
      if (!docSnap.exists()) {
        return null;
      }

      // Get stats using the computeBookStats thunk
      const stats = await dispatch(computeBookStats(bookId)).unwrap();
      console.log(stats);

      const bookData = docSnap.data();

      // Serialize any timestamp fields in the book data
      const serializedBookData: any = {};
      for (const [key, value] of Object.entries(bookData)) {
        if (
          value &&
          typeof value === "object" &&
          "toDate" in value &&
          typeof value.toDate === "function"
        ) {
          // This is a Firestore Timestamp
          serializedBookData[key] = value.toDate().toISOString();
        } else if (
          value &&
          typeof value === "object" &&
          "seconds" in value &&
          "nanoseconds" in value
        ) {
          // This is also a Firestore Timestamp
          serializedBookData[key] = new Date(
            value.seconds * 1000,
          ).toISOString();
        } else {
          serializedBookData[key] = value;
        }
      }

      return {
        id: docSnap.id,
        ...serializedBookData,
        rating: stats.rating,
        readers: stats.readers,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch book");
    }
  },
);

export const toggleFavoriteBook = createAsyncThunk(
  "favorites/toggleFavoriteBook",
  async (
    { uid, bookId }: { uid: string; bookId: string },
    { rejectWithValue },
  ) => {
    try {
      // Check if already favorited
      const q = query(
        collection(db, "favoriteBooks"),
        where("uid", "==", uid),
        where("bookId", "==", bookId),
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        // Remove from favorites
        await deleteDoc(doc(db, "favoriteBooks", snap.docs[0].id));
        return { isFavorite: false, bookId }; // not favorite anymore
      } else {
        // Add to favorites
        await addDoc(collection(db, "favoriteBooks"), {
          uid,
          bookId,
          createdAt: Timestamp.now(),
        });
        return { isFavorite: true, bookId }; // now favorite
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to toggle favorite");
    }
  },
);

export const isBookFavorite = createAsyncThunk(
  "favorites/isBookFavorite",
  async (
    { uid, bookId }: { uid: string; bookId: string },
    { rejectWithValue },
  ) => {
    try {
      const q = query(
        collection(db, "favoriteBooks"),
        where("uid", "==", uid),
        where("bookId", "==", bookId),
      );
      const snap = await getDocs(q);
      return { isFavorite: !snap.empty, bookId };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to check favorite status",
      );
    }
  },
);


export const getFavoriteBooks = createAsyncThunk(
  "favorites/getFavoriteBooks",
  async (uid: string, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, "favoriteBooks"),
        where("uid", "==", uid)
      );
      const snap = await getDocs(q);
      const favorites = snap.docs.map((doc: any) => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to serializable format
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === "function") {
          createdAt = createdAt.toDate().toISOString();
        } else if (createdAt && createdAt.seconds) {
          createdAt = new Date(createdAt.seconds * 1000).toISOString();
        }
        
        return { 
          id: doc.id, 
          ...data,
          createdAt // Now this is a serializable string
        };
      });
      return favorites;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch favorite books");
    }
  }
);