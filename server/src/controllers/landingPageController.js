const LandingPage = require('../models/LandingPage');
const Project = require('../models/Project');
const { completeStage, getStageStatus } = require('../middleware/stageGating');
const { hasProjectAccess } = require('../utils/auth');

const checkProjectAccess = async (projectId, user) => {
  const project = await Project.findById(projectId)
    .populate('assignedTeam.performanceMarketer', '_id')
    .populate('assignedTeam.uiUxDesigner', '_id')
    .populate('assignedTeam.graphicDesigner', '_id')
    .populate('assignedTeam.developer', '_id')
    .populate('assignedTeam.tester', '_id');

  if (!project) {
    return { project: null, error: { status: 404, message: 'Project not found' } };
  }

  if (!hasProjectAccess(project, user)) {
    return { project: null, error: { status: 403, message: 'Not authorized to access this project' } };
  }

  return { project, error: null };
};

// @desc    Get landing page strategy for a project
// @route   GET /api/landing-pages/:projectId
// @access  Private
exports.getLandingPage = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access
    if (!project.stages.trafficStrategy.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Traffic Strategy first to access Landing Page Strategy'
      });
    }

    let landingPage = await LandingPage.findOne({ projectId });

    if (!landingPage) {
      // Create default landing page
      landingPage = await LandingPage.create({
        projectId,
        createdBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...landingPage.toObject(),
        completionPercentage: landingPage.calculateCompletion()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update landing page strategy
// @route   POST /api/landing-pages/:projectId
// @access  Private
exports.upsertLandingPage = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access
    if (!project.stages.trafficStrategy.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Traffic Strategy first to access Landing Page Strategy'
      });
    }

    const {
      type,
      leadCapture,
      nurturing,
      headline,
      subheadline,
      ctaText,
      designPreferences,
      seoSettings,
      isCompleted
    } = req.body;

    const landingPageData = {
      projectId,
      type: type || 'video_sales_letter',
      leadCapture: leadCapture || {},
      nurturing: nurturing || [],
      headline: headline || '',
      subheadline: subheadline || '',
      ctaText: ctaText || '',
      designPreferences: designPreferences || {},
      seoSettings: seoSettings || {},
      createdBy: req.user._id
    };

    // If marking as completed
    if (isCompleted) {
      landingPageData.isCompleted = true;
      landingPageData.completedAt = new Date();
    }

    const landingPage = await LandingPage.findOneAndUpdate(
      { projectId },
      landingPageData,
      { new: true, upsert: true, runValidators: true }
    );

    // If completed, update project stage
    if (isCompleted && !project.stages.landingPage.isCompleted) {
      await completeStage(projectId, 'landingPage');
    }

    // Get updated project
    const updatedProject = await Project.findById(projectId);

    res.status(200).json({
      success: true,
      data: {
        ...landingPage.toObject(),
        completionPercentage: landingPage.calculateCompletion(),
        projectProgress: {
          overallProgress: updatedProject.overallProgress,
          currentStage: updatedProject.currentStage,
          stages: getStageStatus(updatedProject)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add nurturing method
// @route   POST /api/landing-pages/:projectId/nurturing
// @access  Private
exports.addNurturing = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { method, frequency } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const landingPage = await LandingPage.findOne({ projectId });

    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page strategy not found'
      });
    }

    landingPage.nurturing.push({ method, frequency });
    await landingPage.save();

    res.status(200).json({
      success: true,
      data: landingPage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove nurturing method
// @route   DELETE /api/landing-pages/:projectId/nurturing/:nurturingId
// @access  Private
exports.removeNurturing = async (req, res, next) => {
  try {
    const { projectId, nurturingId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const landingPage = await LandingPage.findOne({ projectId });

    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page strategy not found'
      });
    }

    landingPage.nurturing = landingPage.nurturing.filter(
      n => n._id.toString() !== nurturingId
    );
    await landingPage.save();

    res.status(200).json({
      success: true,
      data: landingPage
    });
  } catch (error) {
    next(error);
  }
};