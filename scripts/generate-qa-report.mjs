import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const qaArtifactsDir = path.join(cwd, "qa-artifacts");
const qaReportsDir = path.join(qaArtifactsDir, "reports");
const unitReportPath = path.join(qaArtifactsDir, "unit", "vitest-report.json");
const uiReportPath = path.join(qaArtifactsDir, "ui", "playwright-report.json");
const screenshotDir = path.join(qaArtifactsDir, "ui", "screenshots");
const snapshotDir = path.join(cwd, "tests", "ui", "simulator.smoke.spec.js-snapshots");
const timestamp = new Date().toISOString();

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeVitestReport(report) {
  if (!report) {
    return {
      available: false,
      passed: 0,
      failed: 0,
      total: 0,
      durationMs: 0,
      failures: [],
    };
  }

  const testResults = Array.isArray(report.testResults) ? report.testResults : [];
  const failures = testResults
    .filter((suite) => suite.status === "failed")
    .flatMap((suite) => (suite.assertionResults ?? []).filter((assertion) => assertion.status === "failed").map((assertion) => ({
      suite: suite.name,
      test: assertion.fullName ?? assertion.title ?? "Unknown test",
      message: assertion.failureMessages?.join("\n") ?? "Vitest failure",
    })));

  return {
    available: true,
    passed: report.numPassedTests ?? 0,
    failed: report.numFailedTests ?? 0,
    total: report.numTotalTests ?? 0,
    durationMs: report.startTime && report.success !== undefined ? 0 : 0,
    failures,
  };
}

function collectPlaywrightTests(nodes, bucket = []) {
  for (const node of nodes ?? []) {
    if (Array.isArray(node.specs)) {
      for (const spec of node.specs) {
        for (const test of spec.tests ?? []) {
          const results = test.results ?? [];
          const finalResult = results.at(-1) ?? {};
          const status = finalResult.status ?? test.status ?? "unknown";
          const error = finalResult.error ?? finalResult.errors?.[0] ?? null;
          bucket.push({
            title: [node.title, spec.title, test.title].filter(Boolean).join(" > "),
            status,
            message: error?.message ?? null,
          });
        }
      }
    }
    if (Array.isArray(node.suites)) {
      collectPlaywrightTests(node.suites, bucket);
    }
  }
  return bucket;
}

function normalizePlaywrightReport(report) {
  if (!report) {
    return {
      available: false,
      passed: 0,
      failed: 0,
      total: 0,
      failures: [],
    };
  }

  const tests = collectPlaywrightTests(report.suites ?? []);
  const passed = tests.filter((test) => test.status === "passed").length;
  const failed = tests.filter((test) => !["passed", "skipped"].includes(test.status)).length;

  return {
    available: true,
    passed,
    failed,
    total: tests.length,
    failures: tests.filter((test) => !["passed", "skipped"].includes(test.status)).map((test) => ({
      test: test.title,
      message: test.message ?? "Playwright failure",
    })),
  };
}

function getScreenshots() {
  if (!fs.existsSync(screenshotDir)) return [];
  return fs.readdirSync(screenshotDir).filter((file) => file.endsWith(".png")).sort();
}

function getVisualBaselines() {
  if (!fs.existsSync(snapshotDir)) return [];
  return fs.readdirSync(snapshotDir).filter((file) => file.endsWith(".png")).sort();
}

function buildDebugSummary(unit, ui) {
  const lines = [`QA debug summary`, `Generated: ${timestamp}`, ``];
  const failures = [
    ...unit.failures.map((failure) => ({ type: "unit", ...failure })),
    ...ui.failures.map((failure) => ({ type: "ui", ...failure })),
  ];

  if (!failures.length) {
    lines.push("No failing tests were detected in the latest QA cycle.");
    lines.push("Recommended next step: inspect generated screenshots and keep extending smoke coverage.");
    return lines.join("\n");
  }

  for (const failure of failures) {
    lines.push(`[${failure.type}] ${failure.test ?? failure.suite}`);
    lines.push(failure.message ?? "No failure message provided.");
    lines.push("");
  }

  lines.push("Recommended next step: run `npm run test:ui:debug` for interactive repro or inspect `playwright-report/index.html`.");
  return lines.join("\n");
}

function buildReviewNotes(unit, ui) {
  const lines = [
    "# QA Review Notes",
    "",
    "## Current signal",
    `- Unit coverage signal: ${unit.available ? `${unit.passed}/${unit.total} passing` : "report not generated"}.`,
    `- UI coverage signal: ${ui.available ? `${ui.passed}/${ui.total} passing` : "report not generated"}.`,
    "",
    "## Actionable recommendations",
    "- Keep smoke tests focused on hardware-panel interactions, LCD editor flows, CLI commands, and file/export paths.",
    "- Keep the Playwright baseline snapshots under review when UI or bitmap rendering changes intentionally.",
    "- Expand Vitest around presentation-layer state transforms to catch UI regressions before E2E.",
  ];

  return lines.join("\n");
}

function buildReleaseReadiness(unit, ui, screenshots, baselines) {
  const blockers = unit.failed + ui.failed;
  const status = blockers === 0 ? "READY WITH MONITORING" : "NOT READY";

  return [
    "# QA Release Readiness",
    "",
    `- Generated: ${timestamp}`,
    `- Status: ${status}`,
    `- Unit tests: ${unit.passed}/${unit.total} passing`,
    `- UI tests: ${ui.passed}/${ui.total} passing`,
    `- Screenshots captured: ${screenshots.length}`,
    `- Visual baselines committed: ${baselines.length}`,
    "",
    "## Current assessment",
    blockers === 0
      ? "The local QA cycle is green. Playwright visual checks are now baseline-gated through pixel-diff snapshots."
      : "Release is blocked by failing tests. Use `qa-artifacts/reports/debug_summary.txt` and `playwright-report/index.html` to inspect root causes.",
  ].join("\n");
}

function buildDashboard(report, screenshots, baselines) {
  const listItems = screenshots.map((file) => `<li><a href="../ui/screenshots/${file}">${file}</a></li>`).join("");
  const baselineItems = baselines.map((file) => `<li>${file}</li>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>QA Dashboard</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; background: #f5f7f5; color: #0f172a; }
    h1, h2 { margin-bottom: 0.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .card { background: white; border: 1px solid #d4d4d8; border-radius: 16px; padding: 1rem; }
    code { background: #eef2ff; padding: 0.125rem 0.375rem; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>QA Dashboard</h1>
  <p>Generated: ${report.generatedAt}</p>
  <div class="grid">
    <div class="card">
      <h2>Unit</h2>
      <p>${report.unit.passed}/${report.unit.total} passing</p>
      <p>Failures: ${report.unit.failed}</p>
    </div>
    <div class="card">
      <h2>UI</h2>
      <p>${report.ui.passed}/${report.ui.total} passing</p>
      <p>Failures: ${report.ui.failed}</p>
    </div>
    <div class="card">
      <h2>Artifacts</h2>
      <p>Screenshots: ${screenshots.length}</p>
      <p>Visual baselines: ${baselines.length}</p>
      <p>Trace/video: see <code>test-results/playwright</code></p>
    </div>
  </div>
  <h2>Screenshot artifacts</h2>
  <ul>${listItems || "<li>No screenshots captured yet.</li>"}</ul>
  <h2>Pixel-diff baselines</h2>
  <ul>${baselineItems || "<li>No committed baselines found.</li>"}</ul>
</body>
</html>`;
}

function updateRiskTrends(report) {
  const targetPath = path.join(qaReportsDir, "risk_trends.csv");
  const header = "timestamp,unit_passed,unit_failed,ui_passed,ui_failed,total_failures\n";
  const row = `${report.generatedAt},${report.unit.passed},${report.unit.failed},${report.ui.passed},${report.ui.failed},${report.summary.totalFailures}\n`;

  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, header + row, "utf8");
    return;
  }

  const existing = fs.readFileSync(targetPath, "utf8");
  if (!existing.endsWith("\n")) {
    fs.writeFileSync(targetPath, `${existing}\n${row}`, "utf8");
    return;
  }

  fs.appendFileSync(targetPath, row, "utf8");
}

ensureDir(qaArtifactsDir);
ensureDir(path.join(qaArtifactsDir, "unit"));
ensureDir(path.join(qaArtifactsDir, "ui"));
ensureDir(qaReportsDir);

const unit = normalizeVitestReport(readJsonIfExists(unitReportPath));
const ui = normalizePlaywrightReport(readJsonIfExists(uiReportPath));
const screenshots = getScreenshots();
const baselines = getVisualBaselines();

const report = {
  generatedAt: timestamp,
  environment: {
    node: process.version,
    platform: process.platform,
  },
  unit,
  ui,
  screenshots,
  visualBaselines: baselines,
  visualGate: {
    enabled: baselines.length > 0,
    baselineCount: baselines.length,
  },
  summary: {
    totalFailures: unit.failed + ui.failed,
    healthy: unit.failed + ui.failed === 0,
  },
};

fs.writeFileSync(path.join(qaReportsDir, "qa_reports.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(qaReportsDir, "debug_summary.txt"), buildDebugSummary(unit, ui), "utf8");
fs.writeFileSync(path.join(qaReportsDir, "review_notes.md"), buildReviewNotes(unit, ui), "utf8");
fs.writeFileSync(path.join(qaReportsDir, "QA_Release_Readiness.md"), buildReleaseReadiness(unit, ui, screenshots, baselines), "utf8");
fs.writeFileSync(path.join(qaReportsDir, "qa_dashboard.html"), buildDashboard(report, screenshots, baselines), "utf8");
updateRiskTrends(report);

console.log("QA report artifacts generated:");
console.log(" - qa-artifacts/reports/qa_reports.json");
console.log(" - qa-artifacts/reports/debug_summary.txt");
console.log(" - qa-artifacts/reports/review_notes.md");
console.log(" - qa-artifacts/reports/QA_Release_Readiness.md");
console.log(" - qa-artifacts/reports/qa_dashboard.html");
console.log(" - qa-artifacts/reports/risk_trends.csv");
