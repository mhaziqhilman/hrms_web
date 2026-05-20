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

function spark(values, tone, w = 120, h = 36, opts = {}) {
  const p = TONE[tone] || TONE.slate;
  const { line, area, last } = buildSparkPaths(values, w, h, 2);
  const dot = opts.dot === false ? '' :
    `<circle cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="2.2" fill="white" stroke="${p.stroke}" stroke-width="1.5"/>`;
  return `
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" class="block">
      <path d="${area}" fill="url(#${p.grad})"/>
      <path d="${line}" fill="none" stroke="${p.stroke}" stroke-width="${opts.thick ? 2 : 1.6}" stroke-linecap="round" stroke-linejoin="round"/>
      ${dot}
    </svg>`;
}

function delta(pct) {
  if (pct === 0 || pct === null || pct === undefined) {
    return `<span class="inline-flex items-center gap-0.5 px-1.5 h-[20px] rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 num-tabular">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      0.0%
    </span>`;
  }
  const up = pct > 0;
  const tone = up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50';
  const arrow = up
    ? `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>`
    : `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  return `<span class="inline-flex items-center gap-0.5 px-1.5 h-[20px] rounded-full text-[11px] font-semibold ${tone} num-tabular">
    ${arrow}${up ? '+' : ''}${pct.toFixed(1)}%
  </span>`;
}

// ---------- icons ----------
const ICONS = {
  inbox:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  check:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`,
  x:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  clock:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

const STATS = [
  { key:'requested', title:'Requested', subtitle:'submitted this month', icon:ICONS.inbox, iconBg:'bg-slate-100', iconColor:'text-slate-700',
    value:248, pct: 12.4, tone:'emerald', spark:[180,188,195,200,210,212,220,228,232,238,244,248], sub:'RM 84,210 total value' },
  { key:'approved', title:'Approved', subtitle:'manager + finance', icon:ICONS.check, iconBg:'bg-emerald-50', iconColor:'text-emerald-600',
    value:184, pct: 8.6, tone:'emerald', spark:[120,130,138,144,150,158,162,168,172,176,180,184], sub:'RM 62,540 paid out' },
  { key:'rejected', title:'Rejected', subtitle:'with reason logged', icon:ICONS.x, iconBg:'bg-rose-50', iconColor:'text-rose-600',
    value:22, pct: -18.2, tone:'rose', spark:[34,32,30,28,28,26,25,24,24,23,22,22], sub:'8.9% rejection rate' },
  { key:'pending', title:'Pending', subtitle:'awaiting next approver', icon:ICONS.clock, iconBg:'bg-amber-50', iconColor:'text-amber-600',
    value:42, pct: -5.1, tone:'amber', spark:[58,55,52,50,48,46,46,45,44,43,43,42], sub:'Avg wait 2.4 days' },
];

function fmt(v) { return v.toLocaleString(); }

// =====================================================================
// Stat cards
// =====================================================================
function statCard(s) {
  return `
    <div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5 flex flex-col">
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
      <div class="-mx-1 -mb-1">${spark(s.spark, s.tone, 240, 44)}</div>
      <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span class="text-slate-500">${s.sub}</span>
        <span class="text-slate-400">vs last 30d</span>
      </div>
    </div>`;
}
document.getElementById('stat-cards').innerHTML = STATS.map(statCard).join('');

// =====================================================================
// Insights mini-cards
// =====================================================================
const CATEGORIES = [
  { name:'Travel & Mileage',     amount:'RM 28,420', count:64, share:34, tone:'bg-indigo-500' },
  { name:'Meals & Entertainment', amount:'RM 18,650', count:52, share:22, tone:'bg-emerald-500' },
  { name:'Office Supplies',      amount:'RM 12,310', count:38, share:15, tone:'bg-amber-500' },
  { name:'Software & Tools',     amount:'RM  9,840', count:21, share:12, tone:'bg-rose-500' },
  { name:'Other',                amount:'RM 14,990', count:73, share:17, tone:'bg-slate-400' },
];

document.getElementById('insight-categories').innerHTML = `
  <div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-[12.5px] font-semibold text-slate-800 leading-none">Spend by category</p>
        <p class="text-[10.5px] text-slate-500 mt-1 leading-none">May 2026 · total RM 84,210</p>
      </div>
      <button class="text-[11px] font-medium text-slate-500 hover:text-slate-900">Breakdown →</button>
    </div>
    <div class="space-y-2.5">
      ${CATEGORIES.map(c => `
        <div>
          <div class="flex items-center justify-between text-[11.5px] mb-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full ${c.tone}"></span>
              <span class="truncate text-slate-700">${c.name}</span>
            </div>
            <span class="num-tabular text-slate-500 font-mono shrink-0 pl-2">${c.amount}</span>
          </div>
          <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full ${c.tone} rounded-full" style="width:${c.share * 2.5}%"></div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;

const SPENDERS = [
  { name:'Hanis Ezzati',     role:'HR Manager',      amount:'RM 4,820', claims:12, init:'HE', tone:'from-violet-500 to-violet-700' },
  { name:'Daniel Aiman',     role:'Senior Engineer', amount:'RM 3,940', claims:9,  init:'DA', tone:'from-amber-500 to-amber-700' },
  { name:'Priya Sundram',    role:'Product Lead',    amount:'RM 3,180', claims:7,  init:'PS', tone:'from-emerald-500 to-emerald-700' },
  { name:'Wei Jian Tan',     role:'Sales Director',  amount:'RM 2,760', claims:6,  init:'WT', tone:'from-rose-500 to-rose-700' },
  { name:'Aisha Rahman',     role:'Marketing',       amount:'RM 1,920', claims:5,  init:'AR', tone:'from-indigo-500 to-indigo-700' },
];

document.getElementById('insight-spenders').innerHTML = `
  <div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-[12.5px] font-semibold text-slate-800 leading-none">Top claimants</p>
        <p class="text-[10.5px] text-slate-500 mt-1 leading-none">By approved amount · this month</p>
      </div>
      <button class="text-[11px] font-medium text-slate-500 hover:text-slate-900">All →</button>
    </div>
    <div class="space-y-2.5">
      ${SPENDERS.map((s, i) => `
        <div class="flex items-center gap-3">
          <span class="text-[10.5px] text-slate-400 font-mono w-3 shrink-0">${i+1}</span>
          <span class="w-7 h-7 rounded-full bg-gradient-to-br ${s.tone} text-white text-[10.5px] font-semibold grid place-items-center shrink-0">${s.init}</span>
          <div class="min-w-0 flex-1">
            <p class="text-[12px] font-medium text-slate-800 truncate leading-tight">${s.name}</p>
            <p class="text-[10.5px] text-slate-500 leading-tight">${s.role} · ${s.claims} claims</p>
          </div>
          <span class="text-[12px] font-semibold text-slate-800 num-tabular font-mono shrink-0">${s.amount}</span>
        </div>
      `).join('')}
    </div>
  </div>`;

// SLA / bottleneck card
document.getElementById('insight-sla').innerHTML = `
  <div class="rounded-2xl border border-slate-200 bg-white shad-card-lg p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-[12.5px] font-semibold text-slate-800 leading-none">Processing SLA</p>
        <p class="text-[10.5px] text-slate-500 mt-1 leading-none">Submit → paid · target 5d</p>
      </div>
      <span class="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        On track
      </span>
    </div>

    <div class="flex items-end justify-between mb-3">
      <div>
        <p class="text-[28px] font-semibold tracking-tight num-tabular leading-none">3.2<span class="text-[14px] font-medium text-slate-400 ml-1">days</span></p>
        <p class="text-[10.5px] text-slate-500 mt-1.5">avg cycle time</p>
      </div>
      ${delta(-12.3)}
    </div>

    <!-- segmented funnel -->
    <div class="space-y-2 mt-3">
      <div>
        <div class="flex justify-between text-[10.5px] mb-1"><span class="text-slate-500">Manager review</span><span class="font-mono text-slate-700 num-tabular">1.4d</span></div>
        <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-slate-700 rounded-full" style="width:44%"></div></div>
      </div>
      <div>
        <div class="flex justify-between text-[10.5px] mb-1"><span class="text-slate-500">Finance review</span><span class="font-mono text-slate-700 num-tabular">0.8d</span></div>
        <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-slate-700 rounded-full" style="width:25%"></div></div>
      </div>
      <div>
        <div class="flex justify-between text-[10.5px] mb-1"><span class="text-slate-500">Payment</span><span class="font-mono text-slate-700 num-tabular">1.0d</span></div>
        <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-slate-700 rounded-full" style="width:31%"></div></div>
      </div>
    </div>

    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
      <div class="flex items-center gap-1.5 text-amber-600">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span class="font-medium">3 claims breaching SLA</span>
      </div>
      <button class="text-slate-500 hover:text-slate-900 font-medium">Review →</button>
    </div>
  </div>`;

// =====================================================================
// Claims table — sample rows
// =====================================================================
const CLAIMS = [
  { id:'CLM-0248', who:'Hanis Ezzati', role:'HR Manager', init:'HE', tone:'from-violet-500 to-violet-700',
    desc:'KL → Penang client visit · flight + hotel', cat:'Travel', catTone:'bg-indigo-100 text-indigo-700',
    amount:'RM 1,480.00', currency:'MYR', submitted:'2 hours ago', aging:0,
    status:'Pending manager', statusTone:'bg-amber-50 text-amber-700 ring-amber-200',
    receipts:3, breach:false, selected:false },
  { id:'CLM-0247', who:'Daniel Aiman', role:'Senior Engineer', init:'DA', tone:'from-amber-500 to-amber-700',
    desc:'AWS subscription · May renewal', cat:'Software', catTone:'bg-rose-100 text-rose-700',
    amount:'RM 2,890.00', currency:'MYR', submitted:'Yesterday', aging:1,
    status:'Pending finance', statusTone:'bg-indigo-50 text-indigo-700 ring-indigo-200',
    receipts:1, breach:false, selected:true },
  { id:'CLM-0246', who:'Priya Sundram', role:'Product Lead', init:'PS', tone:'from-emerald-500 to-emerald-700',
    desc:'Quarterly team offsite dinner — 12 attendees', cat:'Meals', catTone:'bg-emerald-100 text-emerald-700',
    amount:'RM 940.50', currency:'MYR', submitted:'2 days ago', aging:2,
    status:'Approved', statusTone:'bg-emerald-50 text-emerald-700 ring-emerald-200',
    receipts:2, breach:false, selected:false },
  { id:'CLM-0245', who:'Wei Jian Tan', role:'Sales Director', init:'WT', tone:'from-rose-500 to-rose-700',
    desc:'Client lunch · Acme Corp pitch follow-up', cat:'Meals', catTone:'bg-emerald-100 text-emerald-700',
    amount:'RM 320.00', currency:'MYR', submitted:'3 days ago', aging:6,
    status:'Pending manager', statusTone:'bg-amber-50 text-amber-700 ring-amber-200',
    receipts:1, breach:true, selected:false },
  { id:'CLM-0244', who:'Aisha Rahman', role:'Marketing', init:'AR', tone:'from-indigo-500 to-indigo-700',
    desc:'Adobe Creative Cloud · annual license', cat:'Software', catTone:'bg-rose-100 text-rose-700',
    amount:'RM 2,640.00', currency:'MYR', submitted:'4 days ago', aging:4,
    status:'Paid', statusTone:'bg-slate-100 text-slate-700 ring-slate-200',
    receipts:1, breach:false, selected:false },
  { id:'CLM-0243', who:'Marcus Lim', role:'Operations', init:'ML', tone:'from-cyan-500 to-cyan-700',
    desc:'Office stationery bulk order — Q2', cat:'Office', catTone:'bg-amber-100 text-amber-700',
    amount:'RM 184.20', currency:'MYR', submitted:'4 days ago', aging:4,
    status:'Rejected', statusTone:'bg-rose-50 text-rose-700 ring-rose-200',
    receipts:4, breach:false, selected:false },
  { id:'CLM-0242', who:'Nadia Shah', role:'Designer', init:'NS', tone:'from-pink-500 to-pink-700',
    desc:'Figma Org plan upgrade · 4 seats', cat:'Software', catTone:'bg-rose-100 text-rose-700',
    amount:'RM 720.00', currency:'MYR', submitted:'5 days ago', aging:5,
    status:'Pending finance', statusTone:'bg-indigo-50 text-indigo-700 ring-indigo-200',
    receipts:1, breach:false, selected:false },
  { id:'CLM-0241', who:'Hanis Ezzati', role:'HR Manager', init:'HE', tone:'from-violet-500 to-violet-700',
    desc:'LinkedIn Recruiter · monthly seat', cat:'Software', catTone:'bg-rose-100 text-rose-700',
    amount:'RM 1,210.00', currency:'MYR', submitted:'6 days ago', aging:6,
    status:'Approved', statusTone:'bg-emerald-50 text-emerald-700 ring-emerald-200',
    receipts:1, breach:false, selected:false },
];

function claimRow(c) {
  const breachBadge = c.breach
    ? `<span class="inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold ring-1 ring-rose-200">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        SLA breach
       </span>`
    : '';
  const agingTone = c.aging >= 5 ? 'text-rose-600' : c.aging >= 3 ? 'text-amber-600' : 'text-slate-500';
  return `
    <tr class="group hover:bg-slate-50/70 transition border-b border-slate-100 last:border-0 ${c.selected ? 'bg-indigo-50/40' : ''}">
      <td class="pl-6 pr-2 py-3 align-middle">
        <input type="checkbox" ${c.selected ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/30"/>
      </td>
      <td class="px-2 py-3 align-middle">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-9 h-9 rounded-full bg-gradient-to-br ${c.tone} text-white text-[11.5px] font-semibold grid place-items-center shrink-0">${c.init}</span>
          <div class="min-w-0">
            <p class="text-[13px] font-semibold text-slate-900 truncate leading-tight">${c.who}</p>
            <p class="text-[11px] text-slate-500 leading-tight mt-0.5">${c.role} · <span class="font-mono">${c.id}</span></p>
          </div>
        </div>
      </td>
      <td class="px-2 py-3 align-middle max-w-[280px]">
        <div class="flex items-center gap-2 min-w-0">
          <span class="inline-flex items-center px-1.5 h-5 rounded-md text-[10.5px] font-semibold ${c.catTone} shrink-0">${c.cat}</span>
          <p class="text-[12.5px] text-slate-700 truncate" title="${c.desc}">${c.desc}</p>
        </div>
        <p class="text-[10.5px] text-slate-400 mt-1 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          ${c.receipts} receipt${c.receipts === 1 ? '' : 's'}
        </p>
      </td>
      <td class="px-2 py-3 align-middle text-right">
        <p class="text-[13px] font-semibold text-slate-900 num-tabular font-mono">${c.amount}</p>
        <p class="text-[10.5px] text-slate-400 mt-0.5">${c.currency}</p>
      </td>
      <td class="px-2 py-3 align-middle">
        <p class="text-[12px] text-slate-700">${c.submitted}</p>
        <p class="text-[10.5px] mt-0.5 ${agingTone}">${c.aging}d in queue</p>
      </td>
      <td class="px-2 py-3 align-middle">
        <div class="flex flex-col gap-1 items-start">
          <span class="inline-flex items-center px-2 h-[22px] rounded-full text-[11px] font-medium ring-1 ring-inset ${c.statusTone}">${c.status}</span>
          ${breachBadge}
        </div>
      </td>
      <td class="pl-2 pr-6 py-3 align-middle">
        <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
          <button class="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-semibold">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Approve
          </button>
          <button class="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11.5px] font-semibold">
            Reject
          </button>
          <button class="w-8 h-8 grid place-items-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="More">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
}
document.getElementById('claims-tbody').innerHTML = CLAIMS.map(claimRow).join('');

// =====================================================================
// Pill tabs — interactive
// =====================================================================
const TABS = [
  { key:'all',      label:'All Claims',        count:248, icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' },
  { key:'pending',  label:'Pending',           count:42,  icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', dot:'bg-amber-500' },
  { key:'mgr',      label:'Manager Approved',  count:102, icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>', dot:'bg-indigo-500' },
  { key:'fin',      label:'Finance Approved',  count:82,  icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>', dot:'bg-emerald-500' },
  { key:'paid',     label:'Paid',              count:68,  icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>', dot:'bg-slate-500' },
  { key:'rejected', label:'Rejected',          count:22,  icon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', dot:'bg-rose-500' },
];

function renderPills(activeKey) {
  document.getElementById('status-pills').innerHTML = TABS.map(t => {
    const active = t.key === activeKey;
    return `
      <button data-pill="${t.key}" class="inline-flex items-center gap-1.5 h-9 pl-2.5 pr-2 rounded-full text-[12.5px] font-medium transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}">
        ${t.dot ? `<span class="w-1.5 h-1.5 rounded-full ${active ? 'bg-white/80' : t.dot}"></span>` : `<span class="${active ? 'text-white/80' : 'text-slate-500'}">${t.icon}</span>`}
        <span>${t.label}</span>
        <span class="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold num-tabular ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}">${t.count}</span>
      </button>`;
  }).join('');
  document.querySelectorAll('[data-pill]').forEach(b => b.addEventListener('click', () => renderPills(b.dataset.pill)));
}
renderPills('all');
