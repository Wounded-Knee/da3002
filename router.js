const { config } = require('./config');
const cfg = config[process.env.da3002env];
const krauter = require('krauter');
const mysql = require('mysql');
const { getUserById, createNewUser } = require('./UserUtilities');

// Create database connection pool
const pool = mysql.createPool(cfg.mysql);
const connection = mysql.createConnection(cfg.mysql);
connection.connect(err => { if (err) throw err; });

// Create a Krauter
const router = krauter.mysql(pool);

router.all('*',
	(req, res, next) => {
		req.userData = undefined;
		req.userId = req.cookies[cfg.cookie.name] || undefined;
		req.transactionDate = new Date();
		next();
	},
	(req, res, next) => {
		const getThisUser = (userId) => getUserById(userId, userId)
			.then(userData => {
				req.userData = userData;
				req.userId = userId;
			})
			.catch(err => {
				req.userId = undefined;
				req.userData = undefined;
			});

		if (req.userId) {
			getThisUser(req.userId).then(next).catch(next);
		} else {
			createNewUser(req, res).then(getThisUser).then(next).catch(next);
		}
	},
	(req, res, next) => {
		if (!req.userData || !req.userId) {
			throw new Error('Could not establish user. ' + JSON.stringify(req.userData) + ' -- ' + req.userId);
		} else {
			console.info('Welcome, ' + req.userData.name + ' #' + req.userData.id);
			next();
		}
	},
);

module.exports = router;
