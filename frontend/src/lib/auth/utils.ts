import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    })
  ).toString("base64url");

  const secret = process.env.JWT_SECRET || "your-secret-key";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const [header, payload, signature] = token.split(".");

    const secret = process.env.JWT_SECRET || "your-secret-key";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());

    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { userId: decoded.sub };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}
