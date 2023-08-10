const express = require("express");
const app = express.Router();
const checkToken = require("../middleware/checkToken");
const docPermission = require("../middleware/docPerm")
const mongoose = require("mongoose");
const Document = mongoose.model("Document");


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
app.post('/api/createNode/:id',checkToken,docPermission("editor"), async (req, res) => {
    // Extract user ID from the request object
    const ownerId = req.user._id;

    // Create new document with the provided data and owner ID
    const newDocData = {
        ...req.body,
        owner: ownerId
    };
    const newDoc = new Document(newDocData);
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

// GET /api/documents/roots
app.get('/api/documents/roots',checkToken,  async (req, res) => {
    try {
        const rootDocuments = await Document.find({ ownerId: req.user._id, parentId: null });
        res.status(200).json(rootDocuments);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch root documents." });
    }
});

// POST /api/documents/createRoot
app.post('/api/documents/createRoot',checkToken,  async (req, res) => {
    try {
        const newDoc = new Document({
            title: "Untitled", // You can change this to a default name you prefer
            ownerId: req.user._id,
            parentId: null,
            // Other necessary fields initialized accordingly
        });

        const savedDoc = await newDoc.save();
        res.status(200).json(savedDoc);
    } catch (err) {
        res.status(500).json({ error: "Failed to create root document." });
    }
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

// share the doc
app.post('/share/:docId', async (req, res) => {
    const doc = await Document.findById(req.params.docId);

    // Check if the requester is the owner of the document
    if (!doc.owner.equals(req.user._id)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    // Add the shared user to the document
    doc.sharedUsers.push({ userId: req.body.userId, role: req.body.role });
    await doc.save();

    res.json({ message: 'Document shared successfully' });
});


module.exports = app