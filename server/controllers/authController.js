const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const axios = require('axios');

// Register user
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with that email or username' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle specific validation errors
    let message = 'Registration failed';
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      message = `A user with this ${field} already exists`;
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      message = messages[0] || 'Validation failed';
    }
    
    res.status(400).json({ success: false, message, error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Initiate GitHub OAuth login
exports.githubLogin = (req, res) => {
  try {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GITHUB_REDIRECT_URI)}&scope=user,repo`;
    res.redirect(authUrl);
  } catch (error) {
    console.error('GitHub login error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate GitHub login' });
  }
};

// GitHub OAuth callback
exports.githubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ success: false, message: 'No authorization code provided' });
    }

    // Validate required environment variables
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error('Missing GitHub OAuth credentials in .env file');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token, error: tokenError } = tokenResponse.data;

    if (tokenError || !access_token) {
      console.error('GitHub token error:', tokenError);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=github_auth_failed`);
    }

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    const { id: githubId, login: username, email: githubEmail, avatar_url } = userResponse.data;

    // Check if user exists
    let user = await User.findOne({ githubId });

    if (!user) {
      // Create new user
      const newUser = await User.create({
        username,
        email: githubEmail || `${username}@github.com`,
        password: Math.random().toString(36), // Random password for OAuth users
        githubId,
        githubAccessToken: access_token,
        profileImage: avatar_url,
      });
      user = newUser;
    } else {
      // Update access token
      user.githubAccessToken = access_token;
      await user.save();
    }

    const token = generateToken(user._id);

    // Redirect directly to dashboard with token in URL
    // Frontend will extract token and store it in localStorage, then redirect to dashboard
    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}&authenticated=true`);
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
  }
};
