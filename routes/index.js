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
			'INSERT INTO Test (name, question, privacyLevel_id, user_id) VALUES(?, ?, ?, ?)',
			[req.body.name, req.body.question, 1, req.payload.me.id ],
			function(err, result) {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			}
		);
	}).then(result => {

		// Record Choices

		Promise.all(
			req.body.choices.map(choice => {
				return new Promise((resolve, reject) => {
					connection.query(
						'INSERT INTO Tag (test_id, name, emoji, summary, choice) VALUES(?, ?, ?, ?, ?)',
						[ result.insertId, choice.name, choice.emoji, choice.summary, choice.choice ],
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
			throw new Error(err);
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
		me: {}
	};

	return new Promise((resolve, reject) => {
		if (!reportedUserId) {
			// First visit ever (no cookie)
			connection.query(
				'INSERT INTO User (name) VALUES(?)',
				[ setUserName || config.anonymousUserName ],
				(err, result) => {
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
		getUserById(userId).then(user => {
			req.payload.me = user;
			next();
		});
	})
}

// Returns a promise which resolves with user data
function getUserById(userId) {
	return new Promise((resolve, reject) => {
		connection.query(
			'SELECT * FROM User WHERE id=?',
			[ userId ],
			(err, result) => {
				if (err) {
					reject(err);
					throw new Error(err);
				} else if (result.length === 0) {
					res.json({
						error: "UserID #"+userId+" doesn't exist."
					});
				} else {
					resolve(result[0]);
				}
			}
		);
	}).then(me => {
		return new Promise((resolve, reject) => {
			getTagsByUserId(userId).then(tags => {
				resolve({
					...me,
					tags: tags
				});
			})
		})
	}).then(me => {
		return new Promise((resolve, reject) => {
			getRelationsByUserId(userId).then(relations => {
				resolve({
					...me,
					relations: relations
				})
			})
		})
	})
}

function getRelationsByUserId(userId) {
	return new Promise((resolve, reject) => {
		connection.query(
			`SELECT
					Relationship.*,
					UserRelationship.privacyLevel_id
				FROM (User
					LEFT JOIN UserRelationship
						ON User.id = UserRelationship.user_id
					LEFT JOIN User as Relationship
						ON UserRelationship.relationship_id = Relationship.id
				)
				WHERE User.id = ?
				AND Relationship.id IS NOT NULL`,
			[ userId ],
			(err, result) => {
				if (err) {
					throw new Error(err);
				} else {
					resolve(result);
				}
			}
		);
	})
}

function getTagsByUserId(userId) {
	return new Promise((resolve, reject) => {
		connection.query(
			`SELECT
					Tag.id,
					Tag.name,
					Tag.emoji,
					User_Tag.privacyLevel_id
				FROM (User
					LEFT JOIN User_Tag
						ON User.id = User_Tag.user_id
					LEFT JOIN Tag
						ON User_Tag.tag_id = Tag.id
				)
				WHERE User.id = ?
				AND Tag.id IS NOT NULL`,
			[ userId ],
			(err, result) => {
				if (err) {
					throw new Error(err);
				} else {
					resolve(result);
				}
			}
		);
	});
}

module.exports = router;
