import React, { useState, useEffect } from 'react';

const PerformanceAnalyzer = ({ sessionData, apiMetrics, frontendMetrics }) => {
  const [bottlenecks, setBottlenecks] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (sessionData) {
      analyzePerformance();
    }
  }, [sessionData, apiMetrics, frontendMetrics]);

  const analyzePerformance = () => {
    const newBottlenecks = [];
    const newAlerts = [];

    // Analyze API performance
    if (apiMetrics) {
      apiMetrics.forEach(api => {
        // Check for slow API calls
        if (api.avgResponseTime > 1000) {
          newBottlenecks.push({
            type: 'api',
            severity: 'high',
            message: `Slow API endpoint: ${api.endpoint} (${api.avgResponseTime}ms)`,
            recommendation: 'Consider optimizing the API endpoint or implementing caching'
          });
        }

        // Check for high error rates
        if (api.errorRate > 5) {
          newAlerts.push({
            type: 'error',
            severity: 'critical',
            message: `High error rate for ${api.endpoint}: ${api.errorRate}%`,
            timestamp: new Date()
          });
        }
      });
    }

    // Analyze frontend performance
    if (frontendMetrics) {
      // Check Core Web Vitals
      if (frontendMetrics.lcp > 2500) {
        newBottlenecks.push({
          type: 'frontend',
          severity: 'high',
          message: 'Slow Largest Contentful Paint (LCP)',
          recommendation: 'Optimize image loading and server response time'
        });
      }

      if (frontendMetrics.cls > 0.1) {
        newBottlenecks.push({
          type: 'frontend',
          severity: 'medium',
          message: 'High Cumulative Layout Shift (CLS)',
          recommendation: 'Ensure proper image dimensions and avoid dynamic content insertion'
        });
      }

      if (frontendMetrics.fid > 100) {
        newBottlenecks.push({
          type: 'frontend',
          severity: 'high',
          message: 'Slow First Input Delay (FID)',
          recommendation: 'Reduce JavaScript execution time and optimize event handlers'
        });
      }
    }

    // Analyze resource usage
    if (sessionData?.metrics) {
      const highCpuUsage = sessionData.metrics.filter(m => m.cpu > 80);
      const highMemoryUsage = sessionData.metrics.filter(m => m.memory > 80);

      if (highCpuUsage.length > 0) {
        newAlerts.push({
          type: 'resource',
          severity: 'warning',
          message: 'High CPU usage detected during session',
          timestamp: new Date(),
          details: `CPU usage exceeded 80% for ${highCpuUsage.length} interactions`
        });
      }

      if (highMemoryUsage.length > 0) {
        newAlerts.push({
          type: 'resource',
          severity: 'warning',
          message: 'High memory usage detected during session',
          timestamp: new Date(),
          details: `Memory usage exceeded 80% for ${highMemoryUsage.length} interactions`
        });
      }
    }

    setBottlenecks(newBottlenecks);
    setAlerts(newAlerts);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'warning': return '#2196f3';
      default: return '#666';
    }
  };

  return (
    <div className="performance-analyzer" style={{
      background: '#fff',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginTop: 0, color: '#1976d2' }}>Performance Analysis</h3>

      {/* Bottlenecks Section */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ color: '#1976d2', marginBottom: 16 }}>Performance Bottlenecks</h4>
        {bottlenecks.length > 0 ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {bottlenecks.map((bottleneck, idx) => (
              <div key={idx} style={{
                background: '#f8fbff',
                padding: 16,
                borderRadius: 8,
                borderLeft: `4px solid ${getSeverityColor(bottleneck.severity)}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}>
                  <strong style={{ color: getSeverityColor(bottleneck.severity) }}>
                    {bottleneck.type.toUpperCase()} - {bottleneck.severity}
                  </strong>
                </div>
                <div style={{ marginBottom: 8 }}>{bottleneck.message}</div>
                <div style={{ 
                  fontSize: 14, 
                  color: '#666',
                  background: '#fff',
                  padding: 8,
                  borderRadius: 4
                }}>
                  Recommendation: {bottleneck.recommendation}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            background: '#e8f5e9', 
            padding: 16, 
            borderRadius: 8,
            color: '#2e7d32'
          }}>
            No significant bottlenecks detected
          </div>
        )}
      </div>

      {/* Alerts Section */}
      <div>
        <h4 style={{ color: '#1976d2', marginBottom: 16 }}>Active Alerts</h4>
        {alerts.length > 0 ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {alerts.map((alert, idx) => (
              <div key={idx} style={{
                background: '#fff',
                padding: 16,
                borderRadius: 8,
                border: `1px solid ${getSeverityColor(alert.severity)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: 8
                }}>
                  <strong style={{ color: getSeverityColor(alert.severity) }}>
                    {alert.type.toUpperCase()} - {alert.severity}
                  </strong>
                  <span style={{ color: '#666', fontSize: 14 }}>
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>{alert.message}</div>
                {alert.details && (
                  <div style={{ 
                    fontSize: 14, 
                    color: '#666',
                    background: '#f8fbff',
                    padding: 8,
                    borderRadius: 4
                  }}>
                    {alert.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            background: '#e8f5e9', 
            padding: 16, 
            borderRadius: 8,
            color: '#2e7d32'
          }}>
            No active alerts
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAnalyzer; 