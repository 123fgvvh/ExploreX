const Listing = require('../models/listing');
const Review = require('../models/review');


module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const { comment, rating } = req.body.review;

    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError('Listing not found', 404);

    let newReview = new Review({ comment, rating });
    newReview.author = req.user._id; // Assigns the user who is making this review as the author
    listing.reviews.push(newReview);

    await Promise.all([newReview.save(), listing.save()]);
    
    req.flash("success", "Review added successfully");
    res.redirect(`/listings/${id}`);
}

module.exports.deleteReview = async (req, res) => {
    try {
        const { listingId, reviewId } = req.params;
        const listing = await Listing.findById(listingId);
        
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect('back'); // Redirect back to the previous page
        }

        const index = listing.reviews.findIndex(review => review._id.equals(reviewId));
        if (index === -1) {
            throw new ExpressError('Review not found', 404);
        }
        
        listing.reviews.splice(index, 1);
        await listing.save();
        req.flash("success", "Review deleted successfully");
        res.redirect(`/listings/${listingId}`);
    } catch (error) {
        // Handle other errors here
        console.error(error);
        req.flash("error", "An error occurred while deleting the review.");
        res.redirect('back');
    }
}