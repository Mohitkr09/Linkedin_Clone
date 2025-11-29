import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Main text content
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },

    // Optional: Message status fields
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Faster read receipt queries
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Optional attachments (images, documents, etc.)
    attachments: [
      {
        url: String,
        type: {
          type: String, // "image" | "file" | "video"
          default: "image",
        },
      },
    ],
  },
  { timestamps: true }
);

// Index sender + receiver for faster chats
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
