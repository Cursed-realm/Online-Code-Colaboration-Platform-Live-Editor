const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Untitled Project',
    },
    description: String,
    code: {
      type: String,
      default: '// Start coding here...',
    },
    language: {
      type: String,
      default: 'javascript',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    githubRepo: {
      name: String,
      owner: String,
      branch: {
        type: String,
        default: 'main',
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    activeUsers: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        username: String,
        socketId: String,
        cursorPosition: Object,
      },
    ],
    // Permission management
    isEditingLocked: {
      type: Boolean,
      default: false, // If true, only room owner and editableUsers can edit
    },
    editableUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
