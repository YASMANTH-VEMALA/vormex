import { Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateToken } from '../utils/jwt.util';
import { sendVerificationEmail } from '../utils/email.util';
import { validateUsername, normalizeUsername } from '../utils/username.util';
import { recordActivity } from '../services/activity.service';
import { updateEngagementStreak } from './engagement.controller';
import {
  RegisterRequestBody,
  LoginRequestBody,
  AuthSuccessResponse,
  ErrorResponse,
  UserResponse,
  AuthenticatedRequest,
} from '../types/auth.types';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Minimum password length
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Hash password rounds
 */
const SALT_ROUNDS = 10;

/**
 * Get current authenticated user profile
 * 
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response<UserResponse | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        error: 'User not authenticated',
      });
      return;
    }

    const userId = String(req.user.userId);

    // Fetch user from database (all fields)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found',
      });
      return;
    }

    // Remove sensitive fields before sending response
    // Exclude: password, githubAccessToken, resetToken, verificationToken, and their expiry fields
    const {
      password: _password,
      githubAccessToken,
      resetToken: _resetToken,
      resetTokenExpiry: _resetTokenExpiry,
      verificationToken: _verificationToken,
      verificationTokenExpiry: _verificationTokenExpiry,
      ...safeUser
    } = user;

    // Prepare user response with all non-sensitive fields
    const userResponse: UserResponse = {
      id: safeUser.id,
      email: safeUser.email,
      username: safeUser.username, // Username is required
      name: safeUser.name,
      profileImage: safeUser.profileImage,
      bio: safeUser.bio,
      college: safeUser.college,
      branch: safeUser.branch,
      graduationYear: safeUser.graduationYear,
      isVerified: safeUser.isVerified,
      authProvider: safeUser.authProvider,
      googleId: safeUser.googleId,
      appleId: safeUser.appleId,
      
      // GitHub Integration Fields
      githubUsername: safeUser.githubUsername,
      githubId: safeUser.githubId,
      githubConnected: safeUser.githubConnected,
      githubAvatarUrl: safeUser.githubAvatarUrl,
      githubProfileUrl: safeUser.githubProfileUrl,
      githubLastSyncedAt: safeUser.githubLastSyncedAt,
      
      // Enhanced Profile Fields
      headline: safeUser.headline,
      bannerImageUrl: safeUser.bannerImageUrl,
      location: safeUser.location,
      currentYear: safeUser.currentYear,
      degree: safeUser.degree,
      portfolioUrl: safeUser.portfolioUrl,
      linkedinUrl: safeUser.linkedinUrl,
      otherSocialUrls: safeUser.otherSocialUrls,
      isOpenToOpportunities: safeUser.isOpenToOpportunities,
      interests: safeUser.interests || [],
      onboardingCompleted: (safeUser as any).onboardingCompleted ?? false,
      
      createdAt: safeUser.createdAt,
      updatedAt: safeUser.updatedAt,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * Register a new user with email and password
 * 
 * POST /api/auth/register
 * Body: { email, password, name, college?, branch? }
 */
export const register = async (
  req: { body: RegisterRequestBody },
  res: Response<AuthSuccessResponse | ErrorResponse>
): Promise<void> => {
  try {
    const { email, password, name, username, college, branch } = req.body;

    // Validate required fields
    if (!email || !password || !name || !username) {
      res.status(400).json({
        error: 'Email, password, name, and username are required',
      });
      return;
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({
        error: 'Invalid email format',
      });
      return;
    }

    // Validate password length
    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
      return;
    }

    // Validate and normalize username
    const normalizedUsername = normalizeUsername(username);
    const usernameValidation = validateUsername(normalizedUsername);
    if (!usernameValidation.valid) {
      res.status(400).json({
        error: usernameValidation.error || 'Invalid username format',
      });
      return;
    }

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUserByEmail) {
      res.status(409).json({
        error: 'User with this email already exists',
      });
      return;
    }

    // Check if username already exists
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUserByUsername) {
      res.status(409).json({
        error: 'Username already taken',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate verification token
    const plainVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = await bcrypt.hash(plainVerificationToken, SALT_ROUNDS);
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: normalizedUsername,
        password: hashedPassword,
        name,
        college: college || null,
        branch: branch || null,
        authProvider: 'email',
        isVerified: false,
        verificationToken: hashedVerificationToken,
        verificationTokenExpiry,
      },
    });

    // Send verification email (don't block registration if email fails)
    try {
      await sendVerificationEmail(email.toLowerCase(), plainVerificationToken, name);
    } catch (emailError) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', emailError);
      // User can still use the app and request resend verification later
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove sensitive fields before sending response
    // Note: password and verificationTokenExpiry from above are already used, so we rename them here to avoid conflict
    const {
      password: _password, // Rename to avoid conflict with req.body password
      githubAccessToken,
      resetToken,
      resetTokenExpiry: _resetTokenExpiry,
      verificationToken: _verificationToken,
      verificationTokenExpiry: _verificationTokenExpiry, // Rename to avoid conflict with local variable
      ...safeUser
    } = user;

    // Prepare user response with all non-sensitive fields
    const userResponse: UserResponse = {
      id: safeUser.id,
      email: safeUser.email,
      username: safeUser.username,
      name: safeUser.name,
      profileImage: safeUser.profileImage,
      bio: safeUser.bio,
      college: safeUser.college,
      branch: safeUser.branch,
      graduationYear: safeUser.graduationYear,
      isVerified: safeUser.isVerified,
      authProvider: safeUser.authProvider,
      googleId: safeUser.googleId,
      appleId: safeUser.appleId,
      
      // GitHub Integration Fields
      githubUsername: safeUser.githubUsername,
      githubId: safeUser.githubId,
      githubConnected: safeUser.githubConnected,
      githubAvatarUrl: safeUser.githubAvatarUrl,
      githubProfileUrl: safeUser.githubProfileUrl,
      githubLastSyncedAt: safeUser.githubLastSyncedAt,
      
      // Enhanced Profile Fields
      headline: safeUser.headline,
      bannerImageUrl: safeUser.bannerImageUrl,
      location: safeUser.location,
      currentYear: safeUser.currentYear,
      degree: safeUser.degree,
      portfolioUrl: safeUser.portfolioUrl,
      linkedinUrl: safeUser.linkedinUrl,
      otherSocialUrls: safeUser.otherSocialUrls,
      isOpenToOpportunities: safeUser.isOpenToOpportunities,
      interests: safeUser.interests || [],
      onboardingCompleted: (safeUser as any).onboardingCompleted ?? false,
      
      createdAt: safeUser.createdAt,
      updatedAt: safeUser.updatedAt,
    };

    // Return success response
    res.status(201).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration',
    });
  }
};

/**
 * Login user with email and password
 * 
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (
  req: { body: LoginRequestBody },
  res: Response<AuthSuccessResponse | ErrorResponse>
): Promise<void> => {
  try {
    const { email, username, emailOrUsername, password } = req.body;

    // Validate required fields
    if (!password) {
      res.status(400).json({
        error: 'Password is required',
      });
      return;
    }

    // Determine login identifier (email or username)
    let loginIdentifier: string | undefined;
    if (emailOrUsername) {
      loginIdentifier = emailOrUsername;
    } else if (email) {
      loginIdentifier = email;
    } else if (username) {
      loginIdentifier = username;
    }

    if (!loginIdentifier) {
      res.status(400).json({
        error: 'Email or username is required',
      });
      return;
    }

    // Determine if loginIdentifier is email (contains @) or username
    const isEmail = loginIdentifier.includes('@');
    const normalizedIdentifier = isEmail 
      ? loginIdentifier.toLowerCase() 
      : normalizeUsername(loginIdentifier);

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: normalizedIdentifier }
        : { username: normalizedIdentifier },
    });

    // Check if user exists
    if (!user) {
      res.status(401).json({
        error: 'Invalid email or password',
      });
      return;
    }

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      res.status(401).json({
        error: 'This account uses OAuth authentication. Please sign in with your OAuth provider.',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid email or password',
      });
      return;
    }

    // Check if email is verified (only for email/password users)
    // Google OAuth users are automatically verified, so they can login
    if (!user.isVerified) {
      res.status(403).json({
        error: 'Please verify your email before logging in. Check your inbox for verification link.',
        requiresVerification: true,
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove sensitive fields before sending response
    // Note: password from req.body is already used, so we rename it here to avoid conflict
    const {
      password: _password, // Rename to avoid conflict with req.body password
      githubAccessToken,
      resetToken,
      resetTokenExpiry: _resetTokenExpiry,
      verificationToken: _verificationToken,
      verificationTokenExpiry: _verificationTokenExpiry,
      ...safeUser
    } = user;

    // Prepare user response with all non-sensitive fields
    const userResponse: UserResponse = {
      id: safeUser.id,
      email: safeUser.email,
      username: safeUser.username,
      name: safeUser.name,
      profileImage: safeUser.profileImage,
      bio: safeUser.bio,
      college: safeUser.college,
      branch: safeUser.branch,
      graduationYear: safeUser.graduationYear,
      isVerified: safeUser.isVerified,
      authProvider: safeUser.authProvider,
      googleId: safeUser.googleId,
      appleId: safeUser.appleId,
      
      // GitHub Integration Fields
      githubUsername: safeUser.githubUsername,
      githubId: safeUser.githubId,
      githubConnected: safeUser.githubConnected,
      githubAvatarUrl: safeUser.githubAvatarUrl,
      githubProfileUrl: safeUser.githubProfileUrl,
      githubLastSyncedAt: safeUser.githubLastSyncedAt,
      
      // Enhanced Profile Fields
      headline: safeUser.headline,
      bannerImageUrl: safeUser.bannerImageUrl,
      location: safeUser.location,
      currentYear: safeUser.currentYear,
      degree: safeUser.degree,
      portfolioUrl: safeUser.portfolioUrl,
      linkedinUrl: safeUser.linkedinUrl,
      otherSocialUrls: safeUser.otherSocialUrls,
      isOpenToOpportunities: safeUser.isOpenToOpportunities,
      interests: safeUser.interests || [],
      onboardingCompleted: (safeUser as any).onboardingCompleted ?? false,
      
      createdAt: safeUser.createdAt,
      updatedAt: safeUser.updatedAt,
    };

    // Record login activity and update streak (non-blocking)
    recordActivity(user.id, 'login', 1).catch(console.error);
    updateEngagementStreak(user.id, 'login').catch(console.error);

    // Return success response
    res.status(200).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login',
    });
  }
};

