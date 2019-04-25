const { config } = require('./config');
const cfg = config[process.env.da3002env];
const krauter = require('krauter');
const mysql = require('mysql');
const { getUserById, getUserRelationsById, setCookie } = require('./UserUtilities');

// Create database connection pool
const pool = mysql.createPool(cfg.mysql);
const connection = mysql.createConnection(cfg.mysql);
connection.connect(err => { if (err) throw err; });

// Create a Krauter
const router = krauter.mysql(pool);

router.all('*',
	(req, res, next) => {
		req.userId = req.cookies[cfg.cookie.name] || undefined;
		req.transactionDate = new Date();
		next();
	},
	(req, res, next) => {
		if (req.userId) {
			connection.query(
				`SELECT id FROM User WHERE id=?`,
				[ req.userId ],
				(err, result) => {
					req.userId = result.length ? result[0].id : undefined;
					next();
				},
			)
		} else {
			next();
		}
	},
	(req, res, next) => {
		if (!req.userId) {
			connection.query(
				`INSERT INTO User (name) VALUES(?)`,
				[ cfg.anonymousUserName ],
				(err, result) => {
					console.error(err, cfg.anonymousUserName);
					req.userId = result ? result.insertId : undefined;
					console.log('Inserted new user, ID# ' + req.userId, result);
					next();
				}
			)
		} else {
			next();
		}
	},
	(req, res, next) => {
		setCookie(req.userId, req, res, next);
		getUserById(req.userId, req, res, next);
	},
	(req, res, next) => {
		if (req.userData && req.userId) {
			getUserRelationsById(req.userId, req, res, next);
		} else {
			res.json({
				error: "Cannot establish user."
			})
		}
	},
);

module.exports = router;
