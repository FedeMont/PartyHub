const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

mongoose.connect("mongodb://federicomontagna.ddns.net:27017", {
    "dbName": "partyhub",
    "user": "root",
    "pass": "password",
});

let documents = {
    userSchema: new mongoose.Schema({
            _id: mongoose.Schema.Types.ObjectId,
            name: { type: String, required: true },
            surname: { type: String, required: true },
            username: { type: String, required: true, unique: true},
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            account_type: { type: String, required: true, default: "up" },
            birthday: { type: Date },
            description: { type: String },
            // profile_picture: Image(),
            number_of_followers: { type: Number, default: 0 },
            followers_list: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }],
            number_of_biglietti: { type: Number, default: 0 },
            biglietti_list: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Biglietto"
            }],
            number_of_events: { type: Number, default: 0 },
            events_list: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Event"
            }],
            event_address: String,
            // document: Image(),
            number_of_services: { type: Number, default: 0 },
            services_list: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Service"
            }],
            number_of_dipendenti: { type: Number, default: 0 },
            dipendenti_list: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }],
            service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
            active_event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
            last_login: { type: Date, default: Date.now },
        }),
};

const standardRes = (res, status, message, third = undefined) => {
    if (status === 200)
        res.status(status).send({
            status: status,
            message: message,
            permissions: third
        });
    else {
        res.status(status).send({
            status: status,
            message: message,
            text: third
        });
    }
};


exports.mongoose = mongoose;
exports.documents = documents;
exports.standardRes = standardRes;
exports.bcrypt = bcrypt;
exports.saltRounds = saltRounds;