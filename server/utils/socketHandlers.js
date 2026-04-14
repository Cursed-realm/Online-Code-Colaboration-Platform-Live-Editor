const Project = require('../models/Project');

// Socket.io event handlers for real-time collaboration
const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.id}`);

    // User joins a room
    socket.on('join-room', async (data) => {
      const { roomId, userId, username } = data;

      socket.join(roomId);

      try {
        // Update project with active user
        const updatedProject = await Project.findOneAndUpdate(
          { roomId },
          {
            $push: {
              activeUsers: {
                userId,
                username,
                socketId: socket.id,
              },
            },
          },
          { new: true }
        ).populate('owner').populate('editableUsers');

        // Send project state and permissions to the user
        const isOwnerFlag = updatedProject.owner && updatedProject.owner._id.toString() === userId.toString();
        
        socket.emit('room-joined', {
          message: `Successfully joined ${roomId}`,
          isOwner: isOwnerFlag,
          ownerId: updatedProject.owner?._id,
          isEditingLocked: updatedProject.isEditingLocked,
          editableUsers: updatedProject.editableUsers.map(u => u._id.toString()),
          activeUsers: updatedProject.activeUsers,
          code: updatedProject.code,
          language: updatedProject.language,
        });

        // Notify others in room about new user
        socket.to(roomId).emit('user-joined', { username, userId });
        
        // Broadcast permission status to all users in room
        io.to(roomId).emit('permission-status', {
          isEditingLocked: updatedProject.isEditingLocked,
          editableUsers: updatedProject.editableUsers.map(u => u._id.toString()),
          activeUsers: updatedProject.activeUsers,
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Code update - broadcast to all in room with permission check
    socket.on('code-change', async (data) => {
      const { roomId, code, userId } = data;

      try {
        const project = await Project.findOne({ roomId });

        // Check permissions
        const canEdit =
          !project.isEditingLocked ||
          project.owner._id.toString() === userId.toString() ||
          project.editableUsers.some(u => u.toString() === userId.toString());

        if (!canEdit) {
          socket.emit('error', { message: 'You do not have permission to edit this project' });
          return;
        }

        // Update code in database
        await Project.findOneAndUpdate({ roomId }, { code, updatedAt: new Date() });

        // Broadcast to all in room
        io.to(roomId).emit('code-updated', { code, userId });
      } catch (error) {
        console.error('Error updating code:', error);
      }
    });

    // Toggle editing lock (room owner only)
    socket.on('toggle-editing-lock', async (data) => {
      const { roomId, userId, isLocked } = data;

      try {
        const project = await Project.findOne({ roomId });

        // Verify user is the room owner
        if (project.owner._id.toString() !== userId.toString()) {
          socket.emit('error', { message: 'Only room owner can toggle editing lock' });
          return;
        }

        // Update the lock status
        await Project.findOneAndUpdate(
          { roomId },
          { isEditingLocked: isLocked }
        );

        // Broadcast to all users in room
        io.to(roomId).emit('editing-lock-changed', { isEditingLocked: isLocked });
      } catch (error) {
        console.error('Error toggling editing lock:', error);
        socket.emit('error', { message: 'Failed to toggle editing lock' });
      }
    });

    // Grant editing permission to a user (room owner only)
    socket.on('grant-edit-permission', async (data) => {
      const { roomId, userId, targetUserId } = data;

      try {
        const project = await Project.findOne({ roomId });

        // Verify user is the room owner
        if (project.owner._id.toString() !== userId.toString()) {
          socket.emit('error', { message: 'Only room owner can grant permissions' });
          return;
        }

        // Add user to editable users if not already there
        const updatedProject = await Project.findOneAndUpdate(
          { roomId },
          { $addToSet: { editableUsers: targetUserId } },
          { new: true }
        );

        // Broadcast updated permissions
        io.to(roomId).emit('permission-status', {
          isEditingLocked: updatedProject.isEditingLocked,
          editableUsers: updatedProject.editableUsers.map(u => u.toString()),
        });

        socket.emit('notification', {
          type: 'success',
          message: `User granted edit permission`,
        });
      } catch (error) {
        console.error('Error granting permission:', error);
        socket.emit('error', { message: 'Failed to grant edit permission' });
      }
    });

    // Revoke editing permission from a user (room owner only)
    socket.on('revoke-edit-permission', async (data) => {
      const { roomId, userId, targetUserId } = data;

      try {
        const project = await Project.findOne({ roomId });

        // Verify user is the room owner
        if (project.owner._id.toString() !== userId.toString()) {
          socket.emit('error', { message: 'Only room owner can revoke permissions' });
          return;
        }

        // Remove user from editable users
        const updatedProject = await Project.findOneAndUpdate(
          { roomId },
          { $pull: { editableUsers: targetUserId } },
          { new: true }
        );

        // Broadcast updated permissions
        io.to(roomId).emit('permission-status', {
          isEditingLocked: updatedProject.isEditingLocked,
          editableUsers: updatedProject.editableUsers.map(u => u.toString()),
        });

        socket.emit('notification', {
          type: 'info',
          message: `User edit permission revoked`,
        });
      } catch (error) {
        console.error('Error revoking permission:', error);
        socket.emit('error', { message: 'Failed to revoke edit permission' });
      }
    });

    // Cursor movement
    socket.on('cursor-move', (data) => {
      const { roomId, userId, position } = data;
      socket.to(roomId).emit('cursor-updated', { userId, position });
    });

    // Language change
    socket.on('language-change', async (data) => {
      const { roomId, language } = data;

      try {
        await Project.findOneAndUpdate({ roomId }, { language });
        socket.to(roomId).emit('language-changed', { language });
      } catch (error) {
        console.error('Error changing language:', error);
      }
    });

    // User leaves room
    socket.on('leave-room', async (data) => {
      const { roomId, userId } = data;

      try {
        await Project.findOneAndUpdate(
          { roomId },
          {
            $pull: {
              activeUsers: { userId },
            },
          }
        );

        socket.to(roomId).emit('user-left', { userId });
      } catch (error) {
        console.error('Error leaving room:', error);
      }

      socket.leave(roomId);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`✗ User disconnected: ${socket.id}`);

      // Find and update all rooms this user was in
      try {
        await Project.updateMany(
          { 'activeUsers.socketId': socket.id },
          {
            $pull: {
              activeUsers: { socketId: socket.id },
            },
          }
        );
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

module.exports = { socketHandlers };
