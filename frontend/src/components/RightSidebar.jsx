import React from 'react';
import { ShieldAlert } from 'lucide-react';
import './RightSidebar.css';

const RightSidebar = () => {
  // Stroke dash calculation for 0%
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference; // 100% offset means 0% filled

  return (
    <aside className="right-sidebar">
      <div className="wellness-card">
        <div className="wellness-header">YOUR WELLNESS</div>
        <div style={{ fontSize: '10px', color: 'var(--text-light)', alignSelf: 'flex-start', marginTop: '-12px' }}>
          AI POWERED INSIGHTS FROM YOUR THOUGHTS
        </div>

        <div className="circular-chart">
          <svg className="circular-chart-svg" viewBox="0 0 120 120">
            <circle className="chart-bg" cx="60" cy="60" r={radius} />
            <circle
              className="chart-fill"
              cx="60"
              cy="60"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="chart-percentage">
            <span className="chart-num">--%</span>
            <span className="chart-label">Stress</span>
          </div>
        </div>

        <div className="wellness-status-desc">NO ANALYSIS DATA</div>
        
        <div className="empty-warning-box">
          <ShieldAlert size={14} style={{ marginBottom: '4px', color: 'var(--text-muted)' }} />
          <div>Stress detection analysis is left empty per requirements.</div>
        </div>
      </div>

      <div className="sentiment-card">
        <div className="wellness-header">SENTIMENT BREAKDOWN</div>
        <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px' }}>
          BASED ON COMMENTS RECEIVED
        </div>

        <div className="sentiment-list">
          <div className="sentiment-row">
            <div className="sentiment-label-info">
              <span>Positive</span>
              <span>0%</span>
            </div>
            <div className="sentiment-bar-bg">
              <div className="sentiment-bar-fill positive-bar" style={{ width: '0%' }}></div>
            </div>
          </div>

          <div className="sentiment-row">
            <div className="sentiment-label-info">
              <span>Neutral</span>
              <span>0%</span>
            </div>
            <div className="sentiment-bar-bg">
              <div className="sentiment-bar-fill neutral-bar" style={{ width: '0%' }}></div>
            </div>
          </div>

          <div className="sentiment-row">
            <div className="sentiment-label-info">
              <span>Negative</span>
              <span>0%</span>
            </div>
            <div className="sentiment-bar-bg">
              <div className="sentiment-bar-fill negative-bar" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="empty-warning-box" style={{ marginTop: '16px' }}>
          Comment sentiment analysis is disabled.
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
