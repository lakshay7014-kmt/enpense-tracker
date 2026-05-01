import { useState } from 'react';
import { addTransaction } from '../../services/api';

export default function ImportTransactions({ onImportDone }) {
  var [preview, setPreview] = useState([]);
  var [importing, setImporting] = useState(false);
  var [status, setStatus] = useState('');
  var [fileName, setFileName] = useState('');
  var [fileType, setFileType] = useState('');

  function detectCategory(desc) {
    var d = desc.toLowerCase();
    if (d.match(/food|zomato|swiggy|restaurant|cafe|lunch|dinner|breakfast|pizza|burger/)) return 'Food';
    if (d.match(/uber|ola|petrol|metro|bus|auto|cab|travel|rapido/)) return 'Transport';
    if (d.match(/netflix|spotify|amazon|hotstar|subscription|prime/)) return 'Entertainment';
    if (d.match(/electricity|wifi|internet|mobile|recharge|bill|jio|airtel/)) return 'Utilities';
    if (d.match(/doctor|medicine|hospital|pharmacy|health|medical/)) return 'Health';
    if (d.match(/shopping|flipkart|clothes|shoes|myntra|meesho/)) return 'Shopping';
    if (d.match(/salary|credited|received|income|bonus/)) return 'Income';
    if (d.match(/rent|house|pg|hostel|apartment/)) return 'Housing';
    return 'General';
  }

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
      if (isNaN(amount) || amount === 0) continue;
      var type = amount < 0 ? 'expense' : 'income';
      if (amount < 0) amount = Math.abs(amount);
      var category = detectCategory(description);
      if (category === 'Income') type = 'income';
      results.push({ description: description, amount: amount, type: type, category: category });
    }
    return results;
  }

  async function parsePDF(file) {
    var pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var fullText = '';

    for (var i = 1; i <= pdf.numPages; i++) {
      var page = await pdf.getPage(i);
      var content = await page.getTextContent();
      var pageText = content.items.map(function(item) { return item.str; }).join(' ');
      fullText += pageText + '\n';
    }

    var results = [];
    var lines = fullText.split('\n');

    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();
      if (!line) continue;

      var amountMatch = line.match(/(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i);
      if (!amountMatch) continue;

      var amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (isNaN(amount) || amount === 0) continue;

      var type = 'expense';
      if (line.match(/credit|credited|received|deposit|income|salary/i)) type = 'income';
      if (line.match(/debit|debited|paid|payment|expense|withdrawal/i)) type = 'expense';

      var description = line.replace(/(?:Rs\.?|INR|₹)\s*[\d,]+\.?\d*/gi, '').trim();
      if (description.length > 100) description = description.substring(0, 100);
      if (!description) description = 'PDF Transaction';

      var category = detectCategory(description);
      if (category === 'Income') type = 'income';

      results.push({ description: description, amount: amount, type: type, category: category });
    }

    return results;
  }

  async function handleFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus('');
    setPreview([]);

    var ext = file.name.split('.').pop().toLowerCase();
    setFileType(ext);

    var results = [];

    if (ext === 'csv') {
      var reader = new FileReader();
      reader.onload = function(event) {
        results = parseCSV(event.target.result);
        if (results.length === 0) setStatus('no_data');
        else setPreview(results);
      };
      reader.readAsText(file);
    } else if (ext === 'pdf') {
      setStatus('loading');
      try {
        results = await parsePDF(file);
        if (results.length === 0) setStatus('no_data');
        else {
          setPreview(results);
          setStatus('');
        }
      } catch (err) {
        console.log(err);
        setStatus('pdf_error');
      }
    }
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setImporting(true);
    setStatus('');
    var success = 0;

    for (var i = 0; i < preview.length; i++) {
      try {
        await addTransaction(preview[i]);
        success++;
      } catch (err) {
        console.log(err);
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
        Upload CSV or PDF from GPay, PhonePe, Paytm or your Bank — transactions will be added automatically!
      </p>

      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(14px, 3vw, 18px)' }}>
          Upload File
        </h3>

        <label style={{
          display: 'block', padding: '2rem',
          border: '2px dashed #334155', borderRadius: '12px',
          textAlign: 'center', cursor: 'pointer', background: '#0f172a'
        }}>
          <p style={{ color: '#94a3b8', margin: '0 0 0.5rem', fontSize: '32px' }}>📂</p>
          <p style={{ color: '#94a3b8', margin: '0 0 0.5rem', fontSize: '14px' }}>
            {fileName ? fileName : 'Click to select CSV or PDF file'}
          </p>
          <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
            Supports: GPay CSV, PhonePe CSV, Paytm CSV, Bank PDF Statement
          </p>
          <input
            type="file"
            accept=".csv,.pdf"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </label>

        {status === 'loading' && (
          <p style={{ color: '#818cf8', marginTop: '1rem', fontSize: '13px', textAlign: 'center' }}>
            Reading PDF... Please wait...
          </p>
        )}
        {status === 'no_data' && (
          <p style={{ color: '#f87171', marginTop: '1rem', fontSize: '13px', textAlign: 'center' }}>
            No transactions found. Please check the file format.
          </p>
        )}
        {status === 'pdf_error' && (
          <p style={{ color: '#f87171', marginTop: '1rem', fontSize: '13px', textAlign: 'center' }}>
            Could not read PDF. Make sure it is a text-based PDF, not a scanned image.
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
                padding: '0.5rem 1.25rem', background: '#6366f1',
                color: '#fff', border: 'none', borderRadius: '8px',
                cursor: importing ? 'not-allowed' : 'pointer',
                fontWeight: '600', fontSize: '14px'
              }}
            >
              {importing ? 'Importing...' : 'Import All (' + preview.length + ')'}
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {preview.map(function(t, i) {
              return (
                <div key={i} style={{
                  background: '#0f172a', borderRadius: '8px',
                  padding: '0.75rem', marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
                      style={{ padding: '0.3rem 0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                    <select
                      value={t.category}
                      onChange={function(e) { handleCategoryChange(i, e.target.value); }}
                      style={{ padding: '0.3rem 0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
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