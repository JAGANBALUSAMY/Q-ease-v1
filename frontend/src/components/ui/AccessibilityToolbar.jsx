import React, { useState, useEffect } from 'react';
import './AccessibilityToolbar.css';

const AccessibilityToolbar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedLargeText = localStorage.getItem('largeText') === 'true';
    const savedVoiceEnabled = localStorage.getItem('voiceEnabled') === 'true';
    
    setHighContrast(savedHighContrast);
    setLargeText(savedLargeText);
    setVoiceEnabled(savedVoiceEnabled);
    
    // Apply saved preferences
    if (savedHighContrast) document.body.classList.add('high-contrast');
    if (savedLargeText) document.body.classList.add('large-text');
  }, []);

  const toggleHighContrast = () => {
    const newHighContrast = !highContrast;
    setHighContrast(newHighContrast);
    localStorage.setItem('highContrast', newHighContrast);
    
    if (newHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    speak('High contrast mode ' + (newHighContrast ? 'enabled' : 'disabled'));
  };

  const toggleLargeText = () => {
    const newLargeText = !largeText;
    setLargeText(newLargeText);
    localStorage.setItem('largeText', newLargeText);
    
    if (newLargeText) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }
    
    speak('Large text ' + (newLargeText ? 'enabled' : 'disabled'));
  };

  const toggleVoice = () => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    localStorage.setItem('voiceEnabled', newVoiceEnabled);
    
    if (newVoiceEnabled) {
      speak('Voice announcements enabled');
    } else {
      speak('Voice announcements disabled');
    }
  };

  const speak = (text) => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const readPageContent = () => {
    if (!voiceEnabled) return;
    
    const mainContent = document.querySelector('main') || document.body;
    const textContent = mainContent.innerText || mainContent.textContent;
    speak(textContent.substring(0, 500) + '...'); // Limit to first 500 characters
  };

  return (
    <>
      <button 
        className={`accessibility-toggle ${isVisible ? 'visible' : ''}`}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Toggle accessibility toolbar"
      >
        <span className="icon">♿</span>
      </button>
      
      {isVisible && (
        <div className="accessibility-toolbar" role="toolbar" aria-label="Accessibility options">
          <div className="toolbar-header">
            <h3>Accessibility Options</h3>
            <button 
              className="close-button"
              onClick={() => setIsVisible(false)}
              aria-label="Close accessibility toolbar"
            >
              ×
            </button>
          </div>
          
          <div className="toolbar-options">
            <button 
              className={`option-button ${highContrast ? 'active' : ''}`}
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
            >
              <span className="option-icon">🎨</span>
              <span className="option-label">High Contrast</span>
            </button>
            
            <button 
              className={`option-button ${largeText ? 'active' : ''}`}
              onClick={toggleLargeText}
              aria-pressed={largeText}
            >
              <span className="option-icon">🔤</span>
              <span className="option-label">Large Text</span>
            </button>
            
            <button 
              className={`option-button ${voiceEnabled ? 'active' : ''}`}
              onClick={toggleVoice}
              aria-pressed={voiceEnabled}
            >
              <span className="option-icon">🔊</span>
              <span className="option-label">Voice Announcements</span>
            </button>
            
            {voiceEnabled && (
              <button 
                className="option-button"
                onClick={readPageContent}
              >
                <span className="option-icon">📖</span>
                <span className="option-label">Read Page</span>
              </button>
            )}
          </div>
          
          <div className="toolbar-footer">
            <p>Quick access to accessibility features</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilityToolbar;