require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/auth', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adfree', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User model
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// JWT generation
function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
    );
}

// Routes
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: 'Validation failed',
            errors: errors.array() 
        });
    }

    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Generate token
        const token = generateToken(user);

        // Send response
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Protected route example
app.get('/api/auth/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            user 
        });
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something broke!' 
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));