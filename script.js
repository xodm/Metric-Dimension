// script.js

let mode = null; // Current mode: 'add' or 'delete'
let vertexCount = 0; // Counter for labeling vertices

// Reference DOM elements
const canvas = document.getElementById('canvas');
const addVertexButton = document.getElementById('add-vertex');
const deleteVertexButton = document.getElementById('delete-vertex');

// Set modes based on button clicks
addVertexButton.addEventListener('click', () => {
    mode = 'add';
    canvas.style.cursor = 'crosshair';
});
deleteVertexButton.addEventListener('click', () => {
    mode = 'delete';
    canvas.style.cursor = 'not-allowed';
});

// Add event listener to the canvas for adding/deleting vertices
canvas.addEventListener('click', (event) => {
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;

    if (mode === 'add') {
        createVertex(x, y);
    } else if (mode === 'delete') {
        deleteVertex(x, y);
    }
});

// Function to create a vertex at a specific position
function createVertex(x, y) {
    vertexCount++;

    const vertex = document.createElement('div');
    vertex.className = 'vertex';
    vertex.style.left = `${x - 15}px`; // Center the vertex
    vertex.style.top = `${y - 15}px`; // Center the vertex
    vertex.textContent = `v_${vertexCount}`;
    vertex.dataset.id = vertexCount; // Store an ID for deletion
    canvas.appendChild(vertex);

    // Make vertex draggable
    makeDraggable(vertex);
}

// Function to delete a vertex based on click position
function deleteVertex(x, y) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (element && element.classList.contains('vertex')) {
        canvas.removeChild(element);
    }
}

// Function to make an element draggable
function makeDraggable(element) {
    let isDragging = false;
    let offsetX, offsetY;

    element.addEventListener('mousedown', (event) => {
        isDragging = true;
        offsetX = event.offsetX;
        offsetY = event.offsetY;
        document.body.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const canvasRect = canvas.getBoundingClientRect();
            const x = event.clientX - canvasRect.left - offsetX;
            const y = event.clientY - canvasRect.top - offsetY;
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.cursor = 'default';
    });
}
