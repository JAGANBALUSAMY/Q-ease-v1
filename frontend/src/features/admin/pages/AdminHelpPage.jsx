import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import '../styles/AdminHelpPage.css';

const AdminHelpPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const helpCategories = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'queue-management', name: 'Queue Management', icon: '📋' },
    { id: 'user-management', name: 'User Management', icon: '👥' },
    { id: 'analytics', name: 'Analytics & Reports', icon: '📊' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' }
  ];

  const helpArticles = [
    {
      id: 1,
      title: 'Creating Your First Queue',
      category: 'getting-started',
      content: 'Learn how to set up your first service queue with proper configurations.',
      difficulty: 'beginner'
    },
    {
      id: 2,
      title: 'Managing Staff Assignments',
      category: 'user-management',
      content: 'How to assign and manage staff members to different queues.',
      difficulty: 'intermediate'
    },
    {
      id: 3,
      title: 'Understanding Analytics Dashboard',
      category: 'analytics',
      content: 'Guide to interpreting the analytics data and performance metrics.',
      difficulty: 'intermediate'
    },
    {
      id: 4,
      title: 'Queue Priority Settings',
      category: 'queue-management',
      content: 'Configure priority and emergency service options for your queues.',
      difficulty: 'advanced'
    },
    {
      id: 5,
      title: 'System Settings Configuration',
      category: 'settings',
      content: 'Customize system-wide settings and organization preferences.',
      difficulty: 'advanced'
    },
    {
      id: 6,
      title: 'Common Issues and Solutions',
      category: 'troubleshooting',
      content: 'Frequently encountered problems and their resolutions.',
      difficulty: 'beginner'
    }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return '#27ae60';
      case 'intermediate': return '#f39c12';
      case 'advanced': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="admin-help-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Help & Support</h1>
        <p>Find answers to your questions and learn how to use Q-Ease effectively</p>
      </div>

      <div className="help-content">
        {/* Search and Filter Section */}
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="category-filter">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">All Categories</option>
              {helpCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="categories-grid">
          {helpCategories.map(category => (
            <div 
              key={category.id}
              className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <h3>{category.name}</h3>
            </div>
          ))}
        </div>

        {/* Articles List */}
        <div className="articles-section">
          <h2>
            {selectedCategory === 'all' ? 'All Help Articles' : 
             helpCategories.find(c => c.id === selectedCategory)?.name}
            <span className="article-count">({filteredArticles.length} articles)</span>
          </h2>
          
          {filteredArticles.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">📚</div>
              <h3>No articles found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="articles-grid">
              {filteredArticles.map(article => (
                <div key={article.id} className="article-card">
                  <div className="article-header">
                    <h3>{article.title}</h3>
                    <span 
                      className="difficulty-tag"
                      style={{ backgroundColor: getDifficultyColor(article.difficulty) }}
                    >
                      {article.difficulty}
                    </span>
                  </div>
                  <p className="article-content">{article.content}</p>
                  <div className="article-footer">
                    <span className="category-badge">
                      {helpCategories.find(c => c.id === article.category)?.icon} 
                      {helpCategories.find(c => c.id === article.category)?.name}
                    </span>
                    <button className="read-more-button">
                      Read More →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support Section */}
        <div className="support-section">
          <div className="support-card">
            <h2>Need More Help?</h2>
            <p>Our support team is here to assist you with any questions or issues.</p>
            
            <div className="support-options">
              <div className="support-option">
                <span className="option-icon">📧</span>
                <div>
                  <h4>Email Support</h4>
                  <p>support@qease.com</p>
                </div>
              </div>
              
              <div className="support-option">
                <span className="option-icon">💬</span>
                <div>
                  <h4>Live Chat</h4>
                  <p>Available 24/7</p>
                </div>
              </div>
              
              <div className="support-option">
                <span className="option-icon">📞</span>
                <div>
                  <h4>Phone Support</h4>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
            
            <button className="contact-support-button">
              Contact Support Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHelpPage;