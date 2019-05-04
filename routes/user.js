const router = require('../router')
const { getUserById, getUserRelationsById, setCookie } = require('../UserUtilities');

router
	.get('/user/all',
		`SELECT id FROM User`,
		({ req, data }) => req.allUsers = data,
		(req, res, next) => {
			Promise.all(
				req.allUsers.map(user => getUserById(user.id))
			).then((allUsers) => {
				req.allUsers = allUsers;
				next();
			}).catch(err => {
				throw new Error(err);
			});
		},
		({ req }) => req.allUsers,
	)

	.get('/user/me',
		({ req }) => req.userData
	)

	.get('/user/:userId([0-9]+)',
		(req, res, next) => {
			getUserById(req.params.userId).then(userData => {
				req.otherUserData = userData;
				next();
			});
		},
		({ req }) => req.otherUserData,
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
				getUserById(req.userId)
					.then(userData => {
						req.userData = userData;
						next();
					})
					.catch(err => { throw new Error(err) });
			} else {
				next();
			}
		},
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
