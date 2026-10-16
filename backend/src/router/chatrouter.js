const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authMiddleware = require('../middleware/authMiddleware');

const {
    Chatcontroller,
    Getchatcontroller,
    ChatMessageController,
    MarkMessageSeenController,
    AlertAllController,
    DeleteMessageController
} = require('../controller/Chatcontroller');

const chatrouter = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

        if (!allowedExtensions.includes(extension)) {
            return cb(new Error('Unsupported image extension'));
        }

        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            return cb(null, true);
        }

        cb(new Error('Only JPG, PNG, WEBP and GIF images are allowed'));
    }
});

// Chat users
chatrouter.get(
    '/user-info',
    authMiddleware,
    Chatcontroller
);

// Customer/staff chat history
chatrouter.get(
    '/user-chat/history',
    authMiddleware,
    Getchatcontroller
);

// Upload chat image
chatrouter.post(
    '/chat-upload-image',
    authMiddleware,
    upload.single('image'),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Image file is required'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: `/uploads/${req.file.filename}`
        });
    }
);

// Send text/image message
chatrouter.post(
    '/chat-message',
    authMiddleware,
    ChatMessageController
);

// Mark message as seen for the logged-in user only
chatrouter.patch(
    '/messages/:id/seen',
    authMiddleware,
    MarkMessageSeenController
);

// Create alert
chatrouter.post(
    '/alert-all',
    authMiddleware,
    AlertAllController
);

// Delete own message
chatrouter.delete(
    '/messages/:id',
    authMiddleware,
    DeleteMessageController
);

// Handle upload errors
chatrouter.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.code === 'LIMIT_FILE_SIZE'
                ? 'Image size cannot exceed 5 MB'
                : err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Upload failed'
        });
    }

    next();
});

module.exports = chatrouter;