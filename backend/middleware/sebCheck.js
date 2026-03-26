const sebCheck = (req, res, next) => {
    // Bypass SEB entirely for staff, admins, and department admins
    if (req.user && ['admin', 'staff', 'department_admin'].includes(req.user.role)) {
        return next();
    }

    // Basic Safe Exam Browser validation using User-Agent.
    // Temporarily bypassed for testing/development. To re-enable SEB enforcement, 
    // uncomment the logic below.
    
    /*
    const userAgent = req.get('User-Agent') || '';

    // Check if the request is coming from SEB
    if (userAgent.includes('SafeExamBrowser')) {
        next();
    } else {
        res.status(403).json({
            error: 'Safe Exam Browser (SEB) is required to access this exam.',
            sebRequired: true
        });
    }
    */
    
    next(); // Bypass SEB check
};

module.exports = sebCheck;
