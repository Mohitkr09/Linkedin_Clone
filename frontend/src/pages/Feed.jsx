import React, { useEffect, useState } from "react";
import API from "../api";
import PostCard from "../components/PostCard";
import { Image, Video, Loader2 } from "lucide-react";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  /* ========================================================
     ✅ Fetch all posts
  ======================================================== */
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/posts");
      // Handle both array or object responses
      const data = Array.isArray(res.data) ? res.data : res.data.posts;
      setPosts(data || []);
    } catch (err) {
      console.error("❌ Fetch posts failed:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  /* ========================================================
     ✅ Create new post
  ======================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      alert("Please write something or attach media before posting.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      if (file) fd.append("file", file);

      const res = await API.post("/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Handle if backend returns { post: {...} } or {...}
      const newPost = res.data.post || res.data;

      setPosts((prev) => [newPost, ...prev]);

      // Reset form
      setContent("");
      setFile(null);
      setPreview(null);
      setFileType(null);
    } catch (err) {
      console.error("❌ Error creating post:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to create post.");
    } finally {
      setUploading(false);
    }
  };

  /* ========================================================
     ✅ Preview selected media
  ======================================================== */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const type = selected.type.startsWith("video") ? "video" : "image";
    setFile(selected);
    setFileType(type);
    setPreview(URL.createObjectURL(selected));
  };

  /* ========================================================
     ✅ Post modification handlers
  ======================================================== */
  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleEdit = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handleShare = (sharedPost) => {
    setPosts((prev) => [sharedPost, ...prev]);
  };

  /* ========================================================
     ✅ Render
  ======================================================== */
  return (
    <div className="bg-gray-50 min-h-screen flex justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Post Composer */}
        <div className="bg-white shadow-md rounded-xl p-5 mb-6 border border-gray-200 hover:shadow-lg transition">
          <div className="flex items-start space-x-3">
            <img
              src={
                user?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt="user"
              className="w-12 h-12 rounded-full object-cover"
            />

            <div className="flex-1">
              <textarea
                placeholder="Start a post..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-2xl px-4 py-2 text-sm text-gray-800 resize-none focus:ring-2 focus:ring-[#0A66C2] focus:outline-none"
                rows="3"
              />

              {preview && (
                <div className="mt-3 relative">
                  {fileType === "image" ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="rounded-lg max-h-72 w-full object-contain border"
                    />
                  ) : (
                    <video
                      src={preview}
                      controls
                      className="rounded-lg max-h-72 w-full border"
                    />
                  )}
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      setFileType(null);
                    }}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between mt-4 border-t pt-3">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <label className="cursor-pointer flex items-center hover:text-[#0A66C2] transition">
                <Image className="w-4 h-4 mr-1" />
                <span>Add Image</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer flex items-center hover:text-[#0A66C2] transition">
                <Video className="w-4 h-4 mr-1" />
                <span>Add Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={uploading}
              className={`flex items-center justify-center gap-2 bg-[#0A66C2] text-white px-6 py-1.5 rounded-full font-medium transition ${
                uploading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "hover:bg-[#004182]"
              }`}
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div className="flex justify-center mt-10 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(posts) && posts.length > 0 ? (
              posts.map((p) => (
                <PostCard
                  key={p._id}
                  post={p}
                  currentUser={user}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onShare={handleShare}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center mt-8">
                No posts yet. Be the first to share something!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
