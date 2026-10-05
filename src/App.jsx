import { useEffect, useMemo, useState } from "react";
import { findLowestCostRoute } from "./utils/dijkstra";
import "./index.css";

const translations = {
  en: {
    title: "Smart Escape",
    subtitle: "Interactive Evacuation Route Simulator",

    startingLocation: "Starting Location",
    selectStart: "Select starting location",

    importFile: "Import building.json",
    reset: "Reset",

    hazards: "Hazard Controls",
    nodes: "Rooms & Junctions",
    corridors: "Corridors",
    exits: "Exits",

    block: "Block",
    unblock: "Unblock",
    close: "Close",
    reopen: "Reopen",

    route: "Lowest-Cost Route",
    totalCost: "Total Cost",
    exit: "Exit",

    noRoute: "No route available",
    blockedStart: "Starting location blocked",

    selectFirst: "Select a starting location to calculate a route.",

    legend: "Map Legend",
    room: "Room",
    junction: "Junction",
    openExit: "Open Exit",
    closedExit: "Closed Exit",
    blocked: "Blocked",
    activeRoute: "Active Route",

    imported: "Building imported successfully.",
    invalidFile: "Invalid building file."
  },

  bn: {
    title: "স্মার্ট এস্কেপ",
    subtitle: "ইন্টার‍্যাক্টিভ ইভাকুয়েশন রুট সিমুলেটর",

    startingLocation: "শুরুর অবস্থান",
    selectStart: "শুরুর অবস্থান নির্বাচন করুন",

    importFile: "building.json ইমপোর্ট করুন",
    reset: "রিসেট",

    hazards: "হ্যাজার্ড কন্ট্রোল",
    nodes: "রুম ও জাংশন",
    corridors: "করিডোর",
    exits: "এক্সিট",

    block: "ব্লক",
    unblock: "আনব্লক",
    close: "বন্ধ করুন",
    reopen: "চালু করুন",

    route: "সর্বনিম্ন খরচের পথ",
    totalCost: "মোট খরচ",
    exit: "এক্সিট",

    noRoute: "কোনো পথ পাওয়া যায়নি",
    blockedStart: "শুরুর অবস্থান ব্লক করা হয়েছে",

    selectFirst:
      "রুট বের করার জন্য একটি শুরুর অবস্থান নির্বাচন করুন।",

    legend: "ম্যাপ লেজেন্ড",
    room: "রুম",
    junction: "জাংশন",
    openExit: "খোলা এক্সিট",
    closedExit: "বন্ধ এক্সিট",
    blocked: "ব্লকড",
    activeRoute: "বর্তমান রুট",

    imported: "বিল্ডিং সফলভাবে ইমপোর্ট হয়েছে।",
    invalidFile: "ভুল building ফাইল।"
  }
};

function App() {
  const [building, setBuilding] = useState(null);

  const [start, setStart] = useState("");

  const [blockedNodes, setBlockedNodes] = useState([]);
  const [blockedEdges, setBlockedEdges] = useState([]);
  const [closedExits, setClosedExits] = useState([]);

  const [language, setLanguage] = useState("en");

  const [statusMessage, setStatusMessage] = useState("");

  const t = translations[language];

  // ----------------------------------------
  // Load default building
  // ----------------------------------------

  useEffect(() => {
    loadDefaultBuilding();
  }, []);

  // ----------------------------------------
  // Calculate route whenever state changes
  // ----------------------------------------

  const route = useMemo(() => {
    if (!building || !start) {
      return null;
    }

    return findLowestCostRoute({
      nodes: building.nodes,
      edges: building.edges,
      startId: start,
      blockedNodes,
      blockedEdges,
      closedExits
    });
  }, [
    building,
    start,
    blockedNodes,
    blockedEdges,
    closedExits
  ]);

  // ----------------------------------------
  // Update message
  // ----------------------------------------

  useEffect(() => {
    if (!route) {
      return;
    }

    if (route.status === "blocked-start") {
      setStatusMessage(t.blockedStart);
      return;
    }

    if (route.status === "no-route") {
      setStatusMessage(t.noRoute);
      return;
    }

    setStatusMessage("");
  }, [route, t]);

  // ----------------------------------------
  // Load default JSON
  // ----------------------------------------

  async function loadDefaultBuilding() {
    try {
      const response = await fetch("/building.json");

      if (!response.ok) {
        throw new Error("Could not load building.json");
      }

      const data = await response.json();

      validateBuilding(data);

      applyBuilding(data);

      setStatusMessage("");
    } catch (error) {
      setStatusMessage(
        error.message || t.invalidFile
      );
    }
  }

  // ----------------------------------------
  // Apply building data
  // ----------------------------------------

  function applyBuilding(data) {
    setBuilding(data);

    setStart("");

    setBlockedNodes([
      ...data.initial_state.blocked_nodes
    ]);

    setBlockedEdges([
      ...data.initial_state.blocked_edges
    ]);

    setClosedExits([
      ...data.initial_state.closed_exits
    ]);
  }

  // ----------------------------------------
  // Validate imported JSON
  // ----------------------------------------

  function validateBuilding(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid JSON object.");
    }

    if (
      typeof data.building !== "string" ||
      !data.building.trim()
    ) {
      throw new Error("Building name is required.");
    }

    if (
      !Array.isArray(data.nodes) ||
      data.nodes.length === 0
    ) {
      throw new Error("nodes must be a non-empty array.");
    }

    if (!Array.isArray(data.edges)) {
      throw new Error("edges must be an array.");
    }

    if (
      !data.initial_state ||
      !Array.isArray(data.initial_state.blocked_nodes) ||
      !Array.isArray(data.initial_state.blocked_edges) ||
      !Array.isArray(data.initial_state.closed_exits)
    ) {
      throw new Error("Invalid initial_state.");
    }

    const nodeIds = new Set();

    for (const node of data.nodes) {
      if (
        !node.id ||
        !node.label ||
        !["room", "junction", "exit"].includes(
          node.type
        ) ||
        typeof node.x !== "number" ||
        typeof node.y !== "number"
      ) {
        throw new Error(
          `Invalid node: ${node.id || "unknown"}`
        );
      }

      if (nodeIds.has(node.id)) {
        throw new Error(
          `Duplicate node ID: ${node.id}`
        );
      }

      nodeIds.add(node.id);
    }

    const edgeIds = new Set();

    for (const edge of data.edges) {
      if (
        !edge.id ||
        !edge.from ||
        !edge.to ||
        !Number.isInteger(edge.cost) ||
        edge.cost <= 0
      ) {
        throw new Error(
          `Invalid edge: ${edge.id || "unknown"}`
        );
      }

      if (!nodeIds.has(edge.from)) {
        throw new Error(
          `Unknown node: ${edge.from}`
        );
      }

      if (!nodeIds.has(edge.to)) {
        throw new Error(
          `Unknown node: ${edge.to}`
        );
      }

      if (edge.from === edge.to) {
        throw new Error(
          `Self-loop is not allowed: ${edge.id}`
        );
      }

      if (edgeIds.has(edge.id)) {
        throw new Error(
          `Duplicate edge ID: ${edge.id}`
        );
      }

      edgeIds.add(edge.id);
    }

    for (const id of data.initial_state.blocked_nodes) {
      if (!nodeIds.has(id)) {
        throw new Error(
          `Unknown blocked node: ${id}`
        );
      }

      const node = data.nodes.find(
        (item) => item.id === id
      );

      if (
        node.type !== "room" &&
        node.type !== "junction"
      ) {
        throw new Error(
          `Only rooms and junctions can be blocked: ${id}`
        );
      }
    }

    for (const id of data.initial_state.blocked_edges) {
      if (!edgeIds.has(id)) {
        throw new Error(
          `Unknown blocked edge: ${id}`
        );
      }
    }

    for (const id of data.initial_state.closed_exits) {
      if (!nodeIds.has(id)) {
        throw new Error(
          `Unknown closed exit: ${id}`
        );
      }

      const node = data.nodes.find(
        (item) => item.id === id
      );

      if (node.type !== "exit") {
        throw new Error(
          `Only exits can be closed: ${id}`
        );
      }
    }
  }

  // ----------------------------------------
  // File import
  // ----------------------------------------

  function handleFileImport(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        validateBuilding(data);

        applyBuilding(data);

        setStatusMessage(t.imported);
      } catch (error) {
        setStatusMessage(
          error.message || t.invalidFile
        );
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  }

  // ----------------------------------------
  // Toggle blocked node
  // ----------------------------------------

  function toggleNode(nodeId) {
    setBlockedNodes((current) => {
      if (current.includes(nodeId)) {
        return current.filter(
          (id) => id !== nodeId
        );
      }

      return [...current, nodeId];
    });
  }

  // ----------------------------------------
  // Toggle blocked corridor
  // ----------------------------------------

  function toggleEdge(edgeId) {
    setBlockedEdges((current) => {
      if (current.includes(edgeId)) {
        return current.filter(
          (id) => id !== edgeId
        );
      }

      return [...current, edgeId];
    });
  }

  // ----------------------------------------
  // Toggle closed exit
  // ----------------------------------------

  function toggleExit(exitId) {
    setClosedExits((current) => {
      if (current.includes(exitId)) {
        return current.filter(
          (id) => id !== exitId
        );
      }

      return [...current, exitId];
    });
  }

  // ----------------------------------------
  // Reset
  // ----------------------------------------

  function resetBuilding() {
    if (!building) {
      return;
    }

    setBlockedNodes([
      ...building.initial_state.blocked_nodes
    ]);

    setBlockedEdges([
      ...building.initial_state.blocked_edges
    ]);

    setClosedExits([
      ...building.initial_state.closed_exits
    ]);

    setStatusMessage("");
  }

  // ----------------------------------------
  // Node helpers
  // ----------------------------------------

  function isNodeBlocked(nodeId) {
    return blockedNodes.includes(nodeId);
  }

  function isExitClosed(nodeId) {
    return closedExits.includes(nodeId);
  }

  // ----------------------------------------
  // Exact route edge check
  // ----------------------------------------

  const routeEdgeSet = useMemo(() => {
    return new Set(route?.edgeIds || []);
  }, [route]);

  // ----------------------------------------
  // Find node
  // ----------------------------------------

  function getNode(nodeId) {
    return building.nodes.find(
      (node) => node.id === nodeId
    );
  }

  // ----------------------------------------
  // If loading
  // ----------------------------------------

  if (!building) {
    return (
      <div className="loading-screen">
        <div>
          <div className="loading-icon">↯</div>
          <h1>Smart Escape</h1>
          <p>Loading building...</p>
        </div>
      </div>
    );
  }

  const selectableNodes = building.nodes.filter(
    (node) =>
      node.type === "room" ||
      node.type === "junction"
  );

  const roomNodes = building.nodes.filter(
    (node) => node.type === "room"
  );

  const junctionNodes = building.nodes.filter(
    (node) => node.type === "junction"
  );

  const exits = building.nodes.filter(
    (node) => node.type === "exit"
  );

  return (
    <div className="app">
      {/* -------------------------------- */}
      {/* Header */}
      {/* -------------------------------- */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">↯</div>

          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>

        <button
          className="language-button"
          onClick={() =>
            setLanguage(
              language === "en" ? "bn" : "en"
            )
          }
        >
          {language === "en"
            ? "বাংলা"
            : "English"}
        </button>
      </header>

      <div className="building-title">
        <span>BUILDING</span>
        <strong>{building.building}</strong>
      </div>

      {/* -------------------------------- */}
      {/* Main */}
      {/* -------------------------------- */}

      <main className="dashboard">
        {/* -------------------------------- */}
        {/* Sidebar */}
        {/* -------------------------------- */}

        <aside className="sidebar">
          <section className="panel">
            <div className="panel-title">
              <span>01</span>
              <h2>{t.startingLocation}</h2>
            </div>

            <select
              value={start}
              onChange={(event) =>
                setStart(event.target.value)
              }
            >
              <option value="">
                {t.selectStart}
              </option>

              {selectableNodes.map((node) => (
                <option
                  key={node.id}
                  value={node.id}
                  disabled={isNodeBlocked(node.id)}
                >
                  {node.id} · {node.label}
                </option>
              ))}
            </select>
          </section>

          <section className="panel">
            <div className="panel-title">
              <span>02</span>
              <h2>{t.hazards}</h2>
            </div>

            <h3>{t.nodes}</h3>

            <div className="control-list">
              {roomNodes.map((node) => (
                <button
                  key={node.id}
                  className={
                    isNodeBlocked(node.id)
                      ? "control active-danger"
                      : "control"
                  }
                  onClick={() =>
                    toggleNode(node.id)
                  }
                >
                  <span>
                    {node.id} · {node.label}
                  </span>

                  <small>
                    {isNodeBlocked(node.id)
                      ? t.unblock
                      : t.block}
                  </small>
                </button>
              ))}

              {junctionNodes.map((node) => (
                <button
                  key={node.id}
                  className={
                    isNodeBlocked(node.id)
                      ? "control active-danger"
                      : "control"
                  }
                  onClick={() =>
                    toggleNode(node.id)
                  }
                >
                  <span>
                    {node.id} · {node.label}
                  </span>

                  <small>
                    {isNodeBlocked(node.id)
                      ? t.unblock
                      : t.block}
                  </small>
                </button>
              ))}
            </div>

            <h3>{t.corridors}</h3>

            <div className="control-list">
              {building.edges.map((edge) => (
                <button
                  key={edge.id}
                  className={
                    blockedEdges.includes(edge.id)
                      ? "control active-danger"
                      : "control"
                  }
                  onClick={() =>
                    toggleEdge(edge.id)
                  }
                >
                  <span>
                    {edge.id} · {edge.from} →{" "}
                    {edge.to}
                  </span>

                  <small>
                    {blockedEdges.includes(edge.id)
                      ? t.unblock
                      : t.block}
                  </small>
                </button>
              ))}
            </div>

            <h3>{t.exits}</h3>

            <div className="control-list">
              {exits.map((exit) => (
                <button
                  key={exit.id}
                  className={
                    isExitClosed(exit.id)
                      ? "control active-danger"
                      : "control"
                  }
                  onClick={() =>
                    toggleExit(exit.id)
                  }
                >
                  <span>
                    {exit.id} · {exit.label}
                  </span>

                  <small>
                    {isExitClosed(exit.id)
                      ? t.reopen
                      : t.close}
                  </small>
                </button>
              ))}
            </div>
          </section>

          <div className="sidebar-actions">
            <label className="import-button">
              <span>↑</span>
              {t.importFile}

              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
              />
            </label>

            <button
              className="reset-button"
              onClick={resetBuilding}
            >
              ↻ {t.reset}
            </button>
          </div>
        </aside>

        {/* -------------------------------- */}
        {/* Map */}
        {/* -------------------------------- */}

        <section className="workspace">
          <div className="map-card">
            <div className="map-header">
              <div>
                <span>LIVE SIMULATION</span>
                <h2>{building.building}</h2>
              </div>

              <div className="live-indicator">
                <i></i>
                LIVE
              </div>
            </div>

            <div className="map-wrapper">
              <svg
                viewBox="0 0 520 250"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Edges */}

                {building.edges.map((edge) => {
                  const from = getNode(edge.from);
                  const to = getNode(edge.to);

                  if (!from || !to) {
                    return null;
                  }

                  const isBlocked =
                    blockedEdges.includes(edge.id);

                  const isRoute =
                    routeEdgeSet.has(edge.id);

                  return (
                    <g key={edge.id}>
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        className={[
                          "map-edge",
                          isRoute
                            ? "route-edge"
                            : "",
                          isBlocked
                            ? "blocked-edge"
                            : ""
                        ].join(" ")}
                      />

                      <rect
                        x={
                          (from.x + to.x) / 2 - 15
                        }
                        y={
                          (from.y + to.y) / 2 - 13
                        }
                        width="30"
                        height="22"
                        rx="5"
                        className="cost-box"
                      />

                      <text
                        x={
                          (from.x + to.x) / 2
                        }
                        y={
                          (from.y + to.y) / 2 + 3
                        }
                        textAnchor="middle"
                        className="cost-text"
                      >
                        {edge.cost}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}

                {building.nodes.map((node) => {
                  const blocked =
                    isNodeBlocked(node.id);

                  const closed =
                    node.type === "exit" &&
                    isExitClosed(node.id);

                  const onRoute =
                    route?.path.includes(node.id);

                  const isStart =
                    node.id === start;

                  return (
                    <g
                      key={node.id}
                      className={[
                        "map-node",
                        node.type,
                        onRoute
                          ? "route-node"
                          : "",
                        blocked
                          ? "blocked-node"
                          : "",
                        closed
                          ? "closed-node"
                          : "",
                        isStart
                          ? "start-node"
                          : ""
                      ].join(" ")}
                      onClick={() => {
                        if (
                          node.type === "room" ||
                          node.type === "junction"
                        ) {
                          setStart(node.id);
                        }
                      }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="20"
                      />

                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        className="node-id"
                      >
                        {node.id}
                      </text>

                      <text
                        x={node.x}
                        y={node.y + 38}
                        textAnchor="middle"
                        className="node-label"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* -------------------------------- */}
            {/* Legend */}
            {/* -------------------------------- */}

            <div className="legend">
              <strong>{t.legend}</strong>

              <span>
                <i className="legend-dot room-dot"></i>
                {t.room}
              </span>

              <span>
                <i className="legend-dot junction-dot"></i>
                {t.junction}
              </span>

              <span>
                <i className="legend-dot exit-dot"></i>
                {t.openExit}
              </span>

              <span>
                <i className="legend-dot blocked-dot"></i>
                {t.blocked}
              </span>

              <span>
                <i className="legend-line"></i>
                {t.activeRoute}
              </span>
            </div>
          </div>

          {/* -------------------------------- */}
          {/* Result */}
          {/* -------------------------------- */}

          <div className="result-card">
            {!start && (
              <div className="empty-result">
                <div>⌖</div>
                <h2>{t.route}</h2>
                <p>{t.selectFirst}</p>
              </div>
            )}

            {route?.status === "blocked-start" && (
              <div className="error-result">
                <div>!</div>
                <div>
                  <h2>{t.blockedStart}</h2>
                  <p>
                    {start} is currently unavailable.
                  </p>
                </div>
              </div>
            )}

            {route?.status === "no-route" && (
              <div className="error-result">
                <div>!</div>
                <div>
                  <h2>{t.noRoute}</h2>
                  <p>
                    No accessible open exit can be
                    reached from {start}.
                  </p>
                </div>
              </div>
            )}

            {route?.status === "success" && (
              <div className="success-result">
                <div className="result-main">
                  <div className="route-icon">✓</div>

                  <div>
                    <span className="result-label">
                      {t.route}
                    </span>

                    <h2>
                      {route.path.join(" → ")}
                    </h2>
                  </div>
                </div>

                <div className="result-stats">
                  <div>
                    <span>{t.exit}</span>
                    <strong>{route.exit}</strong>
                  </div>

                  <div>
                    <span>{t.totalCost}</span>
                    <strong>{route.cost}</strong>
                  </div>

                  <div>
                    <span>Corridors</span>
                    <strong>
                      {route.edgeIds.length}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {statusMessage &&
            !route?.status && (
              <div className="toast-message">
                {statusMessage}
              </div>
            )}
        </section>
      </main>

      <footer>
        Smart Escape · Educational simulation only
      </footer>
    </div>
  );
}

export default App;