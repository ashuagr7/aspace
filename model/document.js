const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types

const documentSchema = new mongoose.Schema({
    title: String,
    parentId: { type: ObjectId, ref: 'Document' },
    children: [{ type: ObjectId, ref: 'Document' }],
    ownerId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    sharedUsers: [{
        userId: { type: ObjectId, ref: 'User' },
        role: { type: String, enum: ['editor', 'viewer'] }
    }]
});

mongoose.model('Document', documentSchema);