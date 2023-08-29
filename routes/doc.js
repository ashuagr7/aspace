const express = require("express");
const app = express.Router();
const checkToken = require("../middleware/checkToken");
const docPermission = require("../middleware/docPerm")
const mongoose = require("mongoose");
const Document = mongoose.model("Document");
const User = mongoose.model("User");
const axios = require('axios');

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = "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";  // Replace with your OpenAI API key



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



app.get('/api/fetchUserDocuments', checkToken, async (req, res) => {
    try {
        const userId = req.user._id;

        const documents = await Document.find({
            $or: [
                { ownerId: userId },
                { 'sharedUsers.userId': userId }
            ]
        });

        res.json(documents);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching documents', error });
    }
});


app.post('/api/uploadDocuments', checkToken,  async (req, res) => {
    // Extract user ID from the request object
    const ownerId = req.user._id.toString();
    console.log(ownerId);

    // Ensure request body is an array
    if (!Array.isArray(req.body)) {
        console.log(req.body);
        return res.status(400).send({ error: "Expected an array of documents." });
    }

    // Process the documents
    let newDocsData = req.body.map(doc => ({
        ...doc,
        ownerId: ownerId
    }));

    // Insert all new documents
    const insertedDocs = await Document.insertMany(newDocsData);
    return res.status(200).json({ message: "Succesfully synced" });
});

app.put('/api/updateDocuments', checkToken, async (req, res) => {
    try {
        // Ensure request body is an array
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: "Expected an array of documents." });
        }

        // Bulk operation array
        const operations = req.body.map(doc => ({
            updateOne: {
                filter: {entityId: doc.entityId, ownerId: req.user._id.toString() },
                update: doc,
            }
        }));

        // Execute bulk operations
        const result = await Document.bulkWrite(operations);
        
        // Send response
        res.status(200).json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
        
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
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
app.post('/shareDocument', checkToken, async (req, res) => {
    const {entityId, emailToShare, role } = req.body;
console.log(req.body);
    // Fetch user using email
    const userToShareWith = await User.findOne({ email: emailToShare });
    console.log(userToShareWith);
    if (!userToShareWith) {
        return res.status(404).json({msg:'User not found'});
    }
console.log(entityId);
    const document = await Document.findOne({entityId:entityId});
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

  
app.post('/ask', async (req, res) => {
    const prompt = req.body.prompt;

    if (!prompt) {
        return res.status(400).send({ error: 'Prompt is required!' });
    }

    try {
        const response = await axios.post(OPENAI_ENDPOINT, {
            model: "gpt-3.5-turbo",

            messages: [{role: 'system', content: 'You are a helpful assistant.'}, {role: 'user', content: prompt}],
            
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });
        res.json({data:response.data.choices[0].message.content})

        // return res.send({ data: response.data.choices[0].text.trim() });
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return res.status(500).send({ error: 'Failed to get response from OpenAI' });
    }
});
  


module.exports = app