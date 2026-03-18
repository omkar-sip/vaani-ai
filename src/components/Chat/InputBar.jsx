import { useRef, useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useI18n } from '../../hooks/useI18n';
import './InputBar.css';

/**
 * @param {{
 *   onSend: (text: string) => void,
 *   onVoice: () => void,
 *   onNewSession: () => void,
 *   onExport: (fmt: string) => void,
 *   onSummary: () => void,
 *   onOpenFoodScanner: () => void,
 *   onDownloadCompanionReport?: () => void,
 *   onDownloadConsultantReport?: () => void,
 *   showCompanionReportAction?: boolean,
 *   showConsultantReportAction?: boolean,
 *   downloadingCompanionReport?: boolean,
 *   downloadingConsultantReport?: boolean,
 *   listening?: boolean
 * }} props
 */
export default function InputBar({
  onSend,
  onVoice,
  onNewSession,
  onExport,
  onSummary,
  onOpenFoodScanner,
  onDownloadCompanionReport,
  onDownloadConsultantReport,
  showCompanionReportAction,
  showConsultantReportAction,
  downloadingCompanionReport,
  downloadingConsultantReport,
  listening,
}) {
  const [text, setText] = useState('');
  const mode = useSessionStore((s) => s.mode);
  const { t } = useI18n();
  const isComp = mode === 'companion';
  const taRef = useRef(null);

  function handleKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
  }

  function autoResize(element) {
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 100) + 'px';
  }

  return (
    <div className={`input-wrap ${isComp ? 'companion-mode' : 'consultant-mode'}`}>
      {!isComp && (
        <div className="expbar on">
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{t('export')}</span>
          <button className="exbtn" onClick={() => onExport('json')}>JSON</button>
          <button className="exbtn" onClick={() => onExport('csv')}>CSV</button>
          {showConsultantReportAction && (
            <button
              className="exbtn pdf"
              onClick={onDownloadConsultantReport}
              disabled={downloadingConsultantReport}
            >
              {downloadingConsultantReport ? t('preparingConsultantReport') : t('downloadConsultantReport')}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="exbtn ai" onClick={onSummary}>{t('summary')}</button>
        </div>
      )}

      <div className="irow">
        <textarea
          id="tbox"
          ref={taRef}
          className="tbox"
          rows={1}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            autoResize(event.target);
          }}
          onKeyDown={handleKey}
          placeholder={isComp ? t('howFeeling') : t('describeConcern')}
        />
        <button id="send-btn" className="sbtn" onClick={handleSend}>^</button>
      </div>

      <div className="action-row">
        <button
          className={`abtn voice ${listening ? 'pulsing' : ''}`}
          onClick={onVoice}
        >
          {listening ? t('stopListening') : t('speak')}
        </button>
        <button className="abtn" onClick={onNewSession}>{t('newSession')}</button>
        {isComp && showCompanionReportAction && (
          <button
            className="abtn report"
            onClick={onDownloadCompanionReport}
            disabled={downloadingCompanionReport}
          >
            {downloadingCompanionReport ? t('preparingHealthReport') : t('downloadHealthReport')}
          </button>
        )}
        <button className="abtn scan" onClick={onOpenFoodScanner}>{t('scanFood')}</button>
        <span className="ahint">{t('voiceAiHint')}</span>
      </div>
    </div>
  );
}
