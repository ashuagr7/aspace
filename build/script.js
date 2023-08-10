var modal = document.getElementById("shareModal");
var close = document.getElementsByClassName("close")[0];
const openModalButton = document.getElementById("openShareModall")
const textarea = document.getElementById('doc-content');
const main = document.getElementById('doc-content');
const sidebar = document.getElementById('sidebar');
let params = new URLSearchParams(window.location.search);
let currentDocId = params.get('id');
let saveTimeoutId;
let selectedDocId
const url = "http://localhost:3000"


// Cache your dropdown for performance
const dropdown = createDropdown();

function createDropdown() {
  const dropdownElement = document.createElement('div');
  // ... Rest of the dropdown creation code ...
  dropdownElement.style.display = 'none';
  dropdownElement.style.position = 'absolute';
  dropdownElement.style.zIndex = '10';
  dropdownElement.style.background = '#fff';
  dropdownElement.style.border = '1px solid #ccc';
  dropdownElement.style.padding = '10px';
  dropdownElement.style.width = '200px';
  dropdownElement.innerHTML = `
  <div>Media</div>
  <div>Animation</div>
  <div>Bullet list</div>
  <!-- Add as many options as you need -->
`;
  document.body.appendChild(dropdownElement);
  return dropdownElement;
}

// Genric apiRequest Function 
async function apiRequest(url, method, data) {
  console.log(url,method,data);
  try {
      const response = await fetch(url, {
          method: method,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token') // assuming the token is stored in localStorage
          },
          body: JSON.stringify(data)
      });

      return await response.json();
  } catch (error) {
      console.error("Error making API request:", error);
      return null;
  }
}

// function to export document 
function exportDocument(format) {
  console.log("export" + format);
  window.location.href = `/documents/export/${format}`;
}

// fucntion to checkAuthentication 
function checkAuthentication() {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/signIn.html';  // Redirect to sign-in page
  }
}

// function to get all document 
async function getDocuments() {
  const response = await fetch(`/documents`);
  const doc = await response.json();
  return doc;
}

// Function to fetch document by ID from server
async function getDocument(id) {
  const response = await fetch(`/documents/${id}`);
  const doc = await response.json();
  return doc;
}

// Function to save document changes to the server
async function saveDocument(doc) {
  await fetch(`/documents/${doc.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doc),
  });
}

// Recursive function to render a document and its children
async function renderDocument(doc, parentElement) {
  const docElement = document.createElement('div');
  docElement.classList.add('doc');
  docElement.dataset.id = doc._id;
  docElement.dataset.childrenFetched = 'false';

  // Create the expand/collapse button
  const expandCollapseButton = document.createElement('button');
  expandCollapseButton.classList.add('expand-collapse-button');
  expandCollapseButton.textContent = document.children.length ? '►' : ''
  docElement.appendChild(expandCollapseButton)

  const titleElement = document.createElement('div');
  titleElement.classList.add('doc-title');
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

// Function to create nodes
async function createNode(newNodeTitle, parentId) {
  const newNode = {
    title: newNodeTitle,
    parentId: parentId,
  };
  const createdNode = await apiRequest(`/api/createNode/${currentDocId}`, 'POST',newNode);
  return createdNode
}

// Fucntion to create bullet Points 
async function bulletPoints(docId) {

  // Fetch the documents from the server
  const doc = await getDocument(docId)

  const response = await fetch(`/documents/${docId}/children`);
  const children = await response.json();

  // Get the main content area

  main.dataset.id = docId
  main.innerHTML = '';  // Clear the main content area

  // create and append a div for parent 
  const parentDiv = document.createElement('div');
  if (doc.parentId != null) {
    parentDiv.contentEditable = true;
  }
  parentDiv.dataset.id = doc._id;
  parentDiv.classList.add('bullet-head');
  parentDiv.textContent = doc.title;


  main.appendChild(parentDiv);

  // Create and append a div for each child document
  for (let child of children) {
    const childDiv = document.createElement('div');
    childDiv.contentEditable = true;
    childDiv.draggable = true;
    childDiv.dataset.id = child._id;
    childDiv.classList.add('bullet-point');
    childDiv.textContent = child.title;


    main.appendChild(childDiv);
  }
}

// Function to create kanban cards for startup screen
function renderKanbanCard(doc) {
  // Create the card element
  const cardDiv = document.createElement('div');
  cardDiv.classList.add('kanban-card');

  // Set the card title
  const cardTitle = document.createElement('h3');
  cardTitle.textContent = doc.title;
  cardDiv.appendChild(cardTitle);

  // Add the card to the Kanban container
  const kanbanContainer = document.querySelector('#kanban-container');
  kanbanContainer.appendChild(cardDiv);
}

// Function to save the changes to the server
async function saveChanges(documentId, updatedText) {
  // Update the document on the server
  const response = await fetch(`/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: updatedText,
    }),
  });
  const updatedDocument = await response.json();

  // Update the title of the document in the sidebar
  const sidebarDocTitle = document.querySelector(`.doc[data-id="${documentId}"]`);

  let title = sidebarDocTitle.querySelector(".doc-title")
  title.innerText = updatedText
}

// Function to loadDocument with id 
async function loadDocument() {
  const document = await apiRequest(`/documents/${currentDocId}`, 'GET');
    if (document) {
      // Populate your editor with the document data
      renderDocument(document, sidebar)
      let docId = document._id
      const response = await fetch(`/documents/${docId}/children`);
      const children = await response.json();
      children.forEach(document => renderKanbanCard(document));
  } else {
      alert("Failed to load document.");
  }
}

function setUpModal(){
  // Open the modal
  openShareModal.onclick = function () {
  modal.style.display = "block";
}
  // When the user clicks on the close button, close the modal
close.onclick = function() {
  modal.style.display = "none";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
}

function setupEventListener() {
 
  // When a document title is clicked, fetch the document and display its content in the main area
  document.getElementById('sidebar').addEventListener('click', async (event) => {
    if (event.target.classList.contains('doc-title')) {
      // Get the document ID
      const docId = event.target.parentNode.dataset.id;
      selectedDocId = docId

      bulletPoints(docId)
      // // Display the document content in the main area
      // document.getElementById('doc-content').innerHTML = `<div class="bullet-point" contenteditable="true">${doc.content}<br></div>`
    }
  });

  // Listen for the input event on the textarea
  textarea.addEventListener('input', (e) => {

    // Save the changes after a delay to avoid saving too frequently
    // If a timer is already running, clear it
    if (saveTimeoutId) clearTimeout(saveTimeoutId);

    // Start a new timer
    saveTimeoutId = setTimeout(() => {

      // Call the update function
      saveChanges(e.target.dataset.id, e.target.innerText);
      // Clear the timeoutId
      timeoutId = null;
    }, 2000);; // Adjust the delay as needed
  });

  // When an "Add Node" button is clicked, create a new document
  sidebar.addEventListener('click', async function (event) {
    if (event.target.matches('.addNode')) {
      // stop the original event
      event.stopPropagation();
      // trigger the click event on the parent button
      event.target.parentNode.click();
      return; // Exit function after triggering the click event
    }
    if (event.target.matches('.add-node-button')) {
      const parentElement = event.target.parentElement;
      const parentId = parentElement.dataset.id;

      const newNodeTitle = prompt('Enter new node title');
      if (newNodeTitle === null || newNodeTitle.trim() === '') return;

      let createdNode = await createNode(newNodeTitle, parentId)
      renderDocument(createdNode, parentElement.querySelector('.doc-children'));
    }
  });

  // When an expand/collapse button is clicked, fetch the children of its document and toggle their visibility
  sidebar.addEventListener('click', async function (event) {
    if (event.target.classList.contains('expand-collapse-button')) {
      const parentNode = event.target.parentNode;
      const parentNodeId = parentNode.dataset.id;
      // Fetch the children from the server if they haven't been fetched yet
      const childrenContainer = parentNode.querySelector('.doc-children');

      if (event.target.parentElement.getAttribute('data-children-fetched') === 'true') {

        if (childrenContainer.style.display === 'none') {
          childrenContainer.style.display = 'block';

          event.target.textContent = '▼';
        } else {
          childrenContainer.style.display = 'none';
          event.target.textContent = '►';
        }
      } else {
        const response = await fetch(`/documents/${parentNodeId}/children`);
        const children = await response.json();

        for (let child of children) {
          renderDocument(child, childrenContainer);
        }
        event.target.parentElement.setAttribute('data-children-fetched', 'true');
        event.target.textContent = '▼';
      }
    }
  });

  // function to open dropdown
  textarea.addEventListener('keyup', function (event) {
    const text = textarea.textContent;
    const slashIndex = text.lastIndexOf('/');

    if (event.key === '/') {

      // Get cursor position
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const rect = range.getClientRects()[0];

      if (rect) {
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom + 10}px`;
        dropdown.style.display = 'block';
      }

    } else if (dropdown.style.display === 'block' && event.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  // fucntion to close dropdown
  dropdown.addEventListener('click', function (event) {
    if (event.target !== dropdown) {
      document.execCommand('insertHTML', false, event.target.textContent);
      dropdown.style.display = 'none';
    }
  });

  // Handle enter and tab events for bullet points.
  document.getElementById('doc-content').addEventListener('keydown', async function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Insert a new bullet point after the current line.
      let bulletPoint = document.createElement('div');
      bulletPoint.classList.add('bullet-point');
      bulletPoint.contentEditable = "true";
      bulletPoint.innerHTML = '<br>';
      // Focus on the new bullet point
      setTimeout(() => bulletPoint.focus(), 0);

      if (e.target.nextSibling) {
        e.target.parentNode.insertBefore(bulletPoint, e.target.nextSibling);
      } else {
        e.target.parentNode.appendChild(bulletPoint);
      }

      let node = await createNode("untitled", e.target.parentElement.dataset.id)
      bulletPoint.dataset.id = node._id
      // Update the title of the document in the sidebar
      const sidebarDoc = document.querySelector(`.doc[data-id="${node.parentId}"]`)
      const childrenContainer = sidebarDoc.parentNode.querySelector('.doc-children');

      renderDocument(node, childrenContainer)




    } else if (e.key === 'Tab') {
      e.preventDefault();

      // Indent the current line to create a nested bullet point.
      e.target.style.marginLeft = (parseInt(e.target.style.marginLeft || '0') + 20) + 'px';
    }
  });

  // Handle click events for bullet points.
  document.getElementById('doc-content').addEventListener('click', function (e) {
    if (e.target.classList.contains('bullet-point')) {
      // Select the clicked bullet point.
      let range = document.createRange();
      range.selectNodeContents(e.target);
      let selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });

  document.getElementById('export-json').addEventListener('click', () => exportDocument('json'));
  document.getElementById('export-csv').addEventListener('click', () => exportDocument('csv'));

}

function start() {
  // Fetch and render the root document when the page loads
  loadDocument()
  setupEventListener()
  setUpModal()
}

window.onload = checkAuthentication;
document.addEventListener('DOMContentLoaded', start);



// Handle document sharing
// function shareDocument() {
//     // Here you'd call your API endpoint to share the document
//     // You can get the values from the modal's input fields
//     const userEmail = document.getElementById('shareEmail').value;
//     const role = document.getElementById('shareRole').value;
    
//     // ... Your logic to share the document using the above values ...

//     // Once done, close the modal
//     modal.style.display = "none";
// }
