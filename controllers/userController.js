const express = require('express');
const { DB } = require('../config/conf');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




module.exports = {
    register: async function (req, res) {
        try {
            const { nama_user, email, pwd, role_id } = req.body;


            // generate m_user_id unik
            const m_user_id = uuidv4();

            // SQL insert
            const sql = `
                INSERT INTO m_user 
                (m_user_id, nama_user, email, pwd, isactive, role_id, createdate, updatedate)
                VALUES (?,?,?,SHA2(?,256),?,?,NOW(),NOW())`;

            DB.query(sql, [m_user_id, nama_user, email, pwd, 1, role_id || 'custom'], (err) => {
                if (err) return res.status(500).json({ message: err.message });

                return res.status(201).json({ message: 'Register sukses' });
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    login: async function (req, res) {
        try {
            const { email, pwd } = req.body;
            console.log('cek email', email);
            console.log('cek pass', pwd);

            // Cari user berdasarkan email + password hash
            const sql = `SELECT * FROM m_user 
                 WHERE email = ? AND pwd = SHA2(?,256) AND isactive = 1`;

            DB.query(sql, [email, pwd], (err, results) => {
                if (err) return res.status(500).json({ message: err.message });
                if (results.length === 0)
                    return res.status(401).json({ message: 'Email atau password salah' });

                const user = results[0];

                // Buat JWT token
                const token = jwt.sign(
                    { m_user_id: user.m_user_id, role_id: user.role_id },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                return res.status(200).json({
                    kode: 200, //supaya match dengan fe yg ngecek res.data.kode
                    message: 'Login sukses',
                    data: {
                        m_user_id: user.m_user_id,
                        nama_user: user.nama_user,
                        email: user.email,
                        role_id: user.role_id,
                        token
                    }
                });
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    forgetPassword: async function (req, res) {
        const { email } = req.body;

        try {
            // cek email dulu, ada atau ngga ?
            const sql = `SELECT * FROM m_user WHERE email = ?`;
            DB.query(sql, [email], (err, results) => {
                if (err) return res.status(500).json({ message: err.message });
                if (results.length === 0) return res.status(404).json({ message: `email tidak ditemukan` });

                const user = results[0];

                // generate token reset
                const resetToken = crypto.randomBytes(32).toString('hex');
                const resetExpires = new Date(Date.now() + 3600000); // 1 jam

                // simpan ke DB
                const updateSql = `UPDATE m_user SET reset_token = ?, reset_expires = ? WHERE m_user_id = ?`;
                DB.query(updateSql, [resetToken, resetExpires, user.m_user_id], (err) => {
                    if (err) {
                        console.error(" Error update token:", err); // ADD LOG
                        return res.status(500).json({ message: err.message });
                    }

                    console.log(" Token tersimpan di DB:", resetToken); // ADD LOG

                    // kirim email pakai nodemailer
                    const transporter = nodemailer.createTransport({
                        // service: `gmail`,
                        host: "smtp.gmail.com",
                        port: 465,
                        secure: true,
                        auth: {
                            user: process.env.EMAIL_USER, // email pengirim
                            pass: process.env.EMAIL_PASS  // password
                        }
                    });

                     const resetUrl = `http://localhost:801/user/reset-password/${resetToken}`; // FIX

                    // const resetUrl = `${process.env.APP_URL}/user/reset-password/${resetToken}`;


                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: user.email,
                        subject: 'Reset Password',
                        html: `<p>Klik link berikut untuk reset password:</p>
                           <a href="${resetUrl}">${resetUrl}</a>`
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.error("Gagal kirim email:", err); // ADD LOG
                            return res.status(500).json({ message: 'gagal kirim email', error: err });
                        }
                        console.log("Email reset terkirim:", info.response); // ADD LOG
                        return res.json({ message: 'email reset password terkirim' });
                    });
                });
            });

        } catch (err) {
            console.error(" Error catch:", err); // ADD LOG
            return res.status(500).json({ message: err.message });
        }
    },

    resetPassword: async function (req, res) {
        const { token } = req.params;
        const { newPassword } = req.body;

        try {
            const sql = `select * from m_user where reset_token = ? and reset_expires > now()`;
            DB.query(sql, [token], (err, results) => {
                if (err) return res.status(500).json({ message: err.message });
                if (results.length === 0) return res.status(400).json({ message: 'token invalid atau sudah expired' });

                const user = results[0];

                //update password
                const updateSql = `update m_user set password= SHA2(?,256),reset_token = null, reset_expires = null where m_user_id = ?`;
                DB.query(updateSql, [newPassword, user.m_user_id], (err) => {
                    if (err) return res.status(500).json({ message: err.message });
                    return res.json({ message: 'password berhasil di reset' });
                });
            });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

};
