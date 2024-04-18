if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const path = require('path');
const Listing = require('./models/listing.js');
const listingsRoutes = require('./routes/listing.js');
const reviewRoutes = require('./routes/review.js');
const userRoutes = require('./routes/user.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user.js');

const app = express();

// Middleware
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionOptions = {
    secret: process.env.SESSION_SECRET ,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        httpOnly: true,
    }
};

const dbUrl = process.env.ATLASDB_URL;

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret : process.env.SESSION_SECRET,
    },
    touchAfter: 24 * 3600,
});
store.on("error", err => {
    console.log("ERROR in mongo session store", err);
});

// Initialize Passport.js middleware
app.use(session({
    store,
    ...sessionOptions
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Passport.js configuration
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to set local variables for success and error flash messages
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

// MongoDB connection
mongoose.connect(dbUrl)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error(`Error connecting to MongoDB: ${err}`));

// Routes for listings
app.use('/listings', listingsRoutes);

// Routes for reviews
app.use('/listings', reviewRoutes);

app.use('/', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('listings/error', { status: 500, message: 'Internal Server Error' });
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
