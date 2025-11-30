// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const token = storedUser?.token;
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

  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  /* AUTH CHECK */
  useEffect(() => {
    if (!storedUser) navigate("/login");
  }, []);

  /* FETCH PROFILE */
  const fetchProfile = async () => {
    try {
      const endpoint = id ? `/users/${id}` : "/users/me";
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

  /* WHEN USER SELECTS IMAGE -> OPEN CROP MODAL */
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setShowCropModal(true);
      setScale(1);
      setOffsetX(0);
      setOffsetY(0);
    };
    reader.readAsDataURL(file);
  };

  /* CONFIRM CROP -> UPLOAD CROPPED IMAGE */
  const handleCropConfirm = async () => {
    if (!cropImageSrc) return;

    setUploading(true);

    try {
      const img = new Image();
      img.src = cropImageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Canvas crop: square avatar
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // center-based with offsets
      const dx = offsetX + (size - scaledWidth) / 2;
      const dy = offsetY + (size - scaledHeight) / 2;

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);

      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
      );

      const fd = new FormData();
      fd.append("avatar", blob, "avatar.jpg");

      const res = await axios.put(`${API_URL}/users/avatar`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedAvatar = res.data.avatar;

      setUser((prev) => ({ ...prev, avatar: updatedAvatar }));
      setAvatarPreview(updatedAvatar);

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          _id: user._id,
          token,
          avatar: updatedAvatar,
        })
      );

      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar");
    } finally {
      setUploading(false);
      setShowCropModal(false);
      setCropImageSrc(null);
    }
  };

  /* DELETE AVATAR */
  const handleDeleteAvatar = async () => {
    if (!window.confirm("Remove your profile picture?")) return;

    setUploading(true);
    try {
      await axios.delete(`${API_URL}/users/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser((prev) => ({ ...prev, avatar: null }));
      setAvatarPreview(null);

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          _id: user._id,
          token,
          avatar: null,
        })
      );

      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error(err);
      alert(
        "Failed to delete avatar. Please make sure DELETE /users/avatar exists on the server."
      );
    } finally {
      setUploading(false);
    }
  };

  /* SAVE PROFILE TEXT FIELDS */
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

  const fallbackAvatar =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const isOwner = String(storedUser?._id) === String(user?._id);

  return (
    <>
      <div className="bg-gray-100 min-h-screen flex justify-center py-8 px-4">
        <div className="max-w-3xl w-full bg-white rounded-xl shadow border">
          {/* COVER + PROFILE PHOTO */}
          <div className="h-40 bg-gradient-to-r from-[#0A66C2] to-[#004182] relative">
            <div className="absolute -bottom-14 left-8">
              <label className="relative group cursor-pointer block w-28 h-28">
                <img
                  src={avatarPreview || user.avatar || fallbackAvatar}
                  alt="avatar"
                  className="w-28 h-28 rounded-full border-4 border-white shadow object-cover transition group-hover:opacity-60"
                />

                {/* Hidden file input */}
                {isOwner && (
                  <input
                    type="file"
                    accept="image/*"
                    id="avatarInput"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                )}

                {/* Hover overlay with actions */}
                {isOwner && !uploading && (
                  <div
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                    flex flex-col items-center justify-center gap-1 rounded-full transition text-xs"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("avatarInput").click()
                      }
                      className="px-3 py-1 bg-white/90 text-black rounded-full text-xs"
                    >
                      Change
                    </button>
                    {user.avatar && (
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        className="px-3 py-1 bg-red-500 text-white rounded-full text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}

                {/* Uploading overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex justify-center items-center text-white text-sm rounded-full">
                    Working...
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* USER INFORMATION */}
          <div className="pt-20 px-8 pb-10">
            <h2 className="text-2xl font-bold">{user.name}</h2>

            <Editable
              label="Headline"
              value={headline}
              editing={editHeadline}
              original={user.headline}
              setValue={setHeadline}
              setEditing={setEditHeadline}
              save={() => saveField("headline")}
              owner={isOwner}
              addLabel="Add Headline"
            />

            <Editable
              label="Bio"
              value={bio}
              editing={editBio}
              original={user.bio}
              setValue={(val) => val.length <= 180 && setBio(val)}
              setEditing={setEditBio}
              save={() => saveField("bio")}
              textarea
              owner={isOwner}
              addLabel="Add Bio"
            />
            {editBio && (
              <p className="text-xs text-gray-500">{bio.length}/180 characters</p>
            )}

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
            owner={isOwner}
            addLabel="Add About"
          />
        </div>
      </div>

      {/* CROP MODAL */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-3">Crop Profile Picture</h3>

            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {cropImageSrc && (
                <img
                  src={cropImageSrc}
                  alt="crop"
                  className="select-none"
                  style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                  }}
                />
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-600">Zoom</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">
                  Move Left / Right
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Move Up / Down</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  if (!uploading) {
                    setShowCropModal(false);
                    setCropImageSrc(null);
                  }
                }}
                className="px-4 py-1 border rounded-full text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={uploading}
                className="px-4 py-1 bg-[#0A66C2] text-white rounded-full text-sm disabled:opacity-60"
              >
                {uploading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* SUB COMPONENT: EDIT FIELD */
function Editable({
  label,
  value,
  original,
  editing,
  setEditing,
  save,
  setValue,
  owner,
  textarea,
  wrapper,
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
            <button
              className="text-[#0A66C2]"
              onClick={() => setEditing(true)}
            >
              {original ? "Edit" : addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* SAVE/CANCEL BUTTONS */
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
