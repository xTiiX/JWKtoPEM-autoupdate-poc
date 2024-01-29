import jwkToPem from "jwk-to-pem";
import dotEnv from 'dotenv'
import * as fs from 'node:fs';
import axios from 'axios';

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
	}

	// curl to get keycloakConfig
	await axios({
		url: keycloakConfig.wellKnown,
		method: "GET", // *GET, POST, PUT, DELETE, etc.
		headers: {
			"Content-Type": "application/json",
		}
	}).then((response) => {
		keycloakConfig.wellKnownRes = response;
	}).catch((err) => console.log(err));

	return keycloakConfig;
}

async function getJWKSig() {
	let keycloakConfig = await getKeycloakConfig()
	if (keycloakConfig === false) {
		return false;
	}

	// curl to get JWK
	let key = '';
	await axios({
		url: keycloakConfig.wellKnownRes.data.jwks_uri,
		method: "GET", // *GET, POST, PUT, DELETE, etc.
		headers: {
			"Content-Type": "application/json",
		}
	}).then((response) => {
		response.data.keys.forEach(jwk => {
			if (jwk.alg === 'RS256') {
				key = jwk
			}
		})
	}).catch((err) => console.log(err));

	return key
}

async function saveNewPEM(jwk) {
	// Get pem
	let pem = jwkToPem(jwk);

	////// NEED TO TEST IF THE JWK CORRECTLY DECODE JWT //////

	// Save in public.pem
	try {
		await fs.writeFileSync('public.pem', pem);
	} catch (e) {
		console.log('Error when file saved :');
		console.log(e);
	}
	return pem
}

let jwk = await getJWKSig()
let res = await saveNewPEM(jwk)
console.log(res)