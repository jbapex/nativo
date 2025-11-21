import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Breadcrumbs({ items, showHome = true }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
      {showHome && (
        <>
          <Link
            to={createPageUrl("Home")}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          {items.length > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </>
      )}
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 || !showHome ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : null}
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link
              to={item.href || "#"}
              className="hover:text-blue-600 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

