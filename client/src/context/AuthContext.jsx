import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Google Login
  const googleLogin = () => signInWithPopup(auth, googleProvider);

  // 2. Email Register
  const registerWithEmail = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });
    return res;
  };

  // 3. Email Login
  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 4. Reset Password
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, googleLogin, registerWithEmail, loginWithEmail, resetPassword, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);