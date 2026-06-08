import { useLocation, useNavigate } from 'react-router-dom';
import ShiftSummaryView from '../../components/pos/ShiftSummaryView';

const ShiftSummary = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  return (
    <ShiftSummaryView
      summary={state?.summary}
      onDone={() => navigate('/admin/login')}
    />
  );
};

export default ShiftSummary;
