import React, { useEffect, useState } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { useParams, useNavigate } from "react-router-dom";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const uid = !id || id === "me" ? loggedUser?._id : id;

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!loggedUser) {
      alert("Please log in to view your profile.");
      navigate("/login");
    }
  }, []);

  // ✅ Fetch user profile
  const fetchUser = async () => {
    try {
      if (!loggedUser?.token) return;

      const target =
        !id || id === "me"
          ? `/api/users/${loggedUser._id}`
          : `/api/users/${uid}`;

      const res = await axios.get(`http://localhost:5000${target}`, {
        headers: { Authorization: `Bearer ${loggedUser?.token}` },
      });

      setUser(res.data);
      setBio(res.data.bio || "");
      setHeadline(res.data.headline || "");
      setAbout(res.data.about || "");
      setAvatarPreview(res.data.avatar || null);
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      alert("Failed to load profile.");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  // ✅ Compress + Upload Avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    try {
      // ✅ Instant Preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setUploading(true);

      // ✅ Compress Image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // ✅ Upload to backend
      const formData = new FormData();
      formData.append("avatar", compressedFile);

      const res = await axios.put(
        "http://localhost:5000/api/users/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${loggedUser?.token}`,
          },
        }
      );

      const updatedAvatar = res.data.avatar;

      // ✅ Update local state + storage + navbar
      setUser((prev) => ({ ...prev, avatar: updatedAvatar }));
      localStorage.setItem(
        "user",
        JSON.stringify({ ...loggedUser, avatar: updatedAvatar })
      );
      window.dispatchEvent(new Event("storage")); // 🔄 triggers navbar re-render

      alert("✅ Profile photo updated successfully!");
    } catch (err) {
      console.error("❌ Avatar upload failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to upload profile photo.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Save Bio / Headline / About
  const handleSaveProfile = async (field) => {
    try {
      const payload =
        field === "bio"
          ? { bio }
          : field === "headline"
          ? { headline }
          : field === "about"
          ? { about }
          : {};

      const res = await axios.put(
        "http://localhost:5000/api/users/update",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loggedUser?.token}`,
          },
        }
      );

      setUser((prev) => ({ ...prev, ...res.data }));
      if (field === "bio") setIsEditingBio(false);
      if (field === "headline") setIsEditingHeadline(false);
      if (field === "about") setIsEditingAbout(false);
    } catch (err) {
      console.error("❌ Failed to update profile:", err);
      alert("Error updating profile. Try again.");
    }
  };

  if (!user)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );

  const fallbackAvatar =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-8 px-4">
      {/* Profile Card */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-r from-[#0A66C2] to-[#004182] relative">
          <div className="absolute -bottom-14 left-8">
            <label className="relative cursor-pointer group">
              <img
                src={avatarPreview || user.avatar || fallbackAvatar}
                alt={user.name || "User Avatar"}
                className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-md group-hover:opacity-90 transition"
              />
              {loggedUser?._id === user._id && (
                <>
                  {uploading ? (
                    <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 rounded-full">
                      <span className="text-white text-xs font-medium">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleAvatarChange}
                    />
                  )}
                </>
              )}
            </label>
          </div>
        </div>

        {/* User Info */}
        <div className="pt-20 pb-8 px-8">
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>

          {/* Headline */}
          <EditableField
            label="headline"
            value={headline}
            originalValue={user.headline}
            isEditing={isEditingHeadline}
            setIsEditing={setIsEditingHeadline}
            onSave={() => handleSaveProfile("headline")}
            onChange={setHeadline}
            placeholder="Add your professional headline..."
          />

          {/* Bio */}
          <EditableField
            label="bio"
            value={bio}
            originalValue={user.bio}
            isEditing={isEditingBio}
            setIsEditing={setIsEditingBio}
            onSave={() => handleSaveProfile("bio")}
            onChange={setBio}
            placeholder="Write something about yourself..."
            multiline
          />

          {/* Followers */}
          <div className="flex gap-8 mt-6 text-sm text-gray-600 border-t border-gray-200 pt-4">
            <div>
              <span className="font-semibold text-gray-900">
                {user.followers?.length || 0}
              </span>{" "}
              followers
            </div>
            <div>
              <span className="font-semibold text-gray-900">
                {user.following?.length || 0}
              </span>{" "}
              following
            </div>
          </div>
        </div>
      </div>

      {/* ✅ About Section */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 mt-6 p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">About</h3>
          {loggedUser?._id === user._id && !isEditingAbout && (
            <button
              onClick={() => setIsEditingAbout(true)}
              className="text-[#0A66C2] text-sm hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingAbout ? (
          <div className="mt-3">
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-[#0A66C2]"
              placeholder="Add a detailed description about yourself..."
            />
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => handleSaveProfile("about")}
                className="px-4 py-1.5 bg-[#0A66C2] text-white text-sm rounded-full hover:bg-[#004182] transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setAbout(user.about || "");
                  setIsEditingAbout(false);
                }}
                className="px-4 py-1.5 border border-gray-400 text-sm rounded-full hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 text-sm leading-relaxed mt-3 whitespace-pre-wrap">
            {user.about ||
              "This user hasn’t added an About section yet. Once they do, it’ll appear here."}
          </p>
        )}
      </div>
    </div>
  );
}

// ✅ Small reusable editable field component
function EditableField({
  label,
  value,
  originalValue,
  isEditing,
  setIsEditing,
  onSave,
  onChange,
  placeholder,
  multiline = false,
}) {
  return (
    <div className="mt-4">
      {isEditing ? (
        <div>
          {multiline ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-[#0A66C2]"
              placeholder={placeholder}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-[#0A66C2]"
              placeholder={placeholder}
            />
          )}
          <div className="mt-2 flex gap-3">
            <button
              onClick={onSave}
              className="px-4 py-1.5 bg-[#0A66C2] text-white text-sm rounded-full hover:bg-[#004182] transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                onChange(originalValue || "");
                setIsEditing(false);
              }}
              className="px-4 py-1.5 border border-gray-400 text-sm rounded-full hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between mt-1">
          <p className="text-gray-700 text-sm whitespace-pre-wrap">
            {originalValue || `No ${label} provided`}
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="text-[#0A66C2] text-sm hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
