const mongoose = require("mongoose")
const Document = mongoose.model("Document");; // Assume you have a Document model

function docPermission(requiredPermission) {
    return async (req, res, next) => {
        console.log(req.params,req.url);
        const docId = req.params.docId;  // Assuming you have a docId in your route params
console.log(docId);
        try {
            const document = await Document.findById(docId);

            if (!document) {
                return res.status(404).send({ error: 'Document not found' });
            }

            if (document.ownerId.toString() === req.user._id.toString()) {
                // The user is the owner, so they have full access
                next();
                return;
            }

            const permission = document.sharedWith.find(per => per.userId.toString() === req.user._id.toString());

            if (!permission) {
                return res.status(403).send({ error: 'Access denied' });
            }

            if (requiredPermission === 'viewer' && (permission.role === 'viewer' || permission.role === 'editor')) {
                // If only viewer access is needed and user has viewer or editor role
                next();
                return;
            }

            if (requiredPermission === 'editor' && permission.role === 'editor') {
                // If editor access is needed and user has editor role
                next();
                return;
            }

            res.status(403).send({ error: 'Insufficient permissions' });
        } catch (error) {
            res.status(500).send({ error: 'Server error' });
        }
    };
}


module.exports = docPermission