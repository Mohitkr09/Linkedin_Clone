import { useState } from "react";
import axios from "axios";
import { X, Image, Loader2 } from "lucide-react";

const EditPostModal = ({ post, onClose, onSave }) => {
  const [content, setContent] = useState(post.content);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(post.image || post.video || null);
  const [fileType, setFileType] = useState(
    post.image ? "image" : post.video ? "video" : null
  );
  const [uploading, setUploading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    const type = selected.type.startsWith("video") ? "video" : "image";
    setFileType(type);
    setPreview(URL.createObjectURL(selected));
  };

  // ✅ Handle save (update post via backend)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      alert("Please add text or media before saving.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("content", content.trim());
      if (file) formData.append("file", file); // backend handles image/video detection

      // ✅ Update post via backend
      const res = await axios.put(
        `http://localhost:5000/api/posts/${post._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      // ✅ Pass updated post back to parent (Feed/PostCard)
      if (res.data?.post) {
        onSave(res.data.post); // << Correct key
      } else {
        console.warn("⚠️ Backend did not return updated post.");
      }

      onClose();
    } catch (error) {
      console.error("❌ Error updating post:", error.response?.data || error);
      alert(error.response?.data?.message || "Failed to update post.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-fadeIn p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Edit Post</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Textarea */}
          <textarea
            rows="4"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to update?"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0A66C2] focus:outline-none text-sm text-gray-800"
          />

          {/* Media Preview */}
          {preview && (
            <div className="relative">
              {fileType === "image" ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="rounded-lg w-full max-h-80 object-contain border"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="rounded-lg w-full max-h-80 border"
                />
              )}

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setFileType(null);
                }}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Input */}
          <label className="cursor-pointer text-[#0A66C2] flex items-center gap-2 text-sm font-medium hover:text-[#004182] transition">
            <Image className="w-4 h-4" />
            <span>Add or Replace Image/Video</span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-full font-medium text-white transition ${
              uploading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-[#0A66C2] hover:bg-[#004182]"
            }`}
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
