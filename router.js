const { config } = require('./config');
const cfg = config[process.env.da3002env];
const krauter = require('krauter');
const mysql = require('mysql');
const { lookupUser } = require('./helpers');

// Create database connection pool
const pool = mysql.createPool(cfg.mysql);
const connection = mysql.createConnection(cfg.mysql);
connection.connect(err => { if (err) throw err; });

// Create a Krauter
const router = krauter.mysql(pool);

router.use(lookupUser);

module.exports = router;
