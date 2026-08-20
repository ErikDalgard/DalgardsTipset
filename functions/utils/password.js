export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  // Vi sparar salt o hash tillsammans
  return `${bufferToHex(salt)}:${bufferToHex(hash)}`;
}

// Jämför ett inskrivet lösenord mot en sparad hash
export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  const salt = hexToBuffer(saltHex);
  const hash = await pbkdf2(password, salt);
  return bufferToHex(hash) === hashHex;
}

async function pbkdf2(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return new Uint8Array(bits);
}

function bufferToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBuffer(hex) {
  return new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
}