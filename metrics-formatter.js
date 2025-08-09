function formatMetricsForDisplay(lighthouseResults, apiResults = null) {
  const { performance, fcp, lcp, cls, tbt, tti, si, details } = lighthouseResults;

  console.log("formatMetricsForDisplay called with apiResults:", apiResults ? "Present" : "Not present");
  if (apiResults) {
    console.log(`API calls: ${apiResults.apiCalls.length}, Analysis: ${Object.keys(apiResults.analysis).join(", ")}`);
  }

  const overallView = `
Performance Score: ${(performance * 100).toFixed(0)}/100

Core Web Vitals:
• First Contentful Paint (FCP): ${fcp}
• Largest Contentful Paint (LCP): ${lcp}
• Cumulative Layout Shift (CLS): ${cls}

Other Important Metrics:
• Time to Interactive (TTI): ${tti}
• Total Blocking Time (TBT): ${tbt}
• Speed Index: ${si}
${
  apiResults
    ? `
API Performance Summary:
• Total API Calls: ${apiResults.analysis.totalApiCalls}
• Average Response Time: ${apiResults.analysis.averageResponseTime}ms
• Slow APIs: ${apiResults.analysis.slowestApis.length}
• Error-Prone APIs: ${apiResults.analysis.errorProneApis.length}
`
    : ""
}
  `.trim();

  const frontendView = `
Core Web Vitals:
• First Contentful Paint (FCP): ${fcp}
  - Time until the first text or image is rendered
  - Good: < 1.8s, Needs Improvement: < 3.0s, Poor: ≥ 3.0s

• Largest Contentful Paint (LCP): ${lcp}
  - Time taken to render the largest visible element
  - Good: < 2.5s, Needs Improvement: < 4.0s, Poor: ≥ 4.0s

• Cumulative Layout Shift (CLS): ${cls}
  - Measures visual stability (e.g., content jumping)
  - Good: < 0.1, Needs Improvement: < 0.25, Poor: ≥ 0.25

• Time to Interactive (TTI): ${tti}
  - Time when the page becomes fully interactive
  - Good: < 3.8s, Needs Improvement: < 7.3s, Poor: ≥ 7.3s

• Total Blocking Time (TBT): ${tbt}
  - Time the main thread is blocked and unresponsive
  - Good: < 200ms, Needs Improvement: < 600ms, Poor: ≥ 600ms

• Speed Index: ${si}
  - Average time to display visible content
  - Good: < 3.4s, Needs Improvement: < 5.8s, Poor: ≥ 5.8s

• First Input Delay (FID): N/A (Requires real user interaction)
  - Time between user interaction and browser response
  - Good: < 100ms, Needs Improvement: < 300ms, Poor: ≥ 300ms

• DOM Content Loaded (DCL): N/A (Not directly provided by Lighthouse)
  - When HTML is fully parsed
  `.trim();

  const apiView = apiResults
    ? `
API Calls Analysis:
  
${formatApiTable(apiResults.apiCalls)}

Slowest APIs Identified:
${
  apiResults.analysis.slowestApis.length > 0
    ? apiResults.analysis.slowestApis.map((api) => `• ${api.method} ${api.endpoint}: ${api.timeTaken}ms`).join("\n")
    : "• None detected"
}

High Payload Endpoints:
${
  apiResults.analysis.highPayloadApis.length > 0
    ? apiResults.analysis.highPayloadApis.map((api) => `• ${api.method} ${api.endpoint}: ${api.payloadSize}`).join("\n")
    : "• None detected"
}

Unstable or Error-Prone Endpoints (4xx/5xx):
${
  apiResults.analysis.errorProneApis.length > 0
    ? apiResults.analysis.errorProneApis
        .map((api) => `• ${api.method} ${api.endpoint}: ${api.status} ${api.error}`)
        .join("\n")
    : "• None detected"
}
  `.trim()
    : `
API Calls Analysis:

Note: Detailed API call analysis requires additional instrumentation.
Lighthouse provides general network information but not specific API call metrics.

Consider implementing:
• API call tracking in your frontend code
• Server-side API monitoring
• Network request timing analysis
  `.trim();

  const dbView = `
Database Latency Analysis:

Note: Database latency analysis requires server-side instrumentation.
This information is not available through Lighthouse alone.

Consider implementing:
• Database query timing on your backend
• Server-side performance monitoring
• API response time tracking
  `.trim();

  const alertsView = `
Automatic Performance Alerts:

Note: Performance alerts will be generated based on the analysis results.
Check the 'alerts' property in the response for detailed alerts.
  `.trim();

  return {
    overall: overallView,
    frontend: frontendView,
    api: apiView,
    db: dbView,
    alerts: alertsView,
  };
}

function formatApiTable(apiCalls) {
  if (!apiCalls || apiCalls.length === 0) {
    return "No API calls detected.";
  }

  const header = "API Endpoint\tMethod\tStatus\tTime Taken (ms)\tPayload Size\tErrors";

  const rows = apiCalls
    .map(
      (call) =>
        `${call.endpoint}\t${call.method}\t${call.status}\t${call.timeTaken} ms\t${call.payloadSize}\t${call.errors}`
    )
    .join("\n");

  return `${header}\n${rows}`;
}

export { formatMetricsForDisplay };
