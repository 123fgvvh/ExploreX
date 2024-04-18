const Listing = require('../models/listing');
const Review = require('../models/review');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.showallListings = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render('listings/index', { allListings });
    } catch (error) {
        console.error('Error fetching listings:', error);
        req.flash('error', 'Failed to fetch listings');
        res.redirect('/listings');
    }
}

module.exports.renderNewForm = (req, res) => {
    res.render('listings/new');
}

module.exports.createListing = async (req, res) => {
    try {
        const { title, description, price, location, country } = req.body;
        const { path, filename } = req.file;
        
        // Send request to Mapbox Geocoding API
        const response = await geocodingClient.forwardGeocode({
            query: `${location}, ${country}`,
            limit: 1
        }).send();

        // Extract coordinates from the geocoding response
        const coordinates = response.body.features[0].geometry.coordinates;

        // Create new listing with geocoding data
        const newListing = new Listing({ 
            title, 
            description, 
            price, 
            location, 
            country, 
            geometry: { 
                type: "Point", 
                coordinates 
            },
            image: { url: path, filename }, 
            owner: req.user._id 
        });

        // Save the new listing
        await newListing.save();
        
        req.flash('success', 'New Listing Created');
        res.redirect('/listings');
    } catch (error) {
        console.error('Error creating listing:', error);
        req.flash('error', 'Failed to create listing');
        res.redirect('/listings');
    }
}


module.exports.showspecificListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id).populate({
            path: 'reviews',
            populate: {
                path: 'author' // Assuming 'author' is the field that references the User model in your Review schema
            }
        }).populate('owner');

        if (!listing) {
            req.flash('error', 'Listing does not exist');
            return res.redirect('/listings');
        }

        res.render('listings/show', { listing });
    } catch (error) {
        console.error('Error fetching listing:', error);
        req.flash('error', 'Failed to fetch listing details');
        res.redirect('/listings');
    }
}


module.exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        res.render('listings/edit', { listing });
    } catch (error) {
        console.error('Error rendering edit form:', error);
        req.flash('error', 'Failed to render edit form');
        res.redirect('/listings');
    }
}

module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, location, country, imageUrl } = req.body;

        // Send request to Mapbox Geocoding API
        const response = await geocodingClient.forwardGeocode({
            query: `${location}, ${country}`,
            limit: 1
        }).send();

        // Extract coordinates from the geocoding response
        const coordinates = response.body.features[0].geometry.coordinates;

        // Update listing with new data
        let listing = await Listing.findByIdAndUpdate(id, { 
            title, 
            description, 
            price, 
            location, 
            country, 
            imageUrl,
            geometry: { 
                type: "Point", 
                coordinates 
            }
        });

        req.flash('success', 'Listing Updated');
        res.redirect('/listings');
    } catch (error) {
        console.error('Error updating listing:', error);
        req.flash('error', 'Failed to update listing');
        res.redirect('/listings');
    }
}


module.exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash('error', 'Listing does not exist');
            return res.redirect('/listings');
        }
        await Review.deleteMany({ _id: { $in: listing.reviews } });
        await Listing.findByIdAndDelete(id);
        req.flash('success', 'Listing deleted successfully');
        res.redirect('/listings');
    } catch (error) {
        console.error('Error deleting listing:', error);
        req.flash('error', 'Failed to delete listing');
        res.redirect('/listings');
    }
}
