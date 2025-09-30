import AdminLayout from "@/components/AdminLayout";
import Leaderboard from "@/components/Leaderboard";

const AdminLeaderboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">🏆 Licensed Users Leaderboard</h1>
          <p className="text-green-100">Monitor performance of licensed students</p>
        </div>
        <Leaderboard />
      </div>
    </AdminLayout>
  );
};

export default AdminLeaderboard;