var router = require('../router')
var pluck = require('pluck');

router.get('/all',
	`
		SELECT
			Node.*
		FROM
			Node
		LEFT JOIN
			Junction
				ON Node.id = Junction.child_node_id
		WHERE
			Junction.node_id IS NULL;
	`,
	({ req, res, data }) => {
		return req.topLevelNodes = data;
	},
	`
		SELECT
			Junction.node_id as parent_id,
			Node.*
		FROM
			Junction
		LEFT JOIN
			Node
				ON Junction.child_node_id = Node.id
		WHERE
			Junction.node_id IN (
					SELECT
						Node.id
					FROM
						Node
					LEFT JOIN
						Junction
							ON Node.id = Junction.child_node_id
					WHERE
						Junction.node_id IS NULL)
	`,
	({ req, res, data }) => {
		const childNodes = data;
		return req.topLevelNodes.map(node => ({
			...node,
			children: childNodes.filter(childNode => childNode.parent_id === node.id)
		}));
	},
);

router.get('/:nodeId([0-9]+)',
	{
		node: `
			SELECT
				*
			FROM
				Node
			WHERE
				id=:params.nodeId:
		`,
		children: `
			SELECT
				Node.*
			FROM
				Node
			INNER JOIN
				Junction
					ON Node.id = Junction.child_node_id
			WHERE
				Junction.node_id=:params.nodeId:
		`,
	},
	({ data }) => ({ ...data.node[0], children: data.children }),
);

router.post('/:parentNodeId',
	`
		INSERT INTO
			Node
				(user_id, text, handle)
			VALUES
				(:payload.me.id:, :body.text:, :body.handle:);
	`,
	({ req, data }) => { req.newNodeId = data.insertId },
	`
		INSERT INTO
			Junction
				(node_id, child_node_id)
			VALUES
				(:params.parentNodeId:, :newNodeId:);
	`,
	`
		SELECT * FROM Node WHERE id = :newNodeId:;
	`,
	({ data }) => data[0],
);

router.post('/',
	`
		INSERT INTO
			Node
				(user_id, text, handle)
			VALUES
				(:payload.me.id:, :body.text:, :body.handle:);
	`,
	`
		SELECT * FROM Node WHERE id = :data.insertId:;
	`,
	({ data }) => data[0],
);

module.exports = router;
