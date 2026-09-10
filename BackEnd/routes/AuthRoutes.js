const express = require("express");
const router = express.Router();
const multer = require("multer");
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/AuthController');
const { protect, adminOnly } = require("../Middlewares/authMiddleware");
const upload = require("../Middlewares/uploadMiddleware");

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Image Upload Route
router.post("/upload-image", (req, res) => {
  upload.any()(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No file uploaded. Please attach an image file." });
    }

    const file = req.files[0];
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const imageUrl = `${protocol}://${req.get("host")}/uploads/${file.filename}`;

    res.status(200).json({ imageUrl });
  });
});

module.exports = router;
