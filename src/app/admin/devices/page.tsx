"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Laptop, Users, LogOut, CheckCircle2, XCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Bi } from "@/components/Bi";
import { BigButton } from "@/components/BigButton";

interface DeviceItem {
  id: string;
  deviceName: string;
  lastSeenAt: string;
  expiresAt: string;
  isRevoked: boolean;
  userAgent?: string;
  user: {
    id: string;
    name_en: string;
    name_te: string;
    role: string;
  };
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/admin/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error("Failed to load devices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const res = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });

      if (res.ok) {
        await fetchDevices();
      }
    } catch (err) {
      console.error("Failed to revoke device:", err);
    }
  };

  return (
    <PageShell
      titleKey="activeDevices"
      showBack={true}
      showHome={true}
      headerAction={
        <Link
          href="/admin/family"
          className="kutumbam-focus min-h-[56px] sm:min-h-[80px] px-3 sm:px-6 py-1 bg-[var(--bg-surface-elevated)] border-4 border-[var(--border-subtle)] hover:border-white rounded-3xl flex items-center gap-2 text-[var(--text-min)] font-bold"
          data-nav-item="true"
        >
          <Users className="w-6 h-6 text-yellow-300" />
          <Bi k="familyMembers" />
        </Link>
      }
      navItems={[
        { key: "library", href: "/admin/library" },
        { key: "uploadMedia", href: "/admin/upload" },
        { key: "familyMembers", href: "/admin/family" },
        { key: "installGuide", href: "/admin/install" },
      ]}
    >
      <div className="flex flex-col gap-8 pb-16">
        <h2 className="text-[var(--text-heading)] font-bold text-white border-b-4 border-[var(--border-subtle)] pb-3">
          <Bi k="activeDevices" />
        </h2>

        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-body)] text-slate-400">
            <Bi k="gettingReady" />
          </div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center bg-[var(--bg-surface)] rounded-3xl border-4 border-[var(--border-subtle)]">
            <p className="text-[var(--text-body)] text-slate-300 font-semibold">
              No registered devices yet. Create a device link to add one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-6 sm:p-8 rounded-3xl border-4 flex flex-col justify-between gap-6 ${
                  device.isRevoked
                    ? "bg-black/60 border-slate-800 opacity-60"
                    : "bg-[var(--bg-surface)] border-[var(--border-thick)]"
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-yellow-300">
                      <Laptop className="w-8 h-8" />
                      <h3 className="text-[var(--text-heading)] font-bold text-white">
                        {device.deviceName}
                      </h3>
                    </div>

                    {device.isRevoked ? (
                      <span className="flex items-center gap-1.5 text-red-400 font-bold text-base px-3 py-1 bg-red-950/80 border border-red-800 rounded-full">
                        <XCircle className="w-5 h-5" /> Revoked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-green-400 font-bold text-base px-3 py-1 bg-green-950/80 border border-green-800 rounded-full">
                        <CheckCircle2 className="w-5 h-5" /> Active
                      </span>
                    )}
                  </div>

                  <p className="text-[var(--text-body)] text-slate-300 font-semibold">
                    <Bi text={{ en: device.user.name_en, te: device.user.name_te }} />
                  </p>

                  <div className="text-base text-slate-400 font-medium flex flex-col gap-1 mt-2">
                    <span>Last active: {new Date(device.lastSeenAt).toLocaleString()}</span>
                    <span>Expires: {new Date(device.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {!device.isRevoked && (
                  <BigButton
                    k="signOutDevice"
                    icon={<LogOut className="w-8 h-8" />}
                    onClick={() => handleRevokeDevice(device.id)}
                    variant="danger"
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
