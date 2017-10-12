/* eslint-disable no-unused-vars */
const mockDigest = jest.fn();
const mockCreateHash = jest.fn().mockReturnValue({
	update() {
		return {
			digest: mockDigest,
		};
	},
});
const mockCreateHmac = jest.fn().mockReturnValue({
	update() {
		return {
			digest: mockDigest,
		};
	},
});

jest.mock("crypto", () => ({
	getHashes() {
		return ["sha256", "sha512"];
	},
	createHash: mockCreateHash,
	createHmac: mockCreateHmac,
}));
jest.mock("debug", () => () => () => {});
jest.mock("hmac-scheme-plain", () => ({
	sign: jest.fn().mockImplementation(options => {
		if (options.request.error) {
			throw new Error("Signing error");
		}

		options.hash("string");
		options.hmac("string", "key");
	}),
}));

const scheme = require("hmac-scheme-plain");
const hmacAdapter = require("../index");

function axios() {}

axios.defaults = {
	adapter: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

it("requires an axios instance to be passed as the first argument", () => {
	expect(() => {
		const adapter = hmacAdapter();
	}).toThrow();

	expect(() => {
		const adapter = hmacAdapter("string");
	}).toThrow();
});

it("requires the algorithm to be a valid, available algorithm", () => {
	expect(() => {
		const adapter = hmacAdapter(axios, { algorithm: "invalid" });
	}).toThrow();
});

it("accepts valid algorithms", () => {
	expect(() => {
		const adapter = hmacAdapter(axios, { algorithm: "sha256" });
	}).not.toThrow();
});

it("requires the signature encoding to be a valid encoding", () => {
	expect(() => {
		const adapter = hmacAdapter(axios, { signatureEncoding: "invalid" });
	}).toThrow();
});

it("accepts valid encodings", () => {
	expect(() => {
		const adapter = hmacAdapter(axios, { signatureEncoding: "binary" });
	}).not.toThrow();

	expect(() => {
		const adapter = hmacAdapter(axios, { signatureEncoding: "hex" });
	}).not.toThrow();

	expect(() => {
		const adapter = hmacAdapter(axios, { signatureEncoding: "base64" });
	}).not.toThrow();
});

it("requires a signedHeaders argument in the config", () => {
	expect(() => {
		const adapter = hmacAdapter(axios, { signedHeaders: null });
	}).toThrow();
});

it("requires the signedHeaders argument to be an array", () => {
	expect(() => {
		const adapter = hmacAdapter(axios, { signedHeaders: "string" });
	}).toThrow();
});

it("returns an adapter function", () => {
	const adapter = hmacAdapter(axios);

	expect(typeof adapter).toBe("function");
});

describe("adapter function", () => {
	it("calls the scheme `sign` function with default options", () => {
		const request = { key: "value" };
		const adapter = hmacAdapter(axios);

		adapter(request);

		const args = scheme.sign.mock.calls[0][0];

		expect(scheme.sign).toHaveBeenCalledTimes(1);
		expect(args.request).toEqual(request);
		expect(args.schemeConfig).toBeUndefined();
		expect(args.signedHeaders).toEqual(["content-type", "date", "host"]);
		expect(mockCreateHash).toHaveBeenCalledTimes(1);
		expect(mockCreateHash).toHaveBeenCalledWith("sha256");
		expect(mockCreateHmac).toHaveBeenCalledTimes(1);
		expect(mockCreateHmac).toHaveBeenCalledWith("sha256", "key");
		expect(mockDigest).toHaveBeenCalledTimes(2);
		expect(mockDigest).toHaveBeenCalledWith("hex");
	});

	it("calls the scheme `sign` function with provided options", () => {
		const schemeConfig = { key: "value" };
		const request = { key: "value" };
		const signedHeaders = ["one", "two"];
		const adapter = hmacAdapter(axios, {
			schemeConfig,
			signedHeaders,
			signatureEncoding: "binary",
			algorithm: "sha512",
		});

		adapter(request);

		const args = scheme.sign.mock.calls[0][0];

		expect(scheme.sign).toHaveBeenCalledTimes(1);
		expect(args.request).toEqual(request);
		expect(args.schemeConfig).toEqual(schemeConfig);
		expect(args.signedHeaders).toEqual(signedHeaders);
		expect(mockCreateHash).toHaveBeenCalledTimes(1);
		expect(mockCreateHash).toHaveBeenCalledWith("sha512");
		expect(mockCreateHmac).toHaveBeenCalledTimes(1);
		expect(mockCreateHmac).toHaveBeenCalledWith("sha512", "key");
		expect(mockDigest).toHaveBeenCalledTimes(2);
		expect(mockDigest).toHaveBeenCalledWith("binary");
	});

	it("calls the default axios adapter if there are no signing errors", () => {
		const request = { key: "value" };
		const adapter = hmacAdapter(axios);

		adapter(request);

		expect(axios.defaults.adapter).toHaveBeenCalledTimes(1);
		expect(axios.defaults.adapter).toHaveBeenCalledWith(request);
	});

	it("returns a rejected promise if there is a signing error", () => {
		const request = { error: true };
		const adapter = hmacAdapter(axios);

		expect.assertions(1);
		return expect(adapter(request)).rejects.toBeTruthy();
	});
});
