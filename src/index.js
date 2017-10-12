const crypto = require("crypto");
const debug = require("debug")("axios-adapter-hmac");

const DEFAULT_CONFIG = {
	scheme: require("hmac-scheme-plain"),
	algorithm: "sha256",
	signatureEncoding: "hex",
	signedHeaders: ["content-type", "date", "host"],
};
const validHashes = crypto.getHashes();
const validEncodings = ["hex", "binary", "base64"];

function hmacAdapter(axios, config = {}) {
	config = Object.assign({}, DEFAULT_CONFIG, config);

	if (!axios || typeof axios !== "function") {
		throw new Error("axios instance required as first argument");
	}

	if (!validHashes.includes(config.algorithm)) {
		throw new Error(
			`"${config.algorithm}" is not a valid hashing algorithm for this platform. Valid options are: ${validHashes.join(
				", "
			)}.`
		);
	}

	if (!validEncodings.includes(config.signatureEncoding)) {
		throw new Error(
			`"${config.signatureEncoding} is not a valid encoding. Valid options are: ${validEncodings.join(
				", "
			)}.`
		);
	}

	if (!config.signedHeaders || !Array.isArray(config.signedHeaders)) {
		throw new Error("signedHeaders must be an array.");
	}

	return function adapter(request) {
		debug("Initial request", request);

		try {
			config.scheme.sign({
				request,
				schemeConfig: config.schemeConfig,
				signedHeaders: config.signedHeaders,
				hash,
				hmac,
			});
		} catch (error) {
			debug("Request signing failed", error);
			return Promise.reject(error);
		}

		debug("Signed request", request);

		return axios.defaults.adapter.call(this, request);
	};

	function hash(data) {
		return crypto
			.createHash(config.algorithm)
			.update(data)
			.digest(config.signatureEncoding);
	}

	function hmac(data, key) {
		return crypto
			.createHmac(config.algorithm, key)
			.update(data)
			.digest(config.signatureEncoding);
	}
}

module.exports = hmacAdapter;
