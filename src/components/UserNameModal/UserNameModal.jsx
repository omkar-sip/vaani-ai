import { useState } from 'react';
import './UserNameModal.css';

export default function UserNameModal({ onSubmit }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div className="name-modal-overlay">
      <form className="name-modal-card" onSubmit={handleSubmit}>
        <div className="name-modal-icon">👋</div>
        <div className="name-modal-title">Welcome to VaaniAI</div>
        <div className="name-modal-subtitle">
          Please enter your name to begin this session.
          <br />Your name helps us personalize your experience.
        </div>
        <input
          className="name-modal-input"
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={60}
        />
        <button
          className="name-modal-btn"
          type="submit"
          disabled={!name.trim()}
        >
          Continue →
        </button>
      </form>
    </div>
  );
}
