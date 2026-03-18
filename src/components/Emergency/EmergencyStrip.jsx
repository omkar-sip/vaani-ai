import { EMERGENCY_HELPLINES } from '../../utils/constants';
import { useCompanionStore } from '../../stores/useCompanionStore';
import './EmergencyStrip.css';

export default function EmergencyStrip() {
  const distressDetected = useCompanionStore((s) => s.distressDetected);
  const dismissDistress = useCompanionStore((s) => s.dismissDistress);

  if (!distressDetected) return null;

  function callEmergency() {
    alert(EMERGENCY_HELPLINES);
  }

  return (
    <div className="emergency-strip">
      <span style={{ fontSize: 18 }}>🚨</span>
      <span className="emg-text">Distress detected — please reach out for help</span>
      <button className="emg-call" onClick={callEmergency}>📞 Call Help</button>
      <button className="emg-btn" onClick={dismissDistress}>✕</button>
    </div>
  );
}
