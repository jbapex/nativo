
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import AdminLayout from "../components/admin/AdminLayout";
import StoresManagementContent from "../components/admin/StoresManagementContent";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export const pagePermissions = {
  public: false,
  loginRequired: true,
  roles: ["admin"]
};

export default function AdminStores() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      if (userData.role !== "admin") {
        navigate(createPageUrl("Home"));
        return;
      }
      setIsAuthorized(true);
    } catch (error) {
      navigate(createPageUrl("AdminLogin"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }
  
  return (
    <AdminLayout>
      <div className="p-6">
        <StoresManagementContent />
      </div>
    </AdminLayout>
  );
}
