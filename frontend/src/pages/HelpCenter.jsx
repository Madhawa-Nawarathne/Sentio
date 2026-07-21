import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import { Mail, Phone, ExternalLink, HelpCircle, HeartHandshake, ShieldAlert, ArrowLeft, X } from 'lucide-react';
import './HelpCenter.css';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [confirmCallHelpline, setConfirmCallHelpline] = useState(null);

  const helplines = [
    {
      name: "Sumithrayo",
      tag: "24/7 Support",
      tagClass: "",
      sub: "Emotional Support & Suicide Prevention",
      displayNumber: "011 2682535",
      tel: "+94112682535"
    },
    {
      name: "NIMH Helpline",
      tag: "Government",
      tagClass: "govt",
      sub: "National Institute of Mental Health",
      displayNumber: "1926",
      tel: "1926"
    },
    {
      name: "CCC Line",
      tag: "Toll Free",
      tagClass: "free",
      sub: "Courage Compassion Commitment Counselling",
      displayNumber: "1333",
      tel: "1333"
    },
    {
      name: "Shanthi Maargam",
      tag: "Youth Line",
      tagClass: "youth",
      sub: "Safe Space & Youth Counselling",
      displayNumber: "0717 639 898",
      tel: "+94717639898"
    }
  ];

  const handleHelplineClick = (helpline) => {
    setConfirmCallHelpline(helpline);
  };

  const handleProceedCall = () => {
    if (confirmCallHelpline) {
      window.location.href = `tel:${confirmCallHelpline.tel}`;
      setConfirmCallHelpline(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="page-header help-header">
          <button className="back-btn" onClick={() => navigate('/settings')}>
            <ArrowLeft size={20} />
          </button>
          <h2>Help Center</h2>
        </div>

        <div className="feed-container help-container">
          <div className="help-hero">
            <div className="help-hero-icon">
              <HelpCircle size={36} />
            </div>
            <h3>How can we help you today?</h3>
            <p>We are here to assist you with support needs, emergency helplines, or inquiries.</p>
          </div>

          {/* Quick Helplines Card */}
          <div className="help-card crisis-card">
            <div className="help-card-header alert-header">
              <ShieldAlert size={20} className="alert-icon" />
              <div>
                <h4>Sri Lanka Mental Health Quick Helplines</h4>
                <p>If you or a loved one needs immediate emotional support or counselling, call these free confidential lines.</p>
              </div>
            </div>

            <div className="helpline-grid">
              {helplines.map((item, idx) => (
                <div key={idx} className="helpline-item">
                  <div className="helpline-top">
                    <span className="helpline-title">{item.name}</span>
                    <span className={`helpline-tag ${item.tagClass}`}>{item.tag}</span>
                  </div>
                  <div className="helpline-sub">{item.sub}</div>
                  <button
                    type="button"
                    className="helpline-link-btn"
                    onClick={() => handleHelplineClick(item)}
                  >
                    <Phone size={15} /> {item.displayNumber}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div className="help-card contact-card">
            <div className="help-card-header">
              <HeartHandshake size={22} className="card-icon" />
              <div>
                <h4>Contact Support</h4>
                <p>Reach out directly to our support team for inquiries or assistance.</p>
              </div>
            </div>
            <div className="contact-box">
              <p>Click below to compose an email directly to our support team:</p>
              <a
                href="mailto:mnawarathne60@gmail.com?subject=Sentio User Inquiry &body=Hello Sentio Support Team,%0D%0A%0D%0AI need help with: "
                className="email-contact-btn"
              >
                <Mail size={18} />
                <span>mnawarathne60@gmail.com</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </main>

      <RightSidebar />

      {/* Confirmation Modal */}
      {confirmCallHelpline && (
        <div className="modal-overlay" onClick={() => setConfirmCallHelpline(null)}>
          <div className="modal-content call-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Phone size={20} className="modal-title-icon" />
                <h3>Confirm Phone Call</h3>
              </div>
              <button onClick={() => setConfirmCallHelpline(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                Are you sure you want to dial <strong>{confirmCallHelpline.name}</strong> at <strong>{confirmCallHelpline.displayNumber}</strong>?
              </p>
              <div className="helpline-modal-badge">
                <span>{confirmCallHelpline.sub}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setConfirmCallHelpline(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-call"
                onClick={handleProceedCall}
              >
                <Phone size={15} /> Call Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpCenter;
