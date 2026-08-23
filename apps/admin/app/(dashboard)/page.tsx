"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface Stats {
  products: number;
  coupons: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [products, coupons] = await Promise.all([
        api.get<{ pagination: { total: number } }>("/api/products?limit=1&status=all"),
        api.get<{ pagination: { total: number } }>("/api/coupons?limit=1"),
      ]);
      setStats({ products: products.pagination.total, coupons: coupons.pagination.total });
    }
    load().catch(() => setStats({ products: 0, coupons: 0 }));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Products</span>
          <span className="stat-value">{stats ? stats.products : "…"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Coupons</span>
          <span className="stat-value">{stats ? stats.coupons : "…"}</span>
        </div>
      </div>
    </div>
  );
}
