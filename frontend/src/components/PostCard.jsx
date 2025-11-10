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

  // ✅ Like / Unlike
  const handleLike = async () => {
    try {
      await API.put(`/posts/${localPost._id}/like`);
      setLiked((prev) => !prev);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error("❌ Like error:", error.response?.data || error);
    }
  };

  // ✅ Delete Post
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

  // ✅ Comment on Post
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

  // ✅ Edit Post
  const handleEditSave = (updatedPost) => {
    if (updatedPost) {
      setLocalPost(updatedPost);
      onEdit?.(updatedPost);
    }
    setEditingPost(null);
  };

  // ✅ Internal Share
  const handleInternalShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const res = await API.post(`/posts/${localPost._id}/share`);
      if (res.data?.post) {
        setShareCount((prev) => prev + 1);
        onShare?.(res.data);
        alert("✅ Post shared successfully within app!");
      }
    } catch (error) {
      console.error("❌ Share error:", error.response?.data || error);
      alert("Failed to share post.");
    } finally {
      setSharing(false);
      setSharingMenu(false);
    }
  };

  // ✅ Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postLink);
      alert("🔗 Post link copied to clipboard!");
    } catch {
      alert("Failed to copy link.");
    }
  };

  // ✅ Native Share (for mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: localPost.user?.name || "LinkedIn Clone Post",
          text: localPost.content || "Check this post!",
          url: postLink,
        });
      } catch (err) {
        console.warn("❌ Native share canceled:", err);
      }
    } else {
      setSharingMenu(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 relative">
        <div className="flex items-center space-x-3">
          <img
            src={localPost.user?.avatar || "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm flex items-center">
              {localPost.user?.name || "Unknown User"}
              {localPost.user?._id === currentUser?._id && (
                <span className="text-gray-500 text-xs ml-1">(You)</span>
              )}
            </h3>
            <p className="text-gray-500 text-xs">
              {localPost.user?.headline || "Member"}
            </p>
          </div>
        </div>

        {/* Menu */}
        {localPost.user?._id === currentUser?._id && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-md z-10">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditingPost(localPost);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4 mr-2 text-gray-500" /> Edit
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

      {/* Shared Info */}
      {localPost.sharedFrom && (
        <div className="px-4 pb-2 text-xs text-gray-500 italic">
          🔁 Shared from{" "}
          <span className="font-medium text-[#0A66C2]">
            {localPost.sharedFrom.user?.name || "another user"}
          </span>{" "}
          •{" "}
          <a
            href={`/post/${localPost.sharedFrom._id}`}
            className="inline-flex items-center text-[#0A66C2] hover:underline"
          >
            View Original <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      )}

      {/* Content */}
      {localPost.content && (
        <div className="px-4 pb-2 text-sm text-gray-800 whitespace-pre-wrap">
          {localPost.content}
        </div>
      )}

      {/* Media */}
      {localPost.image && (
        <img
          src={localPost.image}
          alt="post"
          className="w-full max-h-[500px] object-cover border-t"
        />
      )}
      {localPost.video && (
        <video
          controls
          className="w-full max-h-[500px] border-t rounded-b-xl"
        >
          <source src={localPost.video} type="video/mp4" />
        </video>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2 text-gray-600 text-sm border-t relative">
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
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-1 hover:text-[#0A66C2]"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length}</span>
        </button>

        {/* Share */}
        <div className="relative">
          <button
            onClick={handleNativeShare}
            className="flex items-center space-x-1 hover:text-[#0A66C2]"
          >
            <Share2 className="w-4 h-4" />
            <span>{shareCount}</span>
          </button>

          {sharingMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Link2 className="w-4 h-4" />
                Copy Link
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(postLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-sm hover:bg-gray-100"
              >
                📱 WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-sm hover:bg-gray-100"
              >
                📘 Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postLink)}&text=${encodeURIComponent(localPost.content || "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-sm hover:bg-gray-100"
              >
                🕊 Twitter (X)
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-sm hover:bg-gray-100"
              >
                💼 LinkedIn
              </a>

              <button
                onClick={handleInternalShare}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#0A66C2] hover:bg-gray-100 border-t mt-1"
              >
                🔁 Share within app
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="space-y-3 mb-3">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="flex items-start space-x-2">
                  <img
                    src={c.user?.avatar || "/default-avatar.png"}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="bg-white border rounded-lg px-3 py-1.5 shadow-sm max-w-[85%]">
                    <p className="text-gray-900 text-sm font-medium">
                      {c.user?.name}
                    </p>
                    <p className="text-gray-700 text-sm">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add comment */}
          <div className="flex items-center space-x-2 mt-2">
            <img
              src={currentUser?.avatar || "/default-avatar.png"}
              alt="you"
              className="w-8 h-8 rounded-full object-cover"
            />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 border rounded-full px-3 py-1.5 text-sm focus:ring-[#0A66C2] outline-none"
            />
            <button
              onClick={handleComment}
              disabled={commenting}
              className={`p-2 rounded-full ${
                commenting ? "opacity-50" : "hover:bg-gray-100"
              } transition`}
            >
              <Send className="w-4 h-4 text-[#0A66C2]" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
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
