import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");
const seller = localStorage.getItem("seller");

const initialState = {
  token: token || null,
  seller: seller ? JSON.parse(seller) : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.seller = action.payload.seller;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("seller", JSON.stringify(action.payload.seller));
    },
    logout(state) {
      state.token = null;
      state.seller = null;
      localStorage.removeItem("token");
      localStorage.removeItem("seller");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
