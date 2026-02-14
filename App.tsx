import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  DollarSign,
  Flame,
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  Search,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { generateScript, researchTopics, type ResearchTopic } from './services/contentEmpireService';

type Page = 'dashboard' | 'research' | 'studio' | 'schedule' | 'analytics' | 'monitor' | 'alerts';
type StudioTab = 'script' | 'voice' | 'visuals' | 'preview';
type AnalyticsPlatform = 'All' | 'YouTube' | 'Instagram' | 'Facebook' | 'Twitter';
type AnalyticsRange = 'Last 7 days' | 'Last 30 days' | 'Last 90 days';

type Project = {
  id: string;
  topicId: string;
  topicTitle: string;
  script: string;
  visuals: string[];
  status: 'draft' | 'ready' | 'scheduled';
};

type ScheduleItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  platforms: string[];
  publishDate: string;
  publishTime: string;
};

const PLATFORMS = ['YouTube', 'Instagram', 'Facebook', 'Twitter'];
const PLATFORM_COLORS: Record<string, string> = {
  YouTube: 'bg-red-100 text-red-700',
  Instagram: 'bg-pink-100 text-pink-700',
  Facebook: 'bg-blue-100 text-blue-700',
  Twitter: 'bg-sky-100 text-sky-700',
};

const baseAnalytics = [
  { name: 'W1', views: 8200, engagement: 640, revenue: 260 },
  { name: 'W2', views: 12400, engagement: 980, revenue: 390 },
  { name: 'W3', views: 16800, engagement: 1220, revenue: 520 },
  { name: 'W4', views: 22100, engagement: 1640, revenue: 780 },
];

const platformCompare = [
  { name: 'YouTube', value: 52 },
  { name: 'Instagram', value: 21 },
  { name: 'Facebook', value: 16 },
  { name: 'Twitter', value: 11 },
];

const topContentSeed = [
  { title: 'AI Side Hustles 2026', platform: 'YouTube', views: 18400, engagementRate: '7.2%', revenue: 480 },
  { title: '3 Viral Hooks in 30 Seconds', platform: 'Instagram', views: 11200, engagementRate: '8.9%', revenue: 190 },
  { title: 'Faceless Channel Blueprint', platform: 'YouTube', views: 9600, engagementRate: '6.4%', revenue: 260 },
  { title: 'Affiliate Funnel Breakdown', platform: 'Facebook', views: 7400, engagementRate: '5.3%', revenue: 140 },
];

const competitorChannels = [
  { name: 'GrowthLab AI', subscribers: '1.1M', weeklyViews: '420K', momentum: '+8%' },
  { name: 'ContentOS Daily', subscribers: '560K', weeklyViews: '190K', momentum: '+11%' },
  { name: 'CreatorOps Pro', subscribers: '340K', weeklyViews: '123K', momentum: '+4%' },
];

const alertTemplates = [
  { name: 'Campaign started', channel: 'WhatsApp', status: 'Sent' },
  { name: 'Revenue milestone hit', channel: 'WhatsApp', status: 'Queued' },
  { name: 'Post published to YouTube', channel: 'WhatsApp', status: 'Sent' },
];

const COLORS = ['#667eea', '#764ba2', '#10b981', '#38bdf8'];
const STORAGE_KEY = 'ai-content-empire-state-v2';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('dashboard');
  const [studioTab, setStudioTab] = useState<StudioTab>('script');
  const [category, setCategory] = useState('AI business');
  const [audience, setAudience] = useState('Global');
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ResearchTopic | null>(null);
  const [script, setScript] = useState('Select a topic and generate a script.');
  const [voice, setVoice] = useState('en-US-Neural2-J');
  const [visuals, setVisuals] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['YouTube']);
  const [publishTime, setPublishTime] = useState('09:00');
  const [toast, setToast] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [analyticsPlatform, setAnalyticsPlatform] = useState<AnalyticsPlatform>('All');
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('Last 30 days');
  const [loading, setLoading] = useState({ research: false, script: false, voice: false, visuals: false });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.topics)) setTopics(parsed.topics);
      if (parsed.selectedTopic) setSelectedTopic(parsed.selectedTopic);
      if (Array.isArray(parsed.projects)) setProjects(parsed.projects);
      if (Array.isArray(parsed.schedule)) setSchedule(parsed.schedule);
    } catch (error) {
      console.error('Failed to restore local state', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ topics, selectedTopic, projects, schedule }));
  }, [topics, selectedTopic, projects, schedule]);

  const pushToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const rangeMultiplier = analyticsRange === 'Last 7 days' ? 0.32 : analyticsRange === 'Last 30 days' ? 1 : 2.7;

  const analyticsGrowth = useMemo(() => {
    const platformMultiplier =
      analyticsPlatform === 'All' ? 1 : analyticsPlatform === 'YouTube' ? 1 : analyticsPlatform === 'Instagram' ? 0.58 : analyticsPlatform === 'Facebook' ? 0.44 : 0.32;

    return baseAnalytics.map((point) => ({
      ...point,
      views: Math.round(point.views * platformMultiplier * rangeMultiplier),
      engagement: Math.round(point.engagement * platformMultiplier * rangeMultiplier),
      revenue: Math.round(point.revenue * platformMultiplier * rangeMultiplier),
    }));
  }, [analyticsPlatform, rangeMultiplier]);

  const topContent = useMemo(() => {
    return topContentSeed
      .filter((item) => analyticsPlatform === 'All' || item.platform === analyticsPlatform)
      .map((item) => ({ ...item, views: Math.round(item.views * rangeMultiplier), revenue: Math.round(item.revenue * rangeMultiplier) }));
  }, [analyticsPlatform, rangeMultiplier]);

  const viralAverage = useMemo(() => {
    if (!topics.length) return 0;
    return Math.round(topics.reduce((acc, topic) => acc + topic.viralScore, 0) / topics.length);
  }, [topics]);

  const runResearch = async () => {
    setLoading((prev) => ({ ...prev, research: true }));
    const result = await researchTopics(category, audience);
    setTopics(result);
    setSelectedTopic(result[0] ?? null);
    setLoading((prev) => ({ ...prev, research: false }));
    pushToast(`Research completed for ${audience}.`);
  };

  const createScript = async () => {
    if (!selectedTopic) return;
    setLoading((prev) => ({ ...prev, script: true }));
    const generated = await generateScript(selectedTopic.title, selectedTopic.source, audience);
    setScript(generated);

    setProjects((prev) => [
      {
        id: `project-${Date.now()}`,
        topicId: selectedTopic.id,
        topicTitle: selectedTopic.title,
        script: generated,
        visuals: [],
        status: 'draft',
      },
      ...prev,
    ]);

    setLoading((prev) => ({ ...prev, script: false }));
    pushToast('Script generated.');
  };

  const createVoice = async () => {
    setLoading((prev) => ({ ...prev, voice: true }));
    await wait(650);
    setLoading((prev) => ({ ...prev, voice: false }));
    pushToast(`Voice generated with ${voice}.`);
  };

  const createVisuals = async () => {
    setLoading((prev) => ({ ...prev, visuals: true }));
    await wait(900);
    setVisuals(Array.from({ length: 6 }).map((_, i) => `https://picsum.photos/seed/scene-${i + 1}/800/450`));
    setStudioTab('visuals');
    setLoading((prev) => ({ ...prev, visuals: false }));
    pushToast('Visual scenes generated.');
  };

  const addSchedule = () => {
    if (!projects.length) {
      pushToast('Create a project first in Studio.');
      return;
    }

    setSchedule((prev) => [
      {
        id: `sch-${Date.now()}`,
        projectId: projects[0].id,
        projectTitle: projects[0].topicTitle,
        platforms: selectedPlatforms,
        publishDate: selectedDate.toISOString().slice(0, 10),
        publishTime,
      },
      ...prev,
    ]);
    setShowScheduleModal(false);
    pushToast('Post scheduled successfully.');
  };

  const exportCsv = () => {
    const rows = ['week,views,engagement,revenue', ...analyticsGrowth.map((entry) => `${entry.name},${entry.views},${entry.engagement},${entry.revenue}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${analyticsPlatform}-${analyticsRange.replace(/\s+/g, '-').toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushToast('CSV report exported.');
  };

  return (
    <div className="h-screen bg-[#f9fafb] text-slate-800 flex relative">
      {toast && <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>}

      <aside className="w-64 border-r bg-white shadow-sm p-4">
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl p-4 font-bold">AI Content Empire</div>
        <nav className="mt-6 space-y-2 text-sm">
          {[
            ['dashboard', LayoutDashboard, 'Dashboard'],
            ['research', Search, 'Research'],
            ['studio', Wand2, 'Studio'],
            ['schedule', Calendar, 'Schedule'],
            ['analytics', Sparkles, 'Analytics'],
            ['monitor', Eye, 'Monitor'],
            ['alerts', MessageCircle, 'WhatsApp'],
          ].map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setPage(key as Page)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${page === key ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-20">
          <h1 className="font-semibold text-lg capitalize">{page}</h1>
          <div className="flex items-center gap-4"><Bell size={18} /><div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2]" /></div>
        </header>

        <div className="p-6 space-y-6">
          {page === 'dashboard' && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Followers', '124,420', Lightbulb],
                  ['Scheduled Days', String(schedule.length), Calendar],
                  ['Revenue', '$12,890', DollarSign],
                  ['Viral Score', String(viralAverage || 84), Flame],
                ].map(([name, value, Icon]) => (
                  <div key={name} className="bg-white rounded-xl shadow p-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-500">{name}</p>
                      <Icon size={16} className="text-[#10b981]" />
                    </div>
                    <p className="text-2xl font-bold mt-2">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <ul className="space-y-2 text-sm">
                    {['Research completed', 'Script generated', 'WhatsApp alert sent'].map((item) => (
                      <li key={item} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#10b981]" />{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold mb-3">Upcoming Schedule</h3>
                  {schedule.length === 0 ? (
                    <p className="text-sm text-slate-500">No scheduled posts yet.</p>
                  ) : (
                    schedule.slice(0, 5).map((item) => (
                      <div key={item.id} className="border-b py-2">
                        <div className="flex justify-between text-sm"><span>{item.projectTitle}</span><span>{item.publishDate} {item.publishTime}</span></div>
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {item.platforms.map((platform) => (
                            <span key={platform} className={`text-[11px] px-2 py-0.5 rounded ${PLATFORM_COLORS[platform] || 'bg-slate-100 text-slate-600'}`}>{platform}</span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {page === 'research' && (
            <div className="bg-white rounded-xl shadow p-4 space-y-4">
              <div className="grid md:grid-cols-4 gap-3">
                <input value={category} onChange={(event) => setCategory(event.target.value)} className="border rounded-lg px-3 py-2" placeholder="Category/Niche" />
                <select value={audience} onChange={(event) => setAudience(event.target.value)} className="border rounded-lg px-3 py-2">
                  <option>Global</option>
                  <option>North America</option>
                  <option>Europe</option>
                  <option>Asia</option>
                </select>
                <button onClick={runResearch} className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg px-4 py-2">
                  {loading.research ? 'Researching...' : 'Research'}
                </button>
              </div>

              <div className="max-h-[60vh] overflow-auto border rounded-lg">
                {topics.map((topic, index) => (
                  <div key={topic.id} className="p-3 border-b flex justify-between items-start">
                    <div>
                      <p className="font-semibold">#{index + 1} {topic.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{topic.description}</p>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded mt-2 inline-block">{topic.source}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#10b981]">{topic.viralScore}</p>
                      <button onClick={() => { setSelectedTopic(topic); setPage('studio'); setStudioTab('script'); }} className="text-xs mt-1 px-2 py-1 bg-indigo-50 rounded">Use Topic</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === 'studio' && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex gap-2 mb-4">
                {(['script', 'voice', 'visuals', 'preview'] as StudioTab[]).map((tab) => (
                  <button key={tab} onClick={() => setStudioTab(tab)} className={`px-3 py-1 rounded ${studioTab === tab ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100'}`}>{tab}</button>
                ))}
              </div>

              {studioTab === 'script' && (
                <div className="space-y-3">
                  <p className="text-sm">Topic: <strong>{selectedTopic?.title || 'None selected'}</strong></p>
                  <button onClick={createScript} className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded px-3 py-2">{loading.script ? 'Generating...' : 'Generate Script (Gemini)'}</button>
                  <textarea value={script} onChange={(event) => setScript(event.target.value)} className="w-full h-64 border rounded-lg p-3" />
                  <p className="text-xs text-slate-500">Word Count: {script.split(/\s+/).filter(Boolean).length}</p>
                </div>
              )}

              {studioTab === 'voice' && (
                <div className="space-y-3">
                  <select value={voice} onChange={(event) => setVoice(event.target.value)} className="border rounded-lg px-3 py-2">
                    <option>en-US-Neural2-J</option>
                    <option>en-US-Neural2-A</option>
                    <option>en-GB-Neural2-D</option>
                  </select>
                  <button onClick={createVoice} className="bg-[#10b981] text-white rounded px-3 py-2">{loading.voice ? 'Generating Voice...' : 'Generate Voice (Google TTS)'}</button>
                  <audio controls className="w-full"><source src="https://www.w3schools.com/html/horse.mp3" /></audio>
                </div>
              )}

              {studioTab === 'visuals' && (
                <div className="space-y-3">
                  <button onClick={createVisuals} className="bg-[#10b981] text-white rounded px-3 py-2">{loading.visuals ? 'Generating Scenes...' : 'Generate Visuals (Stable Diffusion)'}</button>
                  <div className="grid md:grid-cols-3 gap-3">{visuals.map((image) => <img key={image} src={image} className="rounded-lg shadow" alt="Generated scene" />)}</div>
                </div>
              )}

              {studioTab === 'preview' && (
                <div className="text-sm space-y-2">
                  <p className="font-semibold">Combined Preview Timeline</p>
                  <div className="h-40 rounded-lg bg-slate-100 flex items-center justify-center"><Clock3 className="mr-2" /> Script + Voice + Visual Assembly</div>
                </div>
              )}
            </div>
          )}

          {page === 'schedule' && (
            <div className="grid lg:grid-cols-[1fr_360px] gap-4">
              <div className="bg-white rounded-xl shadow p-4"><ReactCalendar onChange={(date) => { setSelectedDate(date as Date); setShowScheduleModal(true); }} value={selectedDate} /></div>
              <div className="bg-white rounded-xl shadow p-4 space-y-3">
                <h3 className="font-semibold">Scheduled Posts</h3>
                {schedule.length === 0 ? (
                  <p className="text-sm text-slate-500">Click a calendar date to add a scheduled post.</p>
                ) : (
                  schedule.map((item) => (
                    <div key={item.id} className="border rounded-lg p-2 text-sm">
                      <p className="font-medium">{item.projectTitle}</p>
                      <p className="text-slate-500">{item.publishDate} {item.publishTime}</p>
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {item.platforms.map((platform) => (
                          <span key={platform} className={`text-[11px] px-2 py-0.5 rounded ${PLATFORM_COLORS[platform] || 'bg-slate-100 text-slate-600'}`}>{platform}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {page === 'analytics' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <div className="flex gap-2">
                  {(['All', 'YouTube', 'Instagram', 'Facebook', 'Twitter'] as AnalyticsPlatform[]).map((platform) => (
                    <button key={platform} onClick={() => setAnalyticsPlatform(platform)} className={`px-3 py-1 rounded text-sm ${analyticsPlatform === platform ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100'}`}>{platform}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select value={analyticsRange} onChange={(event) => setAnalyticsRange(event.target.value as AnalyticsRange)} className="border rounded px-2 py-1 text-sm">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                  <button onClick={exportCsv} className="flex items-center gap-1 text-sm bg-[#10b981] text-white px-3 py-1 rounded"><Download size={14} /> Export CSV</button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  ['Views', `${analyticsGrowth.reduce((acc, row) => acc + row.views, 0).toLocaleString()}`],
                  ['Engagement', `${analyticsGrowth.reduce((acc, row) => acc + row.engagement, 0).toLocaleString()}`],
                  ['Revenue', `$${analyticsGrowth.reduce((acc, row) => acc + row.revenue, 0).toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white rounded-xl shadow p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow p-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#667eea" strokeWidth={2} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl shadow p-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformCompare}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">{platformCompare.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformCompare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {platformCompare.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-semibold mb-3">Top Content</h3>
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2">Title</th>
                        <th className="text-left px-3 py-2">Platform</th>
                        <th className="text-left px-3 py-2">Views</th>
                        <th className="text-left px-3 py-2">Engagement</th>
                        <th className="text-left px-3 py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topContent.map((item) => (
                        <tr key={`${item.title}-${item.platform}`} className="border-t">
                          <td className="px-3 py-2">{item.title}</td>
                          <td className="px-3 py-2">{item.platform}</td>
                          <td className="px-3 py-2">{item.views.toLocaleString()}</td>
                          <td className="px-3 py-2">{item.engagementRate}</td>
                          <td className="px-3 py-2">${item.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {page === 'monitor' && (
            <div className="bg-white rounded-xl shadow p-4 space-y-3">
              <h3 className="font-semibold">Competitor Monitor</h3>
              <p className="text-sm text-slate-500">Track benchmark channels and compare growth trends.</p>
              <div className="overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="text-left px-3 py-2">Channel</th><th className="text-left px-3 py-2">Subscribers</th><th className="text-left px-3 py-2">Weekly Views</th><th className="text-left px-3 py-2">Momentum</th></tr></thead>
                  <tbody>{competitorChannels.map((competitor) => <tr key={competitor.name} className="border-t"><td className="px-3 py-2">{competitor.name}</td><td className="px-3 py-2">{competitor.subscribers}</td><td className="px-3 py-2">{competitor.weeklyViews}</td><td className="px-3 py-2 text-[#10b981] font-medium">{competitor.momentum}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'alerts' && (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow p-4 space-y-3">
                <h3 className="font-semibold">Twilio WhatsApp Notifications</h3>
                <p className="text-sm text-slate-500">Configure outbound campaign alerts and milestones.</p>
                <input placeholder="Twilio Account SID" className="border rounded-lg px-3 py-2 w-full" />
                <input placeholder="Twilio Auth Token" className="border rounded-lg px-3 py-2 w-full" type="password" />
                <input placeholder="WhatsApp destination number" className="border rounded-lg px-3 py-2 w-full" />
                <button className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded px-3 py-2" onClick={() => pushToast('Twilio settings saved (prototype).')}>Save Integration</button>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-semibold mb-3">Alert Activity</h3>
                {alertTemplates.map((item) => (
                  <div key={item.name} className="border-b py-2 text-sm flex items-center justify-between">
                    <div><p className="font-medium">{item.name}</p><p className="text-slate-500">{item.channel}</p></div>
                    <span className="text-xs px-2 py-1 rounded bg-slate-100">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-semibold">Add Scheduled Post</h3><button onClick={() => setShowScheduleModal(false)}><X size={16} /></button></div>
            <p className="text-sm text-slate-500">Date: {selectedDate.toDateString()}</p>
            <div className="text-sm">Project: <strong>{projects[0]?.topicTitle || 'No project yet'}</strong></div>
            <div className="space-y-2 text-sm">
              {PLATFORMS.map((platform) => (
                <label key={platform} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform)}
                    onChange={(event) =>
                      setSelectedPlatforms((prev) => (event.target.checked ? [...prev, platform] : prev.filter((name) => name !== platform)))
                    }
                  />
                  {platform}
                </label>
              ))}
            </div>
            <input type="time" value={publishTime} onChange={(event) => setPublishTime(event.target.value)} className="border rounded-lg px-2 py-1" />
            <button onClick={addSchedule} className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded px-3 py-2">Save Schedule</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
