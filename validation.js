var Joi = require('joi');

module.exports = {
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
