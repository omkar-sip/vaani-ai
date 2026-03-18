import { useSessionStore } from '../../stores/useSessionStore';
import { FIELD_LABELS, FIELD_GROUPS } from '../../utils/constants';
import './RightPanel.css';

export default function RightPanel() {
  const mode = useSessionStore((s) => s.mode);
  const section = useSessionStore((s) => s.section);
  const extracted = useSessionStore((s) => s.extracted);
  const turns = useSessionStore((s) => s.turns);
  const sessions = useSessionStore((s) => s.sessions);
  const curSess = useSessionStore((s) => s.curSess);

  if (mode === 'companion') return null;

  const filled = Object.values(extracted).filter((v) => v && String(v).trim()).length;
  const conf = Math.min(25 + filled * 8, 97);
  const groups = FIELD_GROUPS[section];

  return (
    <div className="rpanel">
      <div className="rhead">
        <span className="rhead-title">📋 Patient Record</span>
        <span className="rhead-status">{filled ? `${filled} fields` : 'Waiting…'}</span>
      </div>

      <div className="pbody">
        {/* Data tab */}
        <div id="pv-data">
          <div id="farea">
            {groups ? (
              Object.entries(groups).map(([gLabel, fields]) => (
                <div className="prec-section" key={gLabel}>
                  <div className={`prec-head ${section}`}>{gLabel}</div>
                  <div>
                    {fields.map((f) => {
                      const v = extracted[f] || '';
                      return (
                        <div className="frow" key={f}>
                          <div className="fk">{FIELD_LABELS[f] || f}</div>
                          <div className={`fv${v ? '' : ' mt'}`}>
                            {v || 'Not captured'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="pempty">
                <div className="pe-icon">📋</div>
                <div className="pe-text">Patient data appears as conversation progresses</div>
              </div>
            )}
          </div>
          <div className="confw">
            <div className="confbar">
              <div className="conffill" style={{ width: `${conf}%` }} />
            </div>
            <div className="conflbls">
              <span>Confidence</span>
              <span>{filled ? `${conf}%` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="issec">
          <div className="isgrid">
            <div className="iscard">
              <div className="isn">{turns}</div>
              <div className="isl">Turns</div>
            </div>
            <div className="iscard">
              <div className="isn">{filled}</div>
              <div className="isl">Fields</div>
            </div>
          </div>
        </div>

        {/* Sessions list */}
        <div className="slist">
          {sessions.map((s) => (
            <div className={`sitem ${s.id === curSess ? 'on' : ''}`} key={s.id}>
              <div className="sname">{s.title}</div>
              <div className="smeta">
                <span className={`dtag ${s.domain === 'companion' ? 'companion' : 'health'}`}>
                  {s.domain}
                </span>
                <span>{s.time}</span>
                <span>{s.turns}t</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
