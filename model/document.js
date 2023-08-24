const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types

const documentSchema = new mongoose.Schema({
    title: String,
    parentId: { type: ObjectId, ref: 'Document' },
    ownerId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    entityId:{
        type:"String"
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    sharedUsers: [{
        userId: { type: ObjectId, ref: 'User' },
        role: { type: String, enum: ['editor', 'viewer'] }
    }],
    children: [{  type:"String" }]
});

mongoose.model('Document', documentSchema);