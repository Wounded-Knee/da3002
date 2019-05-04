var createError = require('http-errors');
var router = require('../router')

router
	.get('/node/all',
		`
			SELECT DISTINCT
				Node.*
			FROM
				Node
			LEFT JOIN
				Junction
					ON Node.id = Junction.child_node_id
			WHERE
				Junction.node_id IS NULL;
		`,
		({ req, data }) => {
			return req.topLevelNodes = data;
		},
		`
			SELECT DISTINCT
				Junction.node_id as parent_id,
				Node.*
			FROM
				Junction
			LEFT JOIN
				Node
					ON Junction.child_node_id = Node.id
			WHERE
				Junction.node_id IN (
						SELECT DISTINCT
							Node.id
						FROM
							Node
						LEFT JOIN
							Junction
								ON Node.id = Junction.child_node_id
						WHERE
							Junction.node_id IS NULL)
		`,
		({ req, data }) => {
			const childNodes = data;
			return req.topLevelNodes.map(node => ({
				...node,
				children: childNodes.filter(childNode => childNode.parent_id === node.id)
			}));
		},
	)

	.get('/node/:nodeId([0-9]+)',
		`
			INSERT INTO
				Knowledge
					(user_id, node_id, privacy_id, knowledgeType_id, associated, expires)
				VALUES
					(:userId:, :params.nodeId:, 5, 2, :transactionDate:, NULL);
		`,
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
	)

	.post('/node/:parentNodeId',
		`
			INSERT INTO
				Node
					(user_id, text, handle)
				VALUES
					(:userId:, :body.text:, :body.handle:);
		`,
		({ req, data }) => { req.newNodeId = data.insertId },
		`
			INSERT INTO
				Junction
					(node_id, child_node_id, junctionType_id)
				VALUES
					(:params.parentNodeId:, :newNodeId:, 2);
		`,
		`
			SELECT * FROM Node WHERE id = :newNodeId:;
		`,
		({ req, data }) => ({
			...data[0],
			parent_id: parseInt(req.params.parentNodeId),
		})
	)

	.post('/node',
		`
			INSERT INTO
				Node
					(user_id, text, handle)
				VALUES
					(:userId:, :body.text:, :body.handle:);
		`,
		`
			SELECT * FROM Node WHERE id = :data.insertId:;
		`,
		({ data }) => data[0],
	)

	.put('/node/:nodeId/relation/:childNodeId',
		`
			INSERT INTO
				Knowledge
					(user_id, node_id, privacy_id, knowledgeType_id, associated, expires)
				VALUES
					(:userId:, :params.nodeId:, 5, 3, :transactionDate:, NULL)
		`
	)
;

module.exports = router;
