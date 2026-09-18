import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    select: false
  },
  phoneNumber: {
    type: String,
    default: null,
    match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
  },
  profileImage: {
    type: String,
    default: null
  },
  nationality: {
    type: String,
    default: null,
    uppercase: true,
    match: [/^[A-Z]{3}$/, 'Nationality must be an ISO-3 country code']
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  authProviders: [{
    type: String,
    enum: ['local', 'google', 'facebook', 'twitter']
  }],
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  facebookId: {
    type: String,
    sparse: true,
    unique: true
  },
  twitterId: {
    type: String,
    sparse: true,
    unique: true
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '30d'
    }
  }],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  preferences: {
    travelStyle: { type: String, enum: ['budget', 'moderate', 'luxury', 'premium'], default: null },
    preferredActivities: { type: [String], default: [] },
    seatClass: { type: String, enum: ['economy', 'premium_economy', 'business', 'first'], default: null },
    hotelStars: { type: Number, min: 1, max: 5, default: null },
    dietaryRestrictions: { type: [String], default: [] },
    accessibility: { type: [String], default: [] }
  },
  notificationPreferences: {
    tripReminders: { type: Boolean, default: true },
    bookingConfirmations: { type: Boolean, default: true },
    aiRecommendations: { type: Boolean, default: true },
    tripStoryActivity: { type: Boolean, default: true }
  },
  mapPrivacy: {
    type: String,
    enum: ['private', 'countries_only', 'full_map', 'selected_trips'],
    default: 'private'
  },
  mapShareToken: { type: String, index: true, sparse: true },
  achievements: [{
    id: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
  }],
  newsletterSubscribed: { type: Boolean, default: false },
  shippingAddress: {
    line1: { type: String, trim: true, default: '' },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.passwordHash;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});


userSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (error) {
    throw error;
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.addAuthProvider = function(provider) {
  if (!this.authProviders.includes(provider)) {
    this.authProviders.push(provider);
  }
};

userSchema.methods.hasProvider = function(provider) {
  return this.authProviders.includes(provider);
};

userSchema.statics.findByProvider = async function(provider, providerId) {
  const query = {};

  switch(provider) {
    case 'google':
      query.googleId = providerId;
      break;
    case 'facebook':
      query.facebookId = providerId;
      break;
    case 'twitter':
      query.twitterId = providerId;
      break;
    default:
      return null;
  }

  return await this.findOne(query);
};

const extractProfileImage = (profile) => {
  if (profile.photos && profile.photos.length > 0) {
    return profile.photos[0].value;
  }
  if (profile._json && profile._json.picture) {
    return profile._json.picture;
  }
  if (profile.picture) {
    return profile.picture;
  }
  return null;
};

userSchema.statics.findOrCreateFromOAuth = async function(provider, profile) {
  try {
    let email = null;
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    } else if (profile.email) {
      email = profile.email;
    }

    const profileImage = extractProfileImage(profile);

    let user = await this.findByProvider(provider, profile.id);

    if (user) {
      user.lastLogin = new Date();
      user.addAuthProvider(provider);

      if (profileImage && (!user.profileImage || user.profileImage.includes('googleusercontent') || user.profileImage.includes('facebook') || user.profileImage.includes('twimg'))) {
        user.profileImage = profileImage;
      }

      await user.save();
      return user;
    }

    if (email) {
      user = await this.findOne({ email });

      if (user) {
        user[`${provider}Id`] = profile.id;
        user.addAuthProvider(provider);

        if (profileImage && (!user.profileImage || user.profileImage.includes('googleusercontent') || user.profileImage.includes('facebook') || user.profileImage.includes('twimg'))) {
          user.profileImage = profileImage;
        }

        if (profile.email_verified || profile.verified || profile._json?.email_verified) {
          user.emailVerified = true;
        }

        user.lastLogin = new Date();
        await user.save();
        return user;
      }
    }

    const newUser = new this({
      name: profile.displayName || profile.username || 'User',
      email: email || `${provider}_${profile.id}@placeholder.com`,
      [`${provider}Id`]: profile.id,
      authProviders: [provider],
      profileImage: profileImage,
      emailVerified: profile.email_verified || profile.verified || profile._json?.email_verified || false,
      lastLogin: new Date()
    });

    await newUser.save();
    return newUser;
  } catch (error) {
    throw new Error(`Error in findOrCreateFromOAuth: ${error.message}`);
  }
};

const User = mongoose.model('User', userSchema);

export default User;
