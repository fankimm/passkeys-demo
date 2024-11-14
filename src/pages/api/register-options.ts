// pages/api/registerOptions.ts
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = "jihwan.kim"; // 클라이언트에서 유저 ID를 받아옵니다
  // const user = await database.getUserById(userId);

  const options = await generateRegistrationOptions({
    rpName: "Your App Name",
    rpID: "localhost",
    userID: new TextEncoder().encode(userId),
    userName: "test@email.com",
  });
  // await database.saveChallenge(userId, options.challenge);
  res.status(200).json(options);
}
