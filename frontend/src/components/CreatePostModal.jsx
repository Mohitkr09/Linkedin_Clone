// src/components/CreatePostModal.jsx
import { useState } from "react";
import axios from "axios";
import { Image, Video, X, Loader2 } from "lucide-react";

const CreatePostModal = ({ onClose, onRefresh }) => {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const API_URL = import.meta.env.VITE_API_URL; // 🔥 Correct base URL

  /* =========================================================
     📁 Handle image / video upload selection
  ========================================================= */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setFileType(selected.type.startsWith("video") ? "video" : "image");
    setPreview(URL.createObjectURL(selected));
  };

  /* =========================================================
     📝 Submit Post
  ========================================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !file) {
      alert("Please write something or upload media before posting.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("visibility", "public");

      // Cloudinary requires different field names
      if (file) {
        formData.append("media", file); // 🔥 single field works for both
      }

      const res = await axios.post(`${API_URL}/posts`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        onUploadProgress: ({ loaded, total }) => {
          setProgress(Math.round((loaded * 100) / total));
        },
      });

      // reset state
      setContent("");
      setFile(null);
      setPreview(null);
      setFileType(null);
      setProgress(0);
      setUploading(false);

      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error("❌ Create post error:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to create post");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Create a post</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User section */}
        <div className="flex items-center px-6 mt-3">
          <img
            src={user?.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-3">
            <p className="font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">Posting publicly</p>
          </div>
        </div>

        {/* Text area */}
        <div className="px-6 mt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to talk about?"
            className="w-full h-28 text-sm text-gray-900 outline-none resize-none"
          />
        </div>

        {/* Media preview */}
        {preview && (
          <div className="relative px-6 mt-3">
            {fileType === "image" ? (
              <img src={preview} className="rounded-lg border max-h-80 w-full object-contain" />
            ) : (
              <video src={preview} controls className="rounded-lg border max-h-80 w-full" />
            )}

            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setFileType(null);
              }}
              className="absolute top-2 right-8 bg-black/50 text-white p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="px-6 mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-[#0A66C2] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t mt-4">
          <label className="flex items-center space-x-2 cursor-pointer text-[#0A66C2] hover:text-[#004182]">
            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            <Image className="w-4 h-4" />
            <span>Add media</span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-white transition ${
              uploading ? "bg-blue-400" : "bg-[#0A66C2] hover:bg-[#004182]"
            }`}
          >
            {uploading && <Loader2 className="animate-spin w-4 h-4" />}
            {uploading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
