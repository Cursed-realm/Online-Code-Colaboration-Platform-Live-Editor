import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import { ArrowRight, Code, Users, Zap, Github, Play, Share2, Cpu } from 'lucide-react';
import '../styles/landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <>
      <Navbar />
      <div className="landing-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Code Together, Live</h1>
              <p className="hero-subtitle">
                Real-time collaboration platform for developers. Write code together, 
                push to GitHub instantly. No setup required.
              </p>
              <div className="hero-actions">
                <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
                  Get Started Free
                  <ArrowRight size={20} />
                </button>
              </div>
              <p className="hero-feature-text">⚡ No installation needed. Start coding in seconds.</p>
            </div>

            {/* Hero Visual */}
            <div className="hero-visual">
              <div className="editor-mockup">
                <div className="editor-header">
                  <span>main.js</span>
                  <span className="active-users">👥 3 users</span>
                </div>
                <div className="editor-code">
                  <pre>{`function collaborate() {
  const magic = "happens here";
  console.log("Building amazing things together!");
  return 🚀;
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="container">
            <h2>Powerful Features</h2>
            <div className="features-grid">
              <div className="feature">
                <Zap size={32} />
                <h3>Real-time Sync</h3>
                <p>See code changes from teammates instantly with zero latency</p>
              </div>
              <div className="feature">
                <Users size={32} />
                <h3>Live Collaboration</h3>
                <p>View active users, cursor positions, and collaborate seamlessly</p>
              </div>
              <div className="feature">
                <Code size={32} />
                <h3>Multiple Languages</h3>
                <p>Support for JavaScript, Python, Java, C++, Go, Rust and 20+ more</p>
              </div>
              <div className="feature">
                <Github size={32} />
                <h3>GitHub Integration</h3>
                <p>Push code directly to GitHub repositories with one click</p>
              </div>
              <div className="feature">
                <Play size={32} />
                <h3>Execute Code</h3>
                <p>Run your code and see output in real-time (Premium)</p>
              </div>
              <div className="feature">
                <Share2 size={32} />
                <h3>Share Rooms</h3>
                <p>Join projects with a link. Perfect for pair programming</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works">
          <div className="container">
            <h2>How It Works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Create or Join</h3>
                <p>Start a new coding session or join an existing one</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Code Together</h3>
                <p>Collaborate in real-time with live updates and cursor sync</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Push to GitHub</h3>
                <p>Save your work to GitHub repositories with custom commits</p>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <h3>Share & Scale</h3>
                <p>Invite team members and scale your collaboration effortlessly</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="container">
            <h2>Ready to Collaborate?</h2>
            <p>Join thousands of developers collaborating in real-time</p>
            <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
              Start Free Today
              <ArrowRight size={20} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h4>Nexus</h4>
                <p>Real-time code collaboration platform</p>
              </div>
              <div className="footer-section">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#docs">Docs</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Company</h4>
                <ul>
                  <li><a href="#about">About</a></li>
                  <li><a href="#blog">Blog</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#privacy">Privacy</a></li>
                  <li><a href="#terms">Terms</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2024 Nexus. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
