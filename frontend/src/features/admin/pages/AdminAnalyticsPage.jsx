import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';
import '../styles/AdminAnalyticsPage.css';

const AdminAnalyticsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [analyticsData, setAnalyticsData] = useState({
    realtime: {},
    historical: {},
    staff: {},
    customer: {},
    operational: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
    
    // Set up auto-refresh for real-time data
    const interval = setInterval(() => {
      if (activeTab === 'realtime') {
        loadRealtimeData();
      }
    }, 30000); // Refresh every 30 seconds
    
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [activeTab, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load all analytics data based on active tab
      switch(activeTab) {
        case 'realtime':
          await loadRealtimeData();
          break;
        case 'historical':
          await loadHistoricalData();
          break;
        case 'staff':
          await loadStaffData();
          break;
        case 'customer':
          await loadCustomerData();
          break;
        case 'operational':
          await loadOperationalData();
          break;
        default:
          await loadOverviewData();
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeData = async () => {
    try {
      const [overviewRes, queuesRes, alertsRes] = await Promise.all([
        api.get('/analytics/realtime/overview'),
        api.get('/analytics/realtime/queues'),
        api.get('/analytics/realtime/alerts')
      ]);
      
      setAnalyticsData(prev => ({
        ...prev,
        realtime: {
          overview: overviewRes.data.data,
          queues: queuesRes.data.data,
          alerts: alertsRes.data.data
        }
      }));
    } catch (err) {
      console.error('Error loading realtime data:', err);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const [performanceRes, trendsRes, comparisonRes] = await Promise.all([
        api.get(`/analytics/historical/performance?range=${dateRange}`),
        api.get(`/analytics/historical/trends?range=${dateRange}`),
        api.get(`/analytics/historical/comparison?range=${dateRange}`)
      ]);
      
      setAnalyticsData(prev => ({
        ...prev,
        historical: {
          performance: performanceRes.data.data,
          trends: trendsRes.data.data,
          comparison: comparisonRes.data.data
        }
      }));
    } catch (err) {
      console.error('Error loading historical data:', err);
    }
  };

  const loadStaffData = async () => {
    try {
      const [performanceRes, rankingsRes, trainingRes] = await Promise.all([
        api.get('/analytics/staff/performance'),
        api.get('/analytics/staff/rankings'),
        api.get('/analytics/staff/training')
      ]);
      
      setAnalyticsData(prev => ({
        ...prev,
        staff: {
          performance: performanceRes.data.data,
          rankings: rankingsRes.data.data,
          training: trainingRes.data.data
        }
      }));
    } catch (err) {
      console.error('Error loading staff data:', err);
    }
  };

  const loadCustomerData = async () => {
    try {
      const [satisfactionRes, segmentsRes, behaviorRes] = await Promise.all([
        api.get('/analytics/customer/satisfaction'),
        api.get('/analytics/customer/segments'),
        api.get('/analytics/customer/behavior')
      ]);
      
      setAnalyticsData(prev => ({
        ...prev,
        customer: {
          satisfaction: satisfactionRes.data.data,
          segments: segmentsRes.data.data,
          behavior: behaviorRes.data.data
        }
      }));
    } catch (err) {
      console.error('Error loading customer data:', err);
    }
  };

  const loadOperationalData = async () => {
    try {
      const [efficiencyRes, costsRes, resourcesRes] = await Promise.all([
        api.get('/analytics/operational/efficiency'),
        api.get('/analytics/operational/costs'),
        api.get('/analytics/operational/resources')
      ]);
      
      setAnalyticsData(prev => ({
        ...prev,
        operational: {
          efficiency: efficiencyRes.data.data,
          costs: costsRes.data.data,
          resources: resourcesRes.data.data
        }
      }));
    } catch (err) {
      console.error('Error loading operational data:', err);
    }
  };

  const loadOverviewData = async () => {
    try {
      const overviewRes = await api.get('/analytics/overview');
      setAnalyticsData(prev => ({
        ...prev,
        overview: overviewRes.data.data
      }));
    } catch (err) {
      console.error('Error loading overview data:', err);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const response = await api.get(`/analytics/export?format=${format}&tab=${activeTab}&range=${dateRange}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${activeTab}-${dateRange}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export data');
      console.error('Export error:', err);
    }
  };

  const getTabConfig = () => {
    return {
      overview: { label: 'Overview', icon: '📊' },
      realtime: { label: 'Real-time', icon: '🕐' },
      historical: { label: 'Historical', icon: '📈' },
      staff: { label: 'Staff', icon: '👥' },
      customer: { label: 'Customer', icon: '👤' },
      operational: { label: 'Operational', icon: '⚙️' }
    };
  };

  const renderOverviewTab = () => {
    const data = analyticsData.overview || {};
    return (
      <div className="overview-dashboard">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon">👥</span>
              <h3>Total Served Today</h3>
            </div>
            <div className="kpi-value">{data.totalServedToday || 0}</div>
            <div className="kpi-trend positive">↑ 12% from yesterday</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon">⏱️</span>
              <h3>Avg Wait Time</h3>
            </div>
            <div className="kpi-value">{data.avgWaitTime || 0} min</div>
            <div className="kpi-trend negative">↑ 2 min from target</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon">😊</span>
              <h3>Satisfaction</h3>
            </div>
            <div className="kpi-value">{data.satisfactionScore || 0}/5</div>
            <div className="kpi-trend positive">↑ 0.3 points</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon">📋</span>
              <h3>Active Queues</h3>
            </div>
            <div className="kpi-value">{data.activeQueues || 0}</div>
            <div className="kpi-trend neutral">Stable</div>
          </div>
        </div>
        
        <div className="charts-row">
          <div className="chart-container">
            <h3>Service Distribution</h3>
            <div className="chart-placeholder">
              {/* Pie chart would go here */}
              <div className="pie-chart-simulation">
                <div className="chart-segment" style={{backgroundColor: '#3498db', width: '40%'}}>Consultation 40%</div>
                <div className="chart-segment" style={{backgroundColor: '#27ae60', width: '30%'}}>Registration 30%</div>
                <div className="chart-segment" style={{backgroundColor: '#f39c12', width: '20%'}}>Payment 20%</div>
                <div className="chart-segment" style={{backgroundColor: '#e74c3c', width: '10%'}}>Other 10%</div>
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            <h3>Hourly Trend</h3>
            <div className="chart-placeholder">
              {/* Line chart would go here */}
              <div className="line-chart-simulation">
                {[10, 25, 45, 67, 58, 42, 35, 28].map((value, index) => (
                  <div key={index} className="chart-bar" style={{height: `${value}%`}}>
                    <span className="bar-value">{value}</span>
                    <span className="bar-label">{index + 9}AM</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRealtimeTab = () => {
    const realtime = analyticsData.realtime || {};
    const overview = realtime.overview || {};
    const queues = realtime.queues || [];
    const alerts = realtime.alerts || [];
    
    return (
      <div className="realtime-dashboard">
        <div className="dashboard-header">
          <h2>Real-time Operations</h2>
          <div className="controls">
            <button className="refresh-button" onClick={loadRealtimeData}>
              🔄 Refresh
            </button>
            <span className="last-updated">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="status-grid">
          <div className="status-card active">
            <h3>Active Queues</h3>
            <div className="status-value">{overview.activeQueues || 0}</div>
          </div>
          
          <div className="status-card waiting">
            <h3>Waiting Customers</h3>
            <div className="status-value">{overview.waitingCustomers || 0}</div>
          </div>
          
          <div className="status-card served">
            <h3>Served Today</h3>
            <div className="status-value">{overview.servedToday || 0}</div>
          </div>
          
          <div className="status-card staff">
            <h3>Staff Online</h3>
            <div className="status-value">{overview.staffOnline || 0}</div>
          </div>
        </div>
        
        <div className="alerts-section">
          <h3>🔔 Active Alerts</h3>
          {alerts.length > 0 ? (
            <div className="alerts-list">
              {alerts.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.severity}`}>
                  <span className="alert-icon">{alert.severity === 'high' ? '⚠️' : 'ℹ️'}</span>
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-time">{alert.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-alerts">No active alerts</div>
          )}
        </div>
        
        <div className="queues-section">
          <h3>Queue Performance</h3>
          <div className="queues-table">
            <table>
              <thead>
                <tr>
                  <th>Queue</th>
                  <th>Waiting</th>
                  <th>Avg Wait</th>
                  <th>Status</th>
                  <th>Staff</th>
                </tr>
              </thead>
              <tbody>
                {queues.map((queue, index) => (
                  <tr key={index}>
                    <td>{queue.name}</td>
                    <td>{queue.waiting}</td>
                    <td>{queue.avgWait} min</td>
                    <td>
                      <span className={`status-badge ${queue.status}`}>
                        {queue.status}
                      </span>
                    </td>
                    <td>{queue.staffCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Analytics Dashboard</h1>
        <div className="header-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <div className="export-buttons">
            <button onClick={() => handleExport('csv')} className="export-button">
              📥 CSV
            </button>
            <button onClick={() => handleExport('pdf')} className="export-button">
              📄 PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="analytics-container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          {Object.entries(getTabConfig()).map(([key, config]) => (
            <button
              key={key}
              className={`tab-button ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="tab-icon">{config.icon}</span>
              <span className="tab-label">{config.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'realtime' && renderRealtimeTab()}
          
          {activeTab === 'historical' && (
            <div className="historical-dashboard">
              <h2>Historical Performance Analysis</h2>
              <div className="chart-grid">
                <div className="chart-card">
                  <h3>Performance Trends</h3>
                  <div className="chart-placeholder">Line chart showing performance over time</div>
                </div>
                <div className="chart-card">
                  <h3>Service Comparison</h3>
                  <div className="chart-placeholder">Bar chart comparing service performance</div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'staff' && (
            <div className="staff-dashboard">
              <h2>Staff Performance Analytics</h2>
              <div className="staff-rankings">
                <h3>Top Performers</h3>
                <div className="rankings-list">
                  <div className="ranking-item">
                    <span className="rank">1</span>
                    <span className="staff-name">Sarah Johnson</span>
                    <span className="score">94.2%</span>
                  </div>
                  <div className="ranking-item">
                    <span className="rank">2</span>
                    <span className="staff-name">Mike Chen</span>
                    <span className="score">89.7%</span>
                  </div>
                  <div className="ranking-item">
                    <span className="rank">3</span>
                    <span className="staff-name">Lisa Rodriguez</span>
                    <span className="score">87.3%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'customer' && (
            <div className="customer-dashboard">
              <h2>Customer Experience Analytics</h2>
              <div className="satisfaction-metrics">
                <div className="metric-card">
                  <h3>Overall Satisfaction</h3>
                  <div className="rating">4.3/5.0</div>
                </div>
                <div className="metric-card">
                  <h3>Repeat Customers</h3>
                  <div className="percentage">68%</div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'operational' && (
            <div className="operational-dashboard">
              <h2>Operational Efficiency</h2>
              <div className="efficiency-metrics">
                <div className="metric-row">
                  <span className="metric-label">Resource Utilization</span>
                  <span className="metric-value">87%</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Cost Per Service</span>
                  <span className="metric-value">$12.50</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;