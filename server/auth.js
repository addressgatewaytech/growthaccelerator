const crypto = require('crypto');

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function basicAuth(req, res, next) {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS || 'changeme';

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    const reqUser = decoded.slice(0, idx);
    const reqPass = decoded.slice(idx + 1);
    if (timingSafeEqual(reqUser, user) && timingSafeEqual(reqPass, pass)) {
      return next();
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="Address Gateway Admin"');
  return res.status(401).send('Authentication required.');
}

module.exports = { basicAuth };
