import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, X, Moon, Sun, LogOut, Palette } from 'lucide-react';
import '../../styles/navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { currentTheme, toggleTheme, themes, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [showThemeMenu, setShowThemeMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const themeList = Object.entries(themes).map(([key, theme]) => ({
    key,
    name: theme.name,
  }));

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">⚡</span>
            Nexus
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="navbar-toggle"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Navigation Menu */}
          <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                
                <div className="navbar-actions">
                  <div className="theme-selector">
                    <button 
                      className="btn-icon"
                      onClick={() => setShowThemeMenu(!showThemeMenu)}
                      title="Change theme"
                    >
                      <Palette size={20} />
                    </button>
                    {showThemeMenu && (
                      <div className="theme-menu">
                        {themeList.map(({ key, name }) => (
                          <button
                            key={key}
                            className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                            onClick={() => {
                              changeTheme(key);
                              setShowThemeMenu(false);
                            }}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="user-menu">
                    <span className="user-name">{user?.username}</span>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/" className="nav-link">Home</Link>
                <div className="navbar-actions">
                  <div className="theme-selector">
                    <button 
                      className="btn-icon"
                      onClick={() => setShowThemeMenu(!showThemeMenu)}
                      title="Change theme"
                    >
                      <Palette size={20} />
                    </button>
                    {showThemeMenu && (
                      <div className="theme-menu">
                        {themeList.map(({ key, name }) => (
                          <button
                            key={key}
                            className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                            onClick={() => {
                              changeTheme(key);
                              setShowThemeMenu(false);
                            }}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                  <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
