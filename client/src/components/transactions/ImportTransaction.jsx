import { useState } from 'react';
import { addTransaction } from '../../services/api';

export default function ImportTransactions({ onImportDone }) {
  var [preview, setPreview] = useState([]);
  var [importing, setImporting] = useState(false);
  var [status, setStatus] = useState('');
  var [fileName, setFileName] = useState('');

  function parseCSV(text) {
    var lines = text.trim().split('\n');
    var results = [];

    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      var cols = line.split(',');

      var description = (cols[1] || cols[0] || 'UPI Transaction').replace(/"/g, '').trim();
      var amountRaw = (cols[2] || cols[3] || '0').replace(/"/g, '').replace(/[^0-9.-]/g, '').trim();
      var amount = parseFloat(amountRaw);
      if (isNaN(amount)) amount = 0;
      var type = amount < 0 ? 'expense' : 'income';
      if (amount < 0) amount = Math.abs(amount);

      var category = 'General';
      var desc = description.toLowerCase();
      if (desc.match(/food|zomato|swiggy|restaurant|cafe|lunch|dinner|breakfast/)) category = 'Food';
      else if (desc.match(/uber|ola|petrol|metro|bus|auto|cab|travel/)) category = 'Transport';
      else if (desc.match(/netflix|spotify|amazon|hotstar|subscription/)) category = 'Entertainment';
      else if (desc.match(/electricity|wifi|internet|mobile|recharge|bill/)) category = 'Utilities';
      else if (desc.match(/doctor|medicine|hospital|pharmacy|health/)) category = 'Health';
      else if (desc.match(/shopping|amazon|flipkart|clothes|shoes/)) category = 'Shopping';
      else if (desc.match(/salary|credited|received|income/)) { category = 'Income'; type = 'income'; }

      if (amount > 0) {
        results.push({ description: description, amount: amount, type: type, category: category });
      }
    }
    return results;
  }

  function handleFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus('');

    var reader = new FileReader();
    reader.onload = function(event) {
      var text = event.target.result;
      var parsed = parseCSV(text);
      setPreview(parsed);
      if (parsed.length === 0) {
        setStatus('no_data');
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setImporting(true);
    setStatus('');
    var success = 0;
    var failed = 0;

    for (var i = 0; i < preview.length; i++) {
      try {
        await addTransaction(preview[i]);
        success++;
      } catch (err) {
        failed++;
      }
    }

    setImporting(false);
    setStatus('done');
    setPreview([]);
    setFileName('');
    if (onImportDone) onImportDone();
  }

  function handleTypeChange(index, newType) {
    var updated = [...preview];
    updated[index].type = newType;
    setPreview(updated);
  }

  function handleCategoryChange(index, newCat) {
    var updated = [...preview];
    updated[index].category = newCat;
    setPreview(updated);
  }

  function handleRemove(index) {
    var updated = preview.filter(function(_, i) { return i !== index; });
    setPreview(updated);
  }

  var categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Shopping', 'Housing', 'Education', 'Income', 'General'];

  return (
    <div style={{ padding: '0.5rem', color: '#fff' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontSize: 'clamp(18px, 4vw, 24px)' }}>
        Import Transactions
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '14px' }}>
        Export CSV from GPay / PhonePe / Paytm and upload here — all transactions will be added automatically!
      </p>

      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(14px, 3vw, 18px)' }}>
          Upload CSV File
        </h3>

        <label style={{
          display: 'block',
          padding: '2rem',
          border: '2px dashed #334155',
          borderRadius: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: '#0f172a'
        }}>
          <p style={{ color: '#94a3b8', margin: '0 0 0.5rem', fontSize: '32px' }}>📂</p>
          <p style={{ color: '#94a3b8', margin: '0 0 0.5rem', fontSize: '14px' }}>
            {fileName ? fileName : 'Click to select CSV file'}
          </p>
          <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
            Supports GPay, PhonePe, Paytm CSV
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </label>

        {status === 'no_data' && (
          <p style={{ color: '#f87171', marginTop: '1rem', fontSize: '13px', textAlign: 'center' }}>
            No valid transactions found in this file. Please check the CSV format.
          </p>
        )}

        {status === 'done' && (
          <p style={{ color: '#4ade80', marginTop: '1rem', fontSize: '13px', textAlign: 'center' }}>
            All transactions imported successfully!
          </p>
        )}
      </div>

      {preview.length > 0 && (
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: 'clamp(14px, 3vw, 18px)' }}>
              Preview — {preview.length} Transactions Found
            </h3>
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: importing ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              {importing ? 'Importing...' : 'Import All (' + preview.length + ')'}
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {preview.map(function(t, i) {
              return (
                <div key={i} style={{
                  background: '#0f172a',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13px', flex: 1 }}>{t.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: t.type === 'income' ? '#4ade80' : '#f87171', fontWeight: '600', fontSize: '14px' }}>
                        Rs.{t.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={function() { handleRemove(i); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                      value={t.type}
                      onChange={function(e) { handleTypeChange(i, e.target.value); }}
                      style={{
                        padding: '0.3rem 0.5rem',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <select
                      value={t.category}
                      onChange={function(e) { handleCategoryChange(i, e.target.value); }}
                      style={{
                        padding: '0.3rem 0.5rem',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    >
                      {categories.map(function(c) {
                        return <option key={c} value={c}>{c}</option>;
                      })}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}