type InviteLinkBoxProps = {
  inviteLink: string;
  onCopy: () => void;
};

export default function InviteLinkBox({
  inviteLink,
  onCopy,
}: InviteLinkBoxProps) {
  return (
    <div className="mt-4 p-2 border rounded bg-gray-50">
      <p className="text-xs mb-2">Invite link ready:</p>

      <input
        className="w-full text-xs p-1 border rounded"
        value={inviteLink}
        readOnly
      />

      <button
        onClick={onCopy}
        className="mt-2 w-full text-xs bg-black text-white p-1 rounded"
      >
        Copy link
      </button>
    </div>
  );
}
