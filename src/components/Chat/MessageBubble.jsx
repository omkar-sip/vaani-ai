import { now } from '../../utils/helpers';
import './ChatArea.css';

/**
 * Single message bubble.
 * @param {{ role: 'user'|'ai', text: string, lang?: string, mode: string }} props
 */
export default function MessageBubble({ role, text, lang, mode }) {
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '<br>');

  return (
    <div className={`msg ${role}`}>
      <div className="mav">{role === 'ai' ? 'V' : 'U'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mbub" dangerouslySetInnerHTML={{ __html: safe }} />
        <div className="mmeta">
          <span>{now()}</span>
          {lang && <span className="ltag">{lang}</span>}
        </div>
      </div>
    </div>
  );
}
