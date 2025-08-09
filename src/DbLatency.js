import React, { useEffect, useState } from 'react';

function DbLatency() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/query-logs')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading DB latency data...</div>;
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;

  return (
    <div>
      <h2>DB Latency</h2>
      {logs.length === 0 ? (
        <div>No DB latency data available.</div>
      ) : (
        logs.map((log, idx) => (
          <div key={idx} style={{marginBottom: '1em', background: '#f8f9fa', padding: '10px', borderRadius: '4px'}}>
            <div><strong>Query:</strong> <span style={{fontFamily: 'monospace'}}>{log.query}</span></div>
            <div><strong>Total Duration:</strong> {log.total_time?.toFixed(2)}ms</div>
            <div><strong>Calls:</strong> {log.calls}</div>
            <div><strong>Average Duration:</strong> {log.avg_time?.toFixed(2)}ms</div>
          </div>
        ))
      )}
    </div>
  );
}

export default DbLatency; 