/**
 * Tools Hub - Static Tools Registry (Offline Resilient)
 */
window.TOOLS_DATA = [
  {
    id: "networks",
    title: "Interactive Network Graph Studio",
    shortTitle: "Network Studio",
    category: "Graph Theory",
    curriculum: "Discrete Mathematics & Networks",
    description: "Interactive workbench for graph theory. Design planar and weighted graphs, compute Dijkstra shortest paths, find minimum spanning trees, and inspect live adjacency matrices.",
    path: "./Tools/Networks/",
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><circle cx="12" cy="18" r="3"></circle><line x1="8.5" y1="7.5" x2="15.5" y2="7.5"></line><line x1="7.2" y1="8.5" x2="10.8" y2="15.5"></line><line x1="16.8" y1="8.5" x2="13.2" y2="15.5"></line></svg>`,
    tags: ["Graph Theory", "Adjacency Matrix", "Shortest Path", "Eulerian & Hamiltonian", "Spanning Trees", "Bipartite"],
    badge: "Interactive Studio",
    color: "terracotta",
    featured: true
  },
  {
    id: "regression",
    title: "Least Squares Linear Regression Visualizer",
    shortTitle: "Regression Visualizer",
    category: "Statistics & Data",
    curriculum: "Bivariate Data & Least Squares Fit",
    description: "Dynamic linear regression visualizer. Adjust slope and intercept, inspect vertical residuals and squared error areas, and animate optimal OLS fits.",
    path: "./Tools/Regression/",
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="3"></line><circle cx="7" cy="14" r="2.5"></circle><circle cx="12" cy="8" r="2.5"></circle><circle cx="16" cy="17" r="2.5"></circle><rect x="7" y="10" width="4" height="4"></rect></svg>`,
    tags: ["Linear Regression", "Residual Squares", "OLS Fit", "Pearson r", "Scatter Plots", "Line of Best Fit"],
    badge: "Visualizer",
    color: "slate",
    featured: true
  }
];

// Backwards compatibility alias
window.MR_BYRON_TOOLS = window.TOOLS_DATA;
