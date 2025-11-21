
import React from "react";
import AdminLayout from "../components/admin/AdminLayout";
import AdminDashboardContent from "../components/admin/AdminDashboardContent";

export const pagePermissions = {
  public: false,
  loginRequired: true,
  roles: ["admin"]
};

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6">
        <AdminDashboardContent />
      </div>
    </AdminLayout>
  );
}
