import { FIELD_LABELS } from '../../utils/constants';

/**
 * Inline captured-fields card displayed in consultant chat.
 * @param {{ extracted: object, confidence: number }} props
 */
export default function FieldStrip({ extracted, confidence }) {
  const topFields = Object.entries(extracted)
    .filter(([k, v]) => v && k !== 'intent' && k !== 'language_detected')
    .slice(0, 6);

  if (!topFields.length) return null;

  return (
    <div className="field-strip">
      <div className="fs-title">📋 Captured Fields</div>
      <div className="fs-grid">
        {topFields.map(([k, v]) => (
          <div className="fs-item" key={k}>
            <div className="fs-key">{FIELD_LABELS[k] || k}</div>
            <div className="fs-val">{v}</div>
          </div>
        ))}
      </div>
      <div className="conf-row">
        <span className="conf-label">Confidence</span>
        <div className="conf-bar">
          <div className="conf-fill" style={{ width: `${confidence}%` }} />
        </div>
        <span className="conf-pct">{confidence}%</span>
      </div>
    </div>
  );
}
