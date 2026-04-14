const User = require('../models/User');
const Project = require('../models/Project');
const { Octokit } = require('@octokit/rest');

// Get user's GitHub repositories
exports.getRepositories = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('+githubAccessToken');

    if (!user || !user.githubAccessToken) {
      return res.status(400).json({ success: false, message: 'GitHub not connected' });
    }

    const octokit = new Octokit({
      auth: user.githubAccessToken,
    });

    // Get user repos
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
    });

    const repoList = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner.login,
      url: repo.html_url,
      description: repo.description,
      private: repo.private,
    }));

    res.status(200).json({
      success: true,
      repositories: repoList,
    });
  } catch (error) {
    console.error('Get repositories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch repositories', error: error.message });
  }
};

// Push code to GitHub
exports.pushToGithub = async (req, res) => {
  try {
    const { roomId, repoName, repoOwner, message, branch } = req.body;
    const userId = req.userId;

    // Validation
    if (!roomId || !repoName || !repoOwner || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get project
    const project = await Project.findOne({ roomId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get user with GitHub token
    const user = await User.findById(userId).select('+githubAccessToken');
    if (!user || !user.githubAccessToken) {
      return res.status(400).json({ success: false, message: 'GitHub not connected' });
    }

    const octokit = new Octokit({
      auth: user.githubAccessToken,
    });

    const targetBranch = branch || 'main';
    const fileName = `code.${getFileExtension(project.language)}`;

    try {
      // Get current file (if exists)
      let sha;
      try {
        const { data: file } = await octokit.repos.getContent({
          owner: repoOwner,
          repo: repoName,
          path: fileName,
          ref: targetBranch,
        });
        sha = file.sha;
      } catch (error) {
        // File doesn't exist, that's ok
        sha = undefined;
      }

      // Create or update file
      const updateRequest = {
        owner: repoOwner,
        repo: repoName,
        path: fileName,
        message: message || 'Update via Nexus',
        content: Buffer.from(project.code).toString('base64'),
        branch: targetBranch,
      };

      if (sha) {
        updateRequest.sha = sha;
      }

      const { data: result } = await octokit.repos.createOrUpdateFileContents(updateRequest);

      // Update project with GitHub info
      project.githubRepo = {
        name: repoName,
        owner: repoOwner,
        branch: targetBranch,
      };
      await project.save();

      res.status(200).json({
        success: true,
        message: 'Code pushed to GitHub successfully',
        result: {
          commit: result.commit.message,
          url: result.commit.html_url,
        },
      });
    } catch (githubError) {
      throw new Error(`GitHub API error: ${githubError.message}`);
    }
  } catch (error) {
    console.error('Push to GitHub error:', error);
    res.status(500).json({ success: false, message: 'Failed to push to GitHub', error: error.message });
  }
};

// Get GitHub user info
exports.getGithubUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('+githubAccessToken');

    if (!user || !user.githubAccessToken) {
      return res.status(400).json({ success: false, message: 'GitHub not connected' });
    }

    const octokit = new Octokit({
      auth: user.githubAccessToken,
    });

    const { data: githubUser } = await octokit.users.getAuthenticated();

    res.status(200).json({
      success: true,
      github: {
        username: githubUser.login,
        name: githubUser.name,
        avatar: githubUser.avatar_url,
        bio: githubUser.bio,
        company: githubUser.company,
        location: githubUser.location,
      },
    });
  } catch (error) {
    console.error('Get GitHub user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch GitHub user', error: error.message });
  }
};

// Helper function to get file extension based on language
function getFileExtension(language) {
  const extensions = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    cplusplus: 'cpp',
    csharp: 'cs',
    php: 'php',
    ruby: 'rb',
    go: 'go',
    rust: 'rs',
    swift: 'swift',
    kotlin: 'kt',
    html: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
    xml: 'xml',
    yaml: 'yaml',
    shell: 'sh',
    bash: 'sh',
  };

  return extensions[language] || 'txt';
}
