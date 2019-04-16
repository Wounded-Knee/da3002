var Joi = require('joi');

module.exports = {
	getBecome: {
		params: {
			userId: Joi.number().integer().required(),
		}
	},
	putAnswer: {
		params: {
			answerId: Joi.number().integer().required(),
			testId: Joi.number().integer().required(),
		}
	},
	postTests: {
		body: {
			question: Joi.string().required(),
			choices: Joi.array().items(
				Joi.object().keys({
					name: Joi.string().required(),
					summary: Joi.string().required(),
					emoji: Joi.string().required(),
					choice: Joi.string().required(),
				})
			)
		}
	}
};
