var mysql = require('mysql');
var pluck = require('pluck');
var { config } = require('./config.js');
const cfg = config[process.env.da3002env];

const connection = mysql.createConnection(cfg.mysql);
connection.connect(err => { if (err) throw err; });

function undevelopedEndpoint(req, res, next) {
	req.payload.text = "Go Away";
	res.json(req.payload);
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
				) ` + ((testId) ? 'WHERE Test.id = ?' : '') + `
				ORDER BY testId DESC
			`,
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
						tests = tests.filter(test => test !== undefined);
						if (!testId) {
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
							tests.sort((testA, testB) => testB.id - testA.id ); // Newest tests first
						} else {
							tests = tests[0];
						}
						resolve(tests);
					}
			})
	});
}

// Returns a promise which resolves with user data
function getUserById(userId, viewingUserId) {
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
/*
	}).then(me => {
		return new Promise((resolve, reject) => {
			getTagsByUserId(userId, viewingUserId).then(tags => {
				resolve({
					...me,
					tags: tags
				});
			})
		})
*/
	}).then(me => {
		return new Promise((resolve, reject) => {
			getRelationsByUserId(userId).then(relations => {
				resolve({
					...me,
					relations: relations
				})
			})
		})
	}).catch(err => {
		throw(err);
	})
}

function getUsers(viewingUserId) {
	return new Promise((resolve, reject) => {
		connection.query(
			'SELECT * FROM User',
			[],
			(err, result) => {
				if (err) {
					reject(err);
					throw new Error(err);
				} else {
					resolve(result);
				}
			}
		);
	}).then(us => {
		return new Promise((resolve, reject) => {
			Promise.all([
				...us.map(her => {
					return new Promise((resolve, reject) => {
						getRelationsByUserId(her.id).then(herRelations => {
							resolve({
								...her,
								relations: herRelations
							});
						})
					})
				})
			]).then(vals => {
				resolve(vals);
			});
		})
	}).catch(err => {
		throw(err);
	})
}

function getRelationsByUserId(userId) {
	return new Promise((resolve, reject) => {
		connection.query(
			`SELECT
					RelatedUser.*,
					Relationship.privacy_id
				FROM (User
					LEFT JOIN Relationship
						ON User.id = Relationship.user_id
					LEFT JOIN User as RelatedUser
						ON Relationship.relationship_id = RelatedUser.id
				)
				WHERE User.id = ?
				AND RelatedUser.id IS NOT NULL
			`,
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

function getTagsByUserId(userId, viewingUserId) {
	return new Promise((resolve, reject) => {
		const self = (userId !== viewingUserId);
		const sql = `SELECT
				Tag.id,
				Tag.name,
				Tag.emoji,
				User_Tag.privacyLevel_id
				${self ? `
				, UserRelationship.privacyLevel_id as userRelPL
				` : ''}
			FROM (User
				LEFT JOIN User_Tag
					ON User.id = User_Tag.user_id
			${self ? `
				LEFT JOIN UserRelationship
					ON User.id = UserRelationship.user_id
						AND UserRelationship.relationship_id = ?
						AND User_Tag.privacyLevel_id >= UserRelationship.privacyLevel_id
			` : ''}
				LEFT JOIN Tag
					ON User_Tag.tag_id = Tag.id
			)
			WHERE User.id = ?
			AND Tag.id IS NOT NULL
			${self ? `
	            AND UserRelationship.privacyLevel_id IS NOT NULL
			` : ''}`;
		connection.query(
			sql,
			self ? [ viewingUserId, userId ] : [ userId ],
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

function lookupUser(req, res, next) {
	const
		setUserName = req.get('X-Name-User'),
		reportedUserId = parseInt(req.cookies[cfg.cookie.name]);

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
						cfg.cookie.name,
						result.insertId,
						{
							domain: '.'+req.headers.host.split(':')[0],
							maxAge: cfg.cookie.expireSeconds,
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
		getUserById(userId, userId).then(user => {
			req.payload.me = user;
			next();
		});
	})
}

module.exports = {
	getTagsByUserId: getTagsByUserId,
	getRelationsByUserId: getRelationsByUserId,
	getUsers: getUsers,
	getUserById: getUserById,
	getTests: getTests,
	undevelopedEndpoint: undevelopedEndpoint,
	lookupUser: lookupUser,
	connection: connection,
}
