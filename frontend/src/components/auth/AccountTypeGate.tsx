import { Navigate, Outlet } from 'react-router-dom';
import { useMe } from '../../api/auth';
import { BUSINESS_MODE_ENABLED } from '../../lib/flags';

export const AccountTypeGate = () => {
  const { data: me, isLoading } = useMe();

  if (!BUSINESS_MODE_ENABLED) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (me && me.account_type === null) {
    return <Navigate to="/choose-mode" replace />;
  }

  return <Outlet />;
};
