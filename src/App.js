import React, { useState } from "react";
import "./App.css";
import AlertsView from './alerts-view.js';
import './alerts.css';
import SessionSimulator from './SessionSimulator.js';
import DbLatency from './DbLatency.js';

function DonutChart({ value = 0, label, color }) {
 
  const radius = 38;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <div className="donut-chart">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#eee"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s" }}
          strokeDasharray={circumference + " " + circumference}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="donut-center">
        <span className="donut-value">{value}</span>
      </div>
      <div className="donut-label">{label}</div>
    </div>
  );
}

const API_BASE = 'http://localhost:5000';

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Enter a URL to start analysis");
  const [rawResponse, setRawResponse] = useState(null);
  const [activePage, setActivePage] = useState("overview");
  const [maxPages, setMaxPages] = useState("4");
  const [alerts, setAlerts] = useState([]);
  const [sessionData, setSessionData] = useState(null);

  const handleCompleteWebsiteAnalysis = async () => {
    if (!url) return;
    setStatus("Starting complete website analysis...");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/analyze-complete-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          options: { maxPages: parseInt(maxPages) || 10, maxDepth: 3 }
        })
      });
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }
      const result = await response.json();
      setRawResponse(result.data);

      // Only generate alerts from frontend metrics (lighthouseResults)
      const newAlerts = [];
      if (result.data.lighthouseResults && Array.isArray(result.data.lighthouseResults)) {
        result.data.lighthouseResults.forEach(page => {
          if (page.lcp && parseFloat(page.lcp) > 4) {
            newAlerts.push({
              type: 'critical',
              category: 'Core Web Vitals',
              message: `LCP is slow on ${page.url}`,
              metric: 'Largest Contentful Paint (LCP)',
              value: page.lcp,
              threshold: '4s',
              recommendation: 'Optimize images and critical content for faster LCP',
              details: [`LCP for ${page.url}: ${page.lcp}`]
            });
          }
          if (page.fcp && parseFloat(page.fcp) > 2) {
            newAlerts.push({
              type: 'warning',
              category: 'Core Web Vitals',
              message: `FCP is slow on ${page.url}`,
              metric: 'First Contentful Paint (FCP)',
              value: page.fcp,
              threshold: '2s',
              recommendation: 'Reduce render-blocking resources for faster FCP',
              details: [`FCP for ${page.url}: ${page.fcp}`]
            });
          }
          // Add more metrics as needed
        });
      }

      setAlerts(newAlerts);

      setStatus("Complete website analysis finished!");
      setActivePage("overview");
    } catch (error) {
      setStatus(`Analysis failed: ${error.message}`);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = (session) => {
    if (!session || !session.metrics) return;

    setSessionData(session);
    const newAlerts = [];
    
    const highCpuUsage = session.metrics.filter(m => parseFloat(m.cpu) > 80);
    const highMemoryUsage = session.metrics.filter(m => parseFloat(m.memory) > 80);
    
    if (highCpuUsage.length > 0) {
      newAlerts.push({
        type: 'warning',
        category: 'Performance',
        message: 'High CPU Usage Detected',
        metric: 'CPU Usage',
        value: `${highCpuUsage[0].cpu}%`,
        threshold: '80%',
        recommendation: 'Consider optimizing CPU-intensive operations',
        details: [`CPU usage exceeded 80% for ${highCpuUsage.length} interactions`]
      });
    }
    
    if (highMemoryUsage.length > 0) {
      newAlerts.push({
        type: 'warning',
        category: 'Performance',
        message: 'High Memory Usage Detected',
        metric: 'Memory Usage',
        value: `${highMemoryUsage[0].memory}%`,
        threshold: '80%',
        recommendation: 'Consider implementing memory optimization techniques',
        details: [`Memory usage exceeded 80% for ${highMemoryUsage.length} interactions`]
      });
    }
    
    setAlerts(newAlerts);
  };

  function getScore(val) {
    if (val === undefined || val === null) return 0;
    if (typeof val === "number" && val <= 1) return Math.round(val * 100);
    return Math.round(val);
  }

  const renderOverview = () => {
    if (!rawResponse) {
      return <div>No analysis data available. Please run an analysis.</div>;
    }
     const { summary, websiteStructure, apiAnalysis, performanceInsights } = rawResponse;
    
     let perf, acc, best, seo;
    if (
      rawResponse.performance !== undefined &&
      rawResponse.accessibility !== undefined &&
      rawResponse.bestPractices !== undefined &&
      rawResponse.seo !== undefined
    ) {
      perf = getScore(rawResponse.performance);
      acc = getScore(rawResponse.accessibility);
      best = getScore(rawResponse.bestPractices);
      seo = getScore(rawResponse.seo);
    } else if (
      rawResponse.lighthouseResults &&
      Array.isArray(rawResponse.lighthouseResults) &&
      rawResponse.lighthouseResults[0] &&
      rawResponse.lighthouseResults[0].categories
    ) {
      const cats = rawResponse.lighthouseResults[0].categories;
      perf = getScore(cats.performance?.score);
      acc = getScore(cats.accessibility?.score);
      best = getScore(cats["best-practices"]?.score);
      seo = getScore(cats.seo?.score);
    } else {
      perf = acc = best = seo = 0;
    }

    return (
      <div className="overview-scrollbox">
        {/* Four donut graphs */}
        <div className="donut-row">
          <DonutChart value={perf} label="Performance" color="#ef4444" />
          <DonutChart value={acc} label="Accessibility" color="#f59e42" />
          <DonutChart value={best} label="Best Practices" color="#fbbf24" />
          <DonutChart value={seo} label="SEO" color="#22c55e" />
        </div>
        <h2 className="overview-title">Website Analysis Overview</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <h3>PAGES ANALYZED</h3>
            <span className="metric-value">{summary.totalPagesAnalyzed}</span>
          </div>
          <div className="summary-card">
            <h3>API CALLS FOUND</h3>
            <span className="metric-value">{summary.totalApiCallsFound}</span>
          </div>
          <div className="summary-card">
            <h3>AVG API RESPONSE</h3>
            <span className="metric-value">{summary.averageApiResponseTime}ms</span>
          </div>
          <div className="summary-card">
            <h3>PAGES W/ SLOW APIS</h3>
            <span className="metric-value">{summary.pagesWithSlowApis}</span>
          </div>
        </div>
        <div className="analysis-section">
          <h3>Website Structure</h3>
          <p>
            Discovered {websiteStructure.totalPages} pages with a maximum depth of {websiteStructure.maxDepthReached}
          </p>
          <div className="pages-list">
            <h4>Analyzed Pages:</h4>
            <ul>
              {websiteStructure.visitedUrls.slice(0, 10).map((pageUrl, index) => (
                <li key={index}>
                  <a href={pageUrl} target="_blank" rel="noopener noreferrer">{pageUrl}</a>
                  <span className="page-info">
                    (APIs: {websiteStructure.pageData[pageUrl]?.apiCalls || 0})
                  </span>
                </li>
              ))}
              {websiteStructure.visitedUrls.length > 10 && (
                <p>...and {websiteStructure.visitedUrls.length - 10} more pages</p>
              )}
            </ul>
          </div>
        </div>
        <div className="analysis-section">
          <h3>API Analysis Summary</h3>
          <div className="api-stats">
            <div className="stat-item">
              <strong>Total API Calls:</strong> {apiAnalysis.totalApiCalls}
            </div>
            <div className="stat-item">
              <strong>Slow APIs (&gt;1s):</strong> {apiAnalysis.slowestApis?.length || 0}
            </div>
            <div className="stat-item">
              <strong>Error APIs:</strong> {apiAnalysis.errorApis?.length || 0}
            </div>
            <div className="stat-item">
              <strong>High Impact APIs:</strong> {apiAnalysis.highImpactApis?.length || 0}
            </div>
          </div>
        </div>
        {performanceInsights?.criticalIssues?.length > 0 && (
          <div className="analysis-section critical-issues">
            <h3>Critical Issues Found</h3>
            {performanceInsights.criticalIssues.map((issue, index) => (
              <div key={index} className="issue-item">
                <div className={`issue-severity ${issue.severity}`}>{issue.severity.toUpperCase()}</div>
                <div className="issue-content">
                  <strong>{issue.message}</strong>
                  {issue.affectedApis && (
                    <div className="affected-apis">
                      <small>Affected APIs: {issue.affectedApis.length} endpoints</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {alerts.length > 0 && (
          <div className="analysis-section critical-issues">
            <h3>Frontend Metric Issues Found</h3>
            {alerts.map((alert, index) => (
              <div key={index} className="issue-item">
                <div className={`issue-severity ${alert.type}`}>{alert.type.toUpperCase()}</div>
                <div className="issue-content">
                  <strong>{alert.message}</strong>
                  <div>
                    <small>
                      Metric: {alert.metric} | Value: {alert.value} | Threshold: {alert.threshold}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderApiCalls = () => {
    if (!rawResponse?.apiAnalysis?.apiCalls) {
      return <div>No API calls data available.</div>;
    }
    const { apiCalls } = rawResponse.apiAnalysis;
    return (
      <div className="api-calls-container">
        <h2>API Calls Analysis</h2>
        <div className="api-table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Page</th>
                <th>Response Time</th>
                <th>Status</th>
                <th>Frontend Impact</th>
              </tr>
            </thead>
            <tbody>
              {apiCalls.map((call, index) => (
                <tr key={index}>
                  <td title={call.url}>{call.url}</td>
                  <td>
                    <span className={`method-tag method-${call.method?.toLowerCase() || "get"}`}>
                      {call.method}
                    </span>
                  </td>
                  <td>{call.page}</td>
                  <td>{call.duration || 0}ms</td>
                  <td>
                    <span className={`status-tag status-${Math.floor(call.status / 100)}`}>
                      {call.status}
                    </span>
                  </td>
                  <td>
                    {call.frontendImpact?.renderingImpact && (
                      <span className={`impact-${call.frontendImpact.renderingImpact}`}>
                        {call.frontendImpact.renderingImpact}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFrontendMetrics = () => {
    if (!rawResponse?.lighthouseResults) {
      return <div>No frontend metrics available.</div>;
    }

    return (
      <div className="frontend-metrics-container">
        <h2>Frontend Performance Metrics</h2>
        
        {rawResponse.lighthouseResults.map((result, index) => (
          <div key={index} className="page-metrics">
            <h3>{result.url}</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <strong>Performance Score:</strong> {Math.round((result.performance || 0) * 100)}/100
              </div>
              <div className="metric-item">
                <strong>First Contentful Paint:</strong> {result.fcp || 'N/A'}
              </div>
              <div className="metric-item">
                <strong>Largest Contentful Paint:</strong> {result.lcp || 'N/A'}
              </div>
              <div className="metric-item">
                <strong>Cumulative Layout Shift:</strong> {result.cls || 'N/A'}
              </div>
              <div className="metric-item">
                <strong>Time to Interactive:</strong> {result.tti || 'N/A'}
              </div>
              <div className="metric-item">
                <strong>Total Blocking Time:</strong> {result.tbt || 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Performance Report</h2>
        <div className={`sidebar-item ${activePage === "overview" ? "active" : ""}`}
          onClick={() => setActivePage("overview")}>Overall</div>
        <div className={`sidebar-item ${activePage === "api" ? "active" : ""}`}
          onClick={() => setActivePage("api")}>API Calls</div>
        <div className={`sidebar-item ${activePage === "frontend" ? "active" : ""}`}
          onClick={() => setActivePage("frontend")}>Frontend Metrics</div>
        <div className={`sidebar-item ${activePage === "db" ? "active" : ""}`}
          onClick={() => setActivePage("db")}>DB Latency</div>
        <div className={`sidebar-item ${activePage === "alerts" ? "active" : ""}`}
          onClick={() => setActivePage("alerts")}>Alerts</div>
        <div className={`sidebar-item ${activePage === "session" ? "active" : ""}`}
          onClick={() => setActivePage("session")}>Session Analysis</div>
      </div>
      <div className="main-content">
        <h1>Responsive Tracer</h1>
        {activePage === "overview" && (
          <div className="input-group">
            <input
              type="url"
              className="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a url."
            />
            <div className="analyze-options">
              <div className="max-pages-input">
                <label>
                  Max Pages:
                  <input
                    type="number"
                    className="max-pages"
                    value={maxPages}
                    onChange={(e) => setMaxPages(e.target.value)}
                    min="1"
                    max="20"
                  />
                </label>
              </div>
            </div>
            <button
              className="analyze-button"
              onClick={handleCompleteWebsiteAnalysis}
              disabled={loading || !url}
            >
              {loading ? "Analyzing..." : "Analyze Website"}
            </button>
          </div>
        )}
        <div className="status-section">
          <p className={status.includes("failed") ? "error-message" : ""}>{status}</p>
        </div>
        {/* Content */}
        <div className="report-section">
          {activePage === "overview" && renderOverview()}
          {activePage === "api" && renderApiCalls()}
          {activePage === "frontend" && renderFrontendMetrics()}
          {activePage === "db" && <DbLatency />}
          {activePage === "alerts" && <AlertsView alerts={alerts} />}
          {activePage === "session" && <SessionSimulator url={url} onSessionComplete={handleSessionComplete} />}
        </div>
      </div>
    </div>
  );
}

export default App;
