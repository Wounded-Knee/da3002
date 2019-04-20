var router = require('../router')

router.put('/:userId/privacy/:privacy_id',
	`
		REPLACE INTO Relationship
			(user_id, relationship_id, privacy_id)
		VALUES
			(:payload.me.id:, :params.userId:, :params.privacy_id:)
	`,
	({ data }) => !!data.affectedRows,
);

module.exports = router;
