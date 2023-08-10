const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types
const app = express();
const port = process.env.port || 5000;
const path = require("path")

const cors = require("cors");
const json2csv = require('json2csv').parse;

require("./model/document")
require("./model/auth")
app.use(express.json()); // for parsing application/json
app.use(cors())
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server error');
    return
});
app.use(require("./routes/doc"))
app.use(require("./routes/authApi"))


// MongoDB setup
const mongoURI = 'mongodb+srv://ashu:U92zmo6s27b5brI9@cluster0.re3rzqw.mongodb.net/tree';
mongoose.connect(mongoURI);

mongoose.connection.on("connected", () => {
    console.log("successfully connected to mongo")
})

mongoose.connection.on("error", () => {
    console.log("not connected to mongodb")
})

// serving the frontend
app.use(express.static(path.join(__dirname, "./build")))

app.get("*", (req, res) => {
    res.sendFile(
        path.join(__dirname, "./build/index.html"),
        function (err) {
            res.status(500).send(err)
        }
    )
})


app.listen(port, () => {
    console.log(`Document tree editor app listening at http://localhost:${port}`)
});
