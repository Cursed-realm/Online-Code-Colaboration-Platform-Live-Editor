import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../utils/api';
import Navbar from '../components/common/Navbar';
import { Plus, ArrowRight, Users, Code, Zap } from 'lucide-react';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  // Handle GitHub OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const authenticated = searchParams.get('authenticated');

    if (token && authenticated) {
      // Store token in localStorage for API requests
      localStorage.setItem('token', token);
      // Clear URL params
      window.history.replaceState({}, document.title, '/dashboard');
      // Reload page to reinitialize auth context with new token
      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getUserProjects();
      setProjects(response.data.projects);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createNewRoom = async (e) => {
    e.preventDefault();
    if (!roomTitle.trim()) return;

    try {
      const response = await projectAPI.create({ title: roomTitle });
      const { roomId } = response.data.project;
      navigate(`/editor/${roomId}`);
    } catch (err) {
      setError('Failed to create room');
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;

    try {
      await projectAPI.joinProject(joinRoomId);
      navigate(`/editor/${joinRoomId}`);
    } catch (err) {
      setError('Failed to join room. Check the room ID.');
    }
  };

  const handleProjectClick = (roomId) => {
    navigate(`/editor/${roomId}`);
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="container">
          {/* Header */}
          <div className="dashboard-header fade-in">
            <div>
              <h1>Welcome back, {user?.username}!</h1>
              <p>Start collaborating or create a new coding session</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Quick Actions */}
          <div className="dashboard-grid">
            {/* Create New Room */}
            <div className="action-card new-room-card">
              <div className="action-icon">
                <Plus size={32} />
              </div>
              <h3>Create New Room</h3>
              {!showNewRoom ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowNewRoom(true)}
                >
                  New Session
                </button>
              ) : (
                <form onSubmit={createNewRoom} className="room-form">
                  <input
                    type="text"
                    placeholder="Room title..."
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    autoFocus
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-sm">Create</button>
                    <button 
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowNewRoom(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Join Existing Room */}
            <div className="action-card join-room-card">
              <div className="action-icon">
                <Users size={32} />
              </div>
              <h3>Join Room</h3>
              <form onSubmit={joinRoom} className="room-form">
                <input
                  type="text"
                  placeholder="Enter room ID..."
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">Join</button>
              </form>
            </div>
          </div>

          {/* Recent Projects */}
          <section className="recent-projects fade-in">
            <h2>Your Projects</h2>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <Code size={48} />
                <h3>No projects yet</h3>
                <p>Create or join a project to start collaborating</p>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((project) => (
                  <div 
                    key={project._id}
                    className="project-card"
                    onClick={() => handleProjectClick(project.roomId)}
                  >
                    <div className="project-header">
                      <h4>{project.title}</h4>
                      <span className="language-badge">{project.language}</span>
                    </div>
                    <p className="project-id">ID: {project.roomId.substring(0, 8)}...</p>
                    <div className="project-footer">
                      <span className="timestamp">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Features */}
          <section className="features-section fade-in">
            <h2>Why Choose Nexus?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <Zap size={32} />
                <h3>Real-time Sync</h3>
                <p>Changes appear instantly for all collaborators</p>
              </div>
              <div className="feature-card">
                <Code size={32} />
                <h3>Multiple Languages</h3>
                <p>Support for JavaScript, Python, Java, and more</p>
              </div>
              <div className="feature-card">
                <Users size={32} />
                <h3>Live Collaboration</h3>
                <p>See active users and cursor positions in real-time</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
