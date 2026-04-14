import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { projectAPI, githubAPI } from '../utils/api';
import Navbar from '../components/common/Navbar';
import GitHubPushModal from '../components/editor/GitHubPushModal';
import ManageAccessModal from '../components/editor/ManageAccessModal';
import { Share2, Github, Copy, Users, Play, Lock, Unlock, Shield, Settings } from 'lucide-react';
import '../styles/editor.css';
import '../styles/manage-access.css';

const LANGUAGE_OPTIONS = [
  'javascript', 'python', 'java', 'html', 'css', 'json', 'sql'
];

export default function Editor() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { emit, on, off } = useSocket();
  const editorRef = useRef(null);
  const [code, setCode] = useState('// Start coding...');
  const [language, setLanguage] = useState('javascript');
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savingTimeoutRef = useRef(null);

  // Permission states
  const [isOwner, setIsOwner] = useState(false);
  const [isEditingLocked, setIsEditingLocked] = useState(false);
  const [editableUsers, setEditableUsers] = useState([]);
  const [canEdit, setCanEdit] = useState(true);
  const [showPermissionsPanel, setShowPermissionsPanel] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showManageAccessModal, setShowManageAccessModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch project on mount
  useEffect(() => {
    fetchProject();
  }, [roomId]);

  // Setup socket events
  useEffect(() => {
    if (!user || !roomId) return;

    // Join room
    emit('join-room', {
      roomId,
      userId: user.id,
      username: user.username,
    });

    // Listen for room joined
    on('room-joined', (data) => {
      console.log(data.message);
      console.log('🔍 DEBUG - Room Joined:', {
        isOwner: data.isOwner,
        userId: user.id,
        ownerId: data.ownerId,
        message: 'Check if isOwner is TRUE for you to see Manage Access button'
      });
      setIsOwner(data.isOwner);
      setIsEditingLocked(data.isEditingLocked);
      setEditableUsers(data.editableUsers);
      setCode(data.code);
      setLanguage(data.language);

      // Check if user can edit
      const hasPermission =
        !data.isEditingLocked ||
        data.isOwner ||
        data.editableUsers.includes(user.id);

      setCanEdit(hasPermission);
      setActiveUsers(data.activeUsers);
    });

    // Listen for code updates from others
    on('code-updated', (data) => {
      setCode(data.code);
    });

    // Listen for language changes
    on('language-changed', (data) => {
      setLanguage(data.language);
    });

    // Listen for permission status changes
    on('permission-status', (data) => {
      setIsEditingLocked(data.isEditingLocked);
      setEditableUsers(data.editableUsers);

      // Recalculate if user can edit
      const hasPermission =
        !data.isEditingLocked ||
        isOwner ||
        data.editableUsers.includes(user.id);

      setCanEdit(hasPermission);
      setActiveUsers(data.activeUsers);
    });

    // Listen for lock changes
    on('editing-lock-changed', (data) => {
      setIsEditingLocked(data.isEditingLocked);
      const hasPermission =
        !data.isEditingLocked ||
        isOwner ||
        editableUsers.includes(user.id);
      setCanEdit(hasPermission);
    });

    // Listen for notifications
    on('notification', (data) => {
      setNotification({ ...data, timestamp: Date.now() });
      setTimeout(() => setNotification(null), 3000);
    });

    // Listen for user joined
    on('user-joined', (data) => {
      console.log(`${data.username} joined the room`);
    });

    // Listen for user left
    on('user-left', (data) => {
      console.log(`User ${data.userId} left`);
    });

    // Listen for errors
    on('error', (data) => {
      setNotification({ type: 'error', message: data.message, timestamp: Date.now() });
      setTimeout(() => setNotification(null), 3000);
    });

    // Cleanup
    return () => {
      off('room-joined');
      off('code-updated');
      off('language-changed');
      off('permission-status');
      off('editing-lock-changed');
      off('notification');
      off('user-joined');
      off('user-left');
      off('error');

      if (roomId && user) {
        emit('leave-room', {
          roomId,
          userId: user.id,
        });
      }
    };
  }, [user, roomId, emit, on, off, isOwner, editableUsers]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getProject(roomId);
      setProjectData(response.data.project);
      setCode(response.data.project.code);
      setLanguage(response.data.project.language);
      setActiveUsers(response.data.project.activeUsers || []);
    } catch (err) {
      setError('Failed to load project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value) => {
    if (!canEdit) {
      setNotification({
        type: 'error',
        message: 'You do not have permission to edit this room',
        timestamp: Date.now(),
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setCode(value || '');
    setIsSaving(true);

    // Emit code change to others
    emit('code-change', {
      roomId,
      code: value,
      userId: user.id,
    });

    // Clear previous timeout
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
    }

    // Set new timeout
    savingTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    emit('language-change', {
      roomId,
      language: newLanguage,
    });
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setNotification({ type: 'success', message: 'Room ID copied!' });
    setTimeout(() => setNotification(null), 2000);
  };

  const handleToggleLock = () => {
    emit('toggle-editing-lock', {
      roomId,
      userId: user.id,
      isLocked: !isEditingLocked,
    });
  };

  const handleGrantPermission = (userId) => {
    emit('grant-edit-permission', {
      roomId,
      userId: user.id,
      targetUserId: userId,
    });
  };

  const handleRevokePermission = (userId) => {
    emit('revoke-edit-permission', {
      roomId,
      userId: user.id,
      targetUserId: userId,
    });
  };

  const handleChangeUserRole = (userId, role) => {
    if (role === 'editor') {
      // Grant edit permission
      emit('grant-edit-permission', {
        roomId,
        userId: user.id,
        targetUserId: userId,
      });
    } else if (role === 'viewer') {
      // Revoke edit permission
      emit('revoke-edit-permission', {
        roomId,
        userId: user.id,
        targetUserId: userId,
      });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="editor-loading">
          <div className="loading-spinner"></div>
          <p>Loading editor...</p>
        </div>
      </>
    );
  }

  const editableUserIds = editableUsers || [];

  return (
    <>
      <Navbar />
      <div className="editor-container">
        <div className="editor-header">
          <div className="editor-title">
            <h2>{projectData?.title}</h2>
            <span className="room-id">
              {roomId.substring(0, 8)}
              <button
                className="copy-btn"
                onClick={handleCopyRoomId}
                title="Copy room ID"
              >
                <Copy size={16} />
              </button>
            </span>
          </div>

          <div className="editor-toolbar">
            {/* Lock Status */}
            <div className="lock-status">
              {isEditingLocked ? (
                <>
                  <Lock size={18} className="lock-icon" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Unlock size={18} className="unlock-icon" />
                  <span>Unlocked</span>
                </>
              )}
            </div>

            {/* Language Selector */}
            <div className="language-selector">
              <label>Language:</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Users */}
            <div className="active-users-display">
              <Users size={18} />
              <span>{activeUsers.length} online</span>
            </div>

            {/* Manage Access Button - Only for Admin */}
            {isOwner && (
              <button
                className="btn btn-icon-text btn-manage-access"
                onClick={() => setShowManageAccessModal(true)}
                title="Manage user access levels"
              >
                <Settings size={18} />
                Manage Access
              </button>
            )}

            {/* Saving indicator */}
            {isSaving && <span className="saving-indicator">Saving...</span>}

            {/* Owner Controls */}
            {isOwner && (
              <>
                <button
                  className="btn btn-icon-text"
                  onClick={handleToggleLock}
                  title={isEditingLocked ? 'Unlock editing' : 'Lock editing'}
                >
                  {isEditingLocked ? <Lock size={18} /> : <Unlock size={18} />}
                  {isEditingLocked ? 'Unlock' : 'Lock'}
                </button>

                <button
                  className="btn btn-icon-text"
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  title="Admin panel - manage permissions"
                >
                  <Shield size={18} />
                  Admin Panel
                </button>

                <button
                  className="btn btn-icon-text"
                  onClick={() => setShowPermissionsPanel(!showPermissionsPanel)}
                  title="Manage permissions"
                >
                  <Shield size={18} />
                  Permissions
                </button>
              </>
            )}

            {/* GitHub Push Button */}
            <button
              className="btn btn-icon-text"
              onClick={() => setShowGitHubModal(true)}
            >
              <Github size={18} />
              Push to GitHub
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Notification */}
        {notification && (
          <div className={`alert alert-${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* Edit Permission Warning */}
        {!canEdit && (
          <div className="alert alert-warning">
            <Shield size={16} /> You do not have permission to edit this room. Only the room owner or permitted users can edit.
          </div>
        )}

        {/* Editor Layout */}
        <div className="editor-layout">
          {/* Monaco Editor - Whiteboard */}
          <div className={`editor-wrapper ${!canEdit ? 'read-only' : ''}`}>
            <MonacoEditor
              ref={editorRef}
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                wordWrap: 'on',
                fontSize: 14,
                fontFamily: "'Monaco', 'Courier New', monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
                readOnly: !canEdit,
              }}
            />
          </div>

          {/* Sidebar - Active Users & Permissions */}
          <div className="editor-sidebar">
            {/* Active Users Panel */}
            {activeUsers.length > 0 && (
              <div className="active-users-panel">
                <h4>
                  <Users size={16} /> Active Users ({activeUsers.length})
                </h4>
                <div className="users-list">
                  {activeUsers.map((activeUser) => (
                    <div key={activeUser.userId} className="user-item">
                      <span className="user-indicator"></span>
                      <div className="user-info">
                        <span className="username">{activeUser.username}</span>
                        {isOwner && activeUser.userId !== user.id && (
                          <div className="user-actions">
                            {editableUserIds.includes(activeUser.userId) ? (
                              <button
                                className="btn-small btn-revoke"
                                onClick={() => handleRevokePermission(activeUser.userId)}
                                title="Revoke edit permission"
                              >
                                Revoke
                              </button>
                            ) : (
                              <button
                                className="btn-small btn-grant"
                                onClick={() => handleGrantPermission(activeUser.userId)}
                                title="Grant edit permission"
                              >
                                Grant
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permissions Panel */}
            {isOwner && showPermissionsPanel && (
              <div className="permissions-panel">
                <h4>
                  <Shield size={16} /> Permissions
                </h4>
                <div className="permission-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={isEditingLocked}
                      onChange={handleToggleLock}
                    />
                    Lock editing (only permitted users can edit)
                  </label>
                </div>

                {isEditingLocked && editableUserIds.length > 0 && (
                  <div className="editable-users">
                    <p className="label">Users with edit permission:</p>
                    <div className="users-list-compact">
                      {editableUserIds.map((userId) => {
                        const userInfo = activeUsers.find((u) => u.userId === userId);
                        return (
                          <div key={userId} className="editable-user-badge">
                            {userInfo?.username || 'Unknown'} ✓
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Panel */}
            {isOwner && showAdminPanel && (
              <div className="admin-panel">
                <h4>
                  <Shield size={16} /> Admin Controls
                </h4>

                <div className="admin-section">
                  <h5>Room Access Control</h5>
                  <div className="permission-option">
                    <label>
                      <input
                        type="checkbox"
                        checked={isEditingLocked}
                        onChange={handleToggleLock}
                      />
                      Strict Mode - Lock editing (only permitted users can edit)
                    </label>
                    <p className="help-text">When enabled, only users you grant permission will be able to edit code</p>
                  </div>
                </div>

                <div className="admin-section">
                  <h5>User Permissions</h5>
                  {activeUsers.length > 1 ? (
                    <div className="users-permission-list">
                      {activeUsers.map((activeUser) => {
                        if (activeUser.userId === user.id) return null;
                        const hasEditAccess = editableUserIds.includes(activeUser.userId);
                        return (
                          <div key={activeUser.userId} className="user-permission-row">
                            <div className="user-info-admin">
                              <span className="username">{activeUser.username}</span>
                              <span className={`status ${hasEditAccess ? 'can-edit' : 'read-only'}`}>
                                {hasEditAccess ? 'Can Edit' : 'Read Only'}
                              </span>
                            </div>
                            <div className="permission-buttons">
                              {hasEditAccess ? (
                                <button
                                  className="btn-small btn-revoke"
                                  onClick={() => handleRevokePermission(activeUser.userId)}
                                  title="Revoke edit permission"
                                >
                                  ✓ Edit
                                </button>
                              ) : (
                                <button
                                  className="btn-small btn-grant"
                                  onClick={() => handleGrantPermission(activeUser.userId)}
                                  title="Grant edit permission"
                                >
                                  ◯ Grant Edit
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="empty-message">No other users in this room yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Push Modal */}
      {showGitHubModal && (
        <GitHubPushModal
          roomId={roomId}
          onClose={() => setShowGitHubModal(false)}
          code={code}
        />
      )}

      {/* Manage Access Modal */}
      <ManageAccessModal
        isOpen={showManageAccessModal}
        onClose={() => setShowManageAccessModal(false)}
        activeUsers={activeUsers}
        editableUsers={editableUsers}
        currentUserId={user?.id}
        onRoleChange={handleChangeUserRole}
      />
    </>
  );
}
