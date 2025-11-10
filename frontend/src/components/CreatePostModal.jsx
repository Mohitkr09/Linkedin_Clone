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

  // ✅ Detect file type and generate preview
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    const type = selected.type.startsWith("video") ? "video" : "image";
    setFileType(type);

    const fileURL = URL.createObjectURL(selected);
    setPreview(fileURL);
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      alert("Please add text, an image, or a video before posting.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("visibility", "public");
      if (file) formData.append(fileType, file);

      await axios.post("http://localhost:5000/api/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.token}`,
        },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        },
      });

      setContent("");
      setFile(null);
      setPreview(null);
      setFileType(null);
      setUploading(false);
      setProgress(0);

      onRefresh();
      onClose();
    } catch (err) {
      console.error("❌ Post creation failed:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to create post.");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create a Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center px-6 pt-4">
          <img
            src={user?.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900 text-sm">{user?.name}</h3>
            <p className="text-gray-500 text-xs">Post to: Public</p>
          </div>
        </div>

        {/* Textarea */}
        <div className="px-6 mt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to talk about?"
            className="w-full h-32 border-none outline-none text-gray-800 placeholder-gray-400 text-sm resize-none"
          />
        </div>

        {/* Media Preview */}
        {preview && (
          <div className="relative px-6 mt-3">
            {fileType === "image" ? (
              <img
                src={preview}
                alt="preview"
                className="rounded-xl w-full max-h-80 object-contain border"
              />
            ) : (
              <video
                src={preview}
                controls
                className="rounded-xl w-full max-h-80 border"
              />
            )}
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setFileType(null);
              }}
              className="absolute top-2 right-8 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4 px-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#0A66C2] h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t mt-4">
          {/* Upload buttons */}
          <label className="cursor-pointer text-[#0A66C2] text-sm font-medium flex items-center space-x-2 hover:text-[#004182]">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Image className="w-4 h-4" />
            <span>Add Image/Video</span>
          </label>

          {/* Post button */}
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-white font-medium transition ${
              uploading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-[#0A66C2] hover:bg-[#004182]"
            }`}
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
