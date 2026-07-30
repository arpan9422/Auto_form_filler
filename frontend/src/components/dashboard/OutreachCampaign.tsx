import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Mail, CheckCircle, RefreshCcw, AlertTriangle, ArrowLeft, Play, LayoutList } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  _count?: { contacts: number };
}

interface Contact {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  website: string;
  companyContext?: string;
  draftSubject?: string;
  draftBody?: string;
  error?: string;
  status: string;
  lastContactedAt?: string | null;
}

export function OutreachCampaign() {
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  
  // Create view state
  const [campaignName, setCampaignName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ name: '', company: '', position: '', email: '', website: '' });
  
  // Details view state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const limit = 50;

  // Global state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (view === 'list') {
      fetchCampaigns();
    } else if (view === 'details' && selectedCampaignId) {
      fetchContacts(selectedCampaignId, 1, searchQuery, statusFilter);
    }
  }, [view, selectedCampaignId, statusFilter]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('fp_access_token');
      const res = await fetch('http://localhost:5000/api/outreach/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async (id: string, currentPage = page, currentSearch = searchQuery, currentStatus = statusFilter) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('fp_access_token');
      const res = await fetch(`http://localhost:5000/api/outreach/campaign/${id}/contacts?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}&status=${currentStatus}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContacts(data.contacts || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(data.pagination?.page || 1);
      if (currentPage === 1 && (currentSearch !== searchQuery || currentStatus !== statusFilter)) {
        setSelectedContactIds(new Set()); // Reset selection on new search/filter
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      
      const standardizedFile = new File([csvData], selectedFile.name.replace(/\.[^/.]+$/, "") + ".csv", { type: 'text/csv' });
      setFile(standardizedFile);
      
      if (!campaignName) {
        setCampaignName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }

      const lines = csvData.split(/\r?\n/);
      if (lines.length > 0) {
        let firstLine = lines[0];
        if (firstLine.charCodeAt(0) === 0xFEFF) firstLine = firstLine.slice(1);
        const headers = firstLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        setCsvHeaders(headers);

        setMapping({
          name: headers.find(h => /name/i.test(h)) || '',
          company: headers.find(h => /company|organization/i.test(h)) || '',
          position: headers.find(h => /position|title|role/i.test(h)) || '',
          email: headers.find(h => /email/i.test(h)) || '',
          website: headers.find(h => /website|url/i.test(h)) || ''
        });
      }
    }
  };

  const handleCreateCampaign = async () => {
    if (!file || !campaignName) {
      setErrorMsg("Please provide a name and select a CSV file.");
      return;
    }
    if (!mapping.name || !mapping.company || !mapping.email) {
      setErrorMsg("Please map at least Name, Company, and Email fields.");
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const token = localStorage.getItem('fp_access_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('name', campaignName);

      const response = await fetch('http://localhost:5000/api/outreach/campaign', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setSuccessMsg("Campaign created successfully!");
      setFile(null);
      setCampaignName('');
      setTimeout(() => {
        setSuccessMsg('');
        setView('list');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing campaign');
    } finally {
      setLoading(false);
    }
  };

  const toggleContactSelection = (id: string) => {
    const newSet = new Set(selectedContactIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedContactIds(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedContactIds.size === contacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(contacts.map(c => c.id)));
    }
  };

  const handleGenerateDrafts = async () => {
    if (selectedContactIds.size === 0 || !selectedCampaignId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('fp_access_token');
      const response = await fetch(`http://localhost:5000/api/outreach/campaign/${selectedCampaignId}/draft`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: Array.from(selectedContactIds) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSuccessMsg(`Drafts generated for ${data.contacts?.length || 0} contacts.`);
      await fetchContacts(selectedCampaignId);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (selectedContactIds.size === 0 || !selectedCampaignId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('fp_access_token');
      const response = await fetch('http://localhost:5000/api/outreach/dispatch', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: Array.from(selectedContactIds) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSuccessMsg(`Dispatched ${data.results?.length || 0} emails successfully.`);
      await fetchContacts(selectedCampaignId);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: "'Space Grotesk', sans-serif" }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: '#f0ece4', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail color="#d97706" /> Bulk Cold Outreach
          </h1>
          <p style={{ color: '#a09c94', marginTop: '8px' }}>Manage and execute personalized email campaigns.</p>
        </div>
        
        {view !== 'list' && (
          <button 
            onClick={() => setView('list')}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#f0ece4', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Campaigns
          </button>
        )}
      </header>

      {errorMsg && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#10b981', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {view === 'list' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#f0ece4' }}>Your Campaigns</h2>
            <button 
              onClick={() => setView('create')}
              style={{ padding: '10px 20px', background: '#d97706', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Upload size={16} /> New Campaign
            </button>
          </div>

          {loading ? (
            <div style={{ color: '#a09c94', textAlign: 'center', padding: '40px' }}><RefreshCcw className="animate-spin" style={{ margin: '0 auto' }} /></div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: '#a09c94' }}>
              <LayoutList size={48} style={{ opacity: 0.5, margin: '0 auto 16px auto' }} />
              <p>No campaigns found. Create one to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {campaigns.map(c => (
                <div key={c.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', color: '#f0ece4', margin: '0 0 4px 0' }}>{c.name}</h3>
                    <p style={{ color: '#a09c94', fontSize: '14px', margin: 0 }}>Created on {new Date(c.createdAt).toLocaleDateString()} • {c._count?.contacts || 0} Contacts</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedCampaignId(c.id); setView('details'); }}
                    style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#f0ece4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- CREATE VIEW --- */}
      {view === 'create' && (
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '20px', color: '#f0ece4', marginBottom: '20px' }}>Upload Contact List</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#a09c94', marginBottom: '8px', fontSize: '14px' }}>Campaign Name</label>
            <input 
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Q3 Startup Outreach"
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#f0ece4', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#a09c94', marginBottom: '8px', fontSize: '14px' }}>CSV File</label>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '6px', color: '#a09c94' }}
            />
          </div>

          {csvHeaders.length > 0 && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: '14px', color: '#a09c94', marginBottom: '12px' }}>Map CSV Columns:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                {Object.keys(mapping).map((field) => (
                  <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#f0ece4', textTransform: 'capitalize' }}>
                      {field} {['name', 'company', 'email'].includes(field) && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <select
                      value={(mapping as any)[field]}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                      style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#f0ece4', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                    >
                      <option value="">-- Ignore / Select --</option>
                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <button
              onClick={handleCreateCampaign}
              disabled={loading || !file}
              style={{ padding: '12px 24px', background: loading || !file ? '#4b5563' : '#d97706', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading || !file ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {loading ? <RefreshCcw className="animate-spin" size={16} /> : <Upload size={16} />}
              {loading ? 'Processing...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      )}

      {/* --- DETAILS VIEW --- */}
      {view === 'details' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#f0ece4', fontWeight: 600 }}>{selectedContactIds.size} rows selected</span>
              <button onClick={toggleAllSelection} style={{ background: 'transparent', border: '1px solid #d97706', color: '#d97706', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Select All</button>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleGenerateDrafts}
                disabled={loading || selectedContactIds.size === 0}
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#f0ece4', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: loading || selectedContactIds.size === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {loading ? <RefreshCcw className="animate-spin" size={14} /> : <Play size={14} />}
                Generate Drafts
              </button>
              <button
                onClick={handleDispatch}
                disabled={loading || selectedContactIds.size === 0}
                style={{ padding: '8px 16px', background: '#d97706', color: '#000', border: 'none', borderRadius: '6px', cursor: loading || selectedContactIds.size === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Mail size={14} /> Dispatch Emails
              </button>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
            {[
              { id: 'all', label: 'All Contacts' },
              { id: 'pending', label: 'Unsent' },
              { id: 'drafted', label: 'Drafted' },
              { id: 'sent', label: 'Sent' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: statusFilter === tab.id ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                  color: statusFilter === tab.id ? '#d97706' : '#a09c94',
                  border: `1px solid ${statusFilter === tab.id ? '#d97706' : 'transparent'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: statusFilter === tab.id ? 600 : 400,
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <input 
                type="text"
                placeholder="Search name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') fetchContacts(selectedCampaignId!, 1, searchQuery, statusFilter) }}
                style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#f0ece4', outline: 'none', width: '300px' }}
              />
              <button 
                onClick={() => fetchContacts(selectedCampaignId!, 1, searchQuery, statusFilter)}
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#f0ece4', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Search
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#a09c94', fontSize: '14px' }}>Page {page} of {totalPages}</span>
              <button 
                disabled={page <= 1 || loading}
                onClick={() => fetchContacts(selectedCampaignId!, page - 1, searchQuery, statusFilter)}
                style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: '#f0ece4', border: 'none', borderRadius: '6px', cursor: (page <= 1 || loading) ? 'not-allowed' : 'pointer' }}
              >
                Prev
              </button>
              <button 
                disabled={page >= totalPages || loading}
                onClick={() => fetchContacts(selectedCampaignId!, page + 1, searchQuery, statusFilter)}
                style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: '#f0ece4', border: 'none', borderRadius: '6px', cursor: (page >= totalPages || loading) ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#a09c94', fontSize: '14px' }}>
                  <th style={{ padding: '16px' }}>#</th>
                  <th style={{ padding: '16px' }}>Status</th>
                  <th style={{ padding: '16px' }}>Name</th>
                  <th style={{ padding: '16px' }}>Company</th>
                  <th style={{ padding: '16px' }}>Draft Subject</th>
                  <th style={{ padding: '16px' }}>Last Contacted</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr 
                    key={c.id} 
                    onClick={() => toggleContactSelection(c.id)}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)', 
                      color: '#f0ece4', 
                      fontSize: '14px', 
                      background: selectedContactIds.has(c.id) ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedContactIds.has(c.id)}
                        onChange={() => toggleContactSelection(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                        background: c.status === 'sent' ? 'rgba(16, 185, 129, 0.1)' : c.status === 'drafted' ? 'rgba(59, 130, 246, 0.1)' : c.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.1)',
                        color: c.status === 'sent' ? '#10b981' : c.status === 'drafted' ? '#3b82f6' : c.status === 'error' ? '#ef4444' : '#a09c94'
                      }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '16px' }}>{c.company}</td>
                    <td style={{ padding: '16px', color: '#a09c94', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.draftSubject || ''}>
                      {c.draftSubject || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#a09c94' }}>
                      {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#a09c94' }}>No contacts found in this campaign.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
