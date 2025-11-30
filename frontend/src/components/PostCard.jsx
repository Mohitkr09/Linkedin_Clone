// src/components/PostCard.jsx
import { useState, useEffect, useRef } from "react";
import API from "../api";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Edit2,
  Trash2,
  Send,
  Share2,
  Link2,
} from "lucide-react";
import EditPostModal from "./EditPostModal";

const PostCard = ({ post, currentUser, onDelete, onEdit, onShare }) => {
  const [localPost, setLocalPost] = useState(post);
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(
    post.likes?.includes(currentUser?._id || currentUser?.user?._id)
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [editingPost, setEditingPost] = useState(null);

  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);

  const menuRef = useRef(null);
  const postUrl = `${window.location.origin}/post/${localPost._id}`;

  /* ======================================================
     👤 OWNER CHECK — FINAL FIX
     Handles:
     - currentUser._id
     - currentUser.user._id
     - post.user as object or string
  ====================================================== */
  const loggedInUserId =
    currentUser?._id || currentUser?.user?._id || null;

  const postOwnerId =
    typeof localPost.user === "object" ? localPost.user._id : localPost.user;

  const isOwner =
    loggedInUserId &&
    postOwnerId &&
    String(loggedInUserId).trim() === String(postOwnerId).trim();

  /* ======================================================
     📌 CLOSE MENUS ON OUTSIDE CLICK
  ====================================================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShareMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ======================================================
     👍 LIKE / UNLIKE POST
  ====================================================== */
  const handleLike = async () => {
    try {
      await API.put(`/posts/${localPost._id}/like`);
      setLiked(!liked);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
    } catch (err) {
      console.error("❌ Like failed:", err);
    }
  };

  /* ======================================================
     🗑 DELETE POST
  ====================================================== */
  const handleDelete = async () => {
    if (!confirm("Delete this post permanently?")) return;

    try {
      await API.delete(`/posts/${localPost._id}`);
      onDelete?.(localPost._id);
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete post.");
    }
  };

  /* ======================================================
     💬 COMMENT
  ====================================================== */
  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      setCommenting(true);
      const res = await API.post(`/posts/${localPost._id}/comment`, {
        text: commentText,
      });

      if (res.data?.comments) {
        setComments(res.data.comments);
        setLocalPost((prev) => ({ ...prev, comments: res.data.comments }));
      }

      setCommentText("");
      setShowComments(true);
    } catch (err) {
      console.error("❌ Comment failed:", err);
    } finally {
      setCommenting(false);
    }
  };

  /* ======================================================
     ✏️ SAVE EDITED POST
  ====================================================== */
  const handleEditSave = (updatedPost) => {
    setLocalPost(updatedPost);
    onEdit?.(updatedPost);
    setEditingPost(null);
  };

  /* ======================================================
     🔁 INTERNAL SHARE
  ====================================================== */
  const handleInternalShare = async () => {
    try {
      const res = await API.post(`/posts/${localPost._id}/share`);
      setShareCount((prev) => prev + 1);
      onShare?.(res.data);
    } catch (err) {
      console.error("❌ Share failed:", err);
    } finally {
      setShareMenuOpen(false);
    }
  };

  /* ======================================================
     🔗 COPY LINK
  ====================================================== */
  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    alert("🔗 Post link copied!");
    setShareMenuOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition">

      {/* ================= HEADER ================= */}
      <div className="p-4 flex justify-between">
        <div className="flex gap-3">
          <img
            src={localPost.user?.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold">{localPost.user?.name}</p>
            <p className="text-xs text-gray-500">
              {localPost.user?.headline || "Member"}
            </p>
          </div>
        </div>

        {/* ================= THREE DOTS MENU ================= */}
        {isOwner && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-md w-36 z-20">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditingPost(localPost);
                  }}
                  className="flex px-3 py-2 items-center w-full hover:bg-gray-100 text-sm"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Post
                </button>

                <button
                  onClick={handleDelete}
                  className="flex px-3 py-2 items-center w-full hover:bg-gray-100 text-sm text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= CONTENT ================= */}
      {localPost.content && (
        <p className="px-4 pb-2 text-gray-800 whitespace-pre-wrap text-sm">
          {localPost.content}
        </p>
      )}

      {localPost.image && (
        <img src={localPost.image} className="w-full max-h-[480px] object-cover" />
      )}

      {localPost.video && (
        <video src={localPost.video} controls className="w-full" />
      )}

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-between px-4 py-2 text-sm text-gray-600 border-t">
        <button
          onClick={handleLike}
          className={`flex gap-1 items-center ${
            liked ? "text-[#0A66C2]" : "hover:text-[#0A66C2]"
          }`}
        >
          <Heart className={liked ? "fill-[#0A66C2] stroke-[#0A66C2]" : ""} />
          {likes}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex gap-1 items-center hover:text-[#0A66C2]"
        >
          <MessageCircle />
          {comments.length}
        </button>

        {/* SHARE MENU */}
        <div className="relative">
          <button
            onClick={() => setShareMenuOpen((prev) => !prev)}
            className="flex gap-1 items-center hover:text-[#0A66C2]"
          >
            <Share2 /> {shareCount}
          </button>

          {shareMenuOpen && (
            <div className="absolute right-0 bg-white border shadow w-40 p-2 rounded-md">
              <button
                onClick={copyLink}
                className="flex gap-2 py-1 px-2 w-full hover:bg-gray-100"
              >
                <Link2 className="w-4" /> Copy Link
              </button>

              <button
                onClick={handleInternalShare}
                className="flex gap-2 py-1 px-2 w-full hover:bg-gray-100 text-[#0A66C2]"
              >
                🔁 Share in App
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= COMMENTS ================= */}
      {showComments && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          {comments.map((c) => (
            <div key={c._id} className="flex gap-2 mb-2">
              <img
                src={c.user?.avatar || "/default-avatar.png"}
                className="w-7 h-7 rounded-full"
              />
              <div className="bg-white rounded-lg p-2 border text-sm shadow-sm">
                <p className="font-semibold">{c.user?.name}</p>
                {c.text}
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 border rounded-full px-3 py-1"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              disabled={commenting}
              onClick={handleComment}
              className="p-2 text-[#0A66C2] hover:bg-gray-100 rounded-full"
            >
              <Send />
            </button>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onSave={handleEditSave}
          onClose={() => setEditingPost(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default PostCard;
