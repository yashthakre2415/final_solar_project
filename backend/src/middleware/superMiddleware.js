const superMiddleware = (requiredRole) => {
    return (req, res, next) => {
        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied. SuperAdmin only."
            });
        }

        next();
    };
};

module.exports = superMiddleware;