const router = require('../router')
const { getUserById, getUserRelationsById, setCookie } = require('../UserUtilities');

router
	.get('/user/all',
		`SELECT * FROM User`,
		({ req, data }) => req.allUsers = data,
		`
			SELECT
				User.*,
				Relationship.user_id as relationOfUser_id,
				Relationship.privacy_id
			FROM User
				LEFT JOIN
					Relationship
				ON
					User.id = Relationship.relationship_id
			WHERE User.id IN (
				SELECT
					Relationship.relationship_id
				FROM
					Relationship
			)
		`,
		({ req, res, data }) => {
			const relations = data;
			return req.allUsers.map(user => ({
				...user,
				me: (user.id === req.userId),
				relations: relations.filter(relation => relation.relationOfUser_id === user.id),
			}));
		},
	)

	.get('/user/me',
		({ req }) => req.userData
	)

	.get('/user/:userId([0-9]+)',
		(req, res, next) => getUserById(req.params.userId, req, res, next),
		(req, res, next) => getUserRelationsById(req.params.userId, req, res, next),
		({ req }) => req.userData,
	)

	.put('/user/:relationId/privacy/:privacy_id',
		`
			REPLACE INTO Relationship
				(user_id, relationship_id, privacy_id)
			VALUES
				(:userId:, :params.relationId:, :params.privacy_id:)
		`,
		({ req, data }) => req.affectedRows = data.affectedRows,
		(req, res, next) => {
			if (req.affectedRows) {
				getUserById(req.userId, req, res, next);
			} else {
				res.json({
					error: "Could not alter user relationship."
				})
			}
		},
		(req, res, next) => getUserRelationsById(req.userId, req, res, next),
		({ req }) => req.userData,
	)

	.get('/user/become/:masqueradeId',
		(req, res, next) => {
			req.userId = parseInt(req.params.masqueradeId);
			req.userData = undefined;
			setCookie(req.userId, req, res);
			getUserById(req.userId, req, res, next);
		},
		(req, res, next) => getUserRelationsById(req.userId, req, res, next),
		({ req }) => req.userData,
	)
;

module.exports = router;
