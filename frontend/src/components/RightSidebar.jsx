import React from 'react';
import { ShieldAlert } from 'lucide-react';
import './RightSidebar.css';

const RightSidebar = ({ analytics }) => {

  const loading = !analytics;

  // ==========================================================
  // LIVE VALUES
  // ==========================================================

  const stressScore =
    Number(
      analytics?.stress?.score ?? 0
    );

  const positive =
    Number(
      analytics?.sentiment?.positive ?? 0
    );

  const neutral =
    Number(
      analytics?.sentiment?.neutral ?? 0
    );

  const negative =
    Number(
      analytics?.sentiment?.negative ?? 0
    );

  const analyzedPosts =
    analytics?.stress?.analyzedPosts ?? 0;

  const totalComments =
    analytics?.sentiment?.totalComments ?? 0;

  // ==========================================================
  // CIRCULAR STRESS CHART
  // ==========================================================

  const radius = 50;

  const circumference =
    2 *
    Math.PI *
    radius;

  const safeStressScore =
    Math.min(
      Math.max(
        stressScore,
        0
      ),
      100
    );

  const strokeDashoffset =
    circumference *
    (
      1 -
      safeStressScore / 100
    );

  // ==========================================================
  // STRESS STATUS
  // ==========================================================

  let stressStatus =
    'NO ANALYSIS DATA';

  if (analyzedPosts > 0) {

    if (stressScore < 25) {

      stressStatus =
        'LOW STRESS';

    } else if (stressScore < 50) {

      stressStatus =
        'MODERATE STRESS';

    } else if (stressScore < 75) {

      stressStatus =
        'HIGH STRESS';

    } else {

      stressStatus =
        'VERY HIGH STRESS';

    }

  }

  return (

    <aside className="right-sidebar">

      {/* ================================================== */}
      {/* WELLNESS CARD */}
      {/* ================================================== */}

      <div className="wellness-card">

        <div className="wellness-header">
          YOUR WELLNESS
        </div>

        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-light)',
            alignSelf: 'flex-start',
            marginTop: '-12px'
          }}
        >
          AI POWERED INSIGHTS FROM YOUR THOUGHTS
        </div>

        <div className="circular-chart">

          <svg
            className="circular-chart-svg"
            viewBox="0 0 120 120"
          >

            <circle
              className="chart-bg"
              cx="60"
              cy="60"
              r={radius}
            />

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

            <span className="chart-num">

              {
                loading
                  ? '--'
                  : `${stressScore.toFixed(2)}%`
              }

            </span>

            <span className="chart-label">
              Stress
            </span>

          </div>

        </div>

        <div className="wellness-status-desc">

          {
            loading
              ? 'LOADING ANALYSIS...'
              : stressStatus
          }

        </div>

        {

          analyzedPosts === 0 &&
          !loading ? (

            <div className="empty-warning-box">

              <ShieldAlert
                size={14}
                style={{
                  marginBottom: '4px',
                  color: 'var(--text-muted)'
                }}
              />

              <div>

                Create posts to receive stress analysis.

              </div>

            </div>

          ) : (

            <div className="empty-warning-box">

              {

                loading
                  ? 'Loading analytics...'
                  : `Based on ${analyzedPosts} analyzed ${
                      analyzedPosts === 1
                        ? 'post'
                        : 'posts'
                    }.`

              }

            </div>

          )

        }

      </div>

      {/* ================================================== */}
      {/* SENTIMENT CARD */}
      {/* ================================================== */}

      <div className="sentiment-card">

        <div className="wellness-header">
          SENTIMENT BREAKDOWN
        </div>

        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-light)',
            marginTop: '2px'
          }}
        >
          BASED ON COMMENTS RECEIVED
        </div>

        <div className="sentiment-list">

          {/* Positive */}

          <div className="sentiment-row">

            <div className="sentiment-label-info">

              <span>
                Positive
              </span>

              <span>

                {
                  loading
                    ? '--'
                    : `${positive.toFixed(2)}%`
                }

              </span>

            </div>

            <div className="sentiment-bar-bg">

              <div
                className="sentiment-bar-fill positive-bar"
                style={{
                  width: `${positive}%`
                }}
              />

            </div>

          </div>

          {/* Neutral */}

          <div className="sentiment-row">

            <div className="sentiment-label-info">

              <span>
                Neutral
              </span>

              <span>

                {
                  loading
                    ? '--'
                    : `${neutral.toFixed(2)}%`
                }

              </span>

            </div>

            <div className="sentiment-bar-bg">

              <div
                className="sentiment-bar-fill neutral-bar"
                style={{
                  width: `${neutral}%`
                }}
              />

            </div>

          </div>

          {/* Negative */}

          <div className="sentiment-row">

            <div className="sentiment-label-info">

              <span>
                Negative
              </span>

              <span>

                {
                  loading
                    ? '--'
                    : `${negative.toFixed(2)}%`
                }

              </span>

            </div>

            <div className="sentiment-bar-bg">

              <div
                className="sentiment-bar-fill negative-bar"
                style={{
                  width: `${negative}%`
                }}
              />

            </div>

          </div>

        </div>

        <div
          className="empty-warning-box"
          style={{
            marginTop: '16px'
          }}
        >

          {

            loading
              ? 'Loading sentiment analysis...'

              : totalComments === 0

                ? 'No analyzed comments received yet.'

                : `Based on ${totalComments} analyzed ${
                    totalComments === 1
                      ? 'comment'
                      : 'comments'
                  }.`

          }

        </div>

      </div>

    </aside>

  );

};

export default RightSidebar;