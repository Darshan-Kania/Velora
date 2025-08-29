import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Express middleware to verify JWT from Authorization header (Bearer), x-access-token header, cookie, or query string.
// On success attaches decoded token to req.user and calls next(). On failure sends 401.
export function verifyToken(req, res, next) {
  let token = null;
  // Cookie (requires cookie-parser middleware)
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      if (res.clearCookie) res.clearCookie("jwt");
    }
    return res.redirect("/auth/google");
  }
}
