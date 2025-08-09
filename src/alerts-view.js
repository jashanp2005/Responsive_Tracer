"use client"

import React from "react"

const getAlertTypeColor = (type) => {
  switch (type.toLowerCase()) {
    case "critical":
      return "#dc3545" // red
    case "warning":
      return "#ffc107" // yellow
    default:
      return "#6c757d" // gray
  }
}

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case "core web vitals":
      return "📊"
    case "performance":
      return "⚡"
    case "api performance":
      return "🔌"
    case "api reliability":
      return "🔄"
    case "api efficiency":
      return "📦"
    case "accessibility":
      return "♿"
    case "overall":
      return "🎯"
    default:
      return "🔍"
  }
}

const AlertCard = ({ alert }) => {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="alert-card" style={{ borderLeft: `4px solid ${getAlertTypeColor(alert.type)}` }}>
      <div className="alert-header" onClick={() => setExpanded(!expanded)}>
        <div className="alert-icon">{getCategoryIcon(alert.category)}</div>
        <div className="alert-title">
          <h3>{alert.message}</h3>
          <span className="alert-category">{alert.category || 'General'}</span>
        </div>
        <div className="alert-expand">
          {expanded ? "▲" : "▼"}
        </div>
      </div>

      {expanded && (
        <div className="alert-details">
          {alert.metric && (
            <div className="alert-metric">
              <strong>Metric:</strong> {alert.metric}
            </div>
          )}
          {alert.value && (
            <div className="alert-values">
              <span className="alert-value">
                <strong>Value:</strong> {alert.value}
              </span>
              {alert.threshold && (
                <span className="alert-threshold">
                  <strong>Threshold:</strong> {alert.threshold}
                </span>
              )}
            </div>
          )}
          {alert.recommendation && (
            <div className="alert-recommendation">
              <strong>Recommendation:</strong> {alert.recommendation}
            </div>
          )}
          {alert.details && alert.details.length > 0 && (
            <div className="alert-specific-details">
              <strong>Details:</strong>
              <ul>
                {alert.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const AlertsView = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="alerts-empty">
        <div className="alerts-empty-icon">✅</div>
        <h3>No Performance Alerts</h3>
        <p>Great job! Your website is performing well with no detected issues.</p>
      </div>
    )
  }

  const criticalAlerts = alerts.filter((alert) => alert.type?.toLowerCase() === "critical")
  const warningAlerts = alerts.filter((alert) => alert.type?.toLowerCase() === "warning")

  return (
    <div className="alerts-container">
      <div className="alerts-summary">
        <div className="alerts-summary-item" style={{ background: "#ffeaea" }}>
          <span className="alerts-summary-count">{criticalAlerts.length}</span>
          <span className="alerts-summary-label">Critical</span>
        </div>
        <div className="alerts-summary-item" style={{ background: "#fff8e1" }}>
          <span className="alerts-summary-count">{warningAlerts.length}</span>
          <span className="alerts-summary-label">Warnings</span>
        </div>
        <div className="alerts-summary-item" style={{ background: "#e8f5e9" }}>
          <span className="alerts-summary-count">{alerts.length}</span>
          <span className="alerts-summary-label">Total Alerts</span>
        </div>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="alerts-section">
          <h2 className="alerts-section-title">Critical Alerts</h2>
          <div className="alerts-list">
            {criticalAlerts.map((alert, index) => (
              <AlertCard key={`critical-${index}`} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {warningAlerts.length > 0 && (
        <div className="alerts-section">
          <h2 className="alerts-section-title">Warning Alerts</h2>
          <div className="alerts-list">
            {warningAlerts.map((alert, index) => (
              <AlertCard key={`warning-${index}`} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertsView
