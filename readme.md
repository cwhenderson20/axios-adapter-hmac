# axios-adapter-hmac

[![Build Status](https://travis-ci.org/cwhenderson20/axios-adapter-hmac.svg?branch=master)](https://travis-ci.org/cwhenderson20/axios-adapter-hmac)
[![Coverage Status](https://coveralls.io/repos/github/cwhenderson20/axios-adapter-hmac/badge.svg)](https://coveralls.io/github/cwhenderson20/axios-adapter-hmac)

Sign axios HTTP requests with a customizable HMAC signature

## Installation

```bash
npm install axios-adapter-hmac --save
```

## Usage

```javascript
const axios = require("axios");
const hmacAdapter = require("axios-adapter-hmac");

const config = {
    //options detailed below
};
const adapter = hmacAdapter(axios, config);

// the request will automatcally be signed
axios
    .get("https://example.com", { adapter })
    .then(response => console.log(response))
    .catch(error => console.log(error));
```

This also works (so you only have to define the adapter once):

```javascript
const axios = require("axios");
const hmacAdapter = require("axios-adapter-hmac");

const config = {
    // ...
};
const adapter = hmacAdapter(axios, config);
const instance = axios.create({ adapter });

instance
    .get("https://example.com")
    .then(response => console.log(response))
    .catch(error => console.log(error));

```

## Configure

The default options are:

```javascript
{
    scheme: require("hmac-scheme-plain"),
    algorithm: "sha256",
    signatureEncoding: "hex",
    signedHeaders: ["content-type", "date", "host"],
}
```

### `algorithm`

The hashing algorithm (e.g., `sha256`, `md5`, etc.) to use when generating hashes. See Node.js' [crypto documentation](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) for information on available algorithms.


### `signatureEncoding`

The encoding to use when generating hash digests. Valid options are `hex`, `latin1`, and `base64`.

### `signedHeaders`

The headers that will be included when creating the HMAC signature. Only these headers will be used when creating the signature; other headers included may be modified enroute without invaldating the signature.

Must be an array; can be empty.

### Schemes

The adapter gains flexibility through pluggable schemes. The scheme does most of the hard work and is responsible for generating the HMAC signature and adding the requisite headers to the request.

A default scheme is included ([hmac-scheme-plain](https://github.com/cwhenderson20/hmac-scheme-plain)), which follows the spec defined in [cmawhorter/hmmac](https://github.com/cmawhorter/hmmac).

The default scheme expects two keys, `publicKey` and `privateKey`, which you must pass into the `config` object via the `schemeConfig` key:

```javascript
const config = {
    // ...other options
    schemeConfig: {
        privateKey: "your private key",
        publicKey: "your public key",
    },
};
```

If you want to use the default scheme (likely in combination with `cmawhorter/hmmac`), you do not need to specify the `scheme`. Note, however, that the `schemeConfig` is still required;

#### Using Your Own Scheme

If you would like to create your own scheme (for example, to sign requests in the AWS4 style), you may do so. Simply `require` the scheme and pass it to the `scheme` key of the config. For example:

```javascript
const axios = require("axios");
const customScheme = require("custom-scheme");
const hmacAdapter = require("axios-adapter-hmac");

const config = {
    scheme: customScheme
};

const adapter = hmacAdapter(axios, config);
```

Your scheme must implement a `sign` function, which should directly modify the `request` object it is given. The `sign` function will receive the following object as its first argument when it is called:

```javascript
{
    request,
    schemeConfig,
    signedHeaders,
    hash,
    hmac,
}
```

**`request`**

The axios request object.

**`schemeConfig`**

The value of schemeConfig as defined in the adapter config. Use this to pass options like public and private keys to the scheme.

**`signedHeaders`**

An array of headers to be included when creating the HMAC signature.

**`hash`**

A function that takes a string of data and returns a hash digest using the encoding specified in the adapter config.

**`hmac`**

A function that takes a string of data and returns an HMAC digest using the encoding and algorithms specified in the adapter config.

