import jwkToPem from "jwk-to-pem";
import dotEnv from 'dotenv'
import * as fs from 'node:fs';

// Config .env file
dotEnv.config()

async function getKeycloakConfig() {
	// Get envs var
	let keycloakConfig = {
		"clientSecret": process.env.CLIENT_SECRET ?? '',
		"clientID": process.env.CLIENT_ID ?? '',
		"wellKnown": process.env.WELL_KNOWN ?? '',
	}

	if (keycloakConfig.wellKnown === '') {
		console.error('No .env')
		throw new Error("No .env");
		return false;
	}

	// curl to get keycloakConfig
	const response = await fetch(keycloakConfig.wellKnown, {
		method: "GET", // *GET, POST, PUT, DELETE, etc.
		headers: {
			"Content-Type": "application/json",
		}
	});

	keycloakConfig.wellKnownRes = await response.json();

	return keycloakConfig;
}

async function getJWKSig() {
	let keycloakConfig = await  getKeycloakConfig()
	if (keycloakConfig === false) {
		return false;
	}

	// curl to get JWK
	const response = await fetch(keycloakConfig.wellKnownRes['jwks_uri'], {
		method: "GET", // *GET, POST, PUT, DELETE, etc.
		headers: {
			"Content-Type": "application/json",
		}
	});

	let jwkSet = await response.json()
	let key = '';
	jwkSet.keys.forEach(jwk => {
		if (jwk.alg === 'RS256') {
			key = jwk
		}
	})

	return key
}

function saveNewPEM(jwk) {
	// Get pem
	let pem = jwkToPem(jwk);

	////// NEED TO TEST IF THE JWK CORRECTLY DECODE JWT //////

	// Save in public.pem
	fs.writeFileSync('public.pem', pem);
	return pem
}

let jwk = await getJWKSig()
let res = saveNewPEM(jwk)
await console.log(res)