const Task = require('../models/Task');
const CreativeStrategy = require('../models/Creative');
const User = require('../models/User');

// @desc    Get tasks assigned to logged-in user
// @route   GET /api/tasks/my-tasks
// @access  Private (content_writer, designer)
exports.getMyTasks = async (req, res, next) => {
  try {
    const { status, taskType } = req.query;

    const query = { assignedTo: req.user._id };
    if (status) query.status = status;
    if (taskType) query.taskType = taskType;

    const tasks = await Task.find(query)
      .populate('projectId', 'customerName businessName')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks (for PM/admin)
// @route   GET /api/tasks
// @access  Private (admin, manager, performance_marketer)
exports.getAllTasks = async (req, res, next) => {
  try {
    const { status, taskType, projectId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (taskType) query.taskType = taskType;
    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .populate('projectId', 'customerName businessName')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:taskId
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('projectId', 'customerName businessName')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status (start/complete)
// @route   PUT /api/tasks/:taskId/status
// @access  Private
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status, output, outputFiles, reviewNotes, contentOutput } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify ownership
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    task.status = status;
    if (output) task.output = output;
    if (outputFiles) task.outputFiles = outputFiles;
    if (reviewNotes) task.reviewNotes = reviewNotes;
    if (contentOutput) task.contentOutput = contentOutput;

    if (status === 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    // If content task completed, auto-assign to designer
    if (status === 'completed' && task.taskType === 'content_writing') {
      await autoAssignToDesigner(task);
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task content output
// @route   PUT /api/tasks/:taskId/content
// @access  Private (content_writer)
exports.updateTaskContent = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { headline, bodyText, cta, script, notes } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify ownership
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Verify it's a content writing task
    if (task.taskType !== 'content_writing') {
      return res.status(400).json({
        success: false,
        message: 'This is not a content writing task'
      });
    }

    // Update content output
    task.contentOutput = {
      headline: headline || task.contentOutput?.headline,
      bodyText: bodyText || task.contentOutput?.bodyText,
      cta: cta || task.contentOutput?.cta,
      script: script || task.contentOutput?.script,
      notes: notes || task.contentOutput?.notes
    };

    await task.save();

    // Also update the creative's contentOutput
    await CreativeStrategy.updateOne(
      { 'stages.creatives._id': task.creativeId },
      {
        $set: {
          'stages.$[].creatives.$[creative].contentOutput': task.contentOutput
        }
      },
      { arrayFilters: [{ 'creative._id': task.creativeId }] }
    );

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Auto-assign task to designer
async function autoAssignToDesigner(contentTask) {
  const User = require('../models/User');
  const Task = require('../models/Task');

  // Find an available designer
  const designer = await User.findOne({
    role: 'designer',
    isActive: true
  });

  if (!designer) {
    console.log('No designer available for auto-assignment');
    return;
  }

  // Create design task
  await Task.create({
    projectId: contentTask.projectId,
    creativeStrategyId: contentTask.creativeStrategyId,
    creativeId: contentTask.creativeId,
    creativeStage: contentTask.creativeStage,
    taskType: 'design',
    assignedTo: designer._id,
    assignedBy: contentTask.assignedBy,
    title: `Design for: ${contentTask.title.replace('Content for: ', '')}`,
    description: contentTask.description,
    priority: contentTask.priority,
    dueDate: contentTask.dueDate,
    contentOutput: contentTask.contentOutput,
    createdBy: contentTask.assignedBy
  });

  // Update creative status
  await CreativeStrategy.updateOne(
    { 'stages.creatives._id': contentTask.creativeId },
    {
      $set: {
        'stages.$[].creatives.$[creative].designStatus': 'pending',
        'stages.$[].creatives.$[creative].assignedDesigner': designer._id,
        'stages.$[].creatives.$[creative].designAssignedAt': new Date(),
        'stages.$[].creatives.$[creative].contentStatus': 'completed',
        'stages.$[].creatives.$[creative].contentCompletedAt': new Date(),
        'stages.$[].creatives.$[creative].contentOutput': contentTask.contentOutput
      }
    },
    { arrayFilters: [{ 'creative._id': contentTask.creativeId }] }
  );
}

// @desc    Get available content writers and designers
// @route   GET /api/tasks/team-members
// @access  Private
exports.getTeamMembers = async (req, res, next) => {
  try {
    const contentWriters = await User.find({
      role: 'content_writer',
      isActive: true
    }).select('name email');

    const designers = await User.find({
      role: 'designer',
      isActive: true
    }).select('name email');

    res.status(200).json({
      success: true,
      data: {
        contentWriters,
        designers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload design files for a task
// @route   POST /api/tasks/:taskId/upload
// @access  Private (designer)
exports.uploadTaskFiles = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { files } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify ownership
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Add files to task
    if (files && Array.isArray(files)) {
      task.outputFiles = [...task.outputFiles, ...files.map(f => ({
        name: f.name,
        path: f.path,
        uploadedAt: new Date()
      }))];
    }

    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};