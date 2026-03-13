const mongoose = require('mongoose');

const creativeItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  creativeType: {
    type: String,
    enum: ['static_creative', 'video_creative', 'video_content'],
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'youtube', 'linkedin', 'tiktok', 'twitter'],
    required: true
  },
  dimensions: {
    width: { type: Number },
    height: { type: Number }
  },
  copy: {
    headline: { type: String },
    bodyText: { type: String },
    cta: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'approved', 'rejected'],
    default: 'pending'
  },
  // Content writer assignment (selected by PM when adding creative)
  assignedContentWriter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Designer assignment (auto-assigned after content completes)
  assignedDesigner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Task workflow status
  contentStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  designStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  // Content output (what writer delivers)
  contentOutput: {
    headline: { type: String },
    bodyText: { type: String },
    cta: { type: String },
    script: { type: String }, // For video_content type
    notes: { type: String }
  },
  // Timestamps for workflow tracking
  contentAssignedAt: { type: Date },
  contentCompletedAt: { type: Date },
  designAssignedAt: { type: Date },
  designCompletedAt: { type: Date },
  dueDate: {
    type: Date
  },
  notes: {
    type: String
  },
  files: [{
    name: { type: String },
    path: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const stageCreativeSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['awareness', 'consideration', 'conversion'],
    required: true
  },
  creatives: [creativeItemSchema],
  totalCreatives: {
    type: Number,
    default: 0
  }
}, { _id: false });

const creativeStrategySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  stages: [stageCreativeSchema],
  totalCreatives: {
    type: Number,
    default: 0
  },
  creativeBrief: {
    type: String,
    trim: true
  },
  brandGuidelines: {
    logo: { type: String },
    colors: [{ type: String }],
    fonts: [{ type: String }],
    toneOfVoice: { type: String }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate total creatives
creativeStrategySchema.methods.calculateTotal = function() {
  let total = 0;
  this.stages.forEach(stage => {
    stage.totalCreatives = stage.creatives?.length || 0;
    total += stage.totalCreatives;
  });
  this.totalCreatives = total;
  return total;
};

// Calculate completion percentage
creativeStrategySchema.methods.calculateCompletion = function() {
  let completedItems = 0;
  const totalItems = 3;

  // Check if at least one creative exists
  if (this.stages?.some(s => s.creatives?.length > 0)) completedItems++;

  // Check if creative brief exists
  if (this.creativeBrief) completedItems++;

  // Check if at least one creative has an assigned designer
  const hasAssignedDesigner = this.stages?.some(s =>
    s.creatives?.some(c => c.assignedDesigner)
  );
  if (hasAssignedDesigner) completedItems++;

  return Math.round((completedItems / totalItems) * 100);
};

module.exports = mongoose.model('CreativeStrategy', creativeStrategySchema);