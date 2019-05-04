const { config } = require('./config');
const cfg = config[process.env.da3002env];
const mysql = require('mysql');
const connection = mysql.createConnection(cfg.mysql);
connection.connect(err => { if (err) throw err; });

const setCookie = (userId, req, res) => {
	res.cookie(
		cfg.cookie.name,
		userId,
		{
			domain: '.'+req.headers.host.split(':')[0],
			maxAge: cfg.cookie.expireSeconds,
		}
	);
};

const createNewUser = (req, res) => {
	return new Promise((resolve, reject) => {
		connection.query(
			`INSERT INTO User (name) VALUES(?)`,
			[ cfg.anonymousUserName ],
			(err, result) => {
				if (err) {
					console.error(err, cfg.anonymousUserName);
					reject(err);
				} else {
					var userId = result ? result.insertId : undefined;
					console.log('Inserted new user, ID# ' + userId);
					setCookie(userId, req, res);
					resolve(userId);
				}
			}
		)
	});
};

const getUserById = (userId, myUserId) => {
	return new Promise((resolve, reject) => {
		if (userId) {
			connection.query(
				'SELECT * FROM User WHERE id=?',
				[ userId ],
				(err, result) => {
					if (err) {
						console.warn(err);
						reject(new Error(err));
					} else {
						resolve(result ? { ...result[0], me: (userId === myUserId) } : undefined);
					}
				}
			)
		} else {
			var err = 'No valid userId specified, tried: '+userId;
			console.warn(err);
			reject(new Error(err));
		}
	})
	.then(supplementUserWithRelations)
	.then(supplementUserWithKnowledge);
};

const supplementUserWithKnowledge = (userData) => {
	return new Promise((resolve, reject) => {
		var userId = userData.id;
		connection.query(
			`
				SELECT * FROM Knowledge
				WHERE user_id = ?
			`,
			[ userData.id ],
			(err, result) => {
				if (err) {
					console.warn(err);
					reject(new Error(err));
				} else {
					resolve(result ? { ...userData, knowledge: result } : userData);
				}
			}
		)
	});
}

const supplementUserWithRelations = (userData) => {
	return new Promise((resolve, reject) => {
		var userId = userData.id;
		connection.query(
			`
				SELECT
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
					console.warn(err);
					reject(new Error(err));
				} else {
					resolve(result ? { ...userData, relations: result } : userData);
				}
			}
		)
	});
};

module.exports = {
	getUserById: getUserById,
	setCookie: setCookie,
	createNewUser: createNewUser,
};
