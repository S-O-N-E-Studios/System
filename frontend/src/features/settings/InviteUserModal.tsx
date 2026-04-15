import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import type { UserRole } from '@/types';

const MODAL_ID = 'settings-invite-user';

/** Backend role enum uses `PM` (not PROJECT_MANAGER). */
export type InviteTenantRole = Extract<UserRole, 'ORG_ADMIN' | 'PM' | 'MEMBER' | 'VIEWER'>;

interface InviteUserModalProps {
  onInvite: (email: string, role: InviteTenantRole) => void;
}

export default function InviteUserModal({ onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteTenantRole>('MEMBER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) return;
    onInvite(trimmed, role);
    setEmail('');
    setRole('MEMBER');
  };

  return (
    <Modal
      modalId={MODAL_ID}
      title="Invite team member"
      size="sm"
      onClose={() => {
        setEmail('');
        setRole('MEMBER');
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[0.78rem] text-[var(--text-muted)]">
          An email invitation is sent to this address. They choose a password when they accept.
        </p>
        <FormInput
          label="Email"
          type="email"
          placeholder="colleague@organisation.gov.za"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-eyebrow text-[var(--text-muted)]">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as InviteTenantRole)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-[0.82rem] px-3 py-2"
          >
            <option value="VIEWER">Viewer</option>
            <option value="MEMBER">Member</option>
            <option value="PM">Project Manager</option>
            <option value="ORG_ADMIN">Org Admin</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" variant="primary">
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { MODAL_ID as INVITE_USER_MODAL_ID };
