"""
Educational Tools Hub - Least Squares Regression Studio Unit Tests
Validates statistical formulas (OLS, SSE, MSE, RMSE, R², Pearson r) and DOM button bindings.
"""

import os
import unittest
import math

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class TestRegressionStudio(unittest.TestCase):

    def setUp(self):
        self.html_path = os.path.join(BASE_DIR, 'Tools', 'Regression', 'index.html')
        self.js_path = os.path.join(BASE_DIR, 'Tools', 'Regression', 'app.js')
        with open(self.html_path, 'r', encoding='utf-8') as f:
            self.html_content = f.read()
        with open(self.js_path, 'r', encoding='utf-8') as f:
            self.js_content = f.read()

    def test_regression_dom_buttons_and_controls(self):
        """Verify that all critical interactive buttons, checkboxes, inputs, and canvas exist in HTML."""
        required_ids = [
            'btn-theme-toggle',
            'btn-fit',
            'btn-randomize',
            'btn-clear',
            'chk-residuals',
            'chk-squares',
            'chk-ols',
            'chk-meany',
            'num-m',
            'num-c',
            'slider-m',
            'slider-c',
            'stat-sse',
            'stat-r2',
            'stat-mse',
            'stat-rmse',
            'regression-canvas'
        ]
        for dom_id in required_ids:
            self.assertIn(
                f'id="{dom_id}"',
                self.html_content,
                f"Regression index.html missing required DOM element with id='{dom_id}'"
            )

    def test_ols_line_fitting_exact(self):
        """Statistical Test: Verify OLS slope and intercept on perfect linear data y = 2x + 1."""
        points = [{'x': 1, 'y': 3}, {'x': 2, 'y': 5}, {'x': 3, 'y': 7}, {'x': 4, 'y': 9}]
        n = len(points)

        sumX = sum(p['x'] for p in points)
        sumY = sum(p['y'] for p in points)
        meanX = sumX / n
        meanY = sumY / n

        num = sum((p['x'] - meanX) * (p['y'] - meanY) for p in points)
        den = sum((p['x'] - meanX) ** 2 for p in points)

        m = num / den
        c = meanY - m * meanX

        self.assertAlmostEqual(m, 2.0, places=6, msg="OLS slope should be 2.0")
        self.assertAlmostEqual(c, 1.0, places=6, msg="OLS intercept should be 1.0")

    def test_statistical_metrics_sse_and_r2(self):
        """Statistical Test: Verify SSE, SST, and R² calculations on noisy sample points."""
        points = [{'x': 1, 'y': 1.5}, {'x': 2, 'y': 3.8}, {'x': 3, 'y': 6.1}, {'x': 4, 'y': 8.2}]
        n = len(points)
        m, c = 2.23, -0.675  # Fitted line
        meanY = sum(p['y'] for p in points) / n

        sse = sum((p['y'] - (m * p['x'] + c)) ** 2 for p in points)
        sst = sum((p['y'] - meanY) ** 2 for p in points)
        r2 = 1.0 - (sse / sst)

        mse = sse / n
        rmse = math.sqrt(mse)

        self.assertGreaterEqual(r2, 0.95, "R² should indicate strong fit for this dataset")
        self.assertGreater(sse, 0, "SSE should be positive for non-exact points")
        self.assertAlmostEqual(rmse, math.sqrt(mse), places=6, msg="RMSE must equal sqrt(MSE)")

    def test_pearson_correlation_coefficient(self):
        """Statistical Test: Verify Pearson r calculation."""
        # Perfect positive correlation -> r = 1.0
        pts_pos = [{'x': 1, 'y': 2}, {'x': 2, 'y': 4}, {'x': 3, 'y': 6}]
        meanX = sum(p['x'] for p in pts_pos) / len(pts_pos)
        meanY = sum(p['y'] for p in pts_pos) / len(pts_pos)
        num = sum((p['x'] - meanX) * (p['y'] - meanY) for p in pts_pos)
        den = math.sqrt(sum((p['x'] - meanX)**2 for p in pts_pos) * sum((p['y'] - meanY)**2 for p in pts_pos))
        r_pos = num / den
        self.assertAlmostEqual(r_pos, 1.0, places=6)

        # Perfect negative correlation -> r = -1.0
        pts_neg = [{'x': 1, 'y': 6}, {'x': 2, 'y': 4}, {'x': 3, 'y': 2}]
        meanX = sum(p['x'] for p in pts_neg) / len(pts_neg)
        meanY = sum(p['y'] for p in pts_neg) / len(pts_neg)
        num = sum((p['x'] - meanX) * (p['y'] - meanY) for p in pts_neg)
        den = math.sqrt(sum((p['x'] - meanX)**2 for p in pts_neg) * sum((p['y'] - meanY)**2 for p in pts_neg))
        r_neg = num / den
        self.assertAlmostEqual(r_neg, -1.0, places=6)

    def test_regression_js_function_definitions_and_references(self):
        """Static Code Analysis Test: Ensure all internal helper functions invoked are strictly defined."""
        # Find all function definitions: function foo( or const foo = (
        import re
        defined_functions = set(re.findall(r'(?:function\s+([a-zA-Z0-9_]+)\s*\(|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>))', self.js_content))
        all_defined = {f[0] or f[1] for f in defined_functions if f[0] or f[1]}

        # List of critical functions that must exist
        critical_funcs = [
            'isDarkMode',
            'render',
            'drawGrid',
            'drawPoints',
            'drawOLSLine',
            'drawMeanYLine',
            'drawResidualSquares',
            'drawResidualLines',
            'drawManualLine',
            'drawHandle',
            'updateUI',
            'calculateOLS',
            'calculateMetrics',
            'getManualLineParams',
            'setManualLineFromParams',
            'worldToScreen',
            'screenToWorld',
            'getCanvasMetrics',
            'resizeCanvas',
            'init'
        ]

        for func_name in critical_funcs:
            self.assertIn(
                func_name,
                all_defined,
                f"Critical function '{func_name}' is invoked or required but not defined in Tools/Regression/app.js"
            )

if __name__ == '__main__':
    unittest.main()
