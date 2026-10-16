const db = require('../db/db');

const query = (sql, values = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, values, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });

const getLoggedRole = (role) => {
    const value = String(role || '').toLowerCase().replace(/[\s-]/g, '_');

    if (['superadmin', 'super_admin'].includes(value)) return 'superadmin';
    if (['junior_admin', 'junioradmin'].includes(value)) return 'junior_admin';
    if (value === 'admin') return 'admin';
    if (value.includes('employee')) return 'employee';
    if (value.includes('customer')) return 'customer';

    return null;
};

// Employees list
const getchatuser = (callback) => {
    const sql = `SELECT id, name, email, mobile, designation
FROM employees
ORDER BY name ASC`
    db.query(sql, callback);
};

// Customer support group create/get
const getOrCreateCustomerSupportGroup = async (customerId) => {
    const groupName = `Customer Support ${customerId}`;

    const existing = await query(
        `SELECT id FROM chat_groups
         WHERE created_by = ?
           AND created_by_role = 'customer'
           AND group_name = ?
         ORDER BY id DESC LIMIT 1`,
        [customerId, groupName]
    );

    let groupId;

    if (existing.length) {
        groupId = Number(existing[0].id);
    } else {
        const created = await query(
            `INSERT INTO chat_groups
                (group_name, created_by, created_by_role)
             VALUES (?, ?, 'customer')`,
            [groupName, customerId]
        );

        groupId = Number(created.insertId);
    }

    const members = [
        { id: Number(customerId), role: 'customer' }
    ];

    const staffTables = [
        { table: 'employees', role: 'employee' },
        { table: 'superadmins', role: 'superadmin' },
        { table: 'junior_admins', role: 'junior_admin' }
    ];

    for (const staff of staffTables) {
        const rows = await query(`SELECT id FROM ${staff.table}`);

        for (const row of rows) {
            members.push({
                id: Number(row.id),
                role: staff.role
            });
        }
    }

    for (const member of members) {
        await query(
            `INSERT INTO chat_group_members
                (group_id, member_id, member_role)
             SELECT ?, ?, ?
             WHERE NOT EXISTS (
                SELECT 1 FROM chat_group_members
                WHERE group_id = ?
                  AND member_id = ?
                  AND member_role = ?
             )`,
            [
                groupId, member.id, member.role,
                groupId, member.id, member.role
            ]
        );
    }

    return groupId;
};

const getGroupForCustomer = async (customerId) => {
    const rows = await query(
        `SELECT id FROM chat_groups
         WHERE created_by = ?
           AND created_by_role = 'customer'
           AND group_name = ?
         ORDER BY id DESC LIMIT 1`,
        [customerId, `Customer Support ${customerId}`]
    );

    return rows.length ? Number(rows[0].id) : null;
};

// Check group membership
const isGroupMember = (groupId, userId, userRole, callback) => {
    const role = getLoggedRole(userRole);

    db.query(
        `SELECT 1 FROM chat_group_members
         WHERE group_id = ?
           AND member_id = ?
           AND member_role = ?
         LIMIT 1`,
        [groupId, userId, role],
        (err, rows) => callback(err, Boolean(rows && rows.length))
    );
};

// Chat history: status only for the currently logged-in recipient
const getchathistory = (room, type, viewerId, viewerRole, callback) => {
    const role = getLoggedRole(viewerRole);

    let sql = `
        SELECT
            m.id,
            m.sender_id,
            m.sender_role,
            m.receiver_id,
            m.receiver_role,
            m.room,
            m.chat_type,
            m.group_id,
            m.type,
            m.message,
            m.imageUrl,
            m.created_at,
            COALESCE(s.status, 'unread') AS my_status,
            s.seen_at AS my_seen_at
        FROM chat_message m
        LEFT JOIN chat_message_status s
          ON s.message_id = m.id
         AND s.receiver_id = ?
         AND s.receiver_role = ?
        WHERE m.room = ?
    `;

    const values = [viewerId, role, room];

    if (type) {
        sql += ' AND m.type = ?';
        values.push(type);
    }

    sql += ' ORDER BY m.created_at ASC';

    db.query(sql, values, callback);
};

// Save message + separate status for each recipient
const createChatMessage = (data, callback) => {
    db.beginTransaction((transactionErr) => {
        if (transactionErr) return callback(transactionErr);

        const messageSql = `
            INSERT INTO chat_message
            (
                sender_id, sender_role,
                receiver_id, receiver_role,
                room, chat_type, group_id,
                type, message, imageUrl
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.sender_id,
            data.sender_role,
            data.receiver_id ?? null,
            data.receiver_role ?? null,
            data.room,
            data.chat_type,
            data.group_id ?? null,
            data.type,
            data.message ?? null,
            data.imageUrl ?? null
        ];

        db.query(messageSql, values, (err, result) => {
            if (err) {
                return db.rollback(() => callback(err));
            }

            const messageId = result.insertId;

            const saveStatuses = (recipients) => {
                const unique = [
                    ...new Map(
                        recipients
                            .filter((r) =>
                                !(
                                    Number(r.receiver_id) === Number(data.sender_id) &&
                                    getLoggedRole(r.receiver_role) ===
                                    getLoggedRole(data.sender_role)
                                )
                            )
                            .map((r) => [
                                `${getLoggedRole(r.receiver_role)}:${r.receiver_id}`,
                                {
                                    receiver_id: Number(r.receiver_id),
                                    receiver_role: getLoggedRole(r.receiver_role)
                                }
                            ])
                    ).values()
                ];

                if (!unique.length) {
                    return db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => callback(commitErr));
                        }

                        callback(null, {
                            insertId: messageId,
                            recipients: 0
                        });
                    });
                }

                const statusValues = unique.map((r) => [
                    messageId,
                    r.receiver_id,
                    r.receiver_role,
                    'unread'
                ]);

                db.query(
                    `INSERT INTO chat_message_status
                     (message_id, receiver_id, receiver_role, status)
                     VALUES ?`,
                    [statusValues],
                    (statusErr) => {
                        if (statusErr) {
                            return db.rollback(() => callback(statusErr));
                        }

                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => callback(commitErr));
                            }

                            callback(null, {
                                insertId: messageId,
                                recipients: unique.length
                            });
                        });
                    }
                );
            };

            if (data.chat_type === 'private') {
                return saveStatuses([
                    {
                        receiver_id: data.receiver_id,
                        receiver_role: data.receiver_role
                    }
                ]);
            }

            db.query(
                `SELECT member_id AS receiver_id,
                        member_role AS receiver_role
                 FROM chat_group_members
                 WHERE group_id = ?`,
                [data.group_id],
                (membersErr, members) => {
                    if (membersErr) {
                        return db.rollback(() => callback(membersErr));
                    }

                    saveStatuses(members || []);
                }
            );
        });
    });
};

// Mark only this user's status as seen
const markMessageSeen = (messageId, receiverId, receiverRole, callback) => {
    db.query(
        `UPDATE chat_message_status
         SET status = 'seen', seen_at = CURRENT_TIMESTAMP
         WHERE message_id = ?
           AND receiver_id = ?
           AND receiver_role = ?
           AND status = 'unread'`,
        [messageId, receiverId, getLoggedRole(receiverRole)],
        callback
    );
};

// Delete own message and its statuses, within a transaction
const deleteChatMessage = (id, userId, userRole, callback) => {
    const role = getLoggedRole(userRole);

    db.beginTransaction((err) => {
        if (err) return callback(err);

        db.query(
            `SELECT id FROM chat_message
             WHERE id = ? AND sender_id = ? AND sender_role = ?
             LIMIT 1`,
            [id, userId, role],
            (findErr, rows) => {
                if (findErr) {
                    return db.rollback(() => callback(findErr));
                }

                if (!rows.length) {
                    return db.rollback(() => callback(null, { affectedRows: 0 }));
                }

                db.query(
                    `DELETE FROM chat_message_status WHERE message_id = ?`,
                    [id],
                    (statusErr) => {
                        if (statusErr) {
                            return db.rollback(() => callback(statusErr));
                        }

                        db.query(
                            `DELETE FROM chat_message WHERE id = ?`,
                            [id],
                            (deleteErr, result) => {
                                if (deleteErr) {
                                    return db.rollback(() => callback(deleteErr));
                                }

                                db.commit((commitErr) => {
                                    if (commitErr) {
                                        return db.rollback(() => callback(commitErr));
                                    }

                                    callback(null, result);
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};

const createAlert = (title, message, callback) => {
    db.query(
        `INSERT INTO alerts (title, message) VALUES (?, ?)`,
        [title, message],
        callback
    );
};

module.exports = {
    getchatuser,
    getchathistory,
    createChatMessage,
    markMessageSeen,
    createAlert,
    deleteChatMessage,
    getOrCreateCustomerSupportGroup,
    getGroupForCustomer,
    isGroupMember,
    getLoggedRole
};