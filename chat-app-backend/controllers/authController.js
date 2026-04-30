import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import EmailOtp from "../models/EmailOtp.js";
import { sendOtp } from "../utils/mailer.js";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();


export const register = async (req, res) => {
    console.log("REGISTER HIT"); // 👈 VERY IMPORTANT
  
    try {
      console.log("BODY:", req.body);
  
      const { username, email, password } = req.body;
  
      const normalizedEmail = email.toLowerCase();
  
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ error: "User already exists" });
      }
  
      const hashed = await bcrypt.hash(password, 10);
  
      await User.create({
        username,
        email: normalizedEmail,
        password: hashed,
        emailVerified: false,
      });
  
      console.log("USER CREATED");
  
      const otp = generateOtp();
      console.log("OTP:", otp);
  
      const otpHash = await bcrypt.hash(otp, 10);
  
      await EmailOtp.deleteMany({ email: normalizedEmail });
  
      await EmailOtp.create({
        email: normalizedEmail,
        otp: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
  
      console.log("OTP SAVED");
  
      await sendOtp(normalizedEmail, otp);
  
      console.log("EMAIL SENT");
  
      return res.status(201).json({
        message: "User registered. OTP sent.",
      });
  
    } catch (err) {
      console.error("🔥 REGISTER ERROR:", err); // 👈 THIS MUST PRINT
      return res.status(500).json({ error: err.message });
    }
  };

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = email.toLowerCase();

    const otpRecord = await EmailOtp.findOne({ email: normalizedEmail });

   
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

   
    const isValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

   
    await User.updateOne(
      { email: normalizedEmail },
      { $set: { emailVerified: true } }
    );

   
    await EmailOtp.deleteMany({ email: normalizedEmail });

    return res.json({
      message: "Email verified successfully",
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const resendOtp = async (req, res) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase();
  
      const existingOtp = await EmailOtp.findOne({ email: normalizedEmail });
  
     
      if (existingOtp) {
        const diff = Date.now() - new Date(existingOtp.createdAt).getTime();
  
        if (diff < 60 * 1000) {
          return res.status(429).json({
            error: "Please wait before requesting OTP again"
          });
        }
      }
  
     
      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
  

      await EmailOtp.deleteMany({ email: normalizedEmail });
  
      
      await EmailOtp.create({
        email: normalizedEmail,
        otp: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
  
      
      await sendOtp(normalizedEmail, otp);
  
      res.json({
        message: "OTP resent successfully"
      });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }


    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified",
        action: "verify_email",
      });
    }

  
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};