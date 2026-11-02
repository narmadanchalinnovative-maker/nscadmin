"use client";

import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function P2PNetworkPage() {
  const [swarmStats, setSwarmStats] = useState<any>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to VPS backend Socket.io
    const socket = io();

    socket.on("connect", () => {
      setConnected(true);
      // Join admin room to receive P2P updates
      socket.emit("join-admin-room");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("p2p-swarm-update", (data) => {
      setSwarmStats(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">P2P Mesh Network</h1>
          <p className="text-gray-500 mt-2">
            Monitor real-time WebRTC connections and KVM server offloading.
          </p>
        </div>
        <div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${connected ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
            {connected ? "Connected to Tracker" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(swarmStats || {}).length === 0 ? (
          <div className="col-span-full p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No active P2P Swarms right now.</p>
          </div>
        ) : (
          Object.keys(swarmStats || {}).map((classId) => {
            const stat = swarmStats?.[classId] || {};
            const totalPeers = stat.totalPeers || 0;
            const originPeers = stat.originPeers || 0;
            const meshPeers = stat.meshPeers || 0;
            return (
              <div key={classId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-lg font-semibold flex justify-between items-center text-gray-900">
                    Class ID
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-600">
                      {String(classId || '').split('-')[0]}...
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Live Swarm Statistics</p>
                </div>
                <div className="p-5 space-y-5">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-semibold text-blue-900">Total Peers</span>
                    <span className="text-xl font-bold text-blue-700">{totalPeers}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-xs font-semibold text-red-600 mb-1 text-center">Fetching from KVM</span>
                      <span className="text-2xl font-bold text-red-700">{originPeers}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-100">
                      <span className="text-xs font-semibold text-green-600 mb-1 text-center">Fetching from Peers</span>
                      <span className="text-2xl font-bold text-green-700">{meshPeers}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Bandwidth Saved</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-green-600 text-base">
                        {totalPeers > 0 ? Math.round((meshPeers / totalPeers) * 100) : 0}%
                      </span> of traffic is offloaded to the P2P Mesh.
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
