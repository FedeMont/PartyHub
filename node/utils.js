const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

mongoose.connect("mongodb://federicomontagna.ddns.net:27017", {
    "dbName": "partyhub",
    "user": "root",
    "pass": "password",
});

mongoose.set("debug", true);

const geopositionSchema = new mongoose.Schema({
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    number: { type: String, required: true },
    postal_code: { type: String, required: true },
    street: { type: String, required: true },
    confidence: { type: Number, required: true },
    region: { type: String, required: true },
    region_code: { type: String, required: true },
    county: { type: String },
    locality: { type: String, required: true },
    administrative_area: { type: String, required: true },
    neighbourhood: { type: String },
    country: { type: String, required: true },
    country_code: { type: String, required: true },
    continent: { type: String, required: true },
    label: { type: String, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    // icon: Image()
}); // , { _id: false });

const eventPhotoSchema = new mongoose.Schema({
    photo: { type: String, required: true },
    datetime: { type: Date, required: true, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { _id: false })

let documents = {
    userSchema: new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        name: { type: String, required: true },
        surname: { type: String, required: true },
        username: { type: String, required: true, unique: true },
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
    eventPhotoSchema: eventPhotoSchema,
    geopositionSchema: geopositionSchema,
    eventSchema: new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        // code: { type: String, required: true },
        name: { type: String, required: true },
        address: {
            type: geopositionSchema,
            required: true
        },
        start_datetime: { type: Date, required: true },
        end_datetime: { type: Date, required: true, },
        // poster: Image(),
        age_range_min: { type: Number, required: true },
        age_range_max: { type: Number, required: true },
        number_of_partecipants: { type: Number, default: 0 },
        partecipants_list: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        maximum_partecipants: { type: Number, required: true },
        description: { type: String },
        number_of_photos: { type: Number, default: 0 },
        gallery: [{
            type: eventPhotoSchema
        }],
        owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" }
    }),
    productSchema: productSchema,
    serviceSchema: new mongoose.Schema({
        _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
        name: { type: String, required: true },
        number_of_products: { type: Number, required: true },
        products_list: [{
            type: productSchema,
            required: true
        }]
    }),
    bigliettoSchema: new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        entrance_datetime: { type: Date },
        exit_datetime: { type: Date },
        number_of_products: { type: Number, default: 0 },
        total_price: { type: Number, default: 0 },
        products_list: [{
            type: productSchema
        }],
        // owner: ??
    }),
    tokenBlackListSchema: new mongoose.Schema({
       _id: mongoose.Schema.Types.ObjectId,
        token: { type: String }
    })
};

const standardRes = (res, status, message, token = undefined) => {
    if (token) {
        res.status(status).send({
            status: status,
            message: message,
            token: token
        });
    } else {
        res.status(status).send({
            status: status,
            message: message
        });
    }
};


exports.mongoose = mongoose;
exports.documents = documents;
exports.standardRes = standardRes;
exports.bcrypt = bcrypt;
exports.saltRounds = saltRounds;