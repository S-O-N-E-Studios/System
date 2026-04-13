
// Validation rules for authentication endpoints prevents invalid data from being processed by the controller

exports.validateRegister = (req, res, next) => {
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(400).json({ message: 'Email and password are required' });
    }
    next();
};