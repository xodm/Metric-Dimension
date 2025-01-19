let mode = null; // Current mode: 'add', 'delete', 'edge', or 'delete-edge'
let vertexCount = 0; // Counter for labeling vertices
const vertices = []; // Array to store all vertices
const edges = {}; // Object to track edges (avoid multi-edges)
let selectedVertex = null; // Store the first selected vertex for edge creation

// Reference DOM elements
const canvas = document.getElementById('canvas');
const addVertexButton = document.getElementById('add-vertex');
const deleteVertexButton = document.getElementById('delete-vertex');
const addEdgeButton = document.getElementById('add-edge');
const deleteEdgeButton = document.getElementById('delete-edge');

// Function to handle button toggling
function setMode(newMode) {
    mode = newMode;

    // Reset edge selection if switching modes
    if (mode !== 'edge') {
        clearSelectedVertex(); // Clear any selected vertex
    }

    // Update button styles to reflect active mode
    addVertexButton.classList.toggle('active', mode === 'add');
    deleteVertexButton.classList.toggle('active', mode === 'delete');
    addEdgeButton.classList.toggle('active', mode === 'edge');
    deleteEdgeButton.classList.toggle('active', mode === 'delete-edge');

    // Update cursor style
    canvas.style.cursor =
        mode === 'add'
            ? 'crosshair'
            : mode === 'delete'
            ? 'not-allowed'
            : mode === 'edge'
            ? 'pointer'
            : mode === 'delete-edge'
            ? 'pointer'
            : 'default';
}

// Set modes based on button clicks
addVertexButton.addEventListener('click', () => {
    setMode(mode === 'add' ? null : 'add'); // Toggle add mode
});
deleteVertexButton.addEventListener('click', () => {
    setMode(mode === 'delete' ? null : 'delete'); // Toggle delete mode
});
addEdgeButton.addEventListener('click', () => {
    setMode(mode === 'edge' ? null : 'edge'); // Toggle edge mode
});
deleteEdgeButton.addEventListener('click', () => {
    setMode(mode === 'delete-edge' ? null : 'delete-edge'); // Toggle delete edge mode
});

// Add event listener to the canvas for adding/deleting vertices and edges
canvas.addEventListener('click', (event) => {
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;

    if (mode === 'add') {
        createVertex(x, y);
    } else if (mode === 'delete') {
        deleteVertex(event.clientX, event.clientY);
    } else if (mode === 'edge') {
        handleEdgeCreation(event.clientX, event.clientY);
    } else if (mode === 'delete-edge') {
        deleteEdge(event.clientX, event.clientY);
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
            removeEdgesForVertex(element); // Remove edges connected to the vertex
            vertices.splice(index, 1); // Remove from array
            canvas.removeChild(element); // Remove from DOM
            updateVertexLabelsAndEdges(); // Update all labels and adjust edges
        }
    }
}

// Function to handle edge creation
function handleEdgeCreation(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);

    // Ensure the clicked element is a vertex
    if (element && element.classList.contains('vertex')) {
        if (selectedVertex === null) {
            // First vertex selected
            selectedVertex = element;
            element.classList.add('highlight'); // Add highlight to selected vertex
        } else {
            // Second vertex selected
            if (selectedVertex !== element) {
                createEdge(selectedVertex, element);
            }
            clearSelectedVertex(); // Clear the selection after creating an edge
        }
    } else if (selectedVertex) {
        // Cancel edge creation if clicking outside
        clearSelectedVertex();
    }
}

// Function to create an edge between two vertices
function createEdge(vertex1, vertex2) {
    const id1 = vertex1.dataset.id;
    const id2 = vertex2.dataset.id;

    // Create a unique key for the edge
    const edgeKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

    // Prevent multi-edges
    if (edges[edgeKey]) {
        return; // Edge already exists
    }

    // Create the edge
    const edge = document.createElement('div');
    edge.className = 'edge';

    // Set the edge position and size
    const x1 = parseInt(vertex1.style.left) + 20; // Adjust for vertex center
    const y1 = parseInt(vertex1.style.top) + 20;
    const x2 = parseInt(vertex2.style.left) + 20;
    const y2 = parseInt(vertex2.style.top) + 20;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    edge.style.width = `${length}px`;
    edge.style.transform = `rotate(${angle}deg)`;
    edge.style.left = `${x1}px`;
    edge.style.top = `${y1}px`;

    // Store the edge
    edges[edgeKey] = edge;
    canvas.insertBefore(edge, canvas.firstChild); // Insert behind vertices
}

// Function to remove edges connected to a vertex
function removeEdgesForVertex(vertex) {
    const vertexId = vertex.dataset.id;
    Object.keys(edges).forEach((key) => {
        if (key.includes(vertexId)) {
            const edge = edges[key];
            canvas.removeChild(edge);
            delete edges[key];
        }
    });
}

// Function to update all vertex labels and adjust edges
function updateVertexLabelsAndEdges() {
    const idMapping = {};

    // Map old vertex IDs to new IDs
    vertices.forEach((vertex, index) => {
        const oldId = vertex.dataset.id; // Get old ID
        const newId = (index + 1).toString(); // Calculate new ID
        idMapping[oldId] = newId; // Map old ID to new ID
        vertex.dataset.id = newId; // Update the vertex ID
        vertex.textContent = `v${formatSubscript(newId)}`; // Update the label
    });

    vertexCount = vertices.length; // Update vertex count
    adjustEdgesForNewVertexIDs(idMapping); // Adjust edges for new IDs
}

// Function to adjust edges for new vertex IDs after relabeling
function adjustEdgesForNewVertexIDs(idMapping) {
    const updatedEdges = {};

    Object.keys(edges).forEach((key) => {
        const [oldId1, oldId2] = key.split('-');
        const newId1 = idMapping[oldId1];
        const newId2 = idMapping[oldId2];

        if (newId1 && newId2) {
            const newKey = newId1 < newId2 ? `${newId1}-${newId2}` : `${newId2}-${newId1}`;
            updatedEdges[newKey] = edges[key];

            const vertex1 = vertices.find((v) => v.dataset.id === newId1);
            const vertex2 = vertices.find((v) => v.dataset.id === newId2);

            if (vertex1 && vertex2) {
                updateEdgePosition(vertex1, vertex2, edges[key]);
            }
        }
    });

    Object.keys(edges).forEach((key) => {
        if (!updatedEdges[key]) {
            canvas.removeChild(edges[key]);
        }
    });

    Object.assign(edges, updatedEdges);
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

            // Update edges connected to this vertex
            updateEdgesForVertex(element);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.cursor = 'default';
    });
}

// Function to update edges connected to a vertex
function updateEdgesForVertex(vertex) {
    const vertexId = vertex.dataset.id;
    Object.keys(edges).forEach((key) => {
        if (key.includes(vertexId)) {
            const [id1, id2] = key.split('-');
            const otherVertex =
                id1 === vertexId
                    ? vertices.find((v) => v.dataset.id === id2)
                    : vertices.find((v) => v.dataset.id === id1);

            if (otherVertex) {
                const edge = edges[key];
                const x1 = parseInt(vertex.style.left) + 20;
                const y1 = parseInt(vertex.style.top) + 20;
                const x2 = parseInt(otherVertex.style.left) + 20;
                const y2 = parseInt(otherVertex.style.top) + 20;
                const length = Math.hypot(x2 - x1, y2 - y1);
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

                edge.style.width = `${length}px`;
                edge.style.transform = `rotate(${angle}deg)`;
                edge.style.left = `${x1}px`;
                edge.style.top = `${y1}px`;
            }
        }
    });
}
