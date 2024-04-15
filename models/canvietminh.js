const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataSchema = new Schema({
    temp: [Number],
    spo2: [Number],
    pulse: [Number],
    time: [String],
    clientID: String, //same famlly will have the same clientID (to see the same data above)
    username: String,
    password: String,
    role: String,
    famillyID: [{
        type: Schema.Types.ObjectId,
        ref: 'canvietminh_khungtapdi',
    }],


});

dataSchema.methods.updateData = function (temp, spo2, pulse, time) {
    this.temp.push(temp);
    this.spo2.push(spo2);
    this.pulse.push(pulse);
    this.time.push(time);
}

dataSchema.methods.setClientID = function (clientID) {
    this.clientID = clientID;
}

dataSchema.methods.changePass = function (pass) {
    this.password = pass;
}

dataSchema.methods.addFamilly = function (famillyMemberID) {
    this.famillyID.push(famillyMemberID);
}

module.exports = mongoose.model('canvietminh_khungtapdi', dataSchema);