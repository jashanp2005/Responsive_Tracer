/**
 * Generates performance alerts based on Lighthouse results and API analysis
 * @param {Object} lighthouseResults - Raw Lighthouse results
 * @param {Object} apiResults - API call analysis results
 * @returns {Array} - Array of alert objects
 */
function generatePerformanceAlerts(lighthouseResults, apiResults = null) {
  const alerts = [];

  // Core Web Vitals Thresholds
  const thresholds = {
    fcp: { warning: 2000, critical: 3000 }, // ms
    lcp: { warning: 2500, critical: 4000 }, // ms
    cls: { warning: 0.1, critical: 0.25 }, // unitless
    tbt: { warning: 300, critical: 600 }, // ms
    tti: { warning: 3800, critical: 7300 }, // ms
    si: { warning: 3400, critical: 5800 }, // ms
    performance: { warning: 0.7, critical: 0.5 }, // 0-1 score
    accessibility: { warning: 0.7, critical: 0.5 }, // 0-1 score
    bestPractices: { warning: 0.7, critical: 0.5 }, // 0-1 score
    seo: { warning: 0.7, critical: 0.5 }, // 0-1 score
  };

  // API Thresholds
  const apiThresholds = {
    responseTime: { warning: 500, critical: 1000 }, // ms
    errorRate: { warning: 0.05, critical: 0.1 }, // 5% and 10%
    payloadSize: { warning: 1024 * 1024, critical: 5 * 1024 * 1024 }, // 1MB and 5MB
  };

  // Check Core Web Vitals
  if (lighthouseResults) {
    // Extract raw values for comparison
    const { details } = lighthouseResults;

    // Check FCP
    if (details && details.fcpRaw) {
      if (details.fcpRaw >= thresholds.fcp.critical) {
        alerts.push({
          type: 'critical',
          category: 'Core Web Vitals',
          metric: 'First Contentful Paint (FCP)',
          value: `${(details.fcpRaw / 1000).toFixed(2)}s`,
          threshold: `${thresholds.fcp.critical / 1000}s`,
          message: 'First Contentful Paint is critically slow',
          recommendation: 'Optimize critical rendering path, reduce server response time, and minimize render-blocking resources.'
        });
      } else if (details.fcpRaw >= thresholds.fcp.warning) {
        alerts.push({
          type: 'warning',
          category: 'Core Web Vitals',
          metric: 'First Contentful Paint (FCP)',
          value: `${(details.fcpRaw / 1000).toFixed(2)}s`,
          threshold: `${thresholds.fcp.warning / 1000}s`,
          message: 'First Contentful Paint is slow',
          recommendation: 'Consider optimizing server response time and reducing render-blocking resources.'
        });
      }
    }

    // Check LCP
    if (details && details.lcpRaw) {
      if (details.lcpRaw >= thresholds.lcp.critical) {
        alerts.push({
          type: 'critical',
          category: 'Core Web Vitals',
          metric: 'Largest Contentful Paint (LCP)',
          value: `${(details.lcpRaw / 1000).toFixed(2)}s`,
          threshold: `${thresholds.lcp.critical / 1000}s`,
          message: 'Largest Contentful Paint is critically slow',
          recommendation: 'Optimize and prioritize loading of hero images and text. Consider using CDN and image optimization.'
        });
      } else if (details.lcpRaw >= thresholds.lcp.warning) {
        alerts.push({
          type: 'warning',
          category: 'Core Web Vitals',
          metric: 'Largest Contentful Paint (LCP)',
          value: `${(details.lcpRaw / 1000).toFixed(2)}s`,
          threshold: `${thresholds.lcp.warning / 1000}s`,
          message: 'Largest Contentful Paint is slow',
          recommendation: 'Consider optimizing hero images and text loading.'
        });
      }
    }

    // Check CLS
    if (details && details.clsRaw !== undefined) {
      if (details.clsRaw >= thresholds.cls.critical) {
        alerts.push({
          type: 'critical',
          category: 'Core Web Vitals',
          metric: 'Cumulative Layout Shift (CLS)',
          value: details.clsRaw.toFixed(3),
          threshold: thresholds.cls.critical.toFixed(2),
          message: 'Cumulative Layout Shift is critically high',
          recommendation: 'Set explicit width/height for images, ads, embeds, and dynamically injected content.'
        });
      } else if (details.clsRaw >= thresholds.cls.warning) {
        alerts.push({
          type: 'warning',
          category: 'Core Web Vitals',
          metric: 'Cumulative Layout Shift (CLS)',
          value: details.clsRaw.toFixed(3),
          threshold: thresholds.cls.warning.toFixed(2),
          message: 'Cumulative Layout Shift is high',
          recommendation: 'Consider setting explicit dimensions for images and dynamic content.'
        });
      }
    }

    // Check TTI
    if (details && details.ttiRaw) {
      if (details.ttiRaw >= thresholds.tti.critical) {
        alerts.push({
          type: 'critical',
          category: 'Performance',
          metric: 'Time to Interactive (TTI)',
          value: `${(details.ttiRaw / 1000).toFixed(2)}s`,
          threshold: `${thresholds.tti.critical / 1000}s`,
          message: 'Time to Interactive is critically slow',
          recommendation: 'Reduce JavaScript execution time, minimize main thread work, and defer non-critical JavaScript.'
        });
      } else if (details.ttiRaw >= thresholds.tti.warning) {
        alerts.push({
          type: 'warning',
          category: 'Performance',
          metric: 'Time to Interactive (TTI)',
          value: `${(details.ttiRaw / 1000).toFixed(2)}s`,
          threshold: `${thresholds.tti.warning / 1000}s`,
          message: 'Time to Interactive is slow',
          recommendation: 'Consider reducing JavaScript execution time and deferring non-critical scripts.'
        });
      }
    }

    // Check TBT
    if (details && details.tbtRaw) {
      if (details.tbtRaw >= thresholds.tbt.critical) {
        alerts.push({
          type: 'critical',
          category: 'Performance',
          metric: 'Total Blocking Time (TBT)',
          value: `${details.tbtRaw.toFixed(0)}ms`,
          threshold: `${thresholds.tbt.critical}ms`,
          message: 'Total Blocking Time is critically high',
          recommendation: 'Minimize long tasks, optimize JavaScript execution, and consider code-splitting.'
        });
      } else if (details.tbtRaw >= thresholds.tbt.warning) {
        alerts.push({
          type: 'warning',
          category: 'Performance',
          metric: 'Total Blocking Time (TBT)',
          value: `${details.tbtRaw.toFixed(0)}ms`,
          threshold: `${thresholds.tbt.warning}ms`,
          message: 'Total Blocking Time is high',
          recommendation: 'Consider optimizing JavaScript execution and breaking up long tasks.'
        });
      }
    }

    // Check Speed Index
    if (details && details.siRaw) {
      if (details.siRaw >= thresholds.si.critical) {
        alerts.push({
          type: 'critical',
          category: 'Performance',
          metric: 'Speed Index (SI)',
          value: `${(details.siRaw / 1000).toFixed(2)}s`,
          threshold: `${thresholds.si.critical / 1000}s`,
          message: 'Speed Index is critically slow',
          recommendation: 'Optimize page load performance, minimize critical rendering path, and prioritize visible content.'
        });
      } else if (details.siRaw >= thresholds.si.warning) {
        alerts.push({
          type: 'warning',
          category: 'Performance',
          metric: 'Speed Index (SI)',
          value: `${(details.siRaw / 1000).toFixed(2)}s`,
          threshold: `${thresholds.si.warning / 1000}s`,
          message: 'Speed Index is slow',
          recommendation: 'Consider optimizing page load performance and prioritizing visible content.'
        });
      }
    }

    // Check overall performance score
    if (lighthouseResults.performance !== undefined) {
      if (lighthouseResults.performance <= thresholds.performance.critical) {
        alerts.push({
          type: 'critical',
          category: 'Overall',
          metric: 'Performance Score',
          value: `${Math.round(lighthouseResults.performance * 100)}/100`,
          threshold: `${Math.round(thresholds.performance.critical * 100)}/100`,
          message: 'Overall performance score is critically low',
          recommendation: 'Review all performance metrics and prioritize fixing critical issues first.'
        });
      } else if (lighthouseResults.performance <= thresholds.performance.warning) {
        alerts.push({
          type: 'warning',
          category: 'Overall',
          metric: 'Performance Score',
          value: `${Math.round(lighthouseResults.performance * 100)}/100`,
          threshold: `${Math.round(thresholds.performance.warning * 100)}/100`,
          message: 'Overall performance score is low',
          recommendation: 'Review performance metrics and address the most impactful issues.'
        });
      }
    }

    // Check accessibility score
    if (lighthouseResults.accessibility !== undefined) {
      if (lighthouseResults.accessibility <= thresholds.accessibility.critical) {
        alerts.push({
          type: 'critical',
          category: 'Accessibility',
          metric: 'Accessibility Score',
          value: `${Math.round(lighthouseResults.accessibility * 100)}/100`,
          threshold: `${Math.round(thresholds.accessibility.critical * 100)}/100`,
          message: 'Accessibility score is critically low',
          recommendation: 'Address critical accessibility issues like missing alt text, insufficient color contrast, and improper ARIA usage.'
        });
      } else if (lighthouseResults.accessibility <= thresholds.accessibility.warning) {
        alerts.push({
          type: 'warning',
          category: 'Accessibility',
          metric: 'Accessibility Score',
          value: `${Math.round(lighthouseResults.accessibility * 100)}/100`,
          threshold: `${Math.round(thresholds.accessibility.warning * 100)}/100`,
          message: 'Accessibility score is low',
          recommendation: 'Review accessibility issues and address the most impactful problems.'
        });
      }
    }
  }

  // Check API performance
  if (apiResults && apiResults.apiCalls && apiResults.apiCalls.length > 0) {
    // Check for slow API calls
    const slowApiCalls = apiResults.apiCalls.filter(call => call.timeTaken >= apiThresholds.responseTime.critical);
    if (slowApiCalls.length > 0) {
      alerts.push({
        type: 'critical',
        category: 'API Performance',
        metric: 'Slow API Calls',
        value: `${slowApiCalls.length} calls`,
        threshold: `${apiThresholds.responseTime.critical}ms`,
        message: `${slowApiCalls.length} API calls are critically slow`,
        recommendation: 'Optimize server response time, implement caching, and consider API endpoint consolidation.',
        details: slowApiCalls.map(call => `${call.method} ${call.endpoint}: ${call.timeTaken}ms`)
      });
    } else {
      const warningApiCalls = apiResults.apiCalls.filter(call =>
        call.timeTaken >= apiThresholds.responseTime.warning &&
        call.timeTaken < apiThresholds.responseTime.critical
      );
      if (warningApiCalls.length > 0) {
        alerts.push({
          type: 'warning',
          category: 'API Performance',
          metric: 'Slow API Calls',
          value: `${warningApiCalls.length} calls`,
          threshold: `${apiThresholds.responseTime.warning}ms`,
          message: `${warningApiCalls.length} API calls are slow`,
          recommendation: 'Consider optimizing server response time and implementing caching.',
          details: warningApiCalls.map(call => `${call.method} ${call.endpoint}: ${call.timeTaken}ms`)
        });
      }
    }

    // Check for error-prone API calls
    const errorApiCalls = apiResults.apiCalls.filter(call => call.status >= 400);
    if (errorApiCalls.length > 0) {
      const errorRate = errorApiCalls.length / apiResults.apiCalls.length;

      if (errorRate >= apiThresholds.errorRate.critical) {
        alerts.push({
          type: 'critical',
          category: 'API Reliability',
          metric: 'API Error Rate',
          value: `${(errorRate * 100).toFixed(1)}%`,
          threshold: `${(apiThresholds.errorRate.critical * 100).toFixed(1)}%`,
          message: 'API error rate is critically high',
          recommendation: 'Investigate and fix failing API endpoints. Consider implementing retry logic and error handling.',
          details: errorApiCalls.map(call => `${call.method} ${call.endpoint}: ${call.status}`)
        });
      } else if (errorRate >= apiThresholds.errorRate.warning) {
        alerts.push({
          type: 'warning',
          category: 'API Reliability',
          metric: 'API Error Rate',
          value: `${(errorRate * 100).toFixed(1)}%`,
          threshold: `${(apiThresholds.errorRate.warning * 100).toFixed(1)}%`,
          message: 'API error rate is high',
          recommendation: 'Review failing API endpoints and implement proper error handling.',
          details: errorApiCalls.map(call => `${call.method} ${call.endpoint}: ${call.status}`)
        });
      }
    }

    // Check for large payload sizes
    const largePayloadCalls = apiResults.apiCalls.filter(call => {
      const size = call.rawData?.transferSize || 0;
      return size >= apiThresholds.payloadSize.critical;
    });

    if (largePayloadCalls.length > 0) {
      alerts.push({
        type: 'critical',
        category: 'API Efficiency',
        metric: 'Large API Payloads',
        value: `${largePayloadCalls.length} calls`,
        threshold: `${formatBytes(apiThresholds.payloadSize.critical)}`,
        message: `${largePayloadCalls.length} API calls have excessively large payloads`,
        recommendation: 'Implement pagination, reduce payload size, use compression, and consider GraphQL for selective data fetching.',
        details: largePayloadCalls.map(call => `${call.method} ${call.endpoint}: ${call.payloadSize}`)
      });
    } else {
      const warningPayloadCalls = apiResults.apiCalls.filter(call => {
        const size = call.rawData?.transferSize || 0;
        return size >= apiThresholds.payloadSize.warning && size < apiThresholds.payloadSize.critical;
      });

      if (warningPayloadCalls.length > 0) {
        alerts.push({
          type: 'warning',
          category: 'API Efficiency',
          metric: 'Large API Payloads',
          value: `${warningPayloadCalls.length} calls`,
          threshold: `${formatBytes(apiThresholds.payloadSize.warning)}`,
          message: `${warningPayloadCalls.length} API calls have large payloads`,
          recommendation: 'Consider implementing pagination and reducing payload size.',
          details: warningPayloadCalls.map(call => `${call.method} ${call.endpoint}: ${call.payloadSize}`)
        });
      }
    }
  }

  return alerts;
}

/**
 * Formats bytes into human-readable format
 * @param {number} bytes - The number of bytes
 * @returns {string} - Formatted size string
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0B"

  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + sizes[i]
}

/**
 * Formats performance alerts for display
 * @param {Array} alerts - Array of alert objects
 * @returns {string} - Formatted alerts for display
 */
function formatAlertsForDisplay(alerts) {
  if (!alerts || alerts.length === 0) {
    return "No performance alerts detected. Your website is performing well!"
  }

  // Group alerts by type (critical first, then warnings)
  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');

  let output = "";

  // Format critical alerts
  if (criticalAlerts.length > 0) {
    output += `CRITICAL ALERTS (${criticalAlerts.length})\n`;
    output += "====================\n\n";

    criticalAlerts.forEach((alert, index) => {
      output += `${index + 1}. ${alert.message}\n`;
      output += `   Metric: ${alert.metric}\n`;
      output += `   Value: ${alert.value} (Threshold: ${alert.threshold})\n`;
      output += `   Recommendation: ${alert.recommendation}\n`;

      if (alert.details && alert.details.length > 0) {
        output += "   Details:\n";
        alert.details.slice(0, 3).forEach(detail => {
          output += `     - ${detail}\n`;
        });

        if (alert.details.length > 3) {
          output += `     - ... and ${alert.details.length - 3} more\n`;
        }
      }

      output += "\n";
    });
  }

  // Format warning alerts
  if (warningAlerts.length > 0) {
    output += `WARNING ALERTS (${warningAlerts.length})\n`;
    output += "====================\n\n";

    warningAlerts.forEach((alert, index) => {
      output += `${index + 1}. ${alert.message}\n`;
      output += `   Metric: ${alert.metric}\n`;
      output += `   Value: ${alert.value} (Threshold: ${alert.threshold})\n`;
      output += `   Recommendation: ${alert.recommendation}\n`;

      if (alert.details && alert.details.length > 0) {
        output += "   Details:\n";
        alert.details.slice(0, 3).forEach(detail => {
          output += `     - ${detail}\n`;
        });

        if (alert.details.length > 3) {
          output += `     - ... and ${alert.details.length - 3} more\n`;
        }
      }

      output += "\n";
    });
  }

  // Add summary
  output += "SUMMARY\n";
  output += "====================\n\n";
  output += `Total Alerts: ${alerts.length}\n`;
  output += `Critical Alerts: ${criticalAlerts.length}\n`;
  output += `Warning Alerts: ${warningAlerts.length}\n`;

  return output;
}

export {
  generatePerformanceAlerts,
  formatAlertsForDisplay
};
