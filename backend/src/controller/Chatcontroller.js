const {
    getchatuser,
    getchathistory,
    createChatMessage,
    markMessageSeen,
    createAlert,
    deleteChatMessage,
    getOrCreateCustomerSupportGroup,
    isGroupMember,
    getLoggedRole
} = require('../models/Chatmodel');

const getLoggedInUser = (req) => {
    const user = req.user || {};

    const id =
        user.id ??
        user.userId ??
        user.customer_id ??
        user.employee_id ??
        user.admin_id;

    const role = getLoggedRole(
        user.role ?? user.userRole ?? user.user_type ?? user.type
    );

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0 || !role) {
        return null;
    }

    return {
        id: Number(id),
        role
    };
};

// GET /user-info
const Chatcontroller = (req, res) => {
    const user = getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid login token or role'
        });
    }

    getchatuser((err, employees) => {
        if (err) {
            console.error('Chat users error:', err);
            return res.status(500).json({
                success: false,
                message: 'Unable to get chat users'
            });
        }

        return res.status(200).json({
            success: true,
            loggedInUser: user,
            employees
        });
    });
};

// GET /user-chat/history?group_id=1
const Getchatcontroller = async (req, res) => {
    const user = getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid login token or role'
        });
    }

    try {
        let groupId = req.query.group_id
            ? Number(req.query.group_id)
            : null;

        const type = req.query.type || null;

        if (user.role === 'customer') {
            groupId = await getOrCreateCustomerSupportGroup(user.id);
        }

        if (!groupId || !Number.isInteger(groupId) || groupId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid group_id is required'
            });
        }

        const room = `support-${groupId}`;

        isGroupMember(groupId, user.id, user.role, (memberErr, isMember) => {
            if (memberErr) {
                console.error('Group membership error:', memberErr);
                return res.status(500).json({
                    success: false,
                    message: 'Unable to verify group membership'
                });
            }

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this support group'
                });
            }

            getchathistory(room, type, user.id, user.role, (historyErr, messages) => {
                if (historyErr) {
                    console.error('Chat history error:', historyErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Unable to get chat history'
                    });
                }

                return res.status(200).json({
                    success: true,
                    group_id: groupId,
                    room,
                    messages
                });
            });
        });
    } catch (err) {
        console.error('Get chat history error:', err);
        return res.status(500).json({
            success: false,
            message: 'Unable to get chat history'
        });
    }
};

// POST /chat-message
const ChatMessageController = async (req, res) => {
    const user = getLoggedInUser(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid login token or role'
        });
    }

    const {
        message,
        imageUrl,
        type = 'text'
    } = req.body;

    if (!message && !imageUrl) {
        return res.status(400).json({
            success: false,
            message: 'Message text or imageUrl is required'
        });
    }

    if (!['text', 'image'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'type must be text or image'
        });
    }

    if (type === 'image' && !imageUrl) {
        return res.status(400).json({
            success: false,
            message: 'imageUrl is required for image messages'
        });
    }

    try {
        let groupId = req.body.group_id
            ? Number(req.body.group_id)
            : null;

        if (user.role === 'customer') {
            groupId = await getOrCreateCustomerSupportGroup(user.id);
        }

        if (!groupId || !Number.isInteger(groupId) || groupId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid group_id is required'
            });
        }

        const room = `support-${groupId}`;

        isGroupMember(groupId, user.id, user.role, (memberErr, isMember) => {
            if (memberErr) {
                console.error('Membership check error:', memberErr);
                return res.status(500).json({
                    success: false,
                    message: 'Unable to verify group membership'
                });
            }

            if (!isMember) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this support group'
                });
            }

            createChatMessage({
                sender_id: user.id,
                sender_role: user.role,
                receiver_id: null,
                receiver_role: null,
                room,
                chat_type: 'group',
                group_id: groupId,
                type,
                message: message || null,
                imageUrl: imageUrl || null
            }, (err, result) => {
                if (err) {
                    console.error('Save chat message error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Unable to save chat message'
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: 'Chat message saved successfully',
                    message_id: result.insertId,
                    group_id: groupId,
                    room
                });
            });
        });
    } catch (err) {
   
    console.error("Save chat message error:", err);

    return res.status(500).json({
        success: false,
        message: "Unable to save chat message",
        error: err.message
    });

    }
};

// PATCH /messages/:id/seen
const MarkMessageSeenController = (req, res) => {

    const user = getLoggedInUser(req);
    const messageId = Number(req.params.id);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid login token or role'
        });
    }

    if (!Number.isInteger(messageId) || messageId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid message ID'
        });
    }

    markMessageSeen(messageId, user.id, user.role, (err, result) => {
        if (err) {
            console.error('Mark seen error:', err);
            return res.status(500).json({
                success: false,
                message: 'Unable to mark message as seen'
            });
        }

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Unread message status not found for this user'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Message marked as seen'
        });
    });
};

// DELETE /messages/:id
const DeleteMessageController = (req, res) => {
    const user = getLoggedInUser(req);
    const messageId = Number(req.params.id);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid login token or role'
        });
    }

    if (!Number.isInteger(messageId) || messageId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid message ID'
        });
    }

    deleteChatMessage(messageId, user.id, user.role, (err, result) => {
        if (err) {
            console.error('Delete message error:', err);
            return res.status(500).json({
                success: false,
                message: 'Unable to delete message'
            });
        }

        if (!result.affectedRows) {
            return res.status(403).json({
                success: false,
                message: 'Message not found or you cannot delete this message'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    });
};

// POST /alert-all
const AlertAllController = (req, res) => {
    const user = getLoggedInUser(req);
    const { title, message } = req.body;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid login token or role'
        });
    }

    if (!title || !message) {
        return res.status(400).json({
            success: false,
            message: 'title and message are required'
        });
    }

    createAlert(title, message, (err, result) => {
        if (err) {
            console.error('Create alert error:', err);
            return res.status(500).json({
                success: false,
                message: 'Unable to create alert'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Alert saved successfully',
            alert_id: result.insertId
        });
    });
};

module.exports = {
    Chatcontroller,
    Getchatcontroller,
    ChatMessageController,
    MarkMessageSeenController,
    AlertAllController,
    DeleteMessageController
};