var Joi = require('joi');

module.exports = {
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
