// Variables
let resolved = false
let mode = null; // Current mode
let nextId = 1; // Vertex ID counter
const vertices = []; // Store vertices
const edges = {}; // Store edges
let selectedVertex = null; // Track selected vertex for edge creation
const resolvingSet = new Set(); // Track vertices in resolving set
const adjacencyList = {}; // Adjacency list for graph representation

// DOM Elements
const canvas = document.getElementById('canvas');
const addVertexButton = document.getElementById('add-vertex');
const deleteVertexButton = document.getElementById('delete-vertex');
const addEdgeButton = document.getElementById('add-edge');
const deleteEdgeButton = document.getElementById('delete-edge');
const resolveButton = document.getElementById('resolve');
const resolvingSetDisplay = document.getElementById('resolving-set-display');

// Function to set operation mode
function setMode(newMode) {
    updateAllDistanceVectors(); // Recalculate distance vectors
    mode = newMode;
    if (mode !== 'edge') clearSelectedVertex(); // Reset selected vertex
    addVertexButton.classList.toggle('active', mode === 'add');
    deleteVertexButton.classList.toggle('active', mode === 'delete');
    addEdgeButton.classList.toggle('active', mode === 'edge');
    deleteEdgeButton.classList.toggle('active', mode === 'delete-edge');
    resolveButton.classList.toggle('active', mode === 'resolve');
}

// Event listeners for buttons
addVertexButton.addEventListener('click', () => setMode(mode === 'add' ? null : 'add'));
deleteVertexButton.addEventListener('click', () => setMode(mode === 'delete' ? null : 'delete'));
addEdgeButton.addEventListener('click', () => setMode(mode === 'edge' ? null : 'edge'));
deleteEdgeButton.addEventListener('click', () => setMode(mode === 'delete-edge' ? null : 'delete-edge'));
resolveButton.addEventListener('click', () => setMode(mode === 'resolve' ? null : 'resolve'));

// Canvas click handler
canvas.addEventListener('click', (event) => {
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    updateAllDistanceVectors(); // Recalculate distance vectors
    if (mode === 'add') createVertex(x, y);
    else if (mode === 'delete') deleteVertex(event.clientX, event.clientY);
    else if (mode === 'edge') handleEdgeCreation(event.clientX, event.clientY);
    else if (mode === 'delete-edge') deleteEdge(event.clientX, event.clientY);
    else if (mode === 'resolve') toggleResolvingSet(event.clientX, event.clientY);
});

// Function to create a vertex








function createVertex(x, y) {
    const vertex = {
        id: nextId++,
        element: document.createElement('div'),
        label: null, // Distance vector label
    };

    vertex.element.className = 'vertex';
    vertex.element.style.left = `${x - 20}px`;
    vertex.element.style.top = `${y - 20}px`;
    vertex.element.textContent = `v${formatSubscript(vertex.id)}`;
    canvas.appendChild(vertex.element);

    vertices.push(vertex);
    adjacencyList[vertex.id] = []; // Initialize adjacency list
    makeDraggable(vertex);
    updateAllDistanceVectors(); // Recalculate distance vectors
    updateWordDisplay()
}

// Function to calculate and display distance vectors
function updateAllDistanceVectors() {
    const allDistances = {};
    resolvingSet.forEach((resolvingId) => {
        const distances = bfsDistances(resolvingId);
        for (const [vertexId, dist] of Object.entries(distances)) {
            if (!allDistances[vertexId]) allDistances[vertexId] = [];
            allDistances[vertexId].push(dist);
        }
    });

    vertices.forEach((vertex) => {
        const distanceVector = allDistances[vertex.id] || [];
        updateDistanceLabel(vertex, distanceVector);
    });
}


// Update distance label for a vertex
function updateDistanceLabel(vertex, distanceVector) {
    if (vertex.label) {
        canvas.removeChild(vertex.label);
        vertex.label = null;
    }
    if (distanceVector.length > 0) {
        const label = document.createElement('div');
        label.className = 'distance-label';
        label.textContent = `(${distanceVector.join(', ')})`;
        label.style.left = `${parseInt(vertex.element.style.left) + 25}px`;
        label.style.top = `${parseInt(vertex.element.style.top) - 10}px`;
        canvas.appendChild(label);
        vertex.label = label;
    }
}

// Remaining helper functions (e.g., for edges and resolving set) remain unchanged.


// Function to delete a vertex
function deleteVertex(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    if (element && element.classList.contains('vertex')) {
        const index = vertices.findIndex((v) => v.element === element);
        if (index > -1) {
            const vertex = vertices[index];
            Object.keys(edges).forEach((key) => {
                if (key.includes(vertex.id)) {
                    canvas.removeChild(edges[key].element);
                    delete edges[key];
                }
            });
            delete adjacencyList[vertex.id];
            canvas.removeChild(vertex.element);
            if (vertex.label) canvas.removeChild(vertex.label);
            vertices.splice(index, 1);
            resolvingSet.delete(vertex.id);
            updateResolvingSetDisplay();
            updateAllDistanceVectors();
        }
    }
}

// Function to create an edge
function createEdge(vertex1, vertex2) {
    const id1 = vertex1.id;
    const id2 = vertex2.id;
    const edgeKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    if (edges[edgeKey]) return;

    const edge = document.createElement('div');
    edge.className = 'edge';
    const x1 = parseInt(vertex1.element.style.left) + 20;
    const y1 = parseInt(vertex1.element.style.top) + 20;
    const x2 = parseInt(vertex2.element.style.left) + 20;
    const y2 = parseInt(vertex2.element.style.top) + 20;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    edge.style.width = `${length}px`;
    edge.style.transform = `rotate(${angle}deg)`;
    edge.style.left = `${x1}px`;
    edge.style.top = `${y1}px`;

    edges[edgeKey] = { element: edge, vertices: [id1, id2] };
    adjacencyList[id1].push(id2);
    adjacencyList[id2].push(id1);
    canvas.insertBefore(edge, canvas.firstChild);
    updateAllDistanceVectors();
}



// Update "a" display whenever the resolving set changes
function toggleResolvingSet(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    if (element && element.classList.contains('vertex')) {
        const vertex = vertices.find((v) => v.element === element);
        if (resolvingSet.has(vertex.id)) {
            resolvingSet.delete(vertex.id);
            vertex.element.classList.remove('resolve');
        } else {
            resolvingSet.add(vertex.id);
            vertex.element.classList.add('resolve');
        }
        updateResolvingSetDisplay();
        updateAllDistanceVectors();
        updateWordDisplay(); // Call the function to update "a" display
    }
}

resolveButton.addEventListener('click', () => {
    toggleResolvingSet();
    updateWordDisplay(); // Ensure "a" is updated
    updateAllDistanceVectors(); // Recalculate distance vectors
});



// Update all distance vectors
function updateAllDistanceVectors() {
    const allDistances = {};
    resolvingSet.forEach((resolvingId) => {
        const distances = bfsDistances(resolvingId);
        for (const [vertexId, dist] of Object.entries(distances)) {
            if (!allDistances[vertexId]) allDistances[vertexId] = [];
            allDistances[vertexId].push(dist);
        }
    });

    vertices.forEach((vertex) => {
        const distanceVector = allDistances[vertex.id] || [];
        updateDistanceLabel(vertex, distanceVector);
    });
    let kl = Object.values(allDistances)
    let k = []
    for (let index = 0; index < kl.length; index++) {
        const element = kl[index];
        k.push(element.join(","))
    }
    const j = new Set(k)
    resolved = (k.length == j.size)
    checkinresolved()
}

// Breadth-first search for distances
function bfsDistances(startId) {
    const distances = {}; // To store distances from startId
    const visited = new Set(); // To track visited nodes
    const queue = [[startId, 0]]; // Queue for BFS: [currentNode, distance]
    let checkEdges = Object.keys(edges)
    let temparr = []
    checkEdges = checkEdges.forEach((v)=>{
        let r = v.split("-")
        temparr.push([r[0], r[1]], [r[1],r[0]])
    })
    while (queue.length > 0) {
        const [current, dist] = queue.shift(); // Dequeue the front of the queue

        if (visited.has(current)) continue; // Skip already visited nodes
        visited.add(current); // Mark the node as visited
        distances[current] = dist; // Record the distance

        // Add all unvisited neighbors to the queue
        temparr.forEach((element)=>{
            if( element[0] == current){
                if (!visited.has(element[1])){
                    queue.push([element[1], dist + 1])
                }
            }

        })
    }
    distances[startId] = 0
    // Fill in infinity for any vertex not reachable from startId
    vertices.forEach((vertex) => {
        if (!(vertex.id in distances)) {
            distances[vertex.id] = "∞"; // Unreachable vertices
        }
    });

    return distances; // Return the object with distances
}


// Update distance label for a vertex
function updateWordDisplay() {
    vertices.forEach((vertex) => {
        // Remove existing "a" elements if they exist
        const existingA = vertex.element.querySelector('.word-a');
        if (existingA) existingA.remove();

        // Add "a" only if there are resolving vertices
        if (resolvingSet.size > 0) {
            const wordA = document.createElement('div');
            wordA.className = 'word-a';
            wordA.textContent = '';

            // Position the "a" relative to the vertex
            wordA.style.position = 'absolute';
            wordA.style.fontSize = '16px'; // Font size for visibility
            wordA.style.color = 'red'; // Make it clearly visible
            wordA.style.left = `-5px`; // Adjusted position horizontally
            wordA.style.top = `-10px`; // Adjusted position vertically
            wordA.style.zIndex = '100'; // Ensure it is above all other elements
            wordA.style.pointerEvents = 'none'; // Prevent interaction
            vertex.element.appendChild(wordA);
        }
    });
}
function checkinresolved() {
    if (resolved) {
        resolvingSetDisplay.style.backgroundColor = '#ccffd0';
        resolvingSetDisplay.style.color = '#008042';
    } else {
        resolvingSetDisplay.style.color = '#800000';
        resolvingSetDisplay.style.backgroundColor = '#ffcccc'; // Default or another color
    }
}
// Update resolving set display
function updateResolvingSetDisplay() {
    if (resolvingSet.size === 0) {
        resolvingSetDisplay.style.visibility = 'hidden';
    } else {
        const labels = Array.from(resolvingSet)
            .map((id) => `v${formatSubscript(id)}`)
            .join(', ');
        resolvingSetDisplay.textContent = `W = {${labels}}`;
        resolvingSetDisplay.style.visibility = 'visible';
        checkinresolved()
    }
}

// Format subscripts
function formatSubscript(number) {
    const subscriptMap = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
    return String(number)
        .split('')
        .map((digit) => subscriptMap[digit])
        .join('');
}



// Function to handle edge creation
function handleEdgeCreation(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);

    // Ensure the clicked element is a vertex
    if (element && element.classList.contains('vertex')) {
        const vertex = vertices.find((v) => v.element === element);
        if (!vertex) return;

        if (selectedVertex === null) {
            // First vertex selected
            selectedVertex = vertex;
            vertex.element.classList.add('highlight'); // Add highlight to selected vertex
        } else {
            // Second vertex selected
            if (selectedVertex !== vertex) {
                createEdge(selectedVertex, vertex);
            }
            clearSelectedVertex(); // Clear the selection after creating an edge
        }
    } else if (selectedVertex) {
        // Cancel edge creation if clicking outside
        clearSelectedVertex();
    }
}

// Remaining helper functions are unchanged.

// Function to create an edge between two vertices
function createEdge(vertex1, vertex2) {
    const id1 = vertex1.id;
    const id2 = vertex2.id;

    // Create a unique key for the edge
    const edgeKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

    // Prevent multi-edges
    if (edges[edgeKey]) return;

    // Create the edge
    const edge = document.createElement('div');
    edge.className = 'edge';

    // Set the edge position and size
    const x1 = parseInt(vertex1.element.style.left) + 20;
    const y1 = parseInt(vertex1.element.style.top) + 20;
    const x2 = parseInt(vertex2.element.style.left) + 20;
    const y2 = parseInt(vertex2.element.style.top) + 20;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    edge.style.width = `${length}px`;
    edge.style.transform = `rotate(${angle}deg)`;
    edge.style.left = `${x1}px`;
    edge.style.top = `${y1}px`;

    edges[edgeKey] = { element: edge, vertices: [id1, id2] };
    canvas.insertBefore(edge, canvas.firstChild);
    updateAllDistanceVectors(); // Recalculate distance vectors

}

// Function to delete an edge based on click position
function deleteEdge(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    if (element && element.classList.contains('edge')) {
        const edgeKey = Object.keys(edges).find((key) => edges[key].element === element);
        if (edgeKey) {
            canvas.removeChild(element);
            delete edges[edgeKey];
        updateAllDistanceVectors(); // Recalculate distance vectors
        }
    }
}

// Function to clear the selected vertex highlight
function clearSelectedVertex() {
    if (selectedVertex) {
        selectedVertex.element.classList.remove('highlight');
        selectedVertex = null;
        updateAllDistanceVectors(); // Recalculate distance vectors
    }
}

// Function to format subscripts using Unicode
function formatSubscript(number) {
    const subscriptMap = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
    return String(number)
        .split('')
        .map((digit) => subscriptMap[digit])
        .join('');
}

// Function to make a vertex draggable
function makeDraggable(vertex) {
    let isDragging = false;
    let offsetX, offsetY;

    vertex.element.addEventListener('mousedown', (event) => {
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
            vertex.element.style.left = `${x}px`;
            vertex.element.style.top = `${y}px`;

            // Update edges connected to this vertex
            updateEdgesForVertex(vertex);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.cursor = 'default';
    });
}

// Function to update edges connected to a vertex

function updateEdgesForVertex(vertex) {
    // Update the positions of edges connected to the vertex
    Object.keys(edges).forEach((key) => {
        if (edges[key].vertices.includes(vertex.id)) {
            const [id1, id2] = edges[key].vertices;
            const otherVertex =
                id1 === vertex.id
                    ? vertices.find((v) => v.id === id2)
                    : vertices.find((v) => v.id === id1);

            if (otherVertex) {
                const edge = edges[key].element;
                updateEdgePosition(vertex, otherVertex, edge);
            }
        }
    });

    // Update the position of the distance label for the vertex
    if (vertex.label) {
        vertex.label.style.left = `${parseInt(vertex.element.style.left) + 25}px`;
        vertex.label.style.top = `${parseInt(vertex.element.style.top) - 10}px`;
    }
}


// Function to update the position of an edge between two vertices
function updateEdgePosition(vertex1, vertex2, edge) {
    const x1 = parseInt(vertex1.element.style.left) + 20;
    const y1 = parseInt(vertex1.element.style.top) + 20;
    const x2 = parseInt(vertex2.element.style.left) + 20;
    const y2 = parseInt(vertex2.element.style.top) + 20;

    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    edge.style.width = `${length}px`;
    edge.style.transform = `rotate(${angle}deg)`;
    edge.style.left = `${x1}px`;
    edge.style.top = `${y1}px`;
}
