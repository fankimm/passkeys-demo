import * as cbor from "cbor";
// import * as coseToJwk from "cose-to-jwk";
import { createHash, randomBytes, verify } from "crypto";
const coseToJwk = require("cose-to-jwk");
interface ClientDataJSON {
  type: "webauthn.create" | "webauthn.get";
  challenge: string;
  origin: string;
  crossOrigin: boolean;
}

interface Credential {
  id: string;
  pubKey: string;
}

// Mock database for demonstration purposes
const db = {
  challenges: new Map<string, string>(),
  credentials: new Map<string, Credential>(),
};

const saveChallenge = (userId: string, challenge: string) => db.challenges.set(userId, challenge);
const getChallenge = (userId: string): string | undefined => db.challenges.get(userId);
const deleteChallenge = (userId: string) => db.challenges.delete(userId);
const saveCredential = (userId: string, credential: Credential) => db.credentials.set(userId, credential);
const getCredential = (userId: string) => db.credentials.get(userId);

const generateChallenge = (): string => randomBytes(32).toString("base64");

const verifyRegistration = async (attestationObject: Buffer, clientDataJSON: Buffer) => {
  const decodedAttestationObject = await cbor.decodeFirst(attestationObject);
  const { fmt, authData, attStmt } = decodedAttestationObject;
  const { sig, alg, x5c } = attStmt;

  // Extract the COSE key
  const coseKeyBuffer = extractCoseKey(authData);

  // Convert it to JWK
  const jwk = coseToJwk(coseKeyBuffer);
  const pubKeyJWK = btoa(JSON.stringify(jwk));

  const clientDataHash = createHash("SHA256").update(clientDataJSON).digest();

  const dataToVerify = Buffer.concat([authData, clientDataHash]);

  // Verify the signature against the data
  const isVerified = verify(
    null, // For ECDSA, the algorithm is determined by the key
    dataToVerify,
    {
      key: jwk,
      format: "jwk", // Specifying the format as JWK
      type: "spki", // Public key
    },
    sig
  );

  return { isVerified, pubKeyJWK };
};

const verifyLogin = async (authData: Buffer, clientDataJSON: Buffer, sig: Buffer, pubKeyJwk: string) => {
  const jwk = JSON.parse(Buffer.from(pubKeyJwk, "base64").toString());

  const clientDataHash = createHash("SHA256").update(clientDataJSON).digest();

  const dataToVerify = Buffer.concat([authData, clientDataHash]);

  // Verify the signature against the data
  const isVerified = verify(
    null, // For ECDSA, the algorithm is determined by the key
    dataToVerify,
    {
      key: jwk,
      format: "jwk", // Specifying the format as JWK
      type: "spki", // Public key
    },
    sig
  );

  return isVerified;
};

const extractCoseKey = (authData: Buffer): Buffer => {
  // Skip the RP ID hash, flags, sign count, and AAGUID
  const fixedLength = 32 + 1 + 4 + 16; // 53 bytes

  // Read the credential ID length (2 bytes, big endian)
  const credentialIdLength = authData.readUInt16BE(fixedLength);

  // Calculate the start of the COSE key
  const coseKeyStartIndex = fixedLength + 2 + credentialIdLength; // +2 for the length field itself

  // Extract the COSE key
  return authData.slice(coseKeyStartIndex);
};

const destructClientDataJSON = (clientDataJSON: Buffer): ClientDataJSON => {
  return JSON.parse(clientDataJSON.toString());
};

const compareChallenges = (c1: string, c2: string) => {
  return Buffer.from(c1, "base64").toString() === Buffer.from(c2, "base64").toString();
};

export {
  compareChallenges,
  db,
  deleteChallenge,
  destructClientDataJSON,
  generateChallenge,
  getChallenge,
  getCredential,
  saveChallenge,
  saveCredential,
  verifyLogin,
  verifyRegistration,
};
