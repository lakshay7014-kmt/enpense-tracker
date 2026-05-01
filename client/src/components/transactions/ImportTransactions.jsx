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
    if (d.match(/salary|credited|received|income|bonus/)) return 'Income';
    if (d.match(/rent|house|pg|hostel|apartment/)) return 'Housing';
    return 'General';
  }

  function extractTransactions(text) {
    var results = [];
    var lines = text.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.length < 5) continue;

      var amountMatch = line.match(/([\d,]+\.?\d*)/g);
      if (!amountMatch) continue;

      var amount = 0;
      for (var k = 0; k < amountMatch.length; k++) {
        var val = parseFloat(amountMatch[k].replace(/,/g, ''));
        if (val > 0 && val < 10000000) {
          amount = val;
          break;
        }
      }

      if (amount === 0) continue;

      var type = 'expense';
      if (line.match(/credit|credited|received|deposit|income|salary|cr\b/i)) type = 'income';
      if (line.match(/debit|debited|paid|payment|dr\b|withdrawal/i)) type = 'expense';

      var description = line
        .replace(/([\d,]+\.?\d*)/g, '')
        .replace(/[|\/\\]/g, ' ')
        .trim();

      if (description.length > 80) description = description.substring(0, 80);
      if (!description || description.length < 3) description = 'Bank Transaction';

      var category = detectCategory(description);
      if (category === 'Income') type = 'income';

      results.push({
        description: description,
        amount: amount,
        type: type,
        category: category
      });
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
      if (category === 'Income') type = 'income';
      results.push({ description: description, amount: amount, type: type, category: category });
    }
    return results;
  }

  async function processPDFWithOCR(file) {
    var pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';

    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    var allText = '';
    var totalPages = pdf.numPages;

    for (var i = 1; i <= totalPages; i++) {
      setProgress('Reading page ' + i + ' of ' + totalPages + '...');
      var page = await pdf.getPage(i);

      // Pehle text-based try karo
      var content = await page.getTextContent();
      var pageText = content.items.map(function(item) { return item.str; }).join(' ');

      if (pageText.trim().length > 50) {
        // Text-based PDF — seedha text lo
        allText += pageText + '\n';
      } else {
        // Scanned PDF — image render karke OCR chalao
        setProgress('Scanning page ' + i + ' of ' + totalPages + ' (OCR)...');

        var viewport = page.getViewport({ scale: 2.0 });
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        var imageData = canvas.toDataURL('image/png');

        // Tesseract OCR
        var Tesseract = await import('tesseract.js');
        var result = await Tesseract.recognize(imageData, 'eng', {
          logger: function(m) {
            if (m.status === 'recognizing text') {
              setProgress('OCR Progress: ' + Math.round(m.progress * 100) + '%');
            }
          }
        });

        allText += result.data.text + '\n';
        canvas.remove();
      }
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
        var text = await processPDFWithOCR(file);
        var results = extractTransactions(text);
        setProgress('');
        if (results.length === 0) setStatus('no_data');
        else {
          setPreview(results);
          setStatus('');
        }
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

  var categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Shopping', 'Housing', 'Education', 'Income', 'General'];

  return (
    <div style={{ padding: '0.5rem', color: '#fff' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontSize: 'clamp(18px, 4vw, 24px)' }}>
        Import Transactions
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '14px' }}>
        Upload CSV or PDF (text or scanned) — transactions will be added automatically!
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
            Supports: CSV, Text PDF, Scanned PDF (OCR)
          </p>
          <input
            type="file"
            accept=".csv,.pdf"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </label>

        {status === 'loading' && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#818cf8', fontSize: '13px', marginBottom: '0.5rem' }}>
              Processing file...
            </p>
            {progress && (
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>{progress}</p>
            )}
            <div style={{ background: '#0f172a', borderRadius: '99px', height: '6px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div style={{ width: '60%', height: '100%', background: '#6366f1', borderRadius: '99px', animation: 'pulse 1.5s infinite' }} />
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
              Preview — {preview.length} Transactions
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