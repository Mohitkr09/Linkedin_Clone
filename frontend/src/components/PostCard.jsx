import { useState } from "react";
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
  ExternalLink,
} from "lucide-react";
import EditPostModal from "./EditPostModal";

const PostCard = ({ post, currentUser, onDelete, onEdit, onShare }) => {
  const [localPost, setLocalPost] = useState(post);
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?._id));
  const [menuOpen, setMenuOpen] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [sharingMenu, setSharingMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);

  const appBaseUrl = window.location.origin;
  const postLink = `${appBaseUrl}/post/${localPost._id}`;

  /* ======================================================
      👍 LIKE / UNLIKE
  ====================================================== */
  const handleLike = async () => {
    try {
      await API.put(`/posts/${localPost._id}/like`);
      setLiked((prev) => !prev);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error("❌ Like error:", error.response?.data || error);
    }
  };

  /* ======================================================
      🗑 DELETE POST (ONLY OWNER)
  ====================================================== */
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await API.delete(`/posts/${localPost._id}`);
      onDelete?.(localPost._id);
    } catch (error) {
      console.error("❌ Delete error:", error);
      alert("Failed to delete post.");
    }
  };

  /* ======================================================
      💬 COMMENT ON POST
  ====================================================== */
  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommenting(true);

    try {
      const res = await API.post(`/posts/${localPost._id}/comment`, {
        text: commentText,
      });

      if (res.data?.post) {
        setComments(res.data.post.comments);
        setLocalPost(res.data.post);
      }

      setCommentText("");
      setShowComments(true);
    } catch (err) {
      console.error("❌ Comment error:", err.response?.data || err);
      alert(err.response?.data?.message || "Error posting comment.");
    } finally {
      setCommenting(false);
    }
  };

  /* ======================================================
      ✏️ EDIT POST
  ====================================================== */
  const handleEditSave = (updatedPost) => {
    if (updatedPost) {
      setLocalPost(updatedPost);
      onEdit?.(updatedPost);
    }
    setEditingPost(null);
  };

  /* ======================================================
      🔁 INTERNAL SHARE
  ====================================================== */
  const handleInternalShare = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      const res = await API.post(`/posts/${localPost._id}/share`);
      if (res.data?.post) {
        setShareCount((prev) => prev + 1);
        onShare?.(res.data);
        alert("✅ Post shared successfully!");
      }
    } catch (error) {
      console.error("❌ Share error:", error.response?.data || error);
      alert("Failed to share post.");
    } finally {
      setSharing(false);
      setSharingMenu(false);
    }
  };

  /* ======================================================
      🔗 COPY LINK
  ====================================================== */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postLink);
      alert("🔗 Link copied!");
    } catch {
      alert("Failed to copy link.");
    }
  };

  /* ======================================================
      📱 NATIVE / SYSTEM SHARE
  ====================================================== */
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: localPost.user?.name || "Post",
          text: localPost.content || "",
          url: postLink,
        });
      } catch (err) {
        console.warn("Share canceled:", err);
      }
    } else {
      setSharingMenu(true);
    }
  };

  /* ======================================================
      🔒 OWNER VALIDATION FIX
      Works for both populated user object & simple ID
  ====================================================== */
  const isOwner =
    String(localPost.user?._id || localPost.user) ===
    String(currentUser?._id);

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition overflow-hidden">
      {/* HEADER */}
      <div className="flex items-start justify-between p-4 relative">
        <div className="flex items-center space-x-3">
          <img
            src={localPost.user?.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />

          <div>
            <h3 className="font-semibold text-gray-900 text-sm flex items-center">
              {localPost.user?.name}
              {isOwner && (
                <span className="text-gray-500 text-xs ml-1">(You)</span>
              )}
            </h3>
            <p className="text-gray-500 text-xs">
              {localPost.user?.headline || "Member"}
            </p>
          </div>
        </div>

        {/* OPTIONS MENU (ONLY OWNER) */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-md z-20">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditingPost(localPost);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </button>

                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENT */}
      {localPost.content && (
        <p className="px-4 pb-2 text-sm text-gray-800 whitespace-pre-wrap">
          {localPost.content}
        </p>
      )}

      {/* MEDIA */}
      {localPost.image && (
        <img src={localPost.image} className="w-full max-h-[500px] object-cover border-t" />
      )}
      {localPost.video && (
        <video controls className="w-full border-t rounded-b-xl">
          <source src={localPost.video} type="video/mp4" />
        </video>
      )}

      {/* ACTION BAR */}
      <div className="flex items-center justify-between px-4 py-2 border-t text-sm text-gray-600">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 ${
            liked ? "text-[#0A66C2]" : "hover:text-[#0A66C2]"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              liked ? "fill-[#0A66C2] stroke-[#0A66C2]" : ""
            }`}
          />
          <span>{likes}</span>
        </button>

        <button
          onClick={() => setShowComments((prev) => !prev)}
          className="flex items-center space-x-1 hover:text-[#0A66C2]"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length}</span>
        </button>

        {/* SHARE MENU */}
        <div className="relative">
          <button
            onClick={handleNativeShare}
            className="flex items-center space-x-1 hover:text-[#0A66C2]"
          >
            <Share2 className="w-4 h-4" />
            <span>{shareCount}</span>
          </button>

          {sharingMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow border rounded p-2 z-30">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Link2 className="w-4 h-4" /> Copy Link
              </button>

              <button
                onClick={handleInternalShare}
                className="w-full px-3 py-2 text-sm border-t text-[#0A66C2] hover:bg-gray-100"
              >
                🔁 Share within app
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="px-4 py-3 border-t bg-gray-50">
          {comments.map((c) => (
            <div key={c._id} className="flex gap-2 mb-3">
              <img
                src={c.user?.avatar || "/default-avatar.png"}
                className="w-8 h-8 rounded-full"
              />
              <div className="bg-white border rounded-lg px-3 py-1.5 shadow-sm max-w-[85%]">
                <p className="text-sm font-semibold">{c.user?.name}</p>
                <p className="text-sm text-gray-700">{c.text}</p>
              </div>
            </div>
          ))}

          {/* ADD COMMENT */}
          <div className="flex gap-2 mt-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 border rounded-full px-3 py-1.5 text-sm"
            />
            <button
              disabled={commenting}
              onClick={handleComment}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Send className="w-4 h-4 text-[#0A66C2]" />
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default PostCard;
