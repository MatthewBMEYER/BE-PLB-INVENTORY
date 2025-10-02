require('dotenv').config();

const mysql = require("mysql2");

const configDB = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
};

const DB = new mysql.createPool(configDB);

DB.getConnection((err, connection) => {
    if (err) throw err;
    console.log('MySQL Connected!');
    connection.release();
});

module.exports = { DB }