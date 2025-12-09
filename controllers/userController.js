const express = require('express');
const { DB } = require('../config/conf');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


module.exports = {
    login: async function (req, res) {
        try {
            const request = DB.promise();
            const { email, pwd } = req.body;
            console.log('Login request : ', req.body);

            if (!email || !pwd) {
                return res.status(400).json({ kode: 400, message: 'Email dan password wajib diisi' });
            }

            const cekUser = `SELECT * FROM m_user a WHERE email = ? AND pwd = SHA2(?, 256) LIMIT 1`;
            const [users] = await request.query(cekUser, [email, pwd]);
            const user = users[0];

            if (users.length === 0) {
                return res.status(400).json({ kode: 400, message: 'Login gagal. Email atau password salah' });
            }
            if (user.isactive == 0 || user.role_id === null) {
                return res.status(400).json({
                    kode: 400,
                    message: 'User Belum Aktif, Silahkan hubungi administrator',
                });
            }

            const roleQuery = `
            SELECT 
                b.nama_role, 
                c.role_menu_id, 
                c.header_menu, 
                c.child_menu,
                MIN(d.sort) as sort
            FROM m_user a
            INNER JOIN m_role b ON a.role_id = b.role_id 
            INNER JOIN role_menu c ON c.role_id = b.role_id 
            INNER JOIN m_menu d ON d.header_menu = c.header_menu 
            WHERE a.m_user_id = ? AND c.isactive = 1
            GROUP BY b.nama_role, c.role_menu_id, c.header_menu, c.child_menu
            ORDER BY sort ASC
        `;

            const [roleMenus] = await request.query(roleQuery, [user.m_user_id]);

            if (roleMenus.length === 0) {
                return res.status(401).json({ kode: 401, message: 'Role belum diatur!' });
            }

            const processedMenus = [];
            const processedHeaders = new Set();

            for (let i = 0; i < roleMenus.length; i++) {
                const { header_menu, child_menu, role_menu_id, nama_role, sort } = roleMenus[i];

                if (processedHeaders.has(header_menu)) {
                    continue;
                }
                processedHeaders.add(header_menu);

                let children = [];
                if (child_menu) {
                    const childArray = child_menu.split(',').map(item => item.trim()).filter(item => item !== '');

                    if (childArray.length > 0) {
                        const placeholders = childArray.map(() => '?').join(',');
                        const childQuery = `
                        SELECT * FROM m_menu 
                        WHERE child IN (${placeholders}) AND header_menu = ? AND isactive = 1 
                        ORDER BY sort ASC
                    `;
                        const [childResults] = await request.query(childQuery, [...childArray, header_menu]);
                        children = childResults;
                    }
                }

                processedMenus.push({
                    nama_role,
                    role_menu_id,
                    header_menu,
                    child_menu,
                    sort,
                    child: children
                });
            }

            return res.status(200).json({
                kode: 200,
                message: 'OK',
                data: { user, roleMenus: processedMenus },
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                kode: 500,
                message: 'Terjadi kesalahan server',
                error: {
                    message: error.message,
                    code: error.code
                }
            });
        }
    },

    list: async function (req, res) {
        try {
            const request = DB.promise();
            const [data] = await request.query(`SELECT * FROM m_user`);
            res.status(200).json({ kode: 200, message: "OK", data });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    },

    list: async function (req, res) {
        try {
            const request = DB.promise();
            const [data] = await request.query(`SELECT * FROM m_user`);
            res.status(200).json({ kode: 200, message: "OK", data });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    },

    registerUser: async function (req, res) {
        try {
            const request = DB.promise();
            const { nama_user, email, password, role_id } = req.body;

            console.log('register request : ', req.body);

            if (!nama_user || !email) {
                return res.status(400).json({ kode: 400, message: 'Nama user, email, dan role wajib diisi' });
            }

            const [existingUsers] = await request.query(
                `SELECT * FROM m_user WHERE email = ? AND isactive = 1`,
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json({ kode: 409, message: 'Email sudah terdaftar' });
            }

            await request.query(
                `INSERT INTO m_user 
                (m_user_id, nama_user, email, pwd, isactive, role_id, createdate)
                VALUES (UUID(), ?, ?, SHA2(?, 256), 1, ?, NOW())`,
                [nama_user, email, password, role_id]
            );

            return res.status(200).json({ kode: 200, message: 'User berhasil didaftarkan' });

        } catch (error) {
            console.error('Register error:', error);
            return res.status(500).json({ kode: 500, message: 'Terjadi kesalahan server', error: error.message });
        }
    },

    googleLogin: async function (req, res) {
        try {
            const request = DB.promise();
            const { token, email, google_id } = req.body;

            console.log('Google LOGIN request:', { email, google_id });

            if (!email || !google_id) {
                return res.status(400).json({
                    kode: 400,
                    message: 'Email dan Google ID diperlukan'
                });
            }

            // Check if user exists with this Google ID or email
            const [users] = await request.query(
                `SELECT * FROM m_user WHERE (email = ? OR google_id = ?) AND google_id IS NOT NULL LIMIT 1`,
                [email, google_id]
            );

            if (users.length === 0) {
                // User doesn't exist or not a Google user
                return res.status(404).json({
                    kode: 404,
                    message: 'Akun Google tidak ditemukan. Silakan daftar terlebih dahulu.',
                    email: email
                });
            }

            const user = users[0];

            // Update Google ID if email matches but Google ID not set
            if (user.google_id !== google_id && user.email === email) {
                await request.query(
                    `UPDATE m_user SET google_id = ?, updatedate = NOW() WHERE m_user_id = ?`,
                    [google_id, user.m_user_id]
                );
                user.google_id = google_id;
            }

            // Check if user is active
            if (user.isactive == 0 || user.role_id === null) {
                return res.status(400).json({
                    kode: 400,
                    message: 'User Belum Aktif, Silahkan hubungi administrator',
                });
            }

            const roleQuery = `
            SELECT 
                b.nama_role, 
                c.role_menu_id, 
                c.header_menu, 
                c.child_menu,
                MIN(d.sort) as sort
            FROM m_user a
            INNER JOIN m_role b ON a.role_id = b.role_id 
            INNER JOIN role_menu c ON c.role_id = b.role_id 
            INNER JOIN m_menu d ON d.header_menu = c.header_menu 
            WHERE a.m_user_id = ? AND c.isactive = 1
            GROUP BY b.nama_role, c.role_menu_id, c.header_menu, c.child_menu
            ORDER BY sort ASC
        `;

            const [roleMenus] = await request.query(roleQuery, [user.m_user_id]);

            if (roleMenus.length === 0) {
                return res.status(401).json({
                    kode: 401,
                    message: 'Role belum diatur!',
                    data: {
                        user: {
                            ...user,
                            login_method: 'google'
                        },
                        roleMenus: []
                    }
                });
            }

            const processedMenus = [];
            const processedHeaders = new Set();

            for (let i = 0; i < roleMenus.length; i++) {
                const { header_menu, child_menu, role_menu_id, nama_role, sort } = roleMenus[i];

                if (processedHeaders.has(header_menu)) {
                    continue;
                }
                processedHeaders.add(header_menu);

                let children = [];
                if (child_menu) {
                    const childArray = child_menu.split(',').map(item => item.trim()).filter(item => item !== '');

                    if (childArray.length > 0) {
                        const placeholders = childArray.map(() => '?').join(',');
                        const childQuery = `
                        SELECT * FROM m_menu 
                        WHERE child IN (${placeholders}) AND header_menu = ? AND isactive = 1 
                        ORDER BY sort ASC
                    `;
                        const [childResults] = await request.query(childQuery, [...childArray, header_menu]);
                        children = childResults;
                    }
                }

                processedMenus.push({
                    nama_role,
                    role_menu_id,
                    header_menu,
                    child_menu,
                    sort,
                    child: children
                });
            }

            return res.status(200).json({
                kode: 200,
                message: 'Google login berhasil',
                data: {
                    user: {
                        ...user,
                        login_method: 'google'
                    },
                    roleMenus: processedMenus
                },
            });

        } catch (error) {
            console.error('Google login error:', error);
            return res.status(500).json({
                kode: 500,
                message: 'Terjadi kesalahan server saat Google login',
                error: error.message
            });
        }
    },

    googleRegister: async function (req, res) {
        try {
            const request = DB.promise();
            const { token, email, name, google_id, password, confirmPassword } = req.body;

            console.log('Google REGISTER request:', { email, name, hasPassword: !!password });

            if (!email || !name || !google_id) {
                return res.status(400).json({
                    kode: 400,
                    message: 'Email, nama, dan Google ID diperlukan'
                });
            }

            // Check if email already exists
            const [existingEmailUsers] = await request.query(
                `SELECT * FROM m_user WHERE email = ? LIMIT 1`,
                [email]
            );

            if (existingEmailUsers.length > 0) {
                // Email already exists
                const existingUser = existingEmailUsers[0];
                if (existingUser.google_id) {
                    // User already has Google account - they should login instead
                    return res.status(409).json({
                        kode: 409,
                        message: 'Email sudah terdaftar dengan akun Google. Silakan login.',
                        email: email
                    });
                } else {
                    // Email exists as regular user (non-Google)
                    return res.status(409).json({
                        kode: 409,
                        message: 'Email sudah terdaftar dengan metode login email/password. Silakan login dengan email dan password.',
                        email: email
                    });
                }
            }

            // Check if Google ID already exists
            const [existingGoogleUsers] = await request.query(
                `SELECT * FROM m_user WHERE google_id = ? LIMIT 1`,
                [google_id]
            );

            if (existingGoogleUsers.length > 0) {
                return res.status(409).json({
                    kode: 409,
                    message: 'Akun Google ini sudah terdaftar.',
                    email: existingGoogleUsers[0].email
                });
            }

            // Validate password for registration
            if (!password || !confirmPassword) {
                return res.status(400).json({
                    kode: 400,
                    message: 'Password diperlukan untuk registrasi dengan Google'
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    kode: 400,
                    message: 'Password dan konfirmasi password tidak cocok'
                });
            }

            // Register new user with provided password
            const role_id = null;
            const isactive = 1;

            await request.query(
                `INSERT INTO m_user 
            (m_user_id, nama_user, email, pwd, google_id, isactive, role_id, createdate)
            VALUES (UUID(), ?, ?, SHA2(?, 256), ?, ?, ?, NOW())`,
                [name, email, password, google_id, isactive, role_id]
            );

            // Get the newly created user
            const [newUsers] = await request.query(
                `SELECT * FROM m_user WHERE email = ? LIMIT 1`,
                [email]
            );

            const user = newUsers[0];

            // Return success - user created but inactive
            return res.status(201).json({
                kode: 201,
                message: 'Registrasi dengan Google berhasil. Akun menunggu aktivasi admin.',
                data: {
                    user: {
                        ...user,
                        login_method: 'google'
                    },
                    roleMenus: [] // No role menus yet (inactive)
                }
            });

        } catch (error) {
            console.error('Google register error:', error);
            return res.status(500).json({
                kode: 500,
                message: 'Terjadi kesalahan server saat registrasi Google',
                error: error.message
            });
        }
    },

    forgotPassword: async function (req, res) {
        console.log("SMTP_USER:", process.env.SMTP_USER);
        console.log("SMTP_PASS:", process.env.SMTP_PASS ? 'SET' : 'NOT SET');

        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ kode: 400, message: 'Email wajib diisi' });
            }

            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                return res.status(500).json({
                    kode: 500,
                    message: 'Server configuration error'
                });
            }

            const request = DB.promise();
            const [users] = await request.query(
                `SELECT m_user_id FROM m_user WHERE email = ? AND isactive = 1 LIMIT 1`,
                [email]
            );

            if (users.length === 0) {
                return res.status(404).json({ kode: 404, message: 'Email tidak ditemukan' });
            }

            const userId = users[0].m_user_id;
            const newPassword = crypto.randomBytes(6).toString('hex') + 'A1!';
            const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

            await request.query(
                `UPDATE m_user SET pwd = ?, updatedate = NOW() WHERE m_user_id = ?`,
                [hashedPassword, userId]
            );

            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: { rejectUnauthorized: false }
            });

            const mailOptions = {
                from: `"Support" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Reset Password',
                html: `
        <h3>Reset Password</h3>
        <p>Password sementara: <strong>${newPassword}</strong></p>
        <p>Silakan login dan ganti segera</p>
      `
            };

            await transporter.sendMail(mailOptions);
            return res.status(200).json({
                kode: 200,
                message: `Password sementara dikirim ke ${email}`
            });

        } catch (error) {
            console.error('Error:', error);
            if (error.stack) console.error(error.stack);
            console.error('Full error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

            return res.status(500).json({
                kode: 500,
                message: 'Gagal mengirim email',
                error: error.message || error.toString(),
            });
        }
    },

    resetPassword: async function (req, res) {
        try {
            const request = DB.promise();
            const { m_user_id, pwd } = req.body;

            const pass = pwd && pwd.length < 30 ? pwd : 'Password123#';

            await request.query(
                `UPDATE m_user SET pwd = SHA2(?, 256), updatedate = NOW() WHERE m_user_id = ?`,
                [pass, m_user_id]
            );

            return res.status(200).json({ kode: 200, message: 'Sukses' });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ kode: 500, message: 'Terjadi kesalahan server', error });
        }
    },

    deleteUser: async function (req, res) {
        try {
            const request = DB.promise();
            const { m_user_id } = req.body;

            await request.query(
                `UPDATE m_user SET isactive = 0, updatedate = NOW() WHERE m_user_id = ?`,
                [m_user_id]
            );

            return res.status(200).json({ kode: 200, message: 'Sukses' });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ kode: 500, message: 'Gagal menghapus user', error });
        }
    }
};
