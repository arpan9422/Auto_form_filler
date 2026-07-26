'use client';

import { useEffect, useState } from 'react';
import { llmGatewayApi, GatewayProvider, GatewayConfig, GatewayTestResponse } from '@/lib/services';
import { Cpu, Zap, Key, Globe, Sliders, CheckCircle2, AlertCircle, Eye, EyeOff, Save, RefreshCw, ShieldCheck, Sparkles, Server, Lock, ExternalLink } from 'lucide-react';

export function LLMGateway() {
  const [providers, setProviders] = useState<GatewayProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form State
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama');
  const [model, setModel] = useState<string>('gpt-oss:120b-cloud');
  const [apiKey, setApiKey] = useState<string>('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [baseURL, setBaseURL] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [showApiKey, setShowApiKey] = useState(false);

  // Feedback State
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<GatewayTestResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        setLoading(true);
        const [provRes, confRes] = await Promise.all([
          llmGatewayApi.getProviders(),
          llmGatewayApi.getConfig(),
        ]);

        if (!mounted) return;

        const provData = provRes.data;
        const confData = confRes.data;

        if (provData && provData.providers && provData.providers.length > 0) {
          setProviders(provData.providers);
        }

        if (confData) {
          setSelectedProvider(confData.provider || 'ollama');
          setModel(confData.model || 'gpt-oss:120b-cloud');
          setApiKey(confData.apiKey || '');
          setHasStoredKey(!!confData.hasKey || (confData.apiKey && confData.apiKey !== '') || false);
          setBaseURL(confData.baseURL || '');
          setTemperature(confData.temperature ?? 0.2);
        }
      } catch (err: any) {
        if (mounted) setErrorMessage(err.message || 'Failed to load LLM Gateway configuration.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const currentProviderData = providers.find(p => p.id === selectedProvider) || {
    id: selectedProvider,
    name: selectedProvider.toUpperCase(),
    description: 'Custom AI Inference Engine',
    color: '#3b82f6',
    requiresApiKey: true,
    defaultBaseURL: '',
    models: [],
  };

  const handleProviderChange = (newId: string) => {
    setSelectedProvider(newId);
    setTestResult(null);
    setSaveSuccess(null);
    const found = providers.find(p => p.id === newId);
    if (found && found.models && found.models.length > 0) {
      setModel(found.models[0].id);
    } else {
      setModel('');
    }
    if (found && found.defaultBaseURL) {
      setBaseURL(found.defaultBaseURL);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);
    try {
      const payload: Partial<GatewayConfig> = {
        provider: selectedProvider,
        model: model.trim(),
        apiKey: apiKey,
        baseURL: baseURL.trim(),
        temperature: temperature,
      };
      const res = (await llmGatewayApi.updateConfig(payload)).data;
      setSaveSuccess(res.message || 'LLM Gateway configuration securely stored in Postgres DB!');
      if (res.config) {
        setApiKey(res.config.apiKey || '');
        setHasStoredKey(res.config.hasKey || !!res.config.apiKey);
      }
      setTimeout(() => setSaveSuccess(null), 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      const payload: Partial<GatewayConfig> = {
        provider: selectedProvider,
        model: model.trim(),
        apiKey: apiKey,
        baseURL: baseURL.trim(),
        temperature: temperature,
      };
      const result = (await llmGatewayApi.testConnection(payload)).data;
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: err.latencyMs || 0,
        provider: selectedProvider,
        model: model,
        error: err.error || err.message || 'Failed to verify live connection to model provider.',
      });
    } finally {
      setTesting(false);
    }
  };

  const getKeyAcquisitionLink = (id: string) => {
    switch (id) {
      case 'openai': return 'https://platform.openai.com/api-keys';
      case 'gemini': return 'https://aistudio.google.com/app/apikey';
      case 'groq': return 'https://console.groq.com/keys';
      case 'openrouter': return 'https://openrouter.ai/keys';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '400px', display: 'grid', placeItems: 'center', background: '#09090b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#3b82f6', margin: '0 auto 12px auto' }} />
          <p style={{ color: '#a1a1aa', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', margin: 0 }}>Initializing Universal LLM Gateway...</p>
        </div>
      </div>
    );
  }

  const keyLink = getKeyAcquisitionLink(selectedProvider);

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      color: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1000px',
      margin: '0 auto',
      paddingBottom: '40px',
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(59,130,246,0.08) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 36px -8px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: 'rgba(59,130,246,0.15)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.3)', display: 'flex' }}>
                <Cpu size={24} color="#3b82f6" />
              </div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Universal LLM Gateway
              </h1>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', maxWidth: '640px', lineHeight: '1.6' }}>
              Switch AI foundation models across your FormPilot workspace instantly. Select high-reasoning cloud hyperscalers or private local Ollama clusters without altering code.
            </p>
          </div>

          {/* Active Security & Status Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '999px', padding: '6px 14px', fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
              <ShieldCheck size={14} />
              Zero-XSS Secure Database Vault
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', fontFamily: "'DM Mono', monospace" }}>
              Active Provider: <strong style={{ color: currentProviderData.color }}>{currentProviderData.name}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {errorMessage && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
          <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', animation: 'fadeIn 0.2s ease' }}>
          <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Provider Selection Grid */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color="#38bdf8" />
          1. Choose AI Inference Provider
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
          {providers.map(p => {
            const isSelected = p.id === selectedProvider;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderChange(p.id)}
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(18,18,21,0.7)',
                  border: isSelected ? `2px solid ${p.color}` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? `0 8px 24px -6px ${p.color}33` : '0 4px 12px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: `radial-gradient(circle at 100% 0%, ${p.color}66 0%, transparent 70%)` }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.color, boxShadow: isSelected ? `0 0 10px ${p.color}` : 'none' }} />
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#ffffff' }}>{p.name}</span>
                  </div>
                  {isSelected && <Sparkles size={16} color={p.color} />}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                  {p.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', background: p.requiresApiKey ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: p.requiresApiKey ? '#fca5a5' : '#86efac', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, border: `1px solid ${p.requiresApiKey ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
                    {p.requiresApiKey ? '🔑 Key Required' : '🏠 Local / No Key'}
                  </span>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', padding: '3px 8px', borderRadius: '6px' }}>
                    {p.models.length} Models
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selection & Parameters Section */}
      <div style={{
        background: 'rgba(18,18,22,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '26px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color={currentProviderData.color} />
            2. Configure Model & Architecture
          </h2>
          <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
            Select one of our benchmarked recommended models for {currentProviderData.name}, or type any custom model identifier.
          </p>
        </div>

        {/* Recommended Pill Badges */}
        {currentProviderData.models.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {currentProviderData.models.map(m => {
              const isSelectedModel = model === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  style={{
                    background: isSelectedModel ? `${currentProviderData.color}25` : 'rgba(255,255,255,0.04)',
                    border: isSelectedModel ? `1px solid ${currentProviderData.color}` : '1px solid rgba(255,255,255,0.08)',
                    color: isSelectedModel ? '#ffffff' : '#a1a1aa',
                    padding: '8px 14px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: isSelectedModel ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelectedModel ? `0 0 12px ${currentProviderData.color}22` : 'none',
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Model ID Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
            Active Model Identifier
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gpt-4o-mini, gemini-2.5-flash, llama-3.3-70b"
            style={{
              width: '100%',
              background: 'rgba(9,9,11,0.8)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              fontFamily: "'DM Mono', monospace",
            }}
          />
        </div>

        {/* API Key Vault Input (With XSS DB Protection emphasis) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={15} color="#a855f7" />
              API Key Vault
              {hasStoredKey && (
                <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '999px', fontWeight: 600, marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={10} /> Saved in Database
                </span>
              )}
            </label>

            {keyLink && (
              <a href={keyLink} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Get API Key for {currentProviderData.name} <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasStoredKey ? "•••••••• (Key encrypted & stored in database)" : "Paste your API key here (sk-...)"}
              style={{
                width: '100%',
                background: 'rgba(9,9,11,0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                padding: '12px 42px 12px 16px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                fontFamily: "'DM Mono', monospace",
              }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            To prevent browser XSS vulnerabilities, your API key is transmitted directly via TLS to Postgres and never cached in plain text in localStorage.
          </p>
        </div>

        {/* Advanced Endpoint & Temperature Setup */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={15} color="#38bdf8" />
              Custom Base URL (Optional)
            </label>
            <input
              type="text"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder={currentProviderData.defaultBaseURL || "https://api.openai.com/v1"}
              style={{
                width: '100%',
                background: 'rgba(9,9,11,0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                fontFamily: "'DM Mono', monospace",
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={15} color="#f59e0b" />
                Temperature: <strong style={{ color: '#f59e0b' }}>{temperature}</strong>
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{temperature < 0.4 ? 'Precise / Deterministic' : 'Creative / Exploratory'}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b', marginTop: '6px' }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || saving}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#e2e8f0',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (testing || saving) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            {testing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} color="#fbbf24" />}
            {testing ? 'Verifying Connection...' : 'Test Connection & Latency'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || testing}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '12px 26px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: (saving || testing) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px -4px rgba(59,130,246,0.6)',
              transition: 'all 0.15s ease',
            }}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save AI Configuration'}
          </button>
        </div>
      </div>

      {/* Real-time Test Diagnostics Result Card */}
      {testResult && (
        <div style={{
          background: testResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: testResult.success ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          animation: 'fadeIn 0.2s ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {testResult.success ? (
                <CheckCircle2 size={22} color="#10b981" />
              ) : (
                <AlertCircle size={22} color="#ef4444" />
              )}
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: testResult.success ? '#34d399' : '#f87171' }}>
                {testResult.success ? 'Gateway Verified Connected!' : 'Connection Diagnostics Failed'}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: '999px', fontFamily: "'DM Mono', monospace", color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                ⚡ Latency: <strong>{testResult.latencyMs}ms</strong>
              </span>
              <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: '999px', color: '#e2e8f0' }}>
                Model: <strong>{testResult.model}</strong>
              </span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
            {testResult.message || testResult.error}
          </p>

          {!!testResult.rawResponse && (
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#86efac' }}>
              <span style={{ color: '#64748b' }}>Model Response Acknowledgment: </span>
              {String(testResult.rawResponse)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
