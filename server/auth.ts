import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import { authenticator } from "otplib";
import * as qrcode from "qrcode";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dress-shop-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Create admin account if it doesn't exist
  createAdminIfNotExists().catch(console.error);

  // Auth routes
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ authenticated: false });
    }
    res.json({ authenticated: true, user: req.user });
  });
  
  // 2FA Routes
  app.post("/api/2fa/setup", isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      
      // Generate a secret for the user
      const secret = generateTwoFactorSecret(user.username);
      
      // Store the secret in the database
      await storage.updateUserTwoFactorSecret(user.id, secret);
      
      // Generate a QR code data URL
      const qrCodeDataUrl = await generateQRCode(user.username, secret);
      
      res.json({
        success: true,
        qrCode: qrCodeDataUrl,
        secret
      });
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      res.status(500).json({ message: "Failed to set up 2FA" });
    }
  });
  
  app.post("/api/2fa/verify", isAuthenticated, async (req, res) => {
    try {
      const { token } = req.body;
      const user = req.user!;
      
      if (!user.twoFactorSecret) {
        return res.status(400).json({ message: "2FA not set up for this user" });
      }
      
      const isValid = verifyTwoFactorToken(token, user.twoFactorSecret);
      
      if (isValid) {
        // Enable 2FA for the user
        await storage.enableTwoFactor(user.id);
        res.json({ success: true, message: "2FA successfully enabled" });
      } else {
        res.status(400).json({ success: false, message: "Invalid token" });
      }
    } catch (error) {
      console.error("Error verifying 2FA token:", error);
      res.status(500).json({ message: "Failed to verify 2FA token" });
    }
  });
  
  app.post("/api/2fa/disable", isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      
      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA not enabled for this user" });
      }
      
      await storage.disableTwoFactor(user.id);
      res.json({ success: true, message: "2FA successfully disabled" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });
}

// Middleware to ensure a user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized: Please login to continue" });
}

// Middleware to ensure a user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
}

// Generate a 2FA secret for a user
export function generateTwoFactorSecret(username: string): string {
  return authenticator.generateSecret();
}

// Generate a QR code URL for Google Authenticator
export async function generateQRCode(username: string, secret: string): Promise<string> {
  const serviceName = "DressShop Admin";
  const otpauth = authenticator.keyuri(username, serviceName, secret);
  return qrcode.toDataURL(otpauth);
}

// Verify a token against a user's secret
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

// Create admin account if it doesn't exist
async function createAdminIfNotExists() {
  try {
    const admin = await storage.getUserByUsername("admin");
    if (!admin) {
      console.log("Creating admin account...");
      await storage.createUser({
        username: "admin",
        password: await hashPassword("P@$$word@ADMIN"),
        isAdmin: true
      });
      console.log("Admin account created successfully");
    }
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}