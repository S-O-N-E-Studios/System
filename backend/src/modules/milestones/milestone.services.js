const User = require('../users/users.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// register user
exports.register = async ({name, email, password}) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if(existingUser) {
        throw new Error('User already exists');


    // hashing the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 32);

    // Create new user
    const user = new User({
        name,
        email,
        password: hashedPassword
    });

    return user;

    };

};

// login user
exports.login = async ({ email, password }) => {

    const user = await User.findOne({ email });

    // check if user exists
    if (!user){
        throw new Error('Invalid email or password');
    }
    // validate the password by comparing the hashed password in the database with the password provided by the user during login using bcrypt's compare function
    const ismatch = await bcrypt.compare(password, user.password);

    if (!ismatch){
        throw new Error('Invalid credentials');
    };

    // generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role, organization: user.Organization }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return { user, token }; // return the user and the token to the controller

};
