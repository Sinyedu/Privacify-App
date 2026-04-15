export default function GroupSidebar() {
  return (
    <div className="w-64 border-r p-3">
      <h2 className="font-bold mb-3">Groups</h2>

      <div className="space-y-2">
        <div className="p-2 bg-gray-100 rounded">General</div>
        <div className="p-2 hover:bg-gray-100 rounded cursor-pointer">
          Dev Chat
        </div>
      </div>
    </div>
  );
}
