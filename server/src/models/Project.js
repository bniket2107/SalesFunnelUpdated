const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[+]?[\d\s-]{10,15}$/, 'Please enter a valid mobile number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  currentStage: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stages: {
    onboarding: {
      isCompleted: { type: Boolean, default: true },
      completedAt: { type: Date, default: Date.now }
    },
    marketResearch: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    offerEngineering: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    trafficStrategy: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    landingPage: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    creativeStrategy: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Calculate overall progress
projectSchema.methods.calculateProgress = function() {
  const stages = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
  const completedStages = stages.filter(stage => this.stages[stage].isCompleted).length;
  this.overallProgress = Math.round((completedStages / stages.length) * 100);
  return this.overallProgress;
};

// Get next available stage
projectSchema.methods.getNextStage = function() {
  const stages = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
  const stageNames = ['Onboarding', 'Market Research', 'Offer Engineering', 'Traffic Strategy', 'Landing Page', 'Creative Strategy'];

  for (let i = 0; i < stages.length; i++) {
    if (!this.stages[stages[i]].isCompleted) {
      return { index: i + 1, name: stageNames[i], key: stages[i] };
    }
  }
  return { index: 6, name: 'Completed', key: 'creativeStrategy' };
};

// Check if a stage is accessible
projectSchema.methods.isStageAccessible = function(stageKey) {
  const stages = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
  const stageIndex = stages.indexOf(stageKey);

  if (stageIndex === 0) return true;

  for (let i = 0; i < stageIndex; i++) {
    if (!this.stages[stages[i]].isCompleted) {
      return false;
    }
  }
  return true;
};

module.exports = mongoose.model('Project', projectSchema);