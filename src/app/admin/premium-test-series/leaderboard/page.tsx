'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { premiumTestService } from '@/lib/services/premiumTests';
import { PremiumTest } from '@/types';
import {
  Target,
  Trophy,
  Medal,
  Award,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  Crown,
  ChevronRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TestWiseLeaderboardPage() {
  const [tests, setTests] = useState<PremiumTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('XHhcURgpp9ishQ12Mtsd');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [testInfo, setTestInfo] = useState<any>(null);
  const [summary, setSummary] = useState<any>({
    totalAttempts: 0,
    highestScore: 0,
    avgScore: 0,
    passPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Load All Available Tests
  useEffect(() => {
    async function loadTests() {
      try {
        const res = await premiumTestService.listTests(1, 100);
        const testList = res.data || [];
        setTests(testList);

        if (testList.length > 0) {
          const hasChem = testList.find((t) => t.id === 'XHhcURgpp9ishQ12Mtsd');
          const defaultId = hasChem ? 'XHhcURgpp9ishQ12Mtsd' : testList[0].id!;
          setSelectedTestId(defaultId);
        }
      } catch (err) {
        console.error('Error loading tests:', err);
      }
    }
    loadTests();
  }, []);

  // 2. Load Leaderboard for Selected Test
  useEffect(() => {
    if (!selectedTestId) return;
    loadLeaderboard(selectedTestId);
  }, [selectedTestId]);

  async function loadLeaderboard(testId: string) {
    try {
      setLoading(true);
      const res = await premiumTestService.getLeaderboard(testId);
      setTestInfo(res.test);
      setLeaderboardData(res.leaderboard || []);
      setSummary(res.summary || {});
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      toast.error('Failed to fetch test leaderboard');
    } finally {
      setLoading(false);
    }
  }

  const selectedTestObj = tests.find((t) => t.id === selectedTestId) || testInfo;

  const filteredRankings = leaderboardData.filter((item) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.userName?.toLowerCase().includes(q) ||
      item.userPhone?.toLowerCase().includes(q)
    );
  });

  const top1 = filteredRankings[0];
  const top2 = filteredRankings[1];
  const top3 = filteredRankings[2];

  return (
    <div className="space-y-6">
      {/* Test Selector & Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Test-Wise Toppers Leaderboard
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Ranked Live
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Select any test to inspect its top-performing rankers, AIR percentiles, accuracy rates, and time taken.
          </p>
        </div>

        {/* Test Dropdown Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">
            Select Test:
          </label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="w-full md:w-80 px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.examGoal || 'General'})
              </option>
            ))}
          </select>

          {selectedTestId && (
            <Link
              href={`/admin/tests/${selectedTestId}/questions`}
              className="p-2.5 rounded-xl border border-gray-300 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
              title="View & Edit Questions for this test"
            >
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </Link>
          )}

          <button
            onClick={() => loadLeaderboard(selectedTestId)}
            className="p-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selected Test Context Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-blue-800">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/20 text-blue-200">
            Selected Test Package
          </span>
          <h3 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
            <span>{selectedTestObj?.title || 'Chemistry Mock Test'}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
              ₹{selectedTestObj?.price ?? 299}
            </span>
          </h3>
          <p className="text-xs text-blue-200 mt-1">
            Goal: <span className="font-semibold text-white">{selectedTestObj?.examGoal || 'SCHOOL EDUCATION'}</span> • {selectedTestObj?.totalQuestions || 50} Questions • {selectedTestObj?.duration || 180} Mins • Total Marks: {selectedTestObj?.totalMarks || 300}
          </p>
        </div>

        <Link
          href={`/admin/tests/${selectedTestId}/questions`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-colors shrink-0 shadow-sm"
        >
          <span>Questions Directory (ID: {selectedTestId})</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Takers</p>
          <h4 className="text-2xl font-black text-gray-900 mt-1">{summary.totalAttempts || 0}</h4>
          <span className="text-[11px] text-blue-600 font-medium">Completed attempts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Highest Marks</p>
          <h4 className="text-2xl font-black text-emerald-600 mt-1">
            {summary.highestScore || 0} <span className="text-xs text-gray-400 font-normal">/ {selectedTestObj?.totalMarks || 300}</span>
          </h4>
          <span className="text-[11px] text-emerald-700 font-medium">AIR #1 Benchmark</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Score</p>
          <h4 className="text-2xl font-black text-amber-600 mt-1">
            {summary.avgScore || 0} <span className="text-xs text-gray-400 font-normal">pts</span>
          </h4>
          <span className="text-[11px] text-amber-700 font-medium">Cohort mean</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pass Rate</p>
          <h4 className="text-2xl font-black text-purple-600 mt-1">{summary.passPercentage || 0}%</h4>
          <span className="text-[11px] text-purple-700 font-medium">&gt;= 40% criteria</span>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {filteredRankings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 - Silver */}
          {top2 ? (
            <div className="bg-gradient-to-b from-slate-100 to-white rounded-2xl p-5 border border-slate-300/80 shadow-xs flex flex-col items-center text-center relative overflow-hidden order-2 md:order-1 mt-0 md:mt-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center font-black text-slate-700 text-lg shadow-sm mb-2">
                🥈 2
              </div>
              <h4 className="font-bold text-gray-900 text-base">{top2.userName}</h4>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{top2.userPhone}</p>
              <div className="mt-3 py-1 px-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xl font-black text-gray-900">{top2.score}</span>
                <span className="text-xs text-gray-500 font-medium"> / {top2.totalMarks || 300}</span>
              </div>
              <div className="mt-2 text-xs text-slate-600 font-semibold flex items-center gap-2">
                <span>Accuracy: {top2.accuracy}%</span>
                <span>•</span>
                <span>Time: {top2.timeTaken}</span>
              </div>
            </div>
          ) : <div className="hidden md:block order-2 md:order-1" />}

          {/* Rank 1 - Gold (Elevated center) */}
          {top1 && (
            <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-6 border-2 border-amber-400 shadow-md flex flex-col items-center text-center relative overflow-hidden order-1 md:order-2">
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-xs">
                <Crown className="w-3 h-3 fill-slate-950" /> TOPPER
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-4 border-amber-200 flex items-center justify-center font-black text-slate-950 text-2xl shadow-md mb-2">
                🥇 1
              </div>
              <h4 className="font-black text-gray-900 text-lg">{top1.userName}</h4>
              <p className="text-xs text-gray-600 font-mono mt-0.5">{top1.userPhone}</p>
              <div className="mt-3 py-1.5 px-4 bg-amber-100/80 rounded-xl border border-amber-300 shadow-xs">
                <span className="text-2xl font-black text-amber-900">{top1.score}</span>
                <span className="text-xs text-amber-700 font-medium"> / {top1.totalMarks || 300} Marks</span>
              </div>
              <div className="mt-2 text-xs text-amber-900 font-bold flex items-center gap-2">
                <span>Accuracy: {top1.accuracy}%</span>
                <span>•</span>
                <span>99.9th Percentile</span>
                <span>•</span>
                <span>Time: {top1.timeTaken}</span>
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {top3 ? (
            <div className="bg-gradient-to-b from-amber-50/50 to-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col items-center text-center relative overflow-hidden order-3 mt-0 md:mt-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-600/40 flex items-center justify-center font-black text-amber-800 text-lg shadow-sm mb-2">
                🥉 3
              </div>
              <h4 className="font-bold text-gray-900 text-base">{top3.userName}</h4>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{top3.userPhone}</p>
              <div className="mt-3 py-1 px-3 bg-white rounded-xl border border-amber-200 shadow-xs">
                <span className="text-xl font-black text-gray-900">{top3.score}</span>
                <span className="text-xs text-gray-500 font-medium"> / {top3.totalMarks || 300}</span>
              </div>
              <div className="mt-2 text-xs text-amber-800 font-semibold flex items-center gap-2">
                <span>Accuracy: {top3.accuracy}%</span>
                <span>•</span>
                <span>Time: {top3.timeTaken}</span>
              </div>
            </div>
          ) : <div className="hidden md:block order-3" />}
        </div>
      )}

      {/* Complete Ranked Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">Ranked Students Roster</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
              {filteredRankings.length} attempts
            </span>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-500">Loading student rankings...</div>
          ) : filteredRankings.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No student attempts found for this test yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-16">Rank</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Percentile</th>
                  <th className="py-3 px-4">Correct / Wrong / Skip</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredRankings.map((item, index) => {
                  const rank = item.rank || index + 1;
                  const isTop3 = rank <= 3;
                  const rankBadge =
                    rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`;

                  return (
                    <tr
                      key={item.id || index}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        rank === 1 ? 'bg-amber-50/30' : isTop3 ? 'bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block font-mono font-black text-xs px-2.5 py-1 rounded-full ${
                            rank === 1
                              ? 'bg-amber-400 text-slate-950 shadow-xs'
                              : rank === 2
                              ? 'bg-slate-300 text-slate-800'
                              : rank === 3
                              ? 'bg-amber-200 text-amber-900'
                              : 'text-gray-500 bg-gray-100'
                          }`}
                        >
                          {rankBadge}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{item.userName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{item.userPhone}</div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-blue-700 text-base">{item.score}</span>
                        <span className="text-xs text-gray-400 font-medium"> / {item.totalMarks}</span>
                      </td>

                      {/* Accuracy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${item.accuracy || 0}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-700 text-xs">{item.accuracy}%</span>
                        </div>
                      </td>

                      {/* Percentile */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200">
                          {item.percentile || 95.0}%
                        </span>
                      </td>

                      {/* Correct / Wrong / Skipped */}
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        <span className="text-emerald-600 font-bold">{item.correctCount || 0}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600 font-bold">{item.incorrectCount || 0}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-gray-500 font-medium">{item.skippedCount || 0}</span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-600">
                        {item.timeTaken || '60m'}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN') : 'Recent'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
