const Project = require('../models/Project');
const { v4: uuidv4 } = require('uuid');

// Create new project/room
exports.createProject = async (req, res) => {
  try {
    const { title, description, language, isPublic } = req.body;
    const userId = req.userId;

    const roomId = uuidv4();

    const project = await Project.create({
      roomId,
      title: title || 'Untitled Project',
      description,
      language: language || 'javascript',
      owner: userId,
      users: [userId],
      isPublic: isPublic || false,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: {
        id: project._id,
        roomId: project.roomId,
        title: project.title,
        language: project.language,
      },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Join existing project
exports.joinProject = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    const project = await Project.findOne({ roomId });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user already in project
    if (project.users.includes(userId)) {
      return res.status(200).json({
        success: true,
        message: 'Already in project',
        project: {
          id: project._id,
          roomId: project.roomId,
          title: project.title,
          code: project.code,
          language: project.language,
          owner: project.owner,
        },
      });
    }

    // Add user to project
    project.users.push(userId);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Joined project successfully',
      project: {
        id: project._id,
        roomId: project.roomId,
        title: project.title,
        code: project.code,
        language: project.language,
        owner: project.owner,
      },
    });
  } catch (error) {
    console.error('Join project error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get project details
exports.getProject = async (req, res) => {
  try {
    const { roomId } = req.params;

    const project = await Project.findOne({ roomId }).populate('owner', 'username email').populate('users', 'username email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      project: {
        id: project._id,
        roomId: project.roomId,
        title: project.title,
        description: project.description,
        code: project.code,
        language: project.language,
        owner: project.owner,
        users: project.users,
        activeUsers: project.activeUsers,
        githubRepo: project.githubRepo,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get user projects
exports.getUserProjects = async (req, res) => {
  try {
    const userId = req.userId;

    const projects = await Project.find({
      $or: [{ owner: userId }, { users: userId }],
    }).select('_id roomId title language owner createdAt');

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update project title
exports.updateProject = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title, description } = req.body;
    const userId = req.userId;

    const project = await Project.findOne({ roomId });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user is owner
    if (project.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    if (title) project.title = title;
    if (description) project.description = description;

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.userId;

    const project = await Project.findOne({ roomId });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user is owner
    if (project.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    await Project.deleteOne({ roomId });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
