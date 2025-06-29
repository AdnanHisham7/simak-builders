import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "../types/user";

export type UserType =
  | "client"
  | "admin"
  | "siteManager"
  | "supervisor"
  | "architect"
  | null;

interface AuthState {
  user: IUser | null;
  userType: UserType;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  userType: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{
        user: IUser;
        userType: UserType;
      }>
    ) => {
      state.user = action.payload.user;
      state.userType = action.payload.userType;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.userType = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
