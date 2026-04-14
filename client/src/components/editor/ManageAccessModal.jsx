import React, { useState } from 'react';
import { X, Shield, Eye, Edit3 } from 'lucide-react';
import '../../styles/manage-access.css';

export default function ManageAccessModal({
  isOpen,
  onClose,
  activeUsers,
  editableUsers,
  currentUserId,
  onRoleChange,
  isLoading,
}) {
  const [selectedRole, setSelectedRole] = useState({});

  // Initialize selected roles from editableUsers
  React.useEffect(() => {
    const roles = {};
    activeUsers.forEach((user) => {
      if (user.userId !== currentUserId) {
        roles[user.userId] = editableUsers.includes(user.userId) ? 'editor' : 'viewer';
      }
    });
    setSelectedRole(roles);
  }, [activeUsers, editableUsers, currentUserId]);

  const handleRoleChange = (userId, newRole) => {
    setSelectedRole((prev) => ({
      ...prev,
      [userId]: newRole,
    }));
    onRoleChange(userId, newRole);
  };

  if (!isOpen) return null;

  const otherUsers = activeUsers.filter((user) => user.userId !== currentUserId);

  return (
    <>
      {/* Backdrop */}
      <div className="manage-access-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="manage-access-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Shield size={24} />
            <h2>Manage Access</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {otherUsers.length === 0 ? (
            <div className="empty-state">
              <Shield size={48} />
              <p>No other users in this room</p>
            </div>
          ) : (
            <div className="users-list">
              {otherUsers.map((user) => (
                <div key={user.userId} className="user-access-row">
                  <div className="user-details">
                    <div className="user-avatar">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <p className="user-name">{user.username}</p>
                      <span className="online-indicator">● Online</span>
                    </div>
                  </div>

                  <div className="role-selector">
                    <div className="role-options">
                      <button
                        className={`role-btn editor-btn ${
                          selectedRole[user.userId] === 'editor' ? 'active' : ''
                        }`}
                        onClick={() => handleRoleChange(user.userId, 'editor')}
                        disabled={isLoading}
                        title="Editor: Can read and write code"
                      >
                        <Edit3 size={16} />
                        <span>Editor</span>
                      </button>

                      <button
                        className={`role-btn viewer-btn ${
                          selectedRole[user.userId] === 'viewer' ? 'active' : ''
                        }`}
                        onClick={() => handleRoleChange(user.userId, 'viewer')}
                        disabled={isLoading}
                        title="Viewer: Can only read code"
                      >
                        <Eye size={16} />
                        <span>Viewer</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <p className="footer-text">
            ✏️ <strong>Editor</strong> – Can read and write code
          </p>
          <p className="footer-text">
            👁️ <strong>Viewer</strong> – Can only read code (editor locked)
          </p>
        </div>
      </div>
    </>
  );
}
