import path from "node:path";
import { EngineError } from "../core/errors.mjs";
import { readJson } from "../core/files.mjs";

export function loadGraph(root) {
  const graphPath = path.join(root, "knowledge", "graph.json");
  const graph = readJson(graphPath);
  if (graph.version !== 1 || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new EngineError("INVALID_GRAPH", "knowledge/graph.json must use graph version 1 with nodes and edges.");
  }
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const edge of graph.edges) {
    if (!nodeById.has(edge.from) || !nodeById.has(edge.to)) {
      throw new EngineError("INVALID_GRAPH_EDGE", `Graph edge references a missing node: ${edge.from} -> ${edge.to}`);
    }
  }
  return { ...graph, path: graphPath, nodeById };
}

export function resolveBrand(graph, requested) {
  const needle = String(requested || "").trim().toLowerCase();
  return graph.nodes.find((node) => node.type === "brand" && (
    node.id === needle ||
    node.id === `brand.${needle}` ||
    node.name.toLowerCase() === needle ||
    (node.aliases || []).some((alias) => alias.toLowerCase() === needle)
  ));
}

export function relatedNodes(graph, nodeId, relation = undefined) {
  const ids = graph.edges
    .filter((edge) => edge.from === nodeId && (!relation || edge.relation === relation))
    .map((edge) => edge.to);
  return ids.map((id) => graph.nodeById.get(id));
}

