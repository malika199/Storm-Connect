const mongoose = require('mongoose');

const searchCriteriaSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    min_age: {
        type: Number
    },
    max_age: {
        type: Number
    },
    preferred_gender: {
        type: String
    },
    min_height_cm: {
        type: Number
    },
    max_height_cm: {
        type: Number
    },
    preferred_religion: {
        type: String
    },
    preferred_city: {
        type: String
    },
    preferred_country: {
        type: String
    },
    education_preference: {
        type: String
    },
    preferred_smoker: {
        type: Boolean
    },
    preferred_halal: {
        type: Boolean
    },
    preferred_alcohol: {
        type: Boolean
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SearchCriteria', searchCriteriaSchema);
