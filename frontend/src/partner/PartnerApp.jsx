import { createContext, useContext } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Building2, ClipboardList, ExternalLink, FlaskConical, Gift, LayoutDashboard, Route as RouteIcon, Users } from 'lucide-react';
import InvitePanel from '../components/InvitePanel';
import { DashboardShell } from '../components/Layouts';
import { ErrorState, LabStatusBadge, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import PartnerBookings from './PartnerBookings';
import PartnerDashboard from './PartnerDashboard';
import PartnerPatients from './PartnerPatients';
import PartnerCollectors from './PartnerCollectors';
import PartnerTests from './PartnerTests';
import LabProfileForm from './LabProfileForm';

const PartnerContext = createContext(null);
export const usePartner = () => useContext(PartnerContext);

export default function PartnerApp() {
  const { data, loading, error, reload, setData } = useAsync(() => api('/partner/lab'), []);

  if (error) return <div className="p-10"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading && !data) return <Spinner className="min-h-screen items-center" />;

  const lab = data.lab;
  const setLab = (l) => setData({ lab: l });

  if (!lab) {
    return (
      <DashboardShell title="Partner" nav={[{ to: '/partner', label: 'Lab profile', icon: Building2, end: true }]}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight">Tell patients about your lab</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Step 1 of 2 — add your lab details. Next you’ll add tests and prices. Our team verifies new labs before they go live.
          </p>
          <div className="mt-6">
            <LabProfileForm onSaved={setLab} />
          </div>
        </div>
      </DashboardShell>
    );
  }

  const nav = [
    { to: '/partner', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/partner/bookings', label: 'Bookings', icon: ClipboardList },
    { to: '/partner/tests', label: 'Tests & prices', icon: FlaskConical },
    { to: '/partner/patients', label: 'Patients', icon: Users },
    { to: '/partner/collectors', label: 'Collectors', icon: RouteIcon },
    { to: '/partner/profile', label: 'Lab profile', icon: Building2 },
    { to: '/partner/invite', label: 'Invite & share', icon: Gift },
  ];

  return (
    <PartnerContext.Provider value={{ lab, setLab, reloadLab: reload }}>
      <DashboardShell
        title="Partner"
        nav={nav}
        badge={
          <>
            <p className="truncate font-bold">{lab.name}</p>
            <LabStatusBadge status={lab.status} />
          </>
        }
        headerExtra={
          lab.status === 'approved' && (
            <Link to={`/labs/${lab.slug}`} target="_blank" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:flex">
              View public page <ExternalLink className="h-4 w-4" />
            </Link>
          )
        }
      >
        <Routes>
          <Route index element={<PartnerDashboard />} />
          <Route path="bookings" element={<PartnerBookings />} />
          <Route path="tests" element={<PartnerTests />} />
          <Route path="patients" element={<PartnerPatients />} />
          <Route path="collectors" element={<PartnerCollectors />} />
          <Route
            path="invite"
            element={
              <div className="max-w-3xl">
                <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Invite &amp; share</h1>
                <InvitePanel showLabInvite />
              </div>
            }
          />
          <Route
            path="profile"
            element={
              <div className="max-w-3xl">
                <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Lab profile</h1>
                <LabProfileForm lab={lab} onSaved={setLab} />
              </div>
            }
          />
        </Routes>
      </DashboardShell>
    </PartnerContext.Provider>
  );
}
