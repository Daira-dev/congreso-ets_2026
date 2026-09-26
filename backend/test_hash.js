const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

const originalHash = "f8bb2219633e8e7d23d85836fae758a5:fe5e227091448b111dc54b1f49e49cb4a52ff37cffcf385b2ee50ba3ee27bb61c7414bc9697d812239f60f64beae89fa0821d3780369a4781498b3f6e1f0e4b8";
const passwordToTest = "SuperAdmin2026!";

const [salt, keyHex] = originalHash.split(':');
const storedBuffer = Buffer.from(keyHex, 'hex');
const derivedKey = crypto.scryptSync(passwordToTest, salt, 64);
const isValid = crypto.timingSafeEqual(storedBuffer, derivedKey);

console.log("Is valid:", isValid);
console.log("New hash for admin:", hashPassword("admin"));
console.log("New hash for SuperAdmin2026!:", hashPassword("SuperAdmin2026!"));
