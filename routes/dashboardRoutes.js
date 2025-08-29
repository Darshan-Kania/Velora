import { Router } from 'express';
import {EmailModel} from '../models/Email.js';
import { UserModel } from '../models/User.js';
import { decryptEmails } from '../services/dashboardService.js';
const router = Router();

// Define your dashboard routes here
router.get("/", (req, res) => {
    res.status(200).send(`Welcome to your dashboard, ${req.user.email}`);
});
router.get("/emails", async (req, res) => {
  try {
    // Resolve user _id from JWT email
    const user = await UserModel.findOne({ email: req.user.email }).select("_id email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get query params (defaults if not provided)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch emails and total count
    let [emails, total] = await Promise.all([
      EmailModel.find({ user: user._id })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), // newest first
      EmailModel.countDocuments({ user: user._id }),
    ]);
    // Decrypt sensitive fields
    emails = await decryptEmails(emails);
    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: emails,
    });
  } catch (err) {
    console.error("❌ Pagination error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


export { router as dashboardRoutes };
