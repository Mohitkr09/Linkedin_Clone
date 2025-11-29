import React, { useEffect, useState } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { useParams, useNavigate } from "react-router-dom";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const token = loggedUser?.token;

  // 🟢 Determine which profile to load
  const finalUserId =
    id && id !== "me"
      ? id
      : loggedUser && loggedUser._id
      ? loggedUser._id
      : null;

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");

  const [editBio, setEditBio] = useState(false);
  const [editHeadline, setEditHeadline] = useState(false);
  const [editAbout, setEditAbout] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* =======================================================
     🛑 Redirect if not logged in
  ======================================================= */
  useEffect(() => {
    if (!loggedUser) navigate("/login");
  }, []);

  /* =======================================================
     📌 Fetch User Profile
  ======================================================= */
  const fetchProfile = async () => {
    try {
      if (!token || !finalUserId) return; // 🛑 No request until ID exists

      const res = await axios.get(`${API_URL}/api/users/${finalUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      setBio(res.data.bio || "");
      setHeadline(res.data.headline || "");
      setAbout(res.data.about || "");
      setAvatarPreview(res.data.avatar || null);
    } catch (err) {
      console.error("❌ Profile fetch failed:", err);
      navigate("/");
    }
  };

  useEffect(() => {
    if (!finalUserId) return; // avoids undefined
    fetchProfile();
  }, [id, finalUserId]);

  /* =======================================================
     📸 Upload Avatar
  ======================================================= */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Select a valid image");

    try {
      setUploading(true);
      setAvatarPreview(URL.createObjectURL(file));

      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 600,
      });

      const fd = new FormData();
      fd.append("avatar", compressed);

      const res = await axios.put(`${API_URL}/api/users/avatar`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const newAvatar = res.data.avatar;

      setUser((u) => ({ ...u, avatar: newAvatar }));

      // update localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ ...loggedUser, avatar: newAvatar })
      );

      window.dispatchEvent(new Event("storage"));
    } finally {
      setUploading(false);
    }
  };

  /* =======================================================
     ✏ Update Bio / Headline / About
  ======================================================= */
  const saveField = async (field) => {
    const body =
      field === "bio"
        ? { bio }
        : field === "headline"
        ? { headline }
        : { about };

    try {
      const res = await axios.put(`${API_URL}/api/users/update`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser((prev) => ({ ...prev, ...res.data }));

      if (field === "bio") setEditBio(false);
      if (field === "headline") setEditHeadline(false);
      if (field === "about") setEditAbout(false);
    } catch (err) {
      console.error("❌ Update failed", err);
      alert("Update failed");
    }
  };

  /* =======================================================
     ⏳ Loading State
  ======================================================= */
  if (!user)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );

  const fallbackAvatar =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  /* =======================================================
     🎨 PAGE UI
  ======================================================= */
  return (
    <div className="bg-gray-100 min-h-screen flex justify-center py-8 px-4">
      <div className="max-w-3xl w-full">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-[#0A66C2] to-[#004182] relative">
            <div className="absolute -bottom-14 left-8">
              <label className="relative">
                <img
                  src={avatarPreview || user.avatar || fallbackAvatar}
                  className="w-28 h-28 rounded-full border-4 border-white shadow"
                />
                {(loggedUser?._id === user._id) && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                )}
              </label>
            </div>
          </div>

          <div className="pt-20 pb-8 px-8">
            <h2 className="text-2xl font-bold">{user.name}</h2>

            {/* HEADLINE */}
            <Field
              label="Headline"
              value={headline}
              original={user.headline}
              editing={editHeadline}
              setEditing={setEditHeadline}
              save={() => saveField("headline")}
              setValue={setHeadline}
            />

            {/* BIO */}
            <Field
              label="Bio"
              value={bio}
              original={user.bio}
              editing={editBio}
              setEditing={setEditBio}
              save={() => saveField("bio")}
              setValue={setBio}
              textarea
            />

            {/* STATS */}
            <Stats followers={user.followers} following={user.following} />
          </div>
        </div>

        {/* ABOUT SECTION */}
        <About
          about={about}
          original={user.about}
          setAbout={setAbout}
          editing={editAbout}
          setEditing={setEditAbout}
          save={() => saveField("about")}
          isOwner={loggedUser?._id === user._id}
        />
      </div>
    </div>
  );
}

/* =======================================================
   🔧 FIELD COMPONENT
======================================================= */
function Field({
  label,
  value,
  original,
  editing,
  setEditing,
  save,
  setValue,
  textarea,
}) {
  return (
    <div className="mt-4">
      {editing ? (
        <>
          {textarea ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border p-2 rounded"
            />
          ) : (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border p-2 rounded"
            />
          )}

          <div className="flex gap-3 mt-2">
            <button
              onClick={save}
              className="px-4 py-1 bg-[#0A66C2] text-white rounded-full"
            >
              Save
            </button>
            <button
              onClick={() => {
                setValue(original || "");
                setEditing(false);
              }}
              className="px-4 py-1 border rounded-full"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex justify-between">
          <p className="text-gray-700">{original || `No ${label} added`}</p>
          <button
            onClick={() => setEditing(true)}
            className="text-[#0A66C2] text-sm"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

/* =======================================================
   📊 FOLLOWERS / FOLLOWING
======================================================= */
function Stats({ followers = [], following = [] }) {
  return (
    <div className="flex gap-8 mt-6 border-t pt-4 text-sm">
      <p>
        <b>{followers.length}</b> followers
      </p>
      <p>
        <b>{following.length}</b> following
      </p>
    </div>
  );
}

/* =======================================================
   📝 ABOUT SECTION
======================================================= */
function About({ about, original, setAbout, editing, setEditing, save, isOwner }) {
  return (
    <div className="bg-white rounded-2xl shadow border mt-6 p-6 max-w-3xl w-full">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">About</h3>

        {isOwner && !editing && (
          <button className="text-[#0A66C2]" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <>
          <textarea
            className="w-full border rounded p-2 mt-3"
            rows={4}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
          <div className="flex gap-4 mt-2">
            <button
              onClick={save}
              className="px-4 py-1 bg-[#0A66C2] text-white rounded-full"
            >
              Save
            </button>
            <button
              onClick={() => {
                setAbout(original || "");
                setEditing(false);
              }}
              className="px-4 py-1 border rounded-full"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-700 mt-3">
          {original || "No About section added"}
        </p>
      )}
    </div>
  );
}
