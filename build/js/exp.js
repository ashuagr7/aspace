import { explorerList } from "../handlebar/template/informative/explorerList.js";

// Genric apiRequest Function 
async function apiRequest(url, method, data) {

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

// render template with handlebar 
function renderHandlebarsTemplate(template, data, selector) {
    // Compile the Handlebars template
    const compiledTemplate = Handlebars.compile(template);
    // Render the template with the data
    const renderedHtml = compiledTemplate(data);
    // Inject html into dom 
    document.querySelector(selector).innerHTML = renderedHtml
}

//fetch root documents
async function fetchRootDocuments() {
    const documents = await apiRequest('/api/documents/roots', 'GET');
    console.log(documents);
    renderHandlebarsTemplate(explorerList, documents, "#explorerList")
}

// fucntion to checkAuthentication 
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/signIn.html';  // Redirect to sign-in page
    }
}

// function to get shareed with me docs
async function getSharedDocuments() {
    const sharedDocuments = await apiRequest('/sharedWithMe','GET');
  
    if (sharedDocuments && sharedDocuments.length) {
        renderHandlebarsTemplate(explorerList, sharedDocuments, "#explorerList")
    } else {
      alert('No shared documents found.');
    }
  }
 
function setupEventListener(){
    // create new root documetn 
    document.getElementById('create-document').addEventListener('click', async () => {
        // This could be a simple POST to create a new blank root document
        const response = await apiRequest('/api/documents/createRoot', 'POST');
        if (response && response._id) {
            window.location.href = `/editor.html?id=${response._id}`;
        } else {
            alert("Failed to create a new document.");
        }
    });

    // get shred docs
    document.getElementById("shared-with-me").addEventListener("click",getSharedDocuments)
}

function start() {
    fetchRootDocuments()
    setupEventListener()
}



window.onload = checkAuthentication;
document.addEventListener('DOMContentLoaded', start);

