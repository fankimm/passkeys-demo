import { getCredential } from "@/pages/api/utils";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // getCredential() 불러와

  console.log("getCredential", getCredential("admin"));
}
