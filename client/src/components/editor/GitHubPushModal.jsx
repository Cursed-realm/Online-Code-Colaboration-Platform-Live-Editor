import React, { useState, useEffect } from 'react';
import { githubAPI } from '../../utils/api';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import '../../styles/github-modal.css';

export default function GitHubPushModal({ roomId, onClose, code }) {
  const [step, setStep] = useState('repos'); // repos, push, success, error
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Update code from Nexus');
  const [branch, setBranch] = useState('main');
  const [pushError, setPushError] = useState('');

  // Fetch repositories on mount
  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await githubAPI.getRepositories();
      setRepositories(response.data.repositories);
      if (response.data.repositories.length > 0) {
        setSelectedRepo(response.data.repositories[0].name);
      }
    } catch (err) {
      setError('Failed to load repositories. Make sure GitHub is connected.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async (e) => {
    e.preventDefault();
    
    if (!selectedRepo) {
      setPushError('Please select a repository');
      return;
    }

    const selectedRepoObj = repositories.find(r => r.name === selectedRepo);
    
    try {
      setLoading(true);
      setPushError('');
      
      await githubAPI.pushToGithub({
        roomId,
        repoName: selectedRepo,
        repoOwner: selectedRepoObj.owner,
        message,
        branch,
      });

      setStep('success');
    } catch (err) {
      setPushError(err.response?.data?.message || 'Failed to push to GitHub');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content github-modal">
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <>
          {step === 'repos' && (
            <>
              <h2>Push to GitHub</h2>
              {error ? (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  {error}
                </div>
              ) : loading ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading your repositories...</p>
                </div>
              ) : repositories.length === 0 ? (
                <div className="alert alert-info">
                  <AlertCircle size={18} />
                  No repositories found. Create a repository on GitHub first.
                </div>
              ) : (
                <form onSubmit={handlePush}>
                  <div className="form-group">
                    <label>Select Repository</label>
                    <select
                      value={selectedRepo}
                      onChange={(e) => setSelectedRepo(e.target.value)}
                    >
                      {repositories.map((repo) => (
                        <option key={repo.id} value={repo.name}>
                          {repo.owner}/{repo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Branch (default: main)</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                    />
                  </div>

                  <div className="form-group">
                    <label>Commit Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your changes"
                      rows="3"
                    />
                  </div>

                  {pushError && (
                    <div className="alert alert-error">
                      <AlertCircle size={18} />
                      {pushError}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={onClose}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Pushing...' : 'Push to GitHub'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {step === 'success' && (
            <div className="modal-success">
              <CheckCircle size={48} />
              <h2>Successfully Pushed!</h2>
              <p>Your code has been pushed to GitHub</p>
              <button className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="modal-error">
              <AlertCircle size={48} />
              <h2>Push Failed</h2>
              <p>{pushError}</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setStep('repos');
                  setPushError('');
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </>
      </div>
    </div>
  );
}
