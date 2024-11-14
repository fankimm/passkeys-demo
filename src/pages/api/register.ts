import type { NextApiRequest, NextApiResponse } from "next";
import {
  compareChallenges,
  db,
  deleteChallenge,
  destructClientDataJSON,
  generateChallenge,
  getChallenge,
  saveChallenge,
  saveCredential,
  verifyRegistration,
} from "./utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action, userId, credential } = req.body as {
    action: string;
    userId: string;
    credential?: any;
  };

  console.log(`New call to /register. Action: ${action}`);

  if (action === "registerOptions") {
    const challenge = generateChallenge();
    saveChallenge(userId, challenge);

    const registerOptions = {
      challenge,
      rp: { id: "localhost", name: "Example Service" },
      user: {
        id: userId,
        name: `${userId}`,
        displayName: `${userId}@localhost`,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      timeout: 60000,
      attestation: "direct",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: false,
        userVerification: "preferred",
      },
    };

    res.status(200).json(registerOptions);
  } else if (action === "registerCredential") {
    const attObj = Buffer.from(credential.response.attestationObject, "base64");
    const cdjObj = Buffer.from(credential.response.clientDataJSON, "base64");

    try {
      const expectedChallenge = getChallenge(userId);

      if (!expectedChallenge) {
        return res.status(400).json({ error: "Challenge not found or expired." });
      }

      const { challenge, type } = destructClientDataJSON(cdjObj);

      if (type != "webauthn.create") {
        throw new Error("Wrong type, expected webauthn.create");
      }

      if (!compareChallenges(challenge, expectedChallenge)) {
        throw new Error("Expected challenge mismatch");
      }

      const { isVerified, pubKeyJWK } = await verifyRegistration(attObj, cdjObj);

      if (!isVerified) {
        throw new Error("Signature mismatch");
      }

      saveCredential(userId, { id: credential.id, pubKey: pubKeyJWK });
      deleteChallenge(userId);

      res.status(200).json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(401).json({ success: false, message: (error as Error).message });
    }
  } else {
    res.status(400).json({ error: "Invalid action" });
  }

  console.log(db);
}
