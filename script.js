// script.js

let mode = null; // Current mode: 'add' or 'delete'
let vertexCount = 0; // Counter for labeling vertices
const vertices = []; // Array to store all vertices

// Reference DOM elements
const canvas = document.getElementById('canvas');
const addVertexButton = document.getElementById('add-vertex');
const deleteVertexButton = document.getElementById('delete-vertex');

// Function to handle button toggling
function setMode(newMode) {
    mode = newMode;

    // Update button styles to reflect active mode
    if (mode === 'add') {
        addVertexButton.classList.add('active');
        deleteVertexButton.classList.remove('active');
        canvas.style.cursor = 'crosshair';
    } else if (mode === 'delete') {
        addVertexButton.classList.remove('active');
        deleteVertexButton.classList.add('active');
        canvas.style.cursor = 'not-allowed';
    } else {
        addVertexButton.classList.remove('active');
        deleteVertexButton.classList.remove('active');
        canvas.style.cursor = 'default';
    }
}

// Set modes based on button clicks
addVertexButton.addEventListener('click', () => {
    setMode(mode === 'add' ? null : 'add'); // Toggle add mode
});
deleteVertexButton.addEventListener('click', () => {
    setMode(mode === 'delete' ? null : 'delete'); // Toggle delete mode
});

// Add event listener to the canvas for adding/deleting vertices
canvas.addEventListener('click', (event) => {
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;

    if (mode === 'add') {
        createVertex(x, y);
    } else if (mode === 'delete') {
        deleteVertex(event.clientX, event.clientY);
    }
});

// Function to create a vertex at a specific position
function createVertex(x, y) {
    vertexCount++;

    const vertex = document.createElement('div');
    vertex.className = 'vertex';
    vertex.style.left = `${x - 20}px`; // Center the vertex
    vertex.style.top = `${y - 20}px`; // Center the vertex
    vertex.dataset.id = vertexCount; // Store an ID for deletion
    vertex.textContent = `v${formatSubscript(vertexCount)}`; // Add subscript label
    vertices.push(vertex); // Add to the vertex array
    canvas.appendChild(vertex);

    // Make vertex draggable
    makeDraggable(vertex);
}

// Function to delete a vertex based on click position
function deleteVertex(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    if (element && element.classList.contains('vertex')) {
        const index = vertices.indexOf(element);
        if (index > -1) {
            vertices.splice(index, 1); // Remove from array
            canvas.removeChild(element); // Remove from DOM
            updateVertexLabels(); // Update all labels
        }
    }
}

// Function to update all vertex labels
function updateVertexLabels() {
    vertices.forEach((vertex, index) => {
        vertex.dataset.id = index + 1; // Update ID
        vertex.textContent = `v${formatSubscript(index + 1)}`; // Update label
    });
    vertexCount = vertices.length; // Update vertex count
}

// Function to format subscripts using Unicode
function formatSubscript(number) {
    const subscriptMap = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
    return String(number)
        .split('')
        .map((digit) => subscriptMap[digit])
        .join('');
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
