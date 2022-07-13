const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }
        const email = req.body.email;
        const name = req.body.name;
        const password = req.body.password;


        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPassword,
            name: name
        });
        const result = await user.save();

        res.status(201).json({
            message: 'User created!',
            userId: result._id
        })
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500; //may not have error code
        }
        next(err)
    }

}

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    const user = await User.findOne({ email: email });

    try {
        if (!user) {
            const error = new Error('A user with this email could not be found');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        const isEqual = await bcrypt.compare(password, user.password);


        if (!isEqual) {
            const error = new Error('Wrong password!');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: loadedUser.email,
                userId: loadedUser._id.toString(),
            }, 'somesupersecretsecret',
            { expiresIn: '1h' }
        );

        res.status(200).json({ token: token, userId: loadedUser._id.toString() })
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500; //may not have error code
        }
        next(err)
    }
}

exports.getStatus = async (req, res, next) => {
    const user = await User.findById(req.userId);
    try {
        if (!user) {
            const error = new Error('Unauthorized User');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({ message: 'Status retrieved successfully', status: user.status })
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500; //may not have error code
        }
        next(err)
    }
}
exports.updateStatus = async (req, res, next) => {
    const updatedStatus = req.body.status
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            const error = new Error('Unauthorized User');
            error.statusCode = 401;
            throw error;
        }
        if (updatedStatus) {
            user.status = updatedStatus;
        }
        await user.save();



        res.status(200).json({ message: 'Status Updated!!' })
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500; //may not have error code
        }
        next(err)
    }
}