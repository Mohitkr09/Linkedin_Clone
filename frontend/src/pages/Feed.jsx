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

  /* ===================== Fetch Posts ===================== */
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/posts");
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

  /* ===================== Create Post ===================== */
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

      const newPost = res.data.post || res.data;
      setPosts((prev) => [newPost, ...prev]);

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

  /* ===================== File Preview ===================== */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const type = selected.type.startsWith("video") ? "video" : "image";
    setFile(selected);
    setFileType(type);
    setPreview(URL.createObjectURL(selected));
  };

  /* ===================== Post Handlers ===================== */
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

  /* ===================== UI SECTION ===================== */
  return (
    <div className="bg-gray-50 min-h-screen flex justify-center py-8 px-4">
      <div className="w-full max-w-7xl flex gap-6">

        {/* ===================== LEFT SIDEBAR ===================== */}
        <div className="hidden lg:block w-72 space-y-4">
          <div className="bg-white rounded-xl shadow border p-4">
            <div className="flex flex-col items-center">
              <img
                src={
                  user?.avatar ||
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt="profile"
                className="w-20 h-20 rounded-full object-cover border"
              />
              <h2 className="text-lg font-semibold mt-2">{user?.name}</h2>

              <p className="text-sm text-gray-600 text-center">
                {user?.headline || "Aspiring Developer"}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {user?.college || user?.location || "Not specified"}
              </p>
            </div>

            <div className="mt-4 border-t pt-3 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Profile viewers</span>
                <span className="text-[#0A66C2] font-medium">
                  {user?.profileViews ?? 0}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-gray-600">Post impressions</span>
                <span className="text-[#0A66C2] font-medium">
                  {user?.postImpressions ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border p-4 space-y-3 text-sm font-medium">
            <p>Saved items</p>
            <p>Groups</p>
            <p>Newsletters</p>
            <p>Events</p>
          </div>
        </div>

        {/* ===================== MAIN FEED ===================== */}
        <div className="flex-1 max-w-2xl">
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
                  placeholder={`Start a post, ${user?.name?.split(" ")[0]}...`}
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

        {/* ===================== RIGHT SIDEBAR ===================== */}
        <div className="hidden xl:block w-72 space-y-4">

          <div className="bg-white shadow-md rounded-xl border p-4">
            <h3 className="font-semibold text-gray-800 mb-3">LinkedIn News</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Audio apps eye paid users</li>
              <li>Law firms merge to scale</li>
              <li>GCC talent taps into AI power</li>
              <li>AI is the new KPI</li>
              <li>IT acquisitions pick up</li>
            </ul>
          </div>

          <div className="bg-white shadow-md rounded-xl border p-4">
            <h3 className="font-semibold">Puzzle spotlight</h3>
            <p className="text-sm text-gray-600">
              Sharpen your mind in 60s or less
            </p>
          </div>

          <div className="bg-white shadow-md rounded-xl border p-4">
            <p className="font-semibold text-gray-700">
              {user?.name?.split(" ")[0]}, grow your career by following top companies
            </p>
            <button className="mt-3 w-full bg-[#0A66C2] hover:bg-[#004182] text-white py-1.5 rounded-lg">
              Follow
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
