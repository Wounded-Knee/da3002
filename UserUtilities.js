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

const getUserById = (userId, req, res, next) => {
	if (userId) {
		connection.query(
			'SELECT * FROM User WHERE id=?',
			[ userId ],
			(err, result) => {
				req.userData = result ? { ...result[0], me: (userId === req.userId) } : undefined;
				next();
			}
		)
	} else {
		console.warn('No userid to getUserById()');
		next();
	}
};

const getUserRelationsById = (userId, req, res, next) => {
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
			req.userData = {
				...req.userData,
				relations: result ? result : [],
			}
			next();
		}
	);
};

module.exports = {
	getUserById: getUserById,
	getUserRelationsById: getUserRelationsById,
	setCookie: setCookie,
};
