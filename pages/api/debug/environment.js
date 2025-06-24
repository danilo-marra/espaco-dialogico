import {
  getEnvironmentInfo,
  generateInviteLink,
} from "../../../utils/getBaseUrl.js";

export default function handler(req, res) {
  // Só permitir em desenvolvimento e preview
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not found" });
  }

  const envInfo = getEnvironmentInfo();
  const testInviteCode = "TEST123";
  const testInviteLink = generateInviteLink(testInviteCode);

  const debugInfo = {
    ...envInfo,
    testInviteCode,
    testInviteLink,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(debugInfo);
}
