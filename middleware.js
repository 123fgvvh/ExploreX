const Listing = require('./models/listing.js');
const Review = require('./models/review.js');


module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;  //store the original url to redirect after login
        req.flash("error", "You must be logged in to create Listing!");
        res.redirect('/login');
    }
    next();
};

module.exports.savedRedirectUrl = (req, res, next) => {
    if (!req.isAuthenticated() && req.method === 'GET') {
        req.session.redirectUrl = req.originalUrl; // Store the original URL only for GET requests and if the user is not authenticated
    }
    next();
};


module.exports.checkListingOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect('/listings');
    }
    // Check if the current user is the owner of the listing
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to perform this action on this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { reviewId } = req.params;
    let review = await Review.findById(reviewId);

    if (!review.author.equals(res.locals.currentUser._id)) {
        req.flash("error", "You do not have permission to make changes to this review.");
        return res.redirect("/listings/" + review.listing);
    }
    next();
};
