import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'general'
  },
  quickReplies: [String],
  results: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined
  },
  resultsType: {
    type: String,
    default: undefined
  },
  providerStatus: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined
  },
  pendingSearch: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined
  },
  conversion: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  conversation_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  last_message_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

conversationSchema.index({ user_id: 1, last_message_at: -1 });

export default mongoose.model('Conversation', conversationSchema);
