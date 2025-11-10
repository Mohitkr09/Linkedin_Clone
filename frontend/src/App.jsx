import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import Feed from "./pages/Feed";
import Network from "./pages/Network";
import Jobs from "./pages/Jobs";
import Messaging from "./pages/Messaging";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

/* ========================================================
   ✅ Protect routes for authenticated users only
======================================================== */
function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/login" replace />;
}

/* ========================================================
   ✅ Redirect logged-in users away from /login and /register
======================================================== */
function PublicRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? <Navigate to="/feed" replace /> : children;
}

export default function App() {
  const location = useLocation();

  // ✅ Hide NavBar on auth pages
  const hideNav = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideNav && <NavBar />}

      <Routes>
        {/* ✅ Protected Pages */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Feed />
            </PrivateRoute>
          }
        />
        <Route
          path="/network"
          element={
            <PrivateRoute>
              <Network />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <PrivateRoute>
              <Jobs />
            </PrivateRoute>
          }
        />
        <Route
          path="/messaging"
          element={
            <PrivateRoute>
              <Messaging />
            </PrivateRoute>
          }
        />
        <Route
          path="/messaging/:receiverId"
          element={
            <PrivateRoute>
              <Messaging />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* ✅ Auth Pages */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* ✅ Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
