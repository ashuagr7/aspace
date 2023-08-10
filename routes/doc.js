const express = require("express");
const app = express.Router();
const checkToken = require("../middleware/checkToken");
const docPermission = require("../middleware/docPerm")
const mongoose = require("mongoose");
const Document = mongoose.model("Document");
const User = mongoose.model("User");


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
app.post('/api/createNode',checkToken,docPermission("editor"), async (req, res) => {
    // Extract user ID from the request object
    const ownerId = req.user._id.toString();
    console.log(ownerId);

    // Create new document with the provided data and owner ID
    const newDocData = {
        ...req.body,
        ownerId: ownerId
    };
    const newDoc = new Document(newDocData);
    await newDoc.save();
    const parentDoc = await Document.findById(req.body.parentId);
    parentDoc.children.push(newDoc._id);
    await parentDoc.save();

    res.send(newDoc);
});


// GET request to fetch a document and its immediate children
app.get('/documents/:id',checkToken,docPermission("viewer"), async (req, res) => {
    try {
        
        const document = await Document.findById(req.params.id)
        console.log(document);
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
app.get('/documents/:id/children',checkToken,docPermission("viewer"), async (req, res) => {
    const parentId = req.params.id;
    const children = await Document.find({ parentId: parentId });
    res.send(children);
});

// GET /api/documents/roots
app.get('/api/documents/roots',checkToken,async (req, res) => {
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
app.put('/documents/:id',checkToken,docPermission("editor"), async (req, res) => {
    const document = await Document.findByIdAndUpdate(req.params.id, req.body);
    res.send(document);
});

// // Delete document by ID
app.delete('/documents/:id', async (req, res) => {
    await Document.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

// share the doc
app.post('/shareDocument', checkToken,docPermission("editor"), async (req, res) => {
    const { docId, emailToShare, role } = req.body;
console.log(req.body);
    // Fetch user using email
    const userToShareWith = await User.findOne({ email: emailToShare });
    console.log(userToShareWith);
    if (!userToShareWith) {
        return res.status(404).json({msg:'User not found'});
    }

    const document = await Document.findById(docId);
    if (!document) {
        return res.status(404).json({msg:'Document not found'});
    }

    
  // Check if document is already shared with the user
  const isAlreadyShared = document.sharedUsers.some(shared => shared.userId.equals(userToShareWith._id.toString()));

  if (isAlreadyShared) {
    return res.status(422).json({ error: "Document already shared with this user" });
  }
    // // Ensure the user requesting to share is the owner.
    // if (document.ownerId.toString() !== req.user._id.toString()) {
    //     return res.status(403).send('Permission denied');
    // }

    // Add user and their permission to the sharedUsers array.
    document.sharedUsers.push({ userId: userToShareWith._id, role });
    await document.save();

    res.status(200).json({ error: 'Document shared successfully' });

});

// API endpoint to get documents shared with a user
app.get('/sharedWithMe', checkToken, async (req, res) => {
    console.log(req.url);
    try {
      const userId = req.user._id; // This assumes you've set the user object in the request after JWT verification.
  
      const documents = await Document.find({ "sharedUsers.userId": userId });
      
      return res.status(200).json(documents);
  
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  


module.exports = app