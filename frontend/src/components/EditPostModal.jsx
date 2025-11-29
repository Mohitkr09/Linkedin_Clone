// src/components/EditPostModal.jsx
import { useState } from "react";
import axios from "axios";
import { X, Image, Trash2, Loader2 } from "lucide-react";

const EditPostModal = ({ post, onClose, onSave, onDelete }) => {
  const [content, setContent] = useState(post.content);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(post.image || post.video || null);
  const [fileType, setFileType] = useState(
    post.image ? "image" : post.video ? "video" : null
  );

  const [uploading, setUploading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const API_URL = import.meta.env.VITE_API_URL; // 🔥 USE ENV

  /* =========================================================
     📁 Select new media for update
  ========================================================= */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setFileType(selected.type.startsWith("video") ? "video" : "image");
    setPreview(URL.createObjectURL(selected));
  };

  /* =========================================================
     📝 SAVE UPDATED POST
  ========================================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      alert("Post cannot be empty.");
      return;
    }

    try {
      setUploading(true);

      const fd = new FormData();
      fd.append("content", content.trim());
      if (file) fd.append("media", file); // 🔥 backend expects this

      const res = await axios.put(`${API_URL}/posts/${post._id}`, fd, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      onSave(res.data); // update feed UI
      onClose();
    } catch (err) {
      console.error("❌ Update failed:", err.response?.data || err);
      alert("Failed to update post");
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     🗑 DELETE POST
  ========================================================= */
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      setUploading(true);

      await axios.delete(`${API_URL}/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      onDelete(post._id); // remove from feed
      onClose();
    } catch (err) {
      console.error("❌ Delete failed:", err.response?.data || err);
      alert("Failed to delete post");
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     MODAL UI
  ========================================================= */
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-fadeIn">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold">Edit Post</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border p-3 rounded-lg focus:ring-[#0A66C2] text-sm"
            rows={4}
            placeholder="Update your post..."
          />

          {preview && (
            <div className="relative">
              {fileType === "image" ? (
                <img src={preview} className="rounded-lg border max-h-80 object-contain" />
              ) : (
                <video src={preview} controls className="rounded-lg border max-h-80" />
              )}

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setFileType(null);
                }}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <label className="cursor-pointer text-[#0A66C2] flex items-center gap-2 hover:text-[#004182]">
            <Image className="w-4 h-4" />
            Change Image/Video
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
          </label>

          <div className="flex justify-between mt-4">
            {/* DELETE BUTTON */}
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-500 rounded-full hover:bg-red-600 hover:text-white transition"
              disabled={uploading}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>

            {/* SAVE BUTTON */}
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2 bg-[#0A66C2] text-white rounded-full hover:bg-[#004182] transition"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
