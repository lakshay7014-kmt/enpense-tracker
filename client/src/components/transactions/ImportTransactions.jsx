import { useState } from 'react';
import { addTransaction } from '../../services/api';

export default function ImportTransactions({ onImportDone }) {
  var [preview, setPreview] = useState([]);
  var [importing, setImporting] = useState(false);
  var [status, setStatus] = useState('');
  var [fileName, setFileName] = useState('');
  var [progress, setProgress] = useState('');

  function detectCategory(desc) {
    var d = desc.toLowerCase();
    if (d.match(/food|zomato|swiggy|restaurant|cafe|lunch|dinner|breakfast|pizza|burger/)) return 'Food';
    if (d.match(/uber|ola|petrol|metro|bus|auto|cab|travel|rapido/)) return 'Transport';
    if (d.match(/netflix|spotify|amazon|hotstar|subscription|prime/)) return 'Entertainment';
    if (d.match(/electricity|wifi|internet|mobile|recharge|bill|jio|airtel/)) return 'Utilities';
    if (d.match(/doctor|medicine|hospital|pharmacy|health|medical/)) return 'Health';
    if (d.match(/shopping|flipkart|clothes|shoes|myntra|meesho/)) return 'Shopping';
    if (d.match(/salary|income|bonus/)) return 'Income';
    if (d.match(/rent|house|pg|hostel|apartment/)) return 'Housing';
    if (d.match(/top.?up|upi lite/)) return 'Transfer';
    return 'General';
  }

  function parseGPayPDF(text) {
    var results = [];
    var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });

    var i = 0;
    while (i < lines.length) {
      var line = lines[i];

      // GPay pattern: "Paid to NAME" or "Received from NAME" or "Top-up"
      var isPaid = line.match(/^Paid to (.+)/i);
      var isReceived = line.match(/^Received from (.+)/i);
      var isTopUp = line.match(/^Top-?up/i);

      if (isPaid || isReceived || isTopUp) {
        var description = line;
        var type = isPaid || isTopUp ? 'expense' : 'income';
        var amount = 0;

        // Amount dhundo agle 5 lines mein
        for (var j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          var amountLine = lines[j];
          // GPay amount format: 60, 109, 160 etc (without Rs symbol in text)
          var amountMatch = amountLine.match(/^[₹Rs\.]?\s*([\d,]+)$/);
          if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(/,/g, ''));
            break;
          }
          // Inline amount
          var inlineMatch = amountLine.match(/[₹Rs\.]\s*([\d,]+)/);
          if (inlineMatch) {
            amount = parseFloat(inlineMatch[1].replace(/,/g, ''));
            break;
          }
        }

        if (amount > 0) {
          var category = detectCategory(description);
          if (isReceived) category = 'Income';
          results.push({
            description: description,
            amount: amount,
            type: type,
            category: category
          });
        }
      }
      i++;
    }
    return results;
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
      results.push({ description: description, amount: amount, type: type, category: category });
    }
    return results;
  }

  async function processPDF(file) {
    var pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';

    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var allText = '';
    var totalPages = pdf.numPages;

    for (var i = 1; i <= totalPages; i++) {
      setProgress('Reading page ' + i + ' of ' + totalPages + '...');
      var page = await pdf.getPage(i);
      var content = await page.getTextContent();

      // GPay PDF mein items ko line by line rakhna zaroori hai
      var items = content.items;
      var pageLines = [];
      var currentY = null;
      var currentLine = '';

      for (var k = 0; k < items.length; k++) {
        var item = items[k];
        var y = Math.round(item.transform[5]);
        var text = item.str.trim();

        if (!text) continue;

        if (currentY === null) {
          currentY = y;
          currentLine = text;
        } else if (Math.abs(y - currentY) < 5) {
          currentLine += ' ' + text;
        } else {
          if (currentLine.trim()) pageLines.push(currentLine.trim());
          currentY = y;
          currentLine = text;
        }
      }
      if (currentLine.trim()) pageLines.push(currentLine.trim());

      allText += pageLines.join('\n') + '\n';
    }

    return allText;
  }

  async function handleFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setStatus('');
    setPreview([]);
    setProgress('');
    var ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      var reader = new FileReader();
      reader.onload = function(event) {
        var results = parseCSV(event.target.result);
        if (results.length === 0) setStatus('no_data');
        else setPreview(results);
      };
      reader.readAsText(file);
    } else if (ext === 'pdf') {
      setStatus('loading');
      try {
        var text = await processPDF(file);
        var results = parseGPayPDF(text);
        setProgress('');
        if (results.length === 0) setStatus('no_data');
        else { setPreview(results); setStatus(''); }
      } catch (err) {
        console.log(err);
        setProgress('');
        setStatus('error');
      }
    }
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setImporting(true);
    for (var i = 0; i < preview.length; i++) {
      try { await addTransaction(preview[i]); } catch (err) { console.log(err); }
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
    setPreview(preview.filter(function(_, i) { return i !== index; }));
  }

  var categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Shopping', 'Housing', 'Education', 'Income', 'General', 'Transfer'];

  return (
    <div style={{ padding: '0.5rem', color: '#fff' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontSize: 'clamp(18px, 4vw, 24px)' }}>
        Import Transactions
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '14px' }}>
        Upload Google Pay PDF or CSV — transactions will be added automatically!
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
            {fileName ? fileName : 'Click to select GPay PDF or CSV file'}
          </p>
          <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
            Supports: Google Pay PDF, PhonePe CSV, Bank CSV
          </p>
          <input type="file" accept=".csv,.pdf" onChange={handleFile} style={{ display: 'none' }} />
        </label>

        {status === 'loading' && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#818cf8', fontSize: '13px', marginBottom: '0.5rem' }}>
              Reading PDF...
            </p>
            {progress && (
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '0.5rem' }}>{progress}</p>
            )}
            <div style={{ background: '#0f172a', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', background: '#6366f1', borderRadius: '99px' }} />
            </div>
          </div>
        )}

        {status === 'no_data' && (
          <p style={{ color: '#f87171', marginTop: '1rem', fontSize: '13px', textAlign: 'center' }}>
            No transactions found. Please check the file.
          </p>
        )}
        {status === 'error' && (
          <p style={{ color: '#f87171', marginTop: '1rem', fontSize: '13px', textAlign: 'center' }}>
            Error reading file. Please try again.
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
              style={{ padding: '0.5rem 1.25rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: importing ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }}
            >
              {importing ? 'Importing...' : 'Import All (' + preview.length + ')'}
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {preview.map(function(t, i) {
              return (
                <div key={i} style={{ background: '#0f172a', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' }}>
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