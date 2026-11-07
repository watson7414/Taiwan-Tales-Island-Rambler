// SHA-256 Checksum and Integrity Verification System for Game Saves

const SECRET_SALT = "TW_ISLAND_RAMBLER_OCCULT_CIPHER_2026_XIMEN";

export async function generateChecksum(data: object): Promise<string> {
  try {
    const rawString = JSON.stringify(data) + SECRET_SALT;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  } catch (err) {
    console.error("Checksum generation failed:", err);
    // Fallback hash
    let hash = 0;
    const str = JSON.stringify(data) + SECRET_SALT;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export async function verifyChecksum(data: object, targetChecksum: string): Promise<boolean> {
  const calculated = await generateChecksum(data);
  return calculated === targetChecksum;
}
