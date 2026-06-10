type InviteLinkBoxProps = {
  inviteLink: string;
  onCopy: () => void;
};

export default function InviteLinkBox({
  inviteLink,
  onCopy,
}: InviteLinkBoxProps) {
  return (
    <div className="mt-4 p-3 border border-neutral-700 rounded bg-neutral-950 text-white shadow-sm">
      <p className="text-xs mb-2 text-neutral-300">Invite link ready</p>

      <input
        className="w-full text-xs p-2 border border-neutral-700 rounded bg-neutral-900 text-neutral-100"
        value={inviteLink}
        readOnly
      />

      <button
        onClick={onCopy}
        className="mt-2 w-full text-xs bg-white text-neutral-950 p-2 rounded hover:bg-neutral-200"
      >
        Copy link
      </button>
    </div>
  );
}
