export function findLowestCostRoute({
  nodes,
  edges,
  startId,
  blockedNodes = [],
  blockedEdges = [],
  closedExits = []
}) {
  const blockedNodeSet = new Set(blockedNodes);
  const blockedEdgeSet = new Set(blockedEdges);
  const closedExitSet = new Set(closedExits);

  // --------------------------------------------------
  // 1. Check whether starting location is blocked
  // --------------------------------------------------

  if (blockedNodeSet.has(startId)) {
    return {
      status: "blocked-start",
      path: [],
      cost: Infinity,
      exit: null,
      edgeIds: []
    };
  }

  // --------------------------------------------------
  // 2. Remove blocked nodes and closed exits
  // --------------------------------------------------

  const availableNodes = nodes.filter((node) => {
    if (blockedNodeSet.has(node.id)) {
      return false;
    }

    if (
      node.type === "exit" &&
      closedExitSet.has(node.id)
    ) {
      return false;
    }

    return true;
  });

  const availableNodeIds = new Set(
    availableNodes.map((node) => node.id)
  );

  // --------------------------------------------------
  // 3. Build undirected graph
  // --------------------------------------------------

  const graph = {};

  availableNodes.forEach((node) => {
    graph[node.id] = [];
  });

  edges.forEach((edge) => {
    // Blocked corridor cannot be used
    if (blockedEdgeSet.has(edge.id)) {
      return;
    }

    // If either endpoint is unavailable,
    // this corridor cannot be used.
    if (
      !availableNodeIds.has(edge.from) ||
      !availableNodeIds.has(edge.to)
    ) {
      return;
    }

    graph[edge.from].push({
      node: edge.to,
      cost: edge.cost,
      edgeId: edge.id
    });

    graph[edge.to].push({
      node: edge.from,
      cost: edge.cost,
      edgeId: edge.id
    });
  });

  // --------------------------------------------------
  // 4. Initialize Dijkstra
  // --------------------------------------------------

  const distances = {};
  const previous = {};

  availableNodes.forEach((node) => {
    distances[node.id] = Infinity;

    previous[node.id] = {
      node: null,
      edgeId: null
    };
  });

  distances[startId] = 0;

  const visited = new Set();

  // --------------------------------------------------
  // 5. Dijkstra algorithm
  // --------------------------------------------------

  while (true) {
    let currentNode = null;
    let smallestDistance = Infinity;

    for (const nodeId of Object.keys(distances)) {
      if (visited.has(nodeId)) {
        continue;
      }

      if (distances[nodeId] < smallestDistance) {
        smallestDistance = distances[nodeId];
        currentNode = nodeId;
      }
    }

    // No more reachable nodes
    if (currentNode === null) {
      break;
    }

    visited.add(currentNode);

    for (const neighbor of graph[currentNode]) {
      const newDistance =
        distances[currentNode] + neighbor.cost;

      if (newDistance < distances[neighbor.node]) {
        distances[neighbor.node] = newDistance;

        previous[neighbor.node] = {
          node: currentNode,
          edgeId: neighbor.edgeId
        };
      }
    }
  }

  // --------------------------------------------------
  // 6. Find reachable exits
  // --------------------------------------------------

  const reachableExits = availableNodes
    .filter((node) => node.type === "exit")
    .filter((exit) => distances[exit.id] !== Infinity);

  // --------------------------------------------------
  // 7. No route available
  // --------------------------------------------------

  if (reachableExits.length === 0) {
    return {
      status: "no-route",
      path: [],
      cost: Infinity,
      exit: null,
      edgeIds: []
    };
  }

  // --------------------------------------------------
  // 8. Choose lowest-cost exit
  //
  // If cost ties:
  // choose lexicographically smallest exit ID
  // --------------------------------------------------

  reachableExits.sort((a, b) => {
    if (distances[a.id] !== distances[b.id]) {
      return distances[a.id] - distances[b.id];
    }

    return a.id.localeCompare(b.id);
  });

  const selectedExit = reachableExits[0];

  // --------------------------------------------------
  // 9. Reconstruct node path
  // --------------------------------------------------

  const path = [];
  const edgeIds = [];

  let current = selectedExit.id;

  while (current !== null) {
    path.unshift(current);

    const previousNode = previous[current];

    if (!previousNode || previousNode.node === null) {
      break;
    }

    edgeIds.unshift(previousNode.edgeId);

    current = previousNode.node;
  }

  // --------------------------------------------------
  // 10. Return final route
  // --------------------------------------------------

  return {
    status: "success",
    path,
    cost: distances[selectedExit.id],
    exit: selectedExit.id,
    edgeIds
  };
}