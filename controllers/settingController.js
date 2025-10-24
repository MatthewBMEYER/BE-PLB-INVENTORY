const express = require('express')
const { DB } = require('../config/conf')
const { v4: uuidv4 } = require('uuid');

module.exports = {

    getAllRoles: async function (req, res) {
        try {
            const request = DB.promise();
            const [roles] = await request.query("SELECT * FROM m_role");
            res.json({ data: roles });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch roles." });
        }
    },

    getAccessByRole: async function (req, res) {
        const { role_id } = req.params;
        try {
            const request = DB.promise();
            const query = `
                SELECT DISTINCT header_menu 
                FROM role_menu 
                WHERE role_id = ? AND isactive = 1
            `;
            const [rows] = await request.query(query, [role_id]);
            const headers = rows.map(row => row.header_menu);

            return res.json({ kode: 200, data: headers });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ kode: 500, message: "Gagal ambil akses role" });
        }
    },

    updateAccessForRole: async function (req, res) {
        const { role_id } = req.params;
        const { headers } = req.body;

        if (!headers || !Array.isArray(headers)) {
            return res.status(400).json({ kode: 400, message: "Header menu tidak valid" });
        }

        const request = DB.promise();

        try {
            await request.query('START TRANSACTION');

            // Clear existing role_menu entries for this role
            await request.query('DELETE FROM role_menu WHERE role_id = ?', [role_id]);

            // For each header, get the child IDs and insert a new row with child_menu as CSV string
            for (const header of headers) {
            const [childRows] = await request.query(
                `SELECT child FROM m_menu WHERE header_menu = ? AND isactive = 1 AND child IS NOT NULL`,
                [header]
            );

            const childIds = childRows.map(row => row.child);
            const childMenuStr = childIds.length ? childIds.join(',') : null;

            const roleMenuId = uuidv4();
            await request.query(
                `INSERT INTO role_menu (role_menu_id, role_id, header_menu, child_menu, isactive) VALUES (?, ?, ?, ?, 1)`,
                [roleMenuId, role_id, header, childMenuStr]
            );
            }

            await request.query('COMMIT');
            return res.json({ kode: 200, message: "Akses role berhasil diperbarui" });
        } catch (err) {
            await request.query('ROLLBACK');
            console.error('Error updating role access:', err);
            return res.status(500).json({ kode: 500, message: "Gagal update akses role", error: err.message });
        }
    },

    getAllMenuHeaders: async function (req, res) {
        try {
            const request = DB.promise();
            const [rows] = await request.query(`
                SELECT DISTINCT header_menu 
                FROM m_menu 
                WHERE isactive = 1 
                ORDER BY header_menu
            `);
            const headers = rows.map(r => r.header_menu);
            return res.json({ kode: 200, data: headers });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ kode: 500, message: "Gagal ambil header menu" });
        }
    },

    // Get all users with role name and status
    getAllUsers: async function (req, res) {
        try {
            const request = DB.promise();
            const [users] = await request.query(`
                SELECT 
                    u.m_user_id, u.nama_user, u.email, u.isactive, 
                    u.role_id, r.nama_role, u.createdate, u.updatedate
                FROM m_user u
                JOIN m_role r ON u.role_id = r.role_id
            `);
            res.json({ data: users });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch users." });
        }
    },

    // Get detail of a single user
    getUserDetail: async function (req, res) {
        const userId = req.params.id;
        try {
            const request = DB.promise();
            const [rows] = await request.query(`
            SELECT u.*, r.nama_role 
            FROM m_user u
            LEFT JOIN m_role r ON u.role_id = r.role_id
            WHERE u.m_user_id = ?
            `, [userId]);

            if (rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
            }

            res.json({ data: rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch user detail." });
        }
    },


    // Update user's role and active status
    updateUserRoleAndStatus: async function (req, res) {
        const { user_id } = req.params;
        const { role_id, isactive } = req.body;

        try {
            const request = DB.promise();
            const [result] = await request.query(`
                UPDATE m_user 
                SET role_id = ?, isactive = ?, updatedate = NOW()
                WHERE m_user_id = ?
            `, [role_id, isactive, user_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "User not found or not updated." });
            }

            res.json({ message: "User updated successfully." });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to update user." });
        }
    }
}