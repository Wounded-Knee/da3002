var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pluck = require('pluck');
var { config } = require('../config.js');

const connection = mysql.createConnection(config.mysql);
connection.connect(err => { if (err) throw err; });

router.get('/', lookupUser, undevelopedEndpoint);

router.put('/user/:userId/privacy/:privacyLevel_id', lookupUser, (req, res, next) => {
	const
		userId = parseInt(req.params.userId),
		privacyLevel_id = parseInt(req.params.privacyLevel_id);
	new Promise((resolve, reject) => {
		connection.query(
			`
				REPLACE INTO UserRelationship
					(user_id, relationship_id, privacyLevel_id)
				VALUES
					(?, ?, ?)
			`,
			[ req.payload.me.id, userId, privacyLevel_id ],
			function(err, result) {
				res.json(!err);
			}
		)
	});
});

router.get('/users', lookupUser, (req, res, next) => {
	res.json(req.payload.me.relations);
});

router.get('/tag/:tagId', lookupUser, (req, res, next) => {
	const meUserId = req.payload.me.id;
	new Promise((resolve, reject) => {

		// Privacy Check

		connection.query(
			`
				SELECT
					Test.user_id as testOwner,
					IFNULL(Test.privacyLevel_id, 5) as testPrivacy,
					IFNULL(UserRelationship.privacyLevel_id, 5) as relationshipPrivacy
				FROM Tag
				LEFT JOIN Test
					ON Test.id = Tag.test_id
				LEFT JOIN UserRelationship
					ON Test.user_id = UserRelationship.user_id
						AND UserRelationship.relationship_id = ?
				WHERE Tag.id = ?
			`,
			[ meUserId, req.params.tagId ],
			function(err, result) {
				const {
					relationshipPrivacy,
					testPrivacy,
					testOwner,
					meUserId,
				} = result;

				if (err) {
					reject(err);
				} else {
					if (testOwner === meUserId || relationshipPrivacy <= testPrivacy) {
						resolve();
					} else {
						reject("Permission denied");
					}
				}
			}
		);
	}).then(() => {

		// Return the Details

		connection.query(
			`
				SELECT
					Tag.*,
					Test.id as test_id
				FROM Tag
				LEFT JOIN Test
					ON Test.id = Tag.test_id
				WHERE Tag.id = ?
			`,
			[ req.params.tagId ],
			function(err, result) {
				if (err || result.length !== 1) {
					throw new Error(err);
				} else {
					res.json(result[0]);
				}
			}
		);
	}).catch((err) => {
		res.json({
			error: err
		});
	});
});

router.get('/users/me', lookupUser, (req, res, next) => {
	res.json(req.payload.me);
});

router.get('/user/:userId', lookupUser, (req, res, next) => {
	getUserById(parseInt(req.params.userId)).then(userData => res.json(userData));
});

router.get('/tests', lookupUser, (req, res, next) => {
	getTests(req).then(tests => res.json(tests));
});

router.get('/tests/:testId', lookupUser, (req, res, next) => {
	getTests(req, req.params.testId).then(tests => res.json(tests));
});

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

router.put('/tests/:testId/answer/:answerId', lookupUser, (req, res, next) => {
	return new Promise((resolve, reject) => {
		// Check if this record already exists
		connection.query(
			`SELECT * FROM User_Tag WHERE tag_id IN (
				SELECT id FROM Tag WHERE test_id = (
					SELECT test_id FROM Tag WHERE id = ?
				)
			) AND user_id = ?`,
			[ parseInt(req.params.answerId), parseInt(req.payload.me.id) ],
			(err, result) => {
				if (result.length === 0) {
					resolve();
				} else {
					req.payload.error = "User has already given that answer.";
					reject();
				}
			}
		);
	}).then(() => {
		connection.query(
			`INSERT INTO User_Tag
			(user_id, tag_id, privacyLevel_id)
			VALUES(?, ?, 1)
			`,
			[ parseInt(req.payload.me.id), parseInt(req.params.answerId) ],
			(err, result) => {
				if (err) {
					throw new Error(err);
				} else {
					lookupUser(req, res, () => {
						res.json(req.payload);
					});
				}
			}
		)
	}).catch(err => {
		if (!err) {
		} else {
			throw new Error(err);
		}
	});
});

function undevelopedEndpoint(req, res, next) {
	req.payload.text = "Go Away";
	res.json(req.payload);
}

function lookupUser(req, res, next) {
	const
		setUserName = req.get('X-Name-User'),
		reportedUserId = parseInt(req.cookies[config.cookie.name]);

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
						config.cookie.name,
						result.insertId,
						{
							domain: '.'+req.headers.host.split(':')[0],
							maxAge: config.cookie.expireSeconds,
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

function getTests(req, testId) {
	return new Promise((resolve, reject) => {
		connection.query(
			`SELECT
					Test.id as testId,
					Test.name as testName,
					Test.question as testQuestion,
					Tag.id as tagId,
					Tag.name as tagName,
					Tag.emoji as tagEmoji,
					Tag.summary as tagSummary,
					Tag.choice as tagChoice
				FROM (Test
					LEFT JOIN Tag
						ON Test.id = Tag.test_id
				) ` + ((testId) ? 'WHERE Test.id = ?' : ''),
			(testId ? [ testId ] : []),
			(err, result) => {
					if (err) {
						reject(err);
					} else {
						var tests = [];
						for (var x=0; x<result.length; x++) {
							var row = result[x];
							var testIndex = row.testId-1;
							if (tests[testIndex] === undefined) {
								tests[testIndex] = {
									id: row.testId,
									name: row.testName,
									question: row.testQuestion,
									tags: []
								};
							}
							tests[testIndex].tags.push({
								id: row.tagId,
								name: row.tagName,
								emoji: row.tagEmoji,
								summary: row.tagSummary,
								choice: row.tagChoice,
							});
						}
						tests = tests.filter(test => {
							const
								testTagIds = pluck('id', test.tags),
								myTagIds = pluck('id', req.payload.me.tags);

							const intersection = [testTagIds, myTagIds].shift().filter(function(v) {
								return [testTagIds, myTagIds].every(function(a) {
									return a.indexOf(v) !== -1;
								});
							});

							const testNotNull = test !== null;

							if (testNotNull && intersection.length === 0) {
								return true;
							}
						});
						if (testId) tests = tests[0];
						resolve(tests);
					}
			})
	});
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
					const err = "UserID #"+userId+" doesn't exist.";
					reject(err)
					throw new Error(err);
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
