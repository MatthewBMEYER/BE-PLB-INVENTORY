const express = require('express');
const { DB } = require('../config/conf');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { text } = require('body-parser');




module.exports = {
    register: async function (req, res) {
        try {
            const { nama_user, email, pwd, role_id } = req.body;

            //validasi password minimal 6karakter
            if (!pwd || pwd.length < 6) {
                return res.status(400).json({
                    status: "error",
                    kode: 400,
                    message: "password harus minimal 6 karakter"

                })
            }
            //cek email, sudah ada apa belum
            const sqlcheckemail = `SELECT * FROM m_user WHERE email = ?`;
            DB.query(sqlcheckemail, [email], (err, results) => {
                if (err) {
                    return res.status(500).json({
                        status: "error",
                        kode: 500,
                        message: err.message
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        status: "error",
                        kode: 409,
                        message: "Email sudah terdaftar"
                    });
                }

                // kalau belum ada, baru insert
                const m_user_id = uuidv4();
                const sql = `
                INSERT INTO m_user 
                (m_user_id, nama_user, email, pwd, isactive, role_id, createdate, updatedate)
                VALUES (?,?,?,SHA2(?,256),?,?,NOW(),NOW())`;

                DB.query(sql, [m_user_id, nama_user, email, pwd, 1, role_id || 'custom'], (err) => {
                    if (err) {
                        return res.status(500).json({ message: err.message });
                    }

                    return res.status(201).json({
                        status: "success",
                        kode: 201,
                        message: "Register sukses"
                    });
                });
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

                const tempPassword = Math.random().toString(36).slice(-8);

                // update password sementara ke DB
                const updateSql = `UPDATE m_user 
                               SET pwd = SHA2(?,256), reset_token = NULL, reset_expires = NULL 
                               WHERE m_user_id = ?`;
                DB.query(updateSql, [tempPassword, user.m_user_id], (err) => {
                    if (err) return res.status(500).json({ message: err.message });



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

                    const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: "Password Sementara",
                    html: `
                        <p>Password sementara Anda adalah:</p>
                        <h3>${tempPassword}</h3>
                        <p>Silakan login dengan password ini, lalu segera ubah password di menu Ubah Password.</p>
                    `
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                    if (err) return res.status(500).json({ message: "Gagal kirim email", error: err });

                    console.log("Email terkirim:", info.response);
                    return res.json({ message: "Password sementara berhasil dikirim ke email." });
                });
                    
                });
            });

        } catch (err) {
            console.error(" Error catch:", err); // ADD LOG
            return res.status(500).json({ message: err.message });
        }
    }

    // resetPassword: async function (req, res) {
    //     const { token } = req.params;

    //     try {
    //         const sql = `select * from m_user where reset_token = ? and reset_expires > now()`;
    //         DB.query(sql, [token], (err, results) => {
    //             if (err) return res.status(500).json({ message: err.message });
    //             if (results.length === 0) return res.status(400).json({ message: 'token invalid atau sudah expired' });

    //             const user = results[0];

    //             //generete password baru
    //             const newPassword = Math.random().toString(36).slice(-8);

    //             //update password
    //             const updateSql = `update m_user set password= SHA2(?,256),reset_token = null, reset_expires = null where m_user_id = ?`;
    //             DB.query(updateSql, [newPassword, user.m_user_id], (err) => {
    //                 if (err) return res.status(500).json({ message: err.message });

    //                 //kirim email  password baru
    //                 const transporter = nodemailer.createTransport({
    //                     host: "smtp.gmail.com",
    //                     port: 465,
    //                     secure: true,
    //                     auth: {
    //                         user: process.env.EMAIL_USER,
    //                         pass: process.env.EMAIL_PASS
    //                     }
    //                 });

    //                 const mailOptions = {
    //                     from: process.env.EMAIL_USER,
    //                     to: user.email,
    //                     subject: "ini password baru anda",
    //                     text: `password baru anda : ${newPassword}`
    //                 }

    //                 transporter.sendMail(mailOptions, () => { });
    //                 return res.send("password berhasil di reset, silahkan cek email anda untuk password baru")
    //             });
    //         });
    //     } catch (err) {
    //         return res.status(500).json({ message: err.message });
    //     }
    // }

};
