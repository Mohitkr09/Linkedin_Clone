import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaLinkedin,
  FaHome,
  FaUsers,
  FaBriefcase,
  FaCommentDots,
  FaBell,
  FaTh,
  FaSearch,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import API from "../api";

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const socket = useRef(null);

  // ✅ Sync avatar in real-time when Profile updates localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user"));
      if (updatedUser) setUser(updatedUser);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Fetch unread notifications count
  const fetchNotificationCount = async () => {
    try {
      const res = await API.get("/connections/notifications");
      const unread = res.data.filter((n) => !n.read).length;
      setNotifCount(unread);
    } catch (err) {
      console.error("❌ Fetch notification count failed:", err);
    }
  };

  // ✅ Mark notifications as read when opening the notification page
  useEffect(() => {
    if (currentPath === "/notifications") {
      API.put("/connections/notifications/read")
        .then(() => setNotifCount(0))
        .catch((err) => console.error("❌ Mark as read failed:", err));
    }
  }, [currentPath]);

  // ✅ Setup Socket.IO for real-time notifications
  useEffect(() => {
    if (!user?._id) return;

    socket.current = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.current.emit("registerUser", user._id);

    socket.current.on("newNotification", (data) => {
      console.log("🔔 New notification:", data);
      setNotifCount((prev) => prev + 1);

      toast.success(data.message, {
        icon: "🔔",
        duration: 4000,
        style: {
          background: "#fff",
          color: "#0A66C2",
          border: "1px solid #dbeafe",
        },
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, [user?._id]);

  // ✅ Initial + periodic refresh of unread notifications
  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
    toast.success("You have been logged out.");
  };

  // ✅ Navigation items
  const navItems = [
    { icon: <FaHome />, label: "Home", to: "/" },
    { icon: <FaUsers />, label: "My Network", to: "/network" },
    { icon: <FaBriefcase />, label: "Jobs", to: "/jobs" },
    { icon: <FaCommentDots />, label: "Messaging", to: "/messaging" },
    {
      icon: <FaBell />,
      label: "Notifications",
      to: "/notifications",
      badge: notifCount > 0 ? notifCount : null,
    },
  ];

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center text-blue-700 text-3xl">
              <FaLinkedin className="bg-blue-700 text-white rounded-sm p-1 w-8 h-8" />
            </Link>

            {/* Search Bar */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-md px-3 py-1">
              <FaSearch className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent outline-none text-sm w-48"
              />
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 text-gray-600">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <NavItem
                  icon={item.icon}
                  label={item.label}
                  active={currentPath === item.to}
                  badge={item.badge}
                />
              </Link>
            ))}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex flex-col items-center text-xs hover:text-black focus:outline-none"
              >
                <div className="relative">
                  <img
                    src={
                      user?.avatar ||
                      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    }
                    alt="Me"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </div>
                <span>Me ▾</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg w-48 p-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="font-semibold text-sm">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.headline}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block text-sm px-3 py-2 hover:bg-gray-100 rounded"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-sm px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="hidden lg:flex items-center space-x-6 text-gray-600 border-l pl-6">
            <NavItem icon={<FaTh />} label="For Business" />
            <button className="text-yellow-600 text-sm font-medium hover:underline">
              Try Premium for ₹0
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 text-xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-sm">
            <div className="flex flex-wrap justify-around py-3 text-gray-600">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                >
                  <NavItem icon={item.icon} label={item.label} badge={item.badge} />
                </Link>
              ))}
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-1 text-gray-600 text-sm mt-2"
              >
                <img
                  src={
                    user?.avatar ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  }
                  alt="Avatar"
                  className="w-5 h-5 rounded-full"
                />
                <span>Me</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-500 text-sm mt-2 hover:underline"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

function NavItem({ icon, label, active, badge }) {
  return (
    <div
      className={`flex flex-col items-center text-xs cursor-pointer relative hover:text-black ${
        active ? "text-black" : "text-gray-600"
      }`}
    >
      <div className="relative">
        <div className="text-lg">{icon}</div>
        {badge && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <span>{label}</span>
      {active && (
        <span className="absolute bottom-[-6px] w-8 border-b-2 border-black"></span>
      )}
    </div>
  );
}
