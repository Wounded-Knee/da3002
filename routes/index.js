var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var { config } = require('../config.js');

const connection = mysql.createConnection(config.mysql);
connection.connect(err => { if (err) throw err; });

router.get('/', lookupUser, undevelopedEndpoint);

router.get('/users', lookupUser, undevelopedEndpoint);
router.get('/users/me', lookupUser, undevelopedEndpoint);

router.get('/tests', lookupUser, undevelopedEndpoint);

router.post('/tests', lookupUser, (req, res, next) => {
	new Promise((resolve, reject) => {

		// Record Test

		connection.query(
			'INSERT INTO Test (name, question) VALUES(?, ?)',
			[req.body.name, req.body.question],
			function(err, result) {
				if (result.insertId !== undefined) {
					resolve(result);
				} else {
					reject(err);
				}
			}
		);
	}).then(result => {

		// Record Choices

		Promise.all(
			req.body.choices.map(choice => {
				return new Promise((resolve, reject) => {
					connection.query(
						'INSERT INTO Answer (test_id, choice) VALUES(?, ?)',
						[ result.insertId, choice ],
						(err, result) => {
							if (!err) {
								resolve(result);
							} else {
								reject(err);
							}
						}
					);
				});
			})
		).then(() => {

			// Return Payload

			res.json(req.payload);
		}).catch(err => {
			console.error(err);
		})
	}).catch(err => {
		throw new Error(err);
	});
});

router.put('/tests/:testId/answer/:answerId', lookupUser, undevelopedEndpoint);

function undevelopedEndpoint(req, res, next) {
	req.payload.text = "Go Away";
	res.json(req.payload);
}

function lookupUser(req, res, next) {
	const
		setUserName = req.get('X-Name-User'),
		reportedUserId = parseInt(req.cookies[config.cookieName]);

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
					req.payload.meta.foundUser = result[0];
					req.me = result[0];
					resolve(result);
				}
			);		
		})
	}

	new Promise((resolve, reject) => {
		if (!reportedUserId) {
			// First visit ever (no cookie)
			connection.query(
				'INSERT INTO User (name) VALUES(?)',
				[ setUserName || config.anonymousUserName ],
				(err, result) => {
					req.payload.meta.createdUser = result.insertId;
					res.cookie(
						config.cookieName,
						result.insertId,
						{
							maxAge: config.cookieExpireSeconds
						}
					);
					resolve(result.insertId);
				}
			)
		} else if (setUserName) {
			// Subsequent visit, with user naming request
			connection.query(
				'UPDATE User SET name=? WHERE id=?',
				[ setUserName, reportedUserId ],
				(err, result) => {
					resolve(reportedUserId)
				}
			);
		} else {
			resolve(reportedUserId);
		}
	}).then((userId) => {
		getUserById(userId).then(user => next());
	})
}

module.exports = router;
