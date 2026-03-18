import { useEffect, useMemo, useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useUserStore } from '../../stores/useUserStore';
import { scanFoodLabel } from '../../api/foodScanner';
import { preprocessFoodImage } from './imagePreprocess';
import { downloadFoodReportPdf } from './pdfReport';
import './FoodScanner.css';

function parseCsvInput(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatProfileList(value) {
  if (Array.isArray(value)) return value.join(', ');
  return typeof value === 'string' ? value : '';
}

function riskTone(riskLevel) {
  if (riskLevel === 'AVOID') return 'avoid';
  if (riskLevel === 'CAUTION') return 'caution';
  return 'good';
}

function availabilityLabel(value) {
  if (value === 'HOME') return 'Can make at home';
  if (value === 'BOTH') return 'Online or home';
  return 'Easy to find online';
}

export default function FoodScanner({ open, onClose }) {
  const mode = useSessionStore((s) => s.mode);
  const user = useUserStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);

  const [productNameInput, setProductNameInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [conditionsInput, setConditionsInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const scanSteps = [
    'Enhancing image contrast',
    'Reading the ingredients label',
    'Checking allergies and conditions',
    'Finding better alternatives',
  ];

  useEffect(() => {
    if (!open) return;
    setProductNameInput('');
    setAllergiesInput(formatProfileList(profile?.allergies));
    setConditionsInput(formatProfileList(profile?.conditions));
  }, [open, profile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const riskClass = useMemo(() => riskTone(result?.riskLevel), [result]);

  if (!open) return null;

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(false);
    setError('');
    setResult(null);

    try {
      const processedFile = await preprocessFoodImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(processedFile));
      setSelectedFile(processedFile);
    } catch (nextError) {
      setSelectedFile(null);
      setPreviewUrl('');
      setError(nextError.message);
    }
  }

  async function handleScan() {
    if (!selectedFile) {
      setError('Please upload a clear food label image first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await scanFoodLabel({
        file: selectedFile,
        userId: user?.uid || '',
        productName: productNameInput.trim(),
        allergies: parseCsvInput(allergiesInput),
        conditions: parseCsvInput(conditionsInput),
        mode,
      });
      setResult(payload);
      if (!productNameInput.trim() && payload.productName) {
        setProductNameInput(payload.productName);
      }
    } catch (nextError) {
      setError(nextError.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setProductNameInput('');
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
  }

  async function handleDownloadPdf() {
    try {
      await downloadFoodReportPdf({ result, imageFile: selectedFile });
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  function renderModeSummary() {
    if (!result) return null;

    if (mode === 'companion') {
      return (
        <div className="food-result-mode companion">
          <div className="food-result-mode-title">Companion Summary</div>
          <div>
            Easy take: {result.summary}
          </div>
        </div>
      );
    }

    return (
      <div className="food-result-mode consultant">
        <div className="food-result-mode-title">Consultant Notes</div>
        <div>
          Structured explanation: {result.summary}
        </div>
      </div>
    );
  }

  return (
    <div className="food-scanner-overlay" onClick={onClose}>
      <div className="food-scanner-modal" onClick={(event) => event.stopPropagation()}>
        <div className="food-scanner-head">
          <div>
            <div className="food-scanner-kicker">Food Ingredients Scanner</div>
            <div className="food-scanner-title">Scan a food label before you eat it</div>
            <div className="food-scanner-sub">
              Upload a packaged food label, optionally enter the product name, and get a simple
              action-ready report with safer alternatives you can buy online or prepare at home.
            </div>
          </div>
          <button className="food-scanner-close" onClick={onClose} aria-label="Close food scanner">
            x
          </button>
        </div>

        <div className="food-scanner-grid">
          <div className="food-scanner-panel">
            <div className="food-scanner-stack">
              <div>
                <label className="food-scanner-label">Product name (optional)</label>
                <input
                  className="food-scanner-input"
                  type="text"
                  value={productNameInput}
                  onChange={(event) => setProductNameInput(event.target.value)}
                  placeholder="Example: Mango fruit drink"
                />
              </div>

              <div>
                <label className="food-scanner-label">Food label image</label>
                <div className="food-scanner-upload">
                  Upload a clear product label photo. We preprocess it in-memory and do not store the image.
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
                </div>
                {previewUrl && (
                  <div className="food-scanner-preview">
                    <img src={previewUrl} alt="Food label preview" />
                    {loading && (
                      <div className="food-scanner-preview-overlay">
                        <div className="food-scan-frame" />
                        <div className="food-scan-line" />
                        <div className="food-scan-label">Scanning label...</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="food-scanner-label">Allergies to check</label>
                <textarea
                  className="food-scanner-input"
                  rows={3}
                  value={allergiesInput}
                  onChange={(event) => setAllergiesInput(event.target.value)}
                  placeholder="Example: nuts, gluten, lactose"
                />
              </div>

              <div>
                <label className="food-scanner-label">Medical conditions to consider</label>
                <textarea
                  className="food-scanner-input"
                  rows={3}
                  value={conditionsInput}
                  onChange={(event) => setConditionsInput(event.target.value)}
                  placeholder="Example: diabetes, hypertension, PCOS"
                />
              </div>
            </div>

            <div className="food-scanner-actions">
              <button className="food-scan-btn primary" disabled={loading} onClick={handleScan}>
                {loading ? 'Scanning label...' : 'Analyze ingredients'}
              </button>
              <button className="food-scan-btn secondary" disabled={loading} onClick={handleReset}>
                Reset
              </button>
            </div>

            <div className="food-scanner-note">
              This analysis is AI-generated and not a substitute for medical advice.
            </div>

            {error && <div className="food-scanner-error">{error}</div>}
          </div>

          <div className="food-scanner-panel">
            {loading ? (
              <div className="food-scanner-live">
                <div className="food-scanner-live-badge">Live analysis running</div>
                <div className="food-scanner-live-title">Scanning the product label</div>
                <div className="food-scanner-live-sub">
                  We are extracting ingredients, checking health risks, and preparing a user-friendly report.
                </div>
                <div className="food-scanner-live-steps">
                  {scanSteps.map((step, index) => (
                    <div className="food-scanner-live-step" key={step} style={{ animationDelay: `${index * 0.16}s` }}>
                      <span className="food-scanner-live-dot" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : !result ? (
              <div className="food-scanner-empty">
                <div className="food-scanner-empty-icon">Scan</div>
                <div className="food-result-title">No analysis yet</div>
                <div className="food-result-summary">
                  Upload a clear ingredients label to get a safety verdict, simple next steps, and healthier
                  alternatives that are practical for everyday users.
                </div>
              </div>
            ) : (
              <>
                <div className="food-result-toolbar">
                  <div className={`food-risk-badge ${riskClass}`}>
                    {result.riskLevel === 'GOOD' ? 'Good fit' : result.riskLevel === 'CAUTION' ? 'Use caution' : 'Avoid'}
                  </div>
                  <button className="food-scan-btn secondary download" onClick={handleDownloadPdf}>
                    Download PDF report
                  </button>
                </div>

                <div className="food-result-title">{result.productName || 'Scanned product'}</div>
                <div className="food-result-summary">{result.summary}</div>
                {renderModeSummary()}

                <div className="food-result-grid">
                  <div className="food-card full">
                    <h3>What you should do now</h3>
                    <div className="food-action-list">
                      {(result.actionSteps || []).map((step) => (
                        <div className="food-action-item" key={step}>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="food-card full">
                    <h3>Extracted ingredients</h3>
                    <div className="food-chip-list">
                      {result.ingredients.map((ingredient) => (
                        <span className="food-chip" key={ingredient}>
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="food-card">
                    <h3>{mode === 'companion' ? 'What to watch' : 'Triggered alerts'}</h3>
                    {result.triggeredAlerts.length ? (
                      <div className="food-alert-list">
                        {result.triggeredAlerts.map((alert) => (
                          <div className="food-alert-item" key={`${alert.ingredient}-${alert.reason}`}>
                            <div className="food-alert-name">{alert.ingredient}</div>
                            <div className="food-alert-reason">{alert.reason}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="food-card-empty">
                        No obvious ingredient triggers were found from the uploaded label.
                      </div>
                    )}
                  </div>

                  <div className="food-card">
                    <h3>Healthier alternatives with similar taste</h3>
                    {result.recommendedAlternatives.length ? (
                      <div className="food-alt-list">
                        {result.recommendedAlternatives.map((alternative) => (
                          <div className="food-alt-item" key={alternative.name}>
                            <div className="food-alt-row">
                              <div className="food-alt-name">{alternative.name}</div>
                              <span className="food-alt-pill">{availabilityLabel(alternative.availability)}</span>
                            </div>
                            <div className="food-alt-reason">{alternative.reason}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="food-card-empty">
                        No alternative suggestions are needed because the ingredient scan looks acceptable.
                      </div>
                    )}
                  </div>

                  <div className="food-card full">
                    <h3>Home dishes or remedy-style swaps</h3>
                    {result.homeSuggestions?.length ? (
                      <div className="food-alt-list">
                        {result.homeSuggestions.map((item) => (
                          <div className="food-alt-item" key={item.name}>
                            <div className="food-alt-name">{item.name}</div>
                            <div className="food-alt-reason">{item.reason}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="food-card-empty">
                        No extra home swaps were needed because the scan looked acceptable.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
