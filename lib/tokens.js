'use strict';

var crypto = require('crypto');

var TOKEN_BYTES = 16;

function generate_token(prefix) {
	return prefix + crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

module.exports.generate_token = generate_token;
