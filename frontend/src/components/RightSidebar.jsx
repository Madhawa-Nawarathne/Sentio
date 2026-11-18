import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import './RightSidebar.css';

const TIMEFRAME_OPTIONS = [
  { value: '24h', label: '24hrs', ms: 24 * 60 * 60 * 1000 },
  { value: '7d', label: '7days', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: '1m', label: '1 month', ms: 30 * 24 * 60 * 60 * 1000 },
  { value: '1y', label: '1 year', ms: 365 * 24 * 60 * 60 * 1000 },
  { value: 'all', label: 'All time', ms: null }
];

const POST_LIMIT_OPTIONS = [
  { value: '1', label: '1 post' },
  { value: '5', label: '5 posts' },
  { value: '10', label: '10 posts' },
  { value: 'all', label: 'All posts' }
];

const getStressColor = (score, hasData) => {
  if (!hasData) {
    return '#cbd5e1';
  }
  if (score < 35) {
    return '#22c55e'; // Green
  }
  if (score < 65) {
    return '#eab308'; // Yellow
  }
  return '#f97316'; // Orange
};

const getStressStatus = (score, hasData) => {
  if (!hasData) {
    return 'NO ANALYSIS DATA';
  }
  if (score < 35) {
    return 'LOW STRESS';
  }
  if (score < 65) {
    return 'MODERATE STRESS';
  }
  return 'HIGH STRESS';
};

const RightSidebar = ({ analytics: externalAnalytics }) => {
  const { token } = useAuth();
  const [internalAnalytics, setInternalAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  const [commentPostScope, setCommentPostScope] = useState('all');

  useEffect(() => {
    if (externalAnalytics !== undefined || !token) {
      return;
    }

    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/summary', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok && isMounted) {
          const data = await response.json();
          setInternalAnalytics(data);
        }
      } catch (err) {
        console.error('Error loading sidebar analytics:', err);
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [externalAnalytics, token]);

  const analytics = externalAnalytics ?? internalAnalytics;
  const loading = !analytics;

  // ==========================================================
  // FILTER POSTS BY TIMEFRAME (ONLY POST STRESS VALUES)
  // ==========================================================

  const { filteredPosts, averageStress, hasStressData } = useMemo(() => {
    const rawPosts = Array.isArray(analytics?.posts) ? analytics.posts : [];

    const validStressPosts = rawPosts
      .map((p) => {
        const score = Number(p.postStressScore ?? p.stressScore);
        const timestamp = p.createdAt ? new Date(p.createdAt).getTime() : null;
        return {
          ...p,
          numericScore: Number.isFinite(score) ? score : null,
          timestamp: Number.isFinite(timestamp) ? timestamp : null
        };
      })
      .filter((p) => p.numericScore !== null);

    const selectedOption = TIMEFRAME_OPTIONS.find((opt) => opt.value === timeframe);

    let scoped = validStressPosts;
    if (selectedOption?.ms) {
      const latestPostTime = validStressPosts.reduce(
        (max, p) => (p.timestamp && p.timestamp > max ? p.timestamp : max),
        0
      );
      const referenceNow = Math.max(Date.now(), latestPostTime);
      const cutoff = referenceNow - selectedOption.ms;

      scoped = validStressPosts.filter(
        (p) => p.timestamp === null || p.timestamp >= cutoff
      );
    }

    // Sort chronologically (oldest -> newest) for the line graph
    const chronological = [...scoped].sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
    );

    if (chronological.length === 0) {
      // Fallback if backend returned overall stress without posts array
      if (
        timeframe === 'all' &&
        rawPosts.length === 0 &&
        Number.isFinite(Number(analytics?.stress?.score)) &&
        (analytics?.stress?.analyzedPosts ?? 0) > 0
      ) {
        const fallbackScore = Number(analytics.stress.score);
        return {
          filteredPosts: [{ numericScore: fallbackScore, timestamp: Date.now() }],
          averageStress: fallbackScore,
          hasStressData: true
        };
      }

      return {
        filteredPosts: [],
        averageStress: 0,
        hasStressData: false
      };
    }

    const sum = chronological.reduce((acc, p) => acc + p.numericScore, 0);
    const avg = Number((sum / chronological.length).toFixed(2));

    return {
      filteredPosts: chronological,
      averageStress: avg,
      hasStressData: true
    };
  }, [analytics, timeframe]);

  const safeStressScore = Math.min(Math.max(averageStress, 0), 100);
  const stressColor = getStressColor(safeStressScore, hasStressData && !loading);
  const stressStatus = getStressStatus(safeStressScore, hasStressData && !loading);

  // ==========================================================
  // DIGITAL SPEEDOMETER GAUGE GEOMETRY (240° ARC, NO POINTER)
  // ==========================================================

  const gaugeRadius = 58;
  const fullCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeArcSpan = 240 / 360; // 240-degree speedometer sweep
  const arcLength = fullCircumference * gaugeArcSpan;
  const filledArcLength = arcLength * (hasStressData && !loading ? safeStressScore / 100 : 0);

  // ==========================================================
  // LINE GRAPH GEOMETRY (STRESS OVER TIME)
  // ==========================================================

  const chartWidth = 240;
  const chartHeight = 76;
  const padX = 10;
  const padY = 10;
  const plotWidth = chartWidth - padX * 2;
  const plotHeight = chartHeight - padY * 2;

  const linePoints = useMemo(() => {
    if (!hasStressData || filteredPosts.length === 0) {
      return [];
    }

    if (filteredPosts.length === 1) {
      const y = padY + plotHeight * (1 - Math.min(Math.max(filteredPosts[0].numericScore, 0), 100) / 100);
      return [
        { x: padX, y, score: filteredPosts[0].numericScore, timestamp: filteredPosts[0].timestamp, isVirtual: true },
        { x: padX + plotWidth / 2, y, score: filteredPosts[0].numericScore, timestamp: filteredPosts[0].timestamp, isVirtual: false },
        { x: padX + plotWidth, y, score: filteredPosts[0].numericScore, timestamp: filteredPosts[0].timestamp, isVirtual: true }
      ];
    }

    return filteredPosts.map((p, index) => {
      const x = padX + (index / (filteredPosts.length - 1)) * plotWidth;
      const clamped = Math.min(Math.max(p.numericScore, 0), 100);
      const y = padY + plotHeight * (1 - clamped / 100);
      return {
        x,
        y,
        score: p.numericScore,
        timestamp: p.timestamp,
        isVirtual: false
      };
    });
  }, [filteredPosts, hasStressData, plotWidth, plotHeight]);

  const polylinePoints = linePoints.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  const areaPath =
    linePoints.length >= 2
      ? `M ${linePoints[0].x.toFixed(1)} ${(padY + plotHeight).toFixed(1)} ` +
        linePoints.map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ') +
        ` L ${linePoints[linePoints.length - 1].x.toFixed(1)} ${(padY + plotHeight).toFixed(1)} Z`
      : '';

  // ==========================================================
  // FILTER COMMENT SENTIMENT BY POST SCOPE (1, 5, 10, ALL)
  // ==========================================================

  const { positive, neutral, negative } = useMemo(() => {
    const rawPosts = Array.isArray(analytics?.posts) ? analytics.posts : [];

    // Ensure posts are ordered newest-first for selecting latest 1, 5, 10 posts
    const sortedNewestFirst = [...rawPosts].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    const hasPerPostSentiment = sortedNewestFirst.some((p) => p.sentimentCounts);

    if (!hasPerPostSentiment || (commentPostScope === 'all' && sortedNewestFirst.length === 0)) {
      return {
        positive: Number(analytics?.sentiment?.positive ?? 0),
        neutral: Number(analytics?.sentiment?.neutral ?? 0),
        negative: Number(analytics?.sentiment?.negative ?? 0)
      };
    }

    const scopedPosts =
      commentPostScope === 'all'
        ? sortedNewestFirst
        : sortedNewestFirst.slice(0, Number(commentPostScope));

    const counts = scopedPosts.reduce(
      (acc, p) => {
        acc.positive += Number(p.sentimentCounts?.positive ?? 0);
        acc.neutral += Number(p.sentimentCounts?.neutral ?? 0);
        acc.negative += Number(p.sentimentCounts?.negative ?? 0);
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    const total = counts.positive + counts.neutral + counts.negative;
    if (total === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    return {
      positive: Number(((counts.positive / total) * 100).toFixed(2)),
      neutral: Number(((counts.neutral / total) * 100).toFixed(2)),
      negative: Number(((counts.negative / total) * 100).toFixed(2))
    };
  }, [analytics, commentPostScope]);

  return (
    <aside className="right-sidebar">
      {/* ================================================== */}
      {/* WELLNESS CARD (POST STRESS SPEEDOMETER & LINE CHART) */}
      {/* ================================================== */}

      <div className="wellness-card">
        <div className="sidebar-card-top-row">
          <div>
            <div className="wellness-header">YOUR WELLNESS</div>
            <div className="wellness-subtitle">POST STRESS INSIGHTS</div>
          </div>

          <select
            className="sidebar-scope-select"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            aria-label="Select stress timeframe"
          >
            {TIMEFRAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* DIGITAL SPEEDOMETER GAUGE (NO POINTER) */}
        <div className="speedometer-gauge">
          <svg className="speedometer-svg" viewBox="0 0 150 122">
            {/* Background Track Arc */}
            <circle
              className="speedometer-track"
              cx="75"
              cy="74"
              r={gaugeRadius}
              strokeDasharray={`${arcLength} ${fullCircumference}`}
              transform="rotate(150 75 74)"
            />

            {/* Active Color-Coded Digital Speedometer Arc */}
            <circle
              className="speedometer-fill"
              cx="75"
              cy="74"
              r={gaugeRadius}
              stroke={stressColor}
              strokeDasharray={`${filledArcLength} ${fullCircumference}`}
              transform="rotate(150 75 74)"
              style={{
                filter: hasStressData && !loading ? `drop-shadow(0 0 5px ${stressColor}55)` : 'none'
              }}
            />

            {/* Scale Endpoint Labels */}
            <text x="26" y="114" className="speedometer-scale-text">0</text>
            <text x="115" y="114" className="speedometer-scale-text">100</text>
          </svg>

          <div className="speedometer-readout">
            <span
              className="speedometer-num"
              style={{ color: hasStressData && !loading ? stressColor : 'var(--text-muted)' }}
            >
              {loading ? '--' : `${safeStressScore.toFixed(1)}%`}
            </span>
            <span className="speedometer-unit">AVG STRESS</span>
          </div>
        </div>

        <div
          className="wellness-status-desc"
          style={{ color: hasStressData && !loading ? stressColor : 'var(--text-muted)' }}
        >
          {loading ? 'LOADING ANALYSIS...' : stressStatus}
        </div>

        {/* STRESS OVER TIME LINE GRAPH */}
        <div className="stress-line-chart-box">
          <div className="stress-line-chart-header">
            <span>STRESS OVER TIME</span>
            <span>
              {TIMEFRAME_OPTIONS.find((o) => o.value === timeframe)?.label}
            </span>
          </div>

          <svg
            className="stress-line-chart-svg"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="stressAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stressColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor={stressColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Grid Lines (100%, 50%, 0%) */}
            <line
              x1={padX}
              y1={padY}
              x2={chartWidth - padX}
              y2={padY}
              className="chart-grid-line"
            />
            <line
              x1={padX}
              y1={padY + plotHeight / 2}
              x2={chartWidth - padX}
              y2={padY + plotHeight / 2}
              className="chart-grid-line"
            />
            <line
              x1={padX}
              y1={padY + plotHeight}
              x2={chartWidth - padX}
              y2={padY + plotHeight}
              className="chart-grid-line"
            />

            {hasStressData && !loading && linePoints.length >= 2 && (
              <>
                <path d={areaPath} fill="url(#stressAreaGrad)" />
                <polyline
                  fill="none"
                  stroke={stressColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />
                {linePoints
                  .filter((pt) => !pt.isVirtual)
                  .map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="3"
                      fill="#ffffff"
                      stroke={stressColor}
                      strokeWidth="2"
                    >
                      <title>{`${pt.score.toFixed(2)}%`}</title>
                    </circle>
                  ))}
              </>
            )}
          </svg>

          {!loading && !hasStressData && (
            <div className="chart-empty-overlay">No posts in this timeframe</div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* SENTIMENT CARD (COMMENTS BREAKDOWN) */}
      {/* ================================================== */}

      <div className="sentiment-card">
        <div className="sidebar-card-top-row">
          <div>
            <div className="wellness-header">SENTIMENT BREAKDOWN</div>
            <div className="wellness-subtitle">COMMENTS RECEIVED</div>
          </div>

          <select
            className="sidebar-scope-select"
            value={commentPostScope}
            onChange={(e) => setCommentPostScope(e.target.value)}
            aria-label="Select post count for comment sentiment"
          >
            {POST_LIMIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sentiment-list">
          {/* Positive */}
          <div className="sentiment-row">
            <div className="sentiment-label-info">
              <span>Positive</span>
              <span>{loading ? '--' : `${positive.toFixed(2)}%`}</span>
            </div>
            <div className="sentiment-bar-bg">
              <div
                className="sentiment-bar-fill positive-bar"
                style={{ width: `${positive}%` }}
              />
            </div>
          </div>

          {/* Neutral */}
          <div className="sentiment-row">
            <div className="sentiment-label-info">
              <span>Neutral</span>
              <span>{loading ? '--' : `${neutral.toFixed(2)}%`}</span>
            </div>
            <div className="sentiment-bar-bg">
              <div
                className="sentiment-bar-fill neutral-bar"
                style={{ width: `${neutral}%` }}
              />
            </div>
          </div>

          {/* Negative */}
          <div className="sentiment-row">
            <div className="sentiment-label-info">
              <span>Negative</span>
              <span>{loading ? '--' : `${negative.toFixed(2)}%`}</span>
            </div>
            <div className="sentiment-bar-bg">
              <div
                className="sentiment-bar-fill negative-bar"
                style={{ width: `${negative}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
