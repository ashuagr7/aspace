const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types
const app = express();
const port = process.env.port || 5000;
const path = require("path")

const cors = require("cors");
const json2csv = require('json2csv').parse;


app.use(express.json()); // for parsing application/json
app.use(cors())
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server error');
    return
});




// MongoDB setup
const mongoURI = 'mongodb+srv://ashu:U92zmo6s27b5brI9@cluster0.re3rzqw.mongodb.net/tree';
mongoose.connect(mongoURI);

mongoose.connection.on("connected", () => {
    console.log("successfully connected to mongo")
})

mongoose.connection.on("error", () => {
    console.log("not connected to mongodb")
})



const documentSchema = new mongoose.Schema({
    title: String,
    parentId: { type: ObjectId, ref: 'Document' },
    children: [{ type: ObjectId, ref: 'Document' }]
});

const Document = mongoose.model('Document', documentSchema);


app.get('/documents/export/json', async (req, res) => {
    // Retrieve all documents
    const documents = await Document.find({});

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=export.json');
    res.send(JSON.stringify(documents));
});

app.get('/documents/export/csv', async (req, res) => {
    // Retrieve all documents
    const documents = await Document.find({});

    const csv = json2csv(documents);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
    res.send(csv);
});

// POST request to create a new document under a parent
app.post('/documents', async (req, res) => {
    const newDoc = new Document(req.body);
    await newDoc.save();

    const parentDoc = await Document.findById(req.body.parentId);
    parentDoc.children.push(newDoc._id);
    await parentDoc.save();

    res.send(newDoc);
});

// Get root document, create if it doesn't exist
app.get('/documents/root', async (req, res) => {
    let rootDocument = await Document.findOne({ title: 'Root' });
    if (!rootDocument) {
        rootDocument = new Document({ title: 'Root', parentId: null, children: [] });
        await rootDocument.save();
    }
    res.send(rootDocument);
});

// GET request to fetch a document and its immediate children
app.get('/documents/:id', async (req, res) => {
    try {
        const document = await Document.findById(req.params.id).populate('children');
        if (!document) {
            return res.status(404).send({ message: "Document not found" });
        }
        res.send(document);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
    }
});

// get children of a document
app.get('/documents/:id/children', async (req, res) => {
    const parentId = req.params.id;
    const children = await Document.find({ parentId: parentId });
    res.send(children);
});

// Update document by ID
app.put('/documents/:id', async (req, res) => {
    const document = await Document.findByIdAndUpdate(req.params.id, req.body);
    res.send(document);
});

// // Delete document by ID
app.delete('/documents/:id', async (req, res) => {
    await Document.findByIdAndDelete(req.params.id);
    res.status(204).send();
});


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
