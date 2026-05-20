// ---------- Sparkline path helpers ----------
function buildSparkPaths(values, w, h, pad = 2) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map(([x, y], i) => (i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : `L${x.toFixed(2)},${y.toFixed(2)}`)).join(' ');
  const area = `${line} L${pts[pts.length-1][0].toFixed(2)},${(h - pad).toFixed(2)} L${pts[0][0].toFixed(2)},${(h - pad).toFixed(2)} Z`;
  const last = pts[pts.length - 1];
  return { line, area, last };
}
const TONE = {
  emerald: { stroke: 'rgb(16 185 129)', grad: 'gEmerald' },
  rose:    { stroke: 'rgb(225 29 72)',  grad: 'gRose' },
  slate:   { stroke: 'rgb(15 23 42)',   grad: 'gSlate' },
  amber:   { stroke: 'rgb(217 119 6)',  grad: 'gAmber' },
  indigo:  { stroke: 'rgb(79 70 229)',  grad: 'gIndigo' },
};
function spark(values, tone, w = 240, h = 44) {
  const p = TONE[tone] || TONE.slate;
  const { line, area, last } = buildSparkPaths(values, w, h, 2);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" class="block">
    <path d="${area}" fill="url(#${p.grad})"/>
    <path d="${line}" fill="none" stroke="${p.stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="2.2" fill="white" stroke="${p.stroke}" stroke-width="1.5"/>
  </svg>`;
}
function delta(pct) {
  if (!pct) return `<span class="inline-flex items-center gap-0.5 px-1.5 h-[20px] rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 num-tabular">
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>0.0%</span>`;
  const up = pct > 0;
  const tone = up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50';
  const arrow = up
    ? `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>`
    : `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  return `<span class="inline-flex items-center gap-0.5 px-1.5 h-[20px] rounded-full text-[11px] font-semibold ${tone} num-tabular">${arrow}${up ? '+' : ''}${pct.toFixed(1)}%</span>`;
}
const fmt = v => v.toLocaleString();

// ---------- KPI cards ----------
const ICONS = {
  folder: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  shield: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  upload: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  drive:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>`,
};

const STATS = [
  { title:'Total Documents', subtitle:'across all categories', icon:ICONS.folder, iconBg:'bg-slate-100', iconColor:'text-slate-700',
    value:1284, pct:6.2, tone:'emerald', spark:[1100,1130,1150,1170,1185,1200,1215,1230,1245,1260,1272,1284], sub:'+76 added this month' },
  { title:'Pending Verification', subtitle:'awaiting HR review', icon:ICONS.shield, iconBg:'bg-amber-50', iconColor:'text-amber-600',
    value:38, pct:-12.3, tone:'amber', spark:[58,55,52,50,48,46,45,43,42,40,39,38], sub:'12 over 3 days old' },
  { title:'Recently Uploaded', subtitle:'last 7 days', icon:ICONS.upload, iconBg:'bg-indigo-50', iconColor:'text-indigo-600',
    value:142, pct:24.8, tone:'indigo', spark:[12,18,20,16,22,24,28,30,32,28,34,36], sub:'Peak on Wed (36)' },
];

function statCard(s) {
  return `<div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5 flex flex-col">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-2.5">
        <span class="w-8 h-8 rounded-lg ${s.iconBg} ${s.iconColor} grid place-items-center">${s.icon}</span>
        <div>
          <p class="text-[12.5px] font-medium text-slate-700 leading-none">${s.title}</p>
          <p class="text-[10.5px] text-slate-500 mt-1 leading-none">${s.subtitle}</p>
        </div>
      </div>
      <button class="text-slate-400 hover:text-slate-700" aria-label="Options">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
    </div>
    <div class="flex items-end justify-between gap-3 mb-3">
      <p class="text-[34px] leading-none font-semibold tracking-tight text-slate-900 num-tabular">${fmt(s.value)}</p>
      ${delta(s.pct)}
    </div>
    <div class="-mx-1 -mb-1">${spark(s.spark, s.tone)}</div>
    <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
      <span class="text-slate-500">${s.sub}</span>
      <span class="text-slate-400">vs last 30d</span>
    </div>
  </div>`;
}

// Storage card (different — uses radial-style fill instead of sparkline)
const storageCard = `<div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5 flex flex-col">
  <div class="flex items-start justify-between mb-4">
    <div class="flex items-center gap-2.5">
      <span class="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 grid place-items-center">${ICONS.drive}</span>
      <div>
        <p class="text-[12.5px] font-medium text-slate-700 leading-none">Storage Used</p>
        <p class="text-[10.5px] text-slate-500 mt-1 leading-none">of 25 GB plan</p>
      </div>
    </div>
    <button class="text-[11px] font-medium text-slate-500 hover:text-slate-900">Upgrade →</button>
  </div>
  <div class="flex items-end justify-between gap-3 mb-3">
    <p class="text-[34px] leading-none font-semibold tracking-tight text-slate-900 num-tabular">14.2<span class="text-[14px] font-medium text-slate-400 ml-1">GB</span></p>
    <span class="inline-flex items-center gap-0.5 px-1.5 h-[20px] rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 num-tabular">57%</span>
  </div>
  <div class="h-2 rounded-full bg-slate-100 overflow-hidden mb-2 flex">
    <div class="h-full bg-violet-600" style="width:34%" title="PDFs"></div>
    <div class="h-full bg-indigo-500" style="width:14%" title="Images"></div>
    <div class="h-full bg-emerald-500" style="width:6%" title="Spreadsheets"></div>
    <div class="h-full bg-amber-500" style="width:3%" title="Other"></div>
  </div>
  <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-y-1.5 text-[11px]">
    <span class="flex items-center gap-1.5 text-slate-500"><span class="w-1.5 h-1.5 rounded-sm bg-violet-600"></span>PDFs <span class="num-tabular text-slate-700 ml-auto pr-2">8.6 GB</span></span>
    <span class="flex items-center gap-1.5 text-slate-500"><span class="w-1.5 h-1.5 rounded-sm bg-indigo-500"></span>Images <span class="num-tabular text-slate-700 ml-auto">3.5 GB</span></span>
    <span class="flex items-center gap-1.5 text-slate-500"><span class="w-1.5 h-1.5 rounded-sm bg-emerald-500"></span>Sheets <span class="num-tabular text-slate-700 ml-auto pr-2">1.4 GB</span></span>
    <span class="flex items-center gap-1.5 text-slate-500"><span class="w-1.5 h-1.5 rounded-sm bg-amber-500"></span>Other <span class="num-tabular text-slate-700 ml-auto">0.7 GB</span></span>
  </div>
</div>`;

document.getElementById('stat-cards').innerHTML = STATS.map(statCard).join('') + storageCard;

// ---------- Insights ----------
const CATEGORIES = [
  { name:'Contracts',         count:412, share:32, tone:'bg-indigo-500' },
  { name:'Payslips',          count:286, share:22, tone:'bg-emerald-500' },
  { name:'Policies',          count:178, share:14, tone:'bg-amber-500' },
  { name:'IDs & Licenses',    count:154, share:12, tone:'bg-rose-500' },
  { name:'Certificates',      count:122, share:10, tone:'bg-violet-500' },
  { name:'Other',             count:132, share:10, tone:'bg-slate-400' },
];
document.getElementById('insight-categories').innerHTML = `<div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5 h-full">
  <div class="flex items-center justify-between mb-4">
    <div>
      <p class="text-[12.5px] font-semibold text-slate-800 leading-none">Category breakdown</p>
      <p class="text-[10.5px] text-slate-500 mt-1 leading-none">1,284 total · May 2026</p>
    </div>
    <button class="text-[11px] font-medium text-slate-500 hover:text-slate-900">Manage →</button>
  </div>
  <div class="space-y-2.5">
    ${CATEGORIES.map(c => `<div>
      <div class="flex items-center justify-between text-[11.5px] mb-1">
        <div class="flex items-center gap-2 min-w-0"><span class="w-2 h-2 rounded-full ${c.tone}"></span><span class="truncate text-slate-700">${c.name}</span></div>
        <span class="num-tabular text-slate-500 font-mono shrink-0 pl-2">${c.count}</span>
      </div>
      <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full ${c.tone} rounded-full" style="width:${c.share * 2.8}%"></div></div>
    </div>`).join('')}
  </div>
</div>`;

const ACTIVITY = [
  { who:'Hanis Ezzati', init:'HE', tone:'from-violet-500 to-violet-700', action:'uploaded', target:'Employment_Contract_2026.pdf', when:'2 min ago', dot:'bg-emerald-500' },
  { who:'Daniel Aiman', init:'DA', tone:'from-amber-500 to-amber-700', action:'verified', target:'NDA — Acme Corp.pdf', when:'18 min ago', dot:'bg-indigo-500' },
  { who:'Priya Sundram', init:'PS', tone:'from-emerald-500 to-emerald-700', action:'requested signature on', target:'Renewal Letter Q3.docx', when:'1 hr ago', dot:'bg-amber-500' },
  { who:'Aisha Rahman', init:'AR', tone:'from-indigo-500 to-indigo-700', action:'shared', target:'Payslip_May_2026.zip', when:'3 hr ago', dot:'bg-slate-500' },
  { who:'Wei Jian Tan', init:'WT', tone:'from-rose-500 to-rose-700', action:'archived', target:'Old_Policy_v3.pdf', when:'Yesterday', dot:'bg-slate-500' },
];
document.getElementById('insight-activity').innerHTML = `<div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5 h-full">
  <div class="flex items-center justify-between mb-4">
    <div>
      <p class="text-[12.5px] font-semibold text-slate-800 leading-none">Recent activity</p>
      <p class="text-[10.5px] text-slate-500 mt-1 leading-none">Across your team today</p>
    </div>
    <button class="text-[11px] font-medium text-slate-500 hover:text-slate-900">Audit log →</button>
  </div>
  <div class="space-y-3">
    ${ACTIVITY.map(a => `<div class="flex items-start gap-2.5">
      <span class="w-7 h-7 rounded-full bg-gradient-to-br ${a.tone} text-white text-[10.5px] font-semibold grid place-items-center shrink-0 mt-0.5">${a.init}</span>
      <div class="min-w-0 flex-1">
        <p class="text-[12px] text-slate-700 leading-snug"><span class="font-semibold text-slate-900">${a.who}</span> <span class="text-slate-500">${a.action}</span> <span class="font-medium text-slate-800 truncate">${a.target}</span></p>
        <p class="text-[10.5px] text-slate-400 mt-0.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${a.dot}"></span>${a.when}</p>
      </div>
    </div>`).join('')}
  </div>
</div>`;

document.getElementById('insight-actions').innerHTML = `<div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5 h-full flex flex-col">
  <div class="flex items-center justify-between mb-4">
    <div>
      <p class="text-[12.5px] font-semibold text-slate-800 leading-none">Quick actions</p>
      <p class="text-[10.5px] text-slate-500 mt-1 leading-none">Common document tasks</p>
    </div>
    <span class="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>Healthy</span>
  </div>
  <div class="grid grid-cols-2 gap-2 mb-3">
    <button class="flex items-center gap-2 h-11 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-semibold">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      Upload
    </button>
    <button class="flex items-center gap-2 h-11 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-medium text-slate-700">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      New folder
    </button>
    <button class="flex items-center gap-2 h-11 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-medium text-slate-700">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
      Request file
    </button>
    <button class="flex items-center gap-2 h-11 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-medium text-slate-700">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      eSign
    </button>
  </div>
  <div class="mt-auto pt-3 border-t border-slate-100">
    <div class="flex items-center justify-between text-[11px]">
      <span class="flex items-center gap-1.5 text-amber-600"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span class="font-medium">5 docs expire in 30 days</span></span>
      <button class="text-slate-500 hover:text-slate-900 font-medium">Review →</button>
    </div>
  </div>
</div>`;

// ---------- Pill tabs ----------
const TABS = [
  { key:'all',    label:'All Documents', count:1284, icon:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>` },
  { key:'pending',label:'Pending Verification', count:38,  dot:'bg-amber-500' },
  { key:'verified',label:'Verified', count:1118, dot:'bg-emerald-500' },
  { key:'expiring',label:'Expiring Soon', count:24, dot:'bg-rose-500' },
  { key:'shared', label:'Shared with me', count:46, dot:'bg-indigo-500' },
  { key:'archive',label:'Archived', count:58, dot:'bg-slate-500' },
];
function renderPills(activeKey) {
  document.getElementById('status-pills').innerHTML = TABS.map(t => {
    const active = t.key === activeKey;
    return `<button data-pill="${t.key}" class="inline-flex items-center gap-1.5 h-9 pl-2.5 pr-2 rounded-full text-[12.5px] font-medium transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}">
      ${t.dot ? `<span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-white/80' : t.dot}"></span>` : `<span class="${active ? 'text-white/80' : 'text-slate-500'}">${t.icon}</span>`}
      <span>${t.label}</span>
      <span class="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold num-tabular ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}">${t.count}</span>
    </button>`;
  }).join('');
  document.querySelectorAll('[data-pill]').forEach(b => b.addEventListener('click', () => renderPills(b.dataset.pill)));
}
renderPills('all');

// ---------- Documents table ----------
const FILE_ICONS = {
  pdf: { bg:'bg-rose-50',    color:'text-rose-600',    label:'PDF' },
  doc: { bg:'bg-indigo-50',  color:'text-indigo-600',  label:'DOC' },
  xls: { bg:'bg-emerald-50', color:'text-emerald-600', label:'XLS' },
  zip: { bg:'bg-amber-50',   color:'text-amber-600',   label:'ZIP' },
  img: { bg:'bg-violet-50',  color:'text-violet-600',  label:'IMG' },
};
function fileIcon(kind) {
  const f = FILE_ICONS[kind] || FILE_ICONS.pdf;
  return `<span class="w-9 h-10 rounded-md ${f.bg} ${f.color} grid place-items-center text-[9.5px] font-bold tracking-wide font-mono shadow-sm border border-current/10 shrink-0">${f.label}</span>`;
}

const DOCS = [
  { name:'Employment_Contract_2026_Hanis_Ezzati.pdf', kind:'pdf', cat:'Contracts', catTone:'bg-indigo-100 text-indigo-700',
    owner:'Hanis Ezzati', init:'HE', tone:'from-violet-500 to-violet-700', size:'2.4 MB', modified:'2 min ago',
    status:'Pending', statusTone:'bg-amber-50 text-amber-700 ring-amber-200', shared:3, sel:false, expiring:false, version:'v3' },
  { name:'NDA — Acme Corp.pdf', kind:'pdf', cat:'Contracts', catTone:'bg-indigo-100 text-indigo-700',
    owner:'Daniel Aiman', init:'DA', tone:'from-amber-500 to-amber-700', size:'820 KB', modified:'18 min ago',
    status:'Verified', statusTone:'bg-emerald-50 text-emerald-700 ring-emerald-200', shared:2, sel:true, expiring:false, version:'v1' },
  { name:'Renewal_Letter_Q3.docx', kind:'doc', cat:'Contracts', catTone:'bg-indigo-100 text-indigo-700',
    owner:'Priya Sundram', init:'PS', tone:'from-emerald-500 to-emerald-700', size:'48 KB', modified:'1 hr ago',
    status:'Awaiting signature', statusTone:'bg-indigo-50 text-indigo-700 ring-indigo-200', shared:1, sel:false, expiring:false, version:'v2' },
  { name:'Payslip_May_2026.zip', kind:'zip', cat:'Payslips', catTone:'bg-emerald-100 text-emerald-700',
    owner:'Aisha Rahman', init:'AR', tone:'from-indigo-500 to-indigo-700', size:'18.6 MB', modified:'3 hr ago',
    status:'Verified', statusTone:'bg-emerald-50 text-emerald-700 ring-emerald-200', shared:12, sel:false, expiring:false, version:'v1' },
  { name:'Leave_Policy_2026_v4.pdf', kind:'pdf', cat:'Policies', catTone:'bg-amber-100 text-amber-700',
    owner:'Hanis Ezzati', init:'HE', tone:'from-violet-500 to-violet-700', size:'1.1 MB', modified:'Yesterday',
    status:'Verified', statusTone:'bg-emerald-50 text-emerald-700 ring-emerald-200', shared:48, sel:false, expiring:false, version:'v4' },
  { name:'Passport_Scan_Wei_Jian.jpg', kind:'img', cat:'IDs & Licenses', catTone:'bg-rose-100 text-rose-700',
    owner:'Wei Jian Tan', init:'WT', tone:'from-rose-500 to-rose-700', size:'3.2 MB', modified:'2 days ago',
    status:'Expires in 21d', statusTone:'bg-rose-50 text-rose-700 ring-rose-200', shared:1, sel:false, expiring:true, version:'v1' },
  { name:'AWS_Certification_2024.pdf', kind:'pdf', cat:'Certificates', catTone:'bg-violet-100 text-violet-700',
    owner:'Daniel Aiman', init:'DA', tone:'from-amber-500 to-amber-700', size:'640 KB', modified:'3 days ago',
    status:'Verified', statusTone:'bg-emerald-50 text-emerald-700 ring-emerald-200', shared:0, sel:false, expiring:false, version:'v1' },
  { name:'Q2_Headcount_Plan.xlsx', kind:'xls', cat:'Other', catTone:'bg-slate-100 text-slate-700',
    owner:'Priya Sundram', init:'PS', tone:'from-emerald-500 to-emerald-700', size:'288 KB', modified:'4 days ago',
    status:'Restricted', statusTone:'bg-slate-200 text-slate-700 ring-slate-300', shared:4, sel:false, expiring:false, version:'v7' },
];

function docRow(d) {
  const expBadge = d.expiring
    ? `<span class="inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold ring-1 ring-rose-200">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Expiring
       </span>` : '';
  return `<tr class="group hover:bg-slate-50/70 transition border-b border-slate-100 last:border-0 ${d.sel ? 'bg-indigo-50/40' : ''}">
    <td class="pl-6 pr-2 py-3 align-middle"><input type="checkbox" ${d.sel ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/30"/></td>
    <td class="px-2 py-3 align-middle">
      <div class="flex items-center gap-3 min-w-0">
        ${fileIcon(d.kind)}
        <div class="min-w-0">
          <p class="text-[13px] font-semibold text-slate-900 truncate leading-tight" title="${d.name}">${d.name}</p>
          <p class="text-[11px] text-slate-500 leading-tight mt-1 flex items-center gap-1.5">
            <span class="inline-flex items-center px-1.5 h-[16px] rounded text-[10px] font-semibold ${d.catTone}">${d.cat}</span>
            <span class="text-slate-300">·</span>
            <span class="font-mono">${d.version}</span>
            <span class="text-slate-300">·</span>
            <span>${d.size}</span>
          </p>
        </div>
      </div>
    </td>
    <td class="px-2 py-3 align-middle">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-7 h-7 rounded-full bg-gradient-to-br ${d.tone} text-white text-[10.5px] font-semibold grid place-items-center shrink-0">${d.init}</span>
        <p class="text-[12.5px] text-slate-700 truncate">${d.owner}</p>
      </div>
    </td>
    <td class="px-2 py-3 align-middle">
      <div class="flex items-center -space-x-1.5">
        ${Array.from({length:Math.min(d.shared, 3)}).map((_,i) => `<span class="w-6 h-6 rounded-full bg-slate-300 text-white text-[9.5px] font-semibold grid place-items-center ring-2 ring-white">${['JM','KL','SR'][i]}</span>`).join('')}
        ${d.shared > 3 ? `<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[9.5px] font-semibold grid place-items-center ring-2 ring-white num-tabular">+${d.shared-3}</span>` : ''}
        ${d.shared === 0 ? `<span class="text-[11px] text-slate-400">Only you</span>` : ''}
      </div>
    </td>
    <td class="px-2 py-3 align-middle">
      <p class="text-[12px] text-slate-700">${d.modified}</p>
    </td>
    <td class="px-2 py-3 align-middle">
      <div class="flex flex-col gap-1 items-start">
        <span class="inline-flex items-center px-2 h-[22px] rounded-full text-[11px] font-medium ring-1 ring-inset ${d.statusTone}">${d.status}</span>
        ${expBadge}
      </div>
    </td>
    <td class="pl-2 pr-6 py-3 align-middle">
      <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
        <button class="w-8 h-8 grid place-items-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="Preview"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="w-8 h-8 grid place-items-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="Download"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
        <button class="w-8 h-8 grid place-items-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="Share"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
        <button class="w-8 h-8 grid place-items-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="More"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
      </div>
    </td>
  </tr>`;
}
document.getElementById('docs-tbody').innerHTML = DOCS.map(docRow).join('');
