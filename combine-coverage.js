#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// Create a directory for the combined coverage report
const combinedDir = path.join(__dirname, "coverage-combined");
if (!fs.existsSync(combinedDir)) {
	fs.mkdirSync(combinedDir);
}

// Function to check if a file exists
function fileExists(filePath) {
	try {
		return fs.statSync(filePath).isFile();
	} catch (err) {
		return false;
	}
}

// Function to copy a directory recursively
function copyDir(src, dest) {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

// Check if frontend coverage exists
const frontendCoverageDir = path.join(__dirname, "frontend", "coverage");
const frontendLcovReport = path.join(frontendCoverageDir, "lcov-report");
const frontendLcovInfo = path.join(frontendCoverageDir, "lcov.info");

// Check if backend coverage exists
const backendCoverageFile = path.join(__dirname, "backend", "coverage.out");
const backendCoverageHtml = path.join(__dirname, "backend", "coverage.html");

// Create index.html for the combined report
let indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PixelMap.io Combined Coverage Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2 {
      color: #2c3e50;
    }
    .report-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 20px;
    }
    .report-card {
      flex: 1;
      min-width: 300px;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .report-card h2 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .btn {
      display: inline-block;
      background-color: #3498db;
      color: white;
      padding: 10px 15px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin-top: 15px;
    }
    .btn:hover {
      background-color: #2980b9;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>PixelMap.io Combined Coverage Report</h1>
  
  <div class="summary">
    <p>This page provides access to coverage reports for both frontend and backend components of PixelMap.io.</p>
  </div>
  
  <div class="report-container">
`;

// Add frontend coverage if it exists
if (fileExists(frontendLcovInfo) && fs.existsSync(frontendLcovReport)) {
	// Copy frontend coverage report to combined directory
	const frontendDestDir = path.join(combinedDir, "frontend");
	copyDir(frontendLcovReport, frontendDestDir);

	// Add frontend section to index.html
	indexHtml += `
    <div class="report-card">
      <h2>Frontend Coverage</h2>
      <p>Coverage report for the Next.js/React frontend application.</p>
      <a href="./frontend/index.html" class="btn">View Frontend Coverage</a>
    </div>
  `;

	console.log("✅ Frontend coverage report copied to combined directory");
} else {
	console.log(
		"⚠️ Frontend coverage report not found. Run frontend tests with coverage first.",
	);
	indexHtml += `
    <div class="report-card">
      <h2>Frontend Coverage</h2>
      <p>Frontend coverage report not available. Run frontend tests with coverage first:</p>
      <pre>./run-tests.sh -f -c</pre>
    </div>
  `;
}

// Add backend coverage if it exists
if (fileExists(backendCoverageFile)) {
	// Create backend coverage directory in combined
	const backendDestDir = path.join(combinedDir, "backend");
	if (!fs.existsSync(backendDestDir)) {
		fs.mkdirSync(backendDestDir, { recursive: true });
	}

	// Copy backend coverage HTML if it exists, or generate it
	if (fileExists(backendCoverageHtml)) {
		fs.copyFileSync(
			backendCoverageHtml,
			path.join(backendDestDir, "index.html"),
		);
	} else {
		try {
			// Try to generate HTML from coverage.out
			execSync(
				`cd backend && go tool cover -html=coverage.out -o ${path.join(backendDestDir, "index.html")}`,
			);
			console.log("✅ Generated backend coverage HTML from coverage.out");
		} catch (error) {
			console.error(
				"❌ Failed to generate backend coverage HTML:",
				error.message,
			);
			fs.writeFileSync(
				path.join(backendDestDir, "index.html"),
				"<html><body><h1>Backend Coverage</h1><p>Failed to generate HTML report from coverage.out</p></body></html>",
			);
		}
	}

	// Add backend section to index.html
	indexHtml += `
    <div class="report-card">
      <h2>Backend Coverage</h2>
      <p>Coverage report for the Go backend application.</p>
      <a href="./backend/index.html" class="btn">View Backend Coverage</a>
    </div>
  `;

	console.log("✅ Backend coverage report copied to combined directory");
} else {
	console.log(
		"⚠️ Backend coverage report not found. Run backend tests with coverage first.",
	);
	indexHtml += `
    <div class="report-card">
      <h2>Backend Coverage</h2>
      <p>Backend coverage report not available. Run backend tests with coverage first:</p>
      <pre>./run-tests.sh -b -c</pre>
    </div>
  `;
}

// Close HTML tags
indexHtml += `
  </div>
</body>
</html>
`;

// Write the index.html file
fs.writeFileSync(path.join(combinedDir, "index.html"), indexHtml);

console.log(`
✨ Combined coverage report generated at: ${path.join(combinedDir, "index.html")}
Open this file in your browser to view the combined coverage report.
`);
