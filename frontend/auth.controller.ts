import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const signToken = (id: string, role: string): string => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "2h" } as jwt.SignOptions
  );
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, mobileNumber, username, password } =
    req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      mobileNumber?: string;
      username?: string;
      password?: string;
    };

  if (!firstName || !lastName || !email || !mobileNumber || !username || !password) {
    res.status(400).json({ message: "All fields are required." });
    return;
  }

  // Check uniqueness on email, mobileNumber, username
  const duplicate = await User.findOne({
    $or: [
      { email: email.toLowerCase().trim() },
      { mobileNumber: mobileNumber.trim() },
      { username: username.toLowerCase().trim() },
    ],
  });

  if (duplicate) {
    let field = "User";
    if (duplicate.email === email.toLowerCase().trim()) field = "Email address";
    else if (duplicate.mobileNumber === mobileNumber.trim()) field = "Mobile number";
    else if (duplicate.username === username.toLowerCase().trim()) field = "Username";

    res.status(409).json({ message: `${field} is already registered.` });
    return;
  }

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    mobileNumber: mobileNumber.trim(),
    username: username.toLowerCase().trim(),
    password,
    role: "admin",
  });

  const token = signToken(String(user._id), user.role);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required." });
    return;
  }

  const user = await User.findOne({ username: username.toLowerCase().trim() });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: "Invalid username or password." });
    return;
  }

  // Record last login time
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(String(user._id), user.role);

  res.status(200).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
    },
  });
};

// GET /api/auth/me  (protected route — verifies token is still valid)
export const getMe = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  const user = await User.findById(req.userId).select("-password");

  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  res.status(200).json({ user });
};

// POST /api/auth/refresh  (protected — issue a fresh 2-hour token)
export const refreshToken = async (
  req: Request & { userId?: string; userRole?: string },
  res: Response
): Promise<void> => {
  if (!req.userId || !req.userRole) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  const token = signToken(req.userId, req.userRole);
  res.status(200).json({ token });
};

// PUT /api/auth/profile  (protected — update own profile)
export const updateProfile = async (
  req: Request & { userId?: string },
  res: Response
): Promise<void> => {
  const { firstName, lastName, email, mobileNumber, username, password } =
    req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      mobileNumber?: string;
      username?: string;
      password?: string;
    };

  if (!firstName || !lastName || !email || !mobileNumber || !username) {
    res.status(400).json({ message: "All fields except password are required." });
    return;
  }

  // Check uniqueness — exclude current user
  const duplicate = await User.findOne({
    _id: { $ne: req.userId },
    $or: [
      { email: email.toLowerCase().trim() },
      { mobileNumber: mobileNumber.trim() },
      { username: username.toLowerCase().trim() },
    ],
  });

  if (duplicate) {
    let field = "User";
    if (duplicate.email === email.toLowerCase().trim()) field = "Email address";
    else if (duplicate.mobileNumber === mobileNumber.trim()) field = "Mobile number";
    else if (duplicate.username === username.toLowerCase().trim()) field = "Username";
    res.status(409).json({ message: `${field} is already in use by another account.` });
    return;
  }

  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  user.firstName = firstName.trim();
  user.lastName = lastName.trim();
  user.email = email.toLowerCase().trim();
  user.mobileNumber = mobileNumber.trim();
  user.username = username.toLowerCase().trim();
  if (password && password.trim().length > 0) {
    user.password = password; // pre-save hook will hash it
  }

  await user.save();

  const updated = await User.findById(req.userId).select("-password");
  res.status(200).json({ user: updated });
};
