const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LeaveSchema = new Schema({

    applicantID: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    title: {type: String, required: true},
    type: {type: String, required: true},
    startDate: {type: String, required: true},
    endDate: {type: String, required: true},
    appliedDate: {type: String, required: true},
    period: {type: Number, required: true, min: 1, max: 10},
    reason: {type: String, required: true},
    adminResponse: {type: String, default: 'N/A'},

});


module.exports = mongoose.model('Leave', LeaveSchema);