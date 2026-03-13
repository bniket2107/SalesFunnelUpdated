const MarketResearch = require('../models/MarketResearch');
const Project = require('../models/Project');
const { completeStage, getStageStatus } = require('../middleware/stageGating');

// @desc    Get market research for a project
// @route   GET /api/market-research/:projectId
// @access  Private
exports.getMarketResearch = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

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

    let marketResearch = await MarketResearch.findOne({ projectId });

    if (!marketResearch) {
      // Create default market research
      marketResearch = await MarketResearch.create({
        projectId,
        createdBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...marketResearch.toObject(),
        completionPercentage: marketResearch.calculateCompletion()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update market research
// @route   POST /api/market-research/:projectId
// @access  Private
exports.upsertMarketResearch = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

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

    // Check if market research stage is accessible
    if (!project.stages.onboarding.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Customer Onboarding first to access Market Research'
      });
    }

    const {
      avatar,
      painPoints,
      desires,
      existingPurchases,
      competitors,
      visionBoard,
      strategySheet,
      isCompleted
    } = req.body;

    const marketResearchData = {
      projectId,
      avatar: avatar || {},
      painPoints: painPoints || [],
      desires: desires || [],
      existingPurchases: existingPurchases || [],
      competitors: competitors || [],
      visionBoard: visionBoard || {},
      strategySheet: strategySheet || {},
      createdBy: req.user._id
    };

    // If marking as completed
    if (isCompleted) {
      marketResearchData.isCompleted = true;
      marketResearchData.completedAt = new Date();
    }

    const marketResearch = await MarketResearch.findOneAndUpdate(
      { projectId },
      marketResearchData,
      { new: true, upsert: true, runValidators: true }
    );

    // If completed, update project stage
    if (isCompleted && !project.stages.marketResearch.isCompleted) {
      await completeStage(projectId, 'marketResearch');
    }

    // Get updated project
    const updatedProject = await Project.findById(projectId);

    res.status(200).json({
      success: true,
      data: {
        ...marketResearch.toObject(),
        completionPercentage: marketResearch.calculateCompletion(),
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

// @desc    Upload vision board
// @route   POST /api/market-research/:projectId/vision-board
// @access  Private
exports.uploadVisionBoard = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const project = await Project.findById(projectId);

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

    const marketResearch = await MarketResearch.findOneAndUpdate(
      { projectId },
      {
        visionBoard: {
          fileName: req.file.originalname,
          filePath: req.file.path,
          uploadedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: marketResearch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload strategy sheet
// @route   POST /api/market-research/:projectId/strategy-sheet
// @access  Private
exports.uploadStrategySheet = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const project = await Project.findById(projectId);

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

    const marketResearch = await MarketResearch.findOneAndUpdate(
      { projectId },
      {
        strategySheet: {
          fileName: req.file.originalname,
          filePath: req.file.path,
          uploadedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: marketResearch
    });
  } catch (error) {
    next(error);
  }
};