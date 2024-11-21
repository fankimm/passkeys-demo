import type { NextApiRequest, NextApiResponse } from "next";
import {
  compareChallenges,
  db,
  destructClientDataJSON,
  generateChallenge,
  getChallenge,
  getCredential,
  saveChallenge,
  verifyLogin,
} from "../utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action, userId, credential } = req.body as {
    action: string;
    userId: string;
    credential?: any;
  };

  console.log(`New call to /login. Action: ${action}`);

  if (req.method === "POST") {
    if (action === "loginOptions") {
      const challenge = generateChallenge();

      const loginOptions = {
        challenge: challenge,
        timeout: 60000,
      };

      saveChallenge(userId, challenge);
      res.status(200).json(loginOptions);
    } else if (action === "verifyCredential") {
      const athObj = Buffer.from(credential.response.authenticatorData, "base64");
      const cdjObj = Buffer.from(credential.response.clientDataJSON, "base64");
      const sig = Buffer.from(credential.response.signature, "base64");

      try {
        const expectedChallenge = getChallenge(userId);
        const expectedCredential = getCredential(userId);
        console.log("expectedChallenge", expectedChallenge);
        console.log("expectedCredential", expectedCredential);
        if (!expectedChallenge || !expectedCredential) {
          throw new Error("Could not find expected challenge or credential");
        }

        const { challenge, type } = destructClientDataJSON(cdjObj);

        if (type != "webauthn.get") {
          throw new Error("Wrong type, expected webauthn.get");
        }

        if (!compareChallenges(challenge, expectedChallenge)) {
          throw new Error("Expected challenge mismatch");
        }

        if (credential.id !== expectedCredential.id) {
          throw new Error("Expected another credential");
        }

        const isVerified = verifyLogin(athObj, cdjObj, sig, expectedCredential.pubKey);

        if (!isVerified) {
          throw new Error("Assertion not verified");
        }
        // Optionally, remove the used challenge to prevent replay attacks
        // TODO : 왜 바로 지우는 코드가 있지?
        // deleteChallenge(userId);

        res.status(200).json({ success: true, message: "Login successful" });
      } catch (error) {
        // console.log(error);
        res.status(401).json({ success: false, message: (error as Error).message });
      }
    } else {
      res.status(400).json({ error: "Invalid action" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end("Method Not Allowed");
  }

  console.log(db);
}
