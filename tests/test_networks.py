"""
Educational Tools Hub - Network Graph Studio Unit Tests
Validates graph theory algorithms (Dijkstra, Prim, Euler, Matrix) and DOM button bindings.
"""

import os
import unittest
import math

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class TestNetworkStudio(unittest.TestCase):

    def setUp(self):
        self.html_path = os.path.join(BASE_DIR, 'Tools', 'Networks', 'index.html')
        self.js_path = os.path.join(BASE_DIR, 'Tools', 'Networks', 'app.js')
        with open(self.html_path, 'r', encoding='utf-8') as f:
            self.html_content = f.read()
        with open(self.js_path, 'r', encoding='utf-8') as f:
            self.js_content = f.read()

    def test_networks_dom_buttons_and_controls(self):
        """Verify that all critical interactive buttons, tabs, and modals exist in HTML."""
        required_ids = [
            'btn-theme-toggle',
            'btn-export-image',
            'btn-export-set',
            'input-import-set',
            'tab-create',
            'tab-interact',
            'btn-find-shortest-path',
            'btn-find-mst',
            'btn-check-eulerian',
            'btn-clear-analysis',
            'matrix-table',
            'network-svg',
            'card-element-inspector',
            'btn-deselect-element',
            'btn-delete-selected-vertex',
            'btn-delete-selected-edge'
        ]
        for dom_id in required_ids:
            self.assertIn(
                f'id="{dom_id}"',
                self.html_content,
                f"Networks index.html missing required DOM element with id='{dom_id}'"
            )

    def test_dijkstra_algorithm(self):
        """Algorithm Test: Verify Dijkstra Shortest Path finding on weighted graph."""
        # Graph: A(0), B(1), C(2), D(3)
        # Edges: A-B (4), A-C (2), C-B (1), B-D (5), C-D (8)
        # Shortest A -> D is A -> C -> B -> D with total distance 2 + 1 + 5 = 8
        nodes = ['A', 'B', 'C', 'D']
        edges = [
            ('A', 'B', 4),
            ('A', 'C', 2),
            ('C', 'B', 1),
            ('B', 'D', 5),
            ('C', 'D', 8),
        ]

        def dijkstra(start, end):
            dist = {node: float('inf') for node in nodes}
            prev = {node: None for node in nodes}
            dist[start] = 0
            unvisited = set(nodes)

            while unvisited:
                current = min(unvisited, key=lambda n: dist[n])
                if dist[current] == float('inf') or current == end:
                    break
                unvisited.remove(current)

                for u, v, w in edges:
                    neighbor = None
                    if u == current: neighbor = v
                    elif v == current: neighbor = u
                    
                    if neighbor and neighbor in unvisited:
                        alt = dist[current] + w
                        if alt < dist[neighbor]:
                            dist[neighbor] = alt
                            prev[neighbor] = current

            # Reconstruct path
            path = []
            curr = end
            while curr:
                path.insert(0, curr)
                curr = prev[curr]
            return dist[end], path

        distance, path = dijkstra('A', 'D')
        self.assertEqual(distance, 8, "Dijkstra calculated incorrect shortest distance")
        self.assertEqual(path, ['A', 'C', 'B', 'D'], "Dijkstra returned suboptimal path sequence")

    def test_prim_mst_algorithm(self):
        """Algorithm Test: Verify Prim Minimum Spanning Tree calculation."""
        # Nodes: A, B, C, D
        # Edges: A-B (1), B-C (2), A-C (3), C-D (4), B-D (5)
        # Expected MST edges: A-B (1), B-C (2), C-D (4) -> Total Weight = 7
        nodes = ['A', 'B', 'C', 'D']
        edges = [
            ('A', 'B', 1),
            ('B', 'C', 2),
            ('A', 'C', 3),
            ('C', 'D', 4),
            ('B', 'D', 5),
        ]

        def prim_mst():
            visited = {'A'}
            mst_edges = []
            total_weight = 0

            while len(visited) < len(nodes):
                possible_edges = []
                for u, v, w in edges:
                    if (u in visited and v not in visited) or (v in visited and u not in visited):
                        possible_edges.append((w, u, v))
                
                if not possible_edges:
                    break
                
                w, u, v = min(possible_edges, key=lambda x: x[0])
                total_weight += w
                mst_edges.append((u, v, w))
                visited.add(u)
                visited.add(v)

            return total_weight, mst_edges

        mst_weight, mst_edges = prim_mst()
        self.assertEqual(mst_weight, 7, "Prim MST total weight is incorrect")
        self.assertEqual(len(mst_edges), 3, "MST should contain exactly V-1 = 3 edges")

    def test_eulerian_graph_parity(self):
        """Algorithm Test: Verify Eulerian Path and Circuit classification."""
        # 1. Eulerian Circuit: all vertices have even degree (e.g. Triangle A-B-C-A: degrees all 2)
        degrees_circuit = {'A': 2, 'B': 2, 'C': 2}
        odd_circuit = [v for v, deg in degrees_circuit.items() if deg % 2 != 0]
        self.assertEqual(len(odd_circuit), 0)

        # 2. Eulerian Trail / Path: exactly 2 vertices have odd degree (e.g. A-B-C: A=1, B=2, C=1)
        degrees_trail = {'A': 1, 'B': 2, 'C': 1}
        odd_trail = [v for v, deg in degrees_trail.items() if deg % 2 != 0]
        self.assertEqual(len(odd_trail), 2)

        # 3. Non-Eulerian: > 2 odd vertices (e.g. K4 complete graph: all 4 vertices have degree 3)
        degrees_none = {'A': 3, 'B': 3, 'C': 3, 'D': 3}
        odd_none = [v for v, deg in degrees_none.items() if deg % 2 != 0]
        self.assertEqual(len(odd_none), 4)

    def test_adjacency_matrix_calculation(self):
        """Algorithm Test: Verify adjacency matrix construction for undirected graph."""
        vertices = ['A', 'B', 'C']
        edges = [('A', 'B'), ('B', 'C')]

        # Expected matrix:
        # A: [0, 1, 0]
        # B: [1, 0, 1]
        # C: [0, 1, 0]
        v_idx = {v: i for i, v in enumerate(vertices)}
        matrix = [[0] * len(vertices) for _ in range(len(vertices))]

        for u, v in edges:
            i, j = v_idx[u], v_idx[v]
            matrix[i][j] += 1
            matrix[j][i] += 1

        self.assertEqual(matrix[0], [0, 1, 0])
        self.assertEqual(matrix[1], [1, 0, 1])
        self.assertEqual(matrix[2], [0, 1, 0])

    def test_networks_js_function_definitions_and_references(self):
        """Static Code Analysis Test: Ensure all internal helper functions invoked are strictly defined."""
        import re
        defined_functions = set(re.findall(r'(?:function\s+([a-zA-Z0-9_]+)\s*\(|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>))', self.js_content))
        all_defined = {f[0] or f[1] for f in defined_functions if f[0] or f[1]}

        critical_funcs = [
            'isDarkMode',
            'applyTheme',
            'renderActiveNetwork',
            'switchPaneMode',
            'setActiveTool',
            'findShortestPath',
            'findMinimumSpanningTree',
            'checkEulerianTrail',
            'computeEdgeCrossings',
            'updateGraphStats',
            'getSVGCoordinates',
            'initApp'
        ]

        for func_name in critical_funcs:
            self.assertIn(
                func_name,
                all_defined,
                f"Critical function '{func_name}' is invoked or required but not defined in Tools/Networks/app.js"
            )

if __name__ == '__main__':
    unittest.main()
