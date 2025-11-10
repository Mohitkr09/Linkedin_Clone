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

// ✅ Route wrapper for protected routes
function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();

  // Hide navbar on login/register pages
  const hideNav = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideNav && <NavBar />}

      <Routes>
        {/* ✅ Feed (Home) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Feed />
            </PrivateRoute>
          }
        />

        {/* ✅ Network Page */}
        <Route
          path="/network"
          element={
            <PrivateRoute>
              <Network />
            </PrivateRoute>
          }
        />

        {/* ✅ Jobs Page */}
        <Route
          path="/jobs"
          element={
            <PrivateRoute>
              <Jobs />
            </PrivateRoute>
          }
        />

        {/* ✅ Messaging List */}
        <Route
          path="/messaging"
          element={
            <PrivateRoute>
              <Messaging />
            </PrivateRoute>
          }
        />

        {/* ✅ One-to-One Messaging (chat with specific user) */}
        <Route
          path="/messaging/:receiverId"
          element={
            <PrivateRoute>
              <Messaging />
            </PrivateRoute>
          }
        />

        {/* ✅ Notifications */}
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />

        {/* ✅ My Profile */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* ✅ View Another User’s Profile */}
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* ✅ Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
