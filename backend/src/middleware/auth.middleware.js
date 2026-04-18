const { verifyAccessToken } = require("../utils/generateToken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED" });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "INVALID_TOKEN" });
  }
};

module.exports = { authenticate };
