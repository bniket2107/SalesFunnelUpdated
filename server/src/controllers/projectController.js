const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { getStageStatus, completeStage } = require('../middleware/stageGating');

// Helper to emit notification (will be set from index.js)
let io = null;
const setIO = (socketIO) => {
  io = socketIO;
};

// Helper to create and emit notification
const createNotification = async ({ recipient, type, title, message, projectId }) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      projectId
    });

    // Emit real-time notification via Socket.io
    if (io) {
      io.to(recipient.toString()).emit('notification', {
        _id: notification._id,
        type,
        title,
        message,
        projectId,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Build query
    let query = {};

    // If not admin, show projects where user is assigned or created by them
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user._id },
        { 'assignedTeam.performanceMarketer': req.user._id },
        { 'assignedTeam.uiUxDesigner': req.user._id },
        { 'assignedTeam.graphicDesigner': req.user._id },
        { 'assignedTeam.developer': req.user._id },
        { 'assignedTeam.tester': req.user._id }
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTeam.performanceMarketer', 'name email specialization')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization')
      .populate('assignedTeam.graphicDesigner', 'name email specialization')
      .populate('assignedTeam.developer', 'name email specialization')
      .populate('assignedTeam.tester', 'name email specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    // Add stage status to each project
    const projectsWithStatus = projects.map(project => ({
      ...project.toObject(),
      stageStatus: getStageStatus(project)
    }));

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: projectsWithStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTeam.performanceMarketer', 'name email specialization avatar')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization avatar')
      .populate('assignedTeam.graphicDesigner', 'name email specialization avatar')
      .populate('assignedTeam.developer', 'name email specialization avatar')
      .populate('assignedTeam.tester', 'name email specialization avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access - admin, creator, or assigned team member
    const userId = req.user._id.toString();
    const isAssigned =
      project.assignedTeam.performanceMarketer?._id?.toString() === userId ||
      project.assignedTeam.uiUxDesigner?._id?.toString() === userId ||
      project.assignedTeam.graphicDesigner?._id?.toString() === userId ||
      project.assignedTeam.developer?._id?.toString() === userId ||
      project.assignedTeam.tester?._id?.toString() === userId;

    if (req.user.role !== 'admin' && project.createdBy._id.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const {
      projectName,
      customerName,
      businessName,
      mobile,
      email,
      industry,
      description,
      budget,
      timeline
    } = req.body;

    // Create project with default stages
    const project = await Project.create({
      projectName,
      customerName,
      businessName,
      mobile,
      email,
      industry,
      description,
      budget,
      timeline,
      createdBy: req.user._id,
      stages: {
        onboarding: {
          isCompleted: true,
          completedAt: new Date()
        },
        marketResearch: {
          isCompleted: false
        },
        offerEngineering: {
          isCompleted: false
        },
        trafficStrategy: {
          isCompleted: false
        },
        landingPage: {
          isCompleted: false
        },
        creativeStrategy: {
          isCompleted: false
        }
      }
    });

    // Calculate initial progress
    project.calculateProgress();
    await project.save();

    res.status(201).json({
      success: true,
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    const {
      projectName,
      customerName,
      businessName,
      mobile,
      email,
      industry,
      description,
      budget,
      timeline,
      status
    } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    const fieldsToUpdate = {};
    if (projectName !== undefined) fieldsToUpdate.projectName = projectName;
    if (customerName) fieldsToUpdate.customerName = customerName;
    if (businessName) fieldsToUpdate.businessName = businessName;
    if (mobile) fieldsToUpdate.mobile = mobile;
    if (email) fieldsToUpdate.email = email;
    if (industry !== undefined) fieldsToUpdate.industry = industry;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (budget !== undefined) fieldsToUpdate.budget = budget;
    if (timeline) fieldsToUpdate.timeline = timeline;
    if (status) fieldsToUpdate.status = status;

    project = await Project.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
      .populate('assignedTeam.performanceMarketer', 'name email specialization avatar')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization avatar')
      .populate('assignedTeam.graphicDesigner', 'name email specialization avatar')
      .populate('assignedTeam.developer', 'name email specialization avatar')
      .populate('assignedTeam.tester', 'name email specialization avatar');

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign team to project
// @route   PUT /api/projects/:id/assign-team
// @access  Private (Admin only)
exports.assignTeam = async (req, res, next) => {
  try {
    const { performanceMarketer, uiUxDesigner, graphicDesigner, developer, tester } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update assigned team
    project.assignedTeam = {
      performanceMarketer: performanceMarketer || null,
      uiUxDesigner: uiUxDesigner || null,
      graphicDesigner: graphicDesigner || null,
      developer: developer || null,
      tester: tester || null
    };

    await project.save();

    // Send notifications to assigned team members
    const assignedRoles = [
      { id: performanceMarketer, role: 'Performance Marketer' },
      { id: uiUxDesigner, role: 'UI/UX Designer' },
      { id: graphicDesigner, role: 'Graphic Designer' },
      { id: developer, role: 'Developer' },
      { id: tester, role: 'Tester' }
    ];

    for (const assignment of assignedRoles) {
      if (assignment.id) {
        await createNotification({
          recipient: assignment.id,
          type: 'project_assigned',
          title: 'New Project Assignment',
          message: `You have been assigned as ${assignment.role} to project: ${project.projectName || project.businessName}`,
          projectId: project._id
        });
      }
    }

    // Populate team details
    await project.populate('assignedTeam.performanceMarketer', 'name email specialization avatar');
    await project.populate('assignedTeam.uiUxDesigner', 'name email specialization avatar');
    await project.populate('assignedTeam.graphicDesigner', 'name email specialization avatar');
    await project.populate('assignedTeam.developer', 'name email specialization avatar');
    await project.populate('assignedTeam.tester', 'name email specialization avatar');

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/Deactivate project
// @route   PUT /api/projects/:id/activate
// @access  Private (Admin only)
exports.toggleProjectActivation = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.isActive = isActive;
    await project.save();

    // Notify assigned team members when project is activated
    if (isActive) {
      const teamMembers = [
        project.assignedTeam.performanceMarketer,
        project.assignedTeam.uiUxDesigner,
        project.assignedTeam.graphicDesigner,
        project.assignedTeam.developer,
        project.assignedTeam.tester
      ].filter(Boolean);

      for (const memberId of teamMembers) {
        await createNotification({
          recipient: memberId,
          type: 'project_activated',
          title: 'Project Activated',
          message: `Project "${project.projectName || project.businessName}" is now active. You can start working on it.`,
          projectId: project._id
        });
      }
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload brand assets
// @route   POST /api/projects/:id/assets
// @access  Private
exports.uploadAssets = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const userId = req.user._id.toString();
    const isAssigned =
      project.assignedTeam.performanceMarketer?._id?.toString() === userId ||
      project.assignedTeam.uiUxDesigner?._id?.toString() === userId ||
      project.assignedTeam.graphicDesigner?._id?.toString() === userId ||
      project.assignedTeam.developer?._id?.toString() === userId ||
      project.assignedTeam.tester?._id?.toString() === userId;

    if (req.user.role !== 'admin' && project.createdBy.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload assets to this project'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Add uploaded files to project's brand assets
    const newAssets = req.files.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      publicId: file.filename,
      uploadedAt: new Date()
    }));

    project.brandAssets = [...project.brandAssets, ...newAssets];
    await project.save();

    res.status(200).json({
      success: true,
      data: project.brandAssets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get projects assigned to current user
// @route   GET /api/projects/assigned
// @access  Private
exports.getAssignedProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    let query = {
      $or: [
        { 'assignedTeam.performanceMarketer': req.user._id },
        { 'assignedTeam.uiUxDesigner': req.user._id },
        { 'assignedTeam.graphicDesigner': req.user._id },
        { 'assignedTeam.developer': req.user._id },
        { 'assignedTeam.tester': req.user._id }
      ]
    };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTeam.performanceMarketer', 'name email specialization')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization')
      .populate('assignedTeam.graphicDesigner', 'name email specialization')
      .populate('assignedTeam.developer', 'name email specialization')
      .populate('assignedTeam.tester', 'name email specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    // Add stage status to each project
    const projectsWithStatus = projects.map(project => ({
      ...project.toObject(),
      stageStatus: getStageStatus(project)
    }));

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: projectsWithStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project progress
// @route   GET /api/projects/:id/progress
// @access  Private
exports.getProjectProgress = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        progress: project.overallProgress,
        currentStage: project.currentStage,
        stages: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/projects/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Build query based on user role
    let query = {};

    if (req.user.role !== 'admin') {
      // For non-admins, show assigned projects
      query.$or = [
        { createdBy: req.user._id },
        { 'assignedTeam.performanceMarketer': req.user._id },
        { 'assignedTeam.uiUxDesigner': req.user._id },
        { 'assignedTeam.graphicDesigner': req.user._id },
        { 'assignedTeam.developer': req.user._id },
        { 'assignedTeam.tester': req.user._id }
      ];
    }

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      recentProjects
    ] = await Promise.all([
      Project.countDocuments(query),
      Project.countDocuments({ ...query, status: 'active', isActive: true }),
      Project.countDocuments({ ...query, status: 'completed' }),
      Project.find(query)
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('createdBy', 'name')
        .populate('assignedTeam.performanceMarketer', 'name')
        .populate('assignedTeam.uiUxDesigner', 'name')
        .populate('assignedTeam.graphicDesigner', 'name')
        .populate('assignedTeam.developer', 'name')
        .populate('assignedTeam.tester', 'name')
    ]);

    // Get projects by stage
    const projectsByStage = await Project.aggregate([
      { $match: query },
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        recentProjects,
        projectsByStage
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export setIO for use in other modules
exports.setIO = setIO;
exports.createNotification = createNotification;