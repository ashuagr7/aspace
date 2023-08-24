class TreeEditor {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.main = document.getElementById('doc-content');;
        this.selectedDocId = null;
        this.ids = null;
        this.clickedDoc = null;
    }

    async getIdsFromURL() {
        const hashValue = window.location.hash; // e.g., "/RootId/NodeId"
        const parts = hashValue.split('/');
        console.log(parts);
        if (!parts[2]) {
            return {
                rootId: parts[1]
            }
        } else {
            return {
                rootId: parts[1],
                nodeId: parts[2]
            };
        }
    }

    async loadDocument() {
        console.log("document loaded");
        try {
            this.ids = await this.getIdsFromURL()
            let document = await IndexedDB.GetByID('MyDatabase', 'documents', this.ids.rootId);
            renderDocument(document, sidebar)
            if (this.ids.nodeId) {
                this.displayMainNode(this.ids.nodeId)
            }
            console.log('Fetched document:');
            return document;
        } catch (error) {
            console.error('Error fetching document:', error);
            alert("Failed to load document.");
        }
    }

    async displayMainNode(docId) {

        // Fetch the documents from the server
        let doc = await IndexedDB.GetByID('MyDatabase', 'documents', docId);

        // fetch children 
        const allDocuments = await IndexedDB.GetAll('MyDatabase', 'documents');
        let children = allDocuments.filter(doc => doc.parentId === docId);

        // Get the main content area
        main.dataset.id = docId
        main.innerHTML = '';  // Clear the main content area

        // create and append a div for parent 
        const parentDiv = document.createElement('div');
        parentDiv.contentEditable = true;
        parentDiv.dataset.id = doc.entityId;
        parentDiv.classList.add('bullet-head');
        parentDiv.textContent = doc.title;


        main.appendChild(parentDiv);

        // Create and append a div for each child document
        for (let child of children) {
            const hasChildren = (child.children && child.children.length > 0);
            const childDiv = this.createBulletPoint(child.entityId, child.title, hasChildren);
            main.appendChild(childDiv);
            renderTree(child.entityId, childDiv);
        }
    }

    createBulletPoint(entityId, title, hasChildren = false) {
        const bulletDiv = document.createElement('div');
        bulletDiv.dataset.id = entityId;
        bulletDiv.classList.add('bullet-point');

        const expandIcon = this.createExpandIcon(hasChildren);
        bulletDiv.appendChild(expandIcon);

        const bulletIcon = this.createBulletIcon();
        bulletDiv.appendChild(bulletIcon);

        const bulletText = this.createBulletText(entityId, title);
        bulletDiv.appendChild(bulletText);

        const childrenDiv = document.createElement("div");
        childrenDiv.classList.add("childrenContainer");
        bulletDiv.appendChild(childrenDiv);

        return bulletDiv;
    }

    createExpandIcon(visible) {
        const icon = document.createElement('button');
        icon.textContent = '► ';
        icon.classList.add('expand-collapse-button');
        icon.style.visibility = visible ? "visible" : "hidden";
        return icon;
    }

    createBulletIcon() {
        const icon = document.createElement('i');
        icon.classList.add("ri-checkbox-blank-circle-fill", "bullet-icon");
        return icon;
    }

    createBulletText(entityId, title) {
        const text = document.createElement('span');
        text.contentEditable = true;
        text.dataset.id = entityId;
        if (title) {
            text.textContent = title;
        }
        return text;
    }
    // Function to create nodes

    async createNode(newNodeTitle, parentId) {

        try {
            // Sample data for the new node, modify according to your requirements
            const newNodeData = {
                title: newNodeTitle,
                parentId: parentId,
                entityId: this.generateUniqueId(),
                syncStatus: "new",
                lastModified: Date.now(),
                children: []
            };

            const node = await IndexedDB.Create('MyDatabase', 'documents', newNodeData);
            console.log('New node created in IndexedDB');

            // Fetch the parent document and update its children
            const parentDoc = await IndexedDB.GetByID('MyDatabase', 'documents', parentId);
            parentDoc.children.push(node.entityId);
            await IndexedDB.Update('MyDatabase', 'documents', parentDoc);


            return node
            // Optionally, you can update the UI with the new node here.

        } catch (error) {
            console.error('Error creating new node in IndexedDB:', error);
        }



    }

    // Recursive function to render a document and its children
    async renderDocument(doc, parentElement) {
        const docElement = document.createElement('div');
        docElement.classList.add('doc');
        docElement.dataset.id = doc.entityId;
        docElement.dataset.childrenFetched = 'false';

        // Create the expand/collapse button
        const expandCollapseButton = document.createElement('button');
        expandCollapseButton.classList.add('expand-collapse-button');
        expandCollapseButton.textContent = document.children.length ? '►' : ''
        docElement.appendChild(expandCollapseButton)

        const titleElement = document.createElement('a');
        titleElement.classList.add('doc-title');
        titleElement.href = `#/${ids.rootId}/${doc.entityId}`
        titleElement.textContent = doc.title;
        docElement.appendChild(titleElement);

        const addButton = document.createElement('button');
        addButton.classList.add('add-node-button');
        addButton.innerHTML = '<i class="ri-add-line addNode"></i>';
        docElement.appendChild(addButton);

        const childrenContainer = document.createElement('div');
        childrenContainer.classList.add('doc-children');

        docElement.appendChild(childrenContainer);


        parentElement.appendChild(docElement);
    }




}