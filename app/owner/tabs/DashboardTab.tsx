'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Building2, Users, DollarSign, Loader2 } from 'lucide-react';

export const DashboardTab: React.FC = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    activeTenants: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, total_units, occupied_units')
          .eq('owner_id', user.id);

        if (props) {
          const totalProps = props.length;
          const totalUnits = props.reduce((acc, curr) => acc + (curr.total_units || 0), 0);
          const occupiedUnits = props.reduce((acc, curr) => acc + (curr.occupied_units || 0), 0);

          setStats({
            totalProperties: totalProps,
            totalUnits,
            occupiedUnits,
            activeTenants: occupiedUnits,
          });
        }
      }
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Properties',
      value: stats.totalProperties,
      icon: Building2,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Total Units',
      value: stats.totalUnits,
      icon: Building2,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Occupied Units',
      value: stats.occupiedUnits,
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Occupancy Rate',
      value: `${stats.totalUnits ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0}%`,
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};