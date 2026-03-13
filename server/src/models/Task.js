const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // References
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  creativeStrategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreativeStrategy',
    required: true
  },
  creativeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  creativeStage: {
    type: String,
    enum: ['awareness', 'consideration', 'conversion']
  },

  // Task type
  taskType: {
    type: String,
    enum: ['content_writing', 'design'],
    required: true
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },

  // Task details
  title: {
    type: String,
    required: true
  },
  description: { type: String },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Due date
  dueDate: { type: Date },

  // Output (content or design file reference)
  output: { type: String },
  outputFiles: [{
    name: { type: String },
    path: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Completion
  completedAt: { type: Date },
  reviewNotes: { type: String },

  // Content output (for content writing tasks)
  contentOutput: {
    headline: { type: String },
    bodyText: { type: String },
    cta: { type: String },
    script: { type: String },
    notes: { type: String }
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ projectId: 1, creativeId: 1 });

module.exports = mongoose.model('Task', taskSchema);