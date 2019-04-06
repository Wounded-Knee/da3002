var express = require('express');
var router = express.Router();
var mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'da3002',
  password: '3490vsjkllk52nm,a',
  database: 'da3002'
})
connection.connect(err => { if (err) throw err; });

router.get('/', lookupUser, undevelopedEndpoint);

router.get('/users', lookupUser, undevelopedEndpoint);
router.get('/users/me', lookupUser, undevelopedEndpoint);

router.get('/tests', lookupUser, undevelopedEndpoint);

router.post('/tests', lookupUser, (req, res, next) => {
	connection.query(
		'INSERT INTO Test (name, question) VALUES(?, ?)',
		[req.body.name, req.body.question],
		function(err, result) {
			req.payload.error = err;
			req.result = result;
			res.json(req.payload);
		}
	);
});

router.put('/tests/:testId/answer/:answerId', lookupUser, undevelopedEndpoint);

function undevelopedEndpoint(req, res, next) {
	req.payload.text = "Go Away";
	res.json(req.payload);
}

function lookupUser(req, res, next) {
	const
		setUserName = req.get('X-Name-User'),
		reportedUserId = parseInt(req.cookies.user);
	req.payload = {
		meta: {}
	};
	req.user = {};

	const getUserById = (userId) => {
		return new Promise((resolve, reject) => {
			connection.query(
				'SELECT * FROM User WHERE id=?',
				[ userId ],
				(err, result) => {
					req.payload.meta.foundUser = userId;
					req.user = result;
					resolve(result);
				}
			);		
		})
	}

	if (reportedUserId) {
		getUserById(reportedUserId).then((user) => {
			next();
		})
	} else {
		if (setUserName) {
			req.payload.meta.namedUser = setUserName;
		}
		const newUserName = setUserName || 'Anonymous';
		new Promise((resolve, reject) => {
			if (!reportedUserId) {
				connection.query(
					'INSERT INTO User (name) VALUES(?)',
					[ newUserName ],
					(err, result) => {
						req.payload.meta.createdUser = result.insertId;
						res.cookie('user', result.insertId, {maxAge: 360000});
						resolve(result.insertId);
					}
				)
			} else {
				resolve(reportedUserId);
			}
		}).then((userId) => {
			getUserById(userId).then(user => next());
		})
		//req.payload.meta.anonymousUser = true;
	}
}

module.exports = router;
