// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { useParams, useNavigate } from "react-router-dom";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const loggedUser = JSON.parse(localStorage.getItem("user"));
  const token = loggedUser?.token;

  const API_URL = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState(null);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [about, setAbout] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [editHeadline, setEditHeadline] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [editAbout, setEditAbout] = useState(false);

  /* AUTH CHECK */
  useEffect(() => {
    if (!loggedUser) navigate("/login");
  }, []);

  /* FETCH PROFILE */
  const fetchProfile = async () => {
    try {
      const endpoint = id ? `/users/${id}` : `/users/me`;

      const res = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      setHeadline(res.data.headline || "");
      setBio(res.data.bio || "");
      setAbout(res.data.about || "");
      setAvatarPreview(res.data.avatar || null);
    } catch (err) {
      navigate("/");
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [id]);

  /* UPDATE AVATAR */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const previewURL = URL.createObjectURL(file);
    setAvatarPreview(previewURL);

    const compressed = await imageCompression(file, { maxSizeMB: 1 });
    const fd = new FormData();
    fd.append("avatar", compressed);

    try {
      const res = await axios.put(`${API_URL}/users/avatar`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedAvatar = res.data.avatar;

      setUser((u) => ({ ...u, avatar: updatedAvatar }));
      localStorage.setItem(
        "user",
        JSON.stringify({ ...loggedUser, avatar: updatedAvatar })
      );
      window.dispatchEvent(new Event("storage"));
    } finally {
      setUploading(false);
    }
  };

  /* SAVE HEADLINE, BIO, ABOUT */
  const saveField = async (field) => {
    const body =
      field === "headline"
        ? { headline }
        : field === "bio"
        ? { bio }
        : { about };

    try {
      const res = await axios.put(`${API_URL}/users/update`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser((prev) => ({ ...prev, ...res.data }));

      if (field === "headline") setEditHeadline(false);
      if (field === "bio") setEditBio(false);
      if (field === "about") setEditAbout(false);
    } catch {
      alert("Update failed");
    }
  };

  if (!user)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );

  const fallbackAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center py-8 px-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow border">
        {/* BANNER + AVATAR */}
        <div className="h-40 bg-gradient-to-r from-[#0A66C2] to-[#004182] relative">
          <div className="absolute -bottom-14 left-8">
            <label className="relative cursor-pointer group">
              <img
                src={avatarPreview || user.avatar || fallbackAvatar}
                alt="avatar"
                className="w-28 h-28 rounded-full border-4 border-white shadow"
              />
              {user._id === loggedUser?._id && (
                <>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleAvatarChange}
                  />
                  {!user.avatar && (
                    <span className="absolute bottom-0 left-0 text-xs bg-white px-2 py-1 rounded shadow text-[#0A66C2]">
                      Add Photo
                    </span>
                  )}
                </>
              )}
            </label>
          </div>
        </div>

        {/* MAIN INFO */}
        <div className="pt-20 px-8 pb-10">
          <h2 className="text-2xl font-bold">{user.name}</h2>

          {/* HEADLINE */}
          <Editable
            label="Headline"
            value={headline}
            editing={editHeadline}
            original={user.headline}
            setValue={setHeadline}
            setEditing={setEditHeadline}
            save={() => saveField("headline")}
            owner={loggedUser?._id === user._id}
            addLabel="Add Headline"
          />

          {/* BIO */}
          <Editable
            label="Bio"
            value={bio}
            editing={editBio}
            original={user.bio}
            setValue={setBio}
            setEditing={setEditBio}
            save={() => saveField("bio")}
            textarea
            owner={loggedUser?._id === user._id}
            addLabel="Add Bio"
          />

          {/* FOLLOWERS */}
          <div className="flex gap-10 mt-6 text-sm text-gray-600 border-t pt-4">
            <p>
              <b>{user.followers?.length || 0}</b> followers
            </p>
            <p>
              <b>{user.following?.length || 0}</b> following
            </p>
          </div>
        </div>

        {/* ABOUT SECTION */}
        <Editable
          label="About"
          value={about}
          editing={editAbout}
          original={user.about}
          setValue={setAbout}
          setEditing={setEditAbout}
          save={() => saveField("about")}
          textarea
          wrapper
          owner={loggedUser?._id === user._id}
          addLabel="Add About"
        />
      </div>
    </div>
  );
}

/********************************
 REUSABLE EDIT COMPONENT
********************************/
function Editable({
  label,
  value,
  original,
  editing,
  setEditing,
  save,
  setValue,
  owner,
  textarea = false,
  wrapper = false,
  addLabel,
}) {
  if (wrapper)
    return (
      <div className="w-full max-w-3xl mt-6 bg-white p-6 shadow rounded-xl mx-auto">
        <h3 className="font-semibold text-lg">{label}</h3>

        {editing ? (
          <>
            <textarea
              rows="4"
              className="w-full border p-2 rounded mt-2"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Buttons save={save} cancel={() => setEditing(false)} />
          </>
        ) : (
          <>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
              {original || `No ${label} section yet`}
            </p>
            {owner && (
              <button
                className="text-[#0A66C2] text-sm mt-2"
                onClick={() => setEditing(true)}
              >
                {original ? "Edit" : addLabel}
              </button>
            )}
          </>
        )}
      </div>
    );

  return (
    <div className="mt-4">
      {editing ? (
        <>
          {textarea ? (
            <textarea
              rows="3"
              className="w-full border p-2 rounded"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          ) : (
            <input
              className="w-full border p-2 rounded"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
          <Buttons save={save} cancel={() => setEditing(false)} />
        </>
      ) : (
        <div className="flex justify-between text-sm text-gray-700">
          <p>{original || `No ${label} added`}</p>
          {owner && (
            <button className="text-[#0A66C2]" onClick={() => setEditing(true)}>
              {original ? "Edit" : addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/********************************
 BUTTON COMPONENT
********************************/
function Buttons({ save, cancel }) {
  return (
    <div className="flex mt-2 gap-3">
      <button
        onClick={save}
        className="px-4 py-1 bg-[#0A66C2] text-white rounded-full"
      >
        Save
      </button>
      <button onClick={cancel} className="px-4 py-1 border rounded-full">
        Cancel
      </button>
    </div>
  );
}
