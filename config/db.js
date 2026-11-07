const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'parking_management',
    port: 3306
});

db.getConnection((err, connection) => {
    if (err) {
        console.log("Database Connection Failed:", err.message);
    } else {
        console.log("MySQL Database Connected Successfully!");
        connection.release();
    }
});

module.exports = db;