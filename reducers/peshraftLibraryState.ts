import { getBookById, getBookReviews, getFavoriteBooks, isBookFavorite } from "@/api/api";
import { RootState } from "@/store/store";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reviewsOfBook: [],
  loadingReviewsOfBook: false,

  bookById: [],
  loadingBookById: false,

  favoriteBooks: [],
  loadingFavoriteBooks: false,

  isFavBook: false,
};

const peshraftLibrarySlice = createSlice({
  name: "peshraftLibraryState",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(getBookReviews.pending, (state: any, action: any) => {
      state.loadingReviewsOfBook = true;
    });
    builder.addCase(getBookReviews.fulfilled, (state: any, action: any) => {
      state.reviewsOfBook = action.payload;
      state.loadingReviewsOfBook = false;
    });
    builder.addCase(getBookReviews.rejected, (state: any, action: any) => {
      state.loadingReviewsOfBook = false;
    });

    

    builder.addCase(getBookById.pending, (state: any, action: any) => {
      state.loadingBookById = true;
    });
    builder.addCase(getBookById.fulfilled, (state: any, action: any) => {
      state.bookById = action.payload;
      state.loadingBookById = false;
    });
    builder.addCase(getBookById.rejected, (state: any, action: any) => {
      state.loadingBookById = false;
    });


    
    builder.addCase(isBookFavorite.pending, (state: any, action: any) => {});
    builder.addCase(isBookFavorite.fulfilled, (state: any, action: any) => {
      state.isFavBook = action.payload;
    });
    builder.addCase(isBookFavorite.rejected, (state: any, action: any) => {});
   


    builder.addCase(getFavoriteBooks.pending, (state: any, action: any) => {
      state.loadingFavoriteBooks = true;
    });
    builder.addCase(getFavoriteBooks.fulfilled, (state: any, action: any) => {
      state.favoriteBooks = action.payload;
      state.loadingFavoriteBooks = false;
    });
    builder.addCase(getFavoriteBooks.rejected, (state: any, action: any) => {
      state.loadingFavoriteBooks = false;
    });
  },
});

// Other code such as selectors can use the imported `RootState` type
export const selectCount = (state: RootState) => state.peshraftLibraryState;
export const {} = peshraftLibrarySlice.actions;

export default peshraftLibrarySlice.reducer;
