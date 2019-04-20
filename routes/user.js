var router = require('../router')
var validate = require('express-validation');
var validation = require('../validation.js');
var { getUserById, connection, getUsers } = require('../helpers.js');

router.get('/all', (req, res, next) => {
	getUsers(req.payload.me.id).then(vals => {
		res.json(vals);
	});
});

router.get('/me', (req, res, next) => {
	res.json(req.payload.me);
});

router.get('/:userId', (req, res, next) => {
	getUserById(parseInt(req.params.userId), parseInt(req.payload.me.id)).then(userData => res.json(userData));
});

router.get('/become/:userId',  validate(validation.getBecome), (req, res, next) => {
	const userId = parseInt(req.params.userId);
	res.cookie(
		cfg.cookie.name,
		userId,
		{
			domain: '.'+req.headers.host.split(':')[0],
			maxAge: cfg.cookie.expireSeconds,
		}
	);
	res.json({
		success: "Cookie set"
	})
	next();
});

router.put('/relation/:userId/privacy/:privacy_id',
	`
		REPLACE INTO Relationship
			(user_id, relationship_id, privacy_id)
		VALUES
			(:payload.me.id:, :params.userId:, :params.privacy_id:)
	`,
	({ data }) => !!data.affectedRows,
);

module.exports = router;
