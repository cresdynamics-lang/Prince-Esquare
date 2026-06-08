import { useNavigate } from 'react-router-dom';
import PosTerminalView from '../../components/pos/PosTerminalView';

const PosTerminal = () => {
  const navigate = useNavigate();
  return (
    <PosTerminalView
      onClockOut={(summary) => navigate('/admin/dashboard', { state: { shiftSummary: summary } })}
    />
  );
};

export default PosTerminal;
