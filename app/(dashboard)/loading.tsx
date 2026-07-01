export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="w-9 h-9 bg-gray-100 rounded-lg mb-3" />
            <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
            <div className="h-7 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-64" />
        ))}
      </div>
    </div>
  );
}
