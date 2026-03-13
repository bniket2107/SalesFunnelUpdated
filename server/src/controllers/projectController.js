const Project = require('../models/Project');
const { getStageStatus, completeStage } = require('../middleware/stageGating');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Build query
    let query = {};

    // If not admin, only show user's projects
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
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
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && project.createdBy._id.toString() !== req.user._id.toString()) {
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
    const { customerName, businessName, mobile, email } = req.body;

    // Create project with default stages
    const project = await Project.create({
      customerName,
      businessName,
      mobile,
      email,
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
    const { customerName, businessName, mobile, email, status } = req.body;

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
    if (customerName) fieldsToUpdate.customerName = customerName;
    if (businessName) fieldsToUpdate.businessName = businessName;
    if (mobile) fieldsToUpdate.mobile = mobile;
    if (email) fieldsToUpdate.email = email;
    if (status) fieldsToUpdate.status = status;

    project = await Project.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

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
// @access  Private
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
    const query = req.user.role !== 'admin'
      ? { createdBy: req.user._id }
      : {};

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      recentProjects
    ] = await Promise.all([
      Project.countDocuments(query),
      Project.countDocuments({ ...query, status: 'active' }),
      Project.countDocuments({ ...query, status: 'completed' }),
      Project.find(query)
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('createdBy', 'name')
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