import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import '../styles/OrganizationSearchPage.css';

const OrganizationSearchPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [organizations, setOrganizations] = useState([]);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/organisations');
            setOrganizations(response.data.data.organisations || []);
        } catch (err) {
            console.error('Error fetching organizations:', err);
            setError('Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            fetchOrganizations();
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/organisations/search?q=${encodeURIComponent(searchQuery)}`);
            setOrganizations(response.data.data.organisations || []);
        } catch (err) {
            console.error('Search error:', err);
            setError('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrgs = searchQuery
        ? organizations.filter(org =>
            org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.address?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : organizations;

    return (
        <div className="org-search-page">
            <div className="container">
                {/* Search Header */}
                <div className="search-header">
                    <h1>Find Organizations</h1>
                    <p>Browse and search for organizations with active queues</p>
                </div>

                {/* Search Bar */}
                <form className="search-section" onSubmit={handleSearch}>
                    <div className="search-bar-large">
                        <svg className="search-icon-large" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            className="search-input-large"
                            placeholder="Search by name, location, or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="clear-search"
                                onClick={() => {
                                    setSearchQuery('');
                                    fetchOrganizations();
                                }}
                            >
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg">
                        Search
                    </button>
                </form>

                {/* Results */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner spinner-primary"></div>
                        <p>Loading organizations...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3>{error}</h3>
                        <button className="btn btn-primary" onClick={fetchOrganizations}>
                            Try Again
                        </button>
                    </div>
                ) : filteredOrgs.length > 0 ? (
                    <>
                        <div className="results-header">
                            <h2>{filteredOrgs.length} Organizations Found</h2>
                        </div>
                        <div className="org-grid">
                            {filteredOrgs.map(org => (
                                <div
                                    key={org.id}
                                    className="org-card"
                                    onClick={() => navigate(`/org/${org.code || org.id}`)}
                                >
                                    <div className="org-card-header">
                                        <div className="org-icon">
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="org-info">
                                            <h3 className="org-name">{org.name}</h3>
                                            {org.code && (
                                                <span className="org-code">Code: {org.code}</span>
                                            )}
                                        </div>
                                    </div>

                                    {org.address && (
                                        <div className="org-detail">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{org.address}</span>
                                        </div>
                                    )}

                                    <div className="org-stats">
                                        <div className="stat">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{org._count?.queues || 0} Queues</span>
                                        </div>
                                        {org.isVerified && (
                                            <span className="badge badge-success">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Verified
                                            </span>
                                        )}
                                    </div>

                                    <button className="btn btn-primary btn-block">
                                        View Queues
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3>No Organizations Found</h3>
                        <p>Try adjusting your search or browse all organizations</p>
                        {searchQuery && (
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSearchQuery('');
                                    fetchOrganizations();
                                }}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizationSearchPage;
