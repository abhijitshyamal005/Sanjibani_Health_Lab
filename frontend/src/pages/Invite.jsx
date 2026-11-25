import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InvitePanel from '../components/InvitePanel';
import { homeFor, useAuth } from '../context/AuthContext';

/** /invite — share your invite link. Open to every signed-in user (patients, labs, collectors, admins). */
export default function Invite() {
  const { user } = useAuth();
  return (
    <div className="container-page max-w-3xl py-8">
      {user.role !== 'patient' && (
        <Link to={homeFor(user)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      )}
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Invite &amp; earn</h1>
      <InvitePanel showLabInvite />
    </div>
  );
}
