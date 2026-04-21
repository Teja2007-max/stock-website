const mongoose = require('mongoose');
const History = require('./models/History');

mongoose.connect('mongodb://127.0.0.1:27017/stockwebsite').then(async () => {
    const records = await History.find({});
    console.log('History entries count:', records.length);
    console.log(records);
    process.exit(0);
}).catch(console.error);
