import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Settings.scss';

const Settings = () => {
  const navigate = useNavigate();
  const handleBackClick = () => navigate(-1);

  return (
    <div className="settings-page">
      <button type="button" className="back-btn" onClick={handleBackClick}>
        <ArrowLeft size={16} />
        Back
      </button>

      <h1>Settings Page</h1>
    </div>
  );
};

export default Settings;
