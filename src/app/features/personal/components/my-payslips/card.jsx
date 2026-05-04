// Variant 2: Compact cards — refined version of original card grid, stripped down
function VariantCards({ year, setYear, onOpenPayslip }) {
    const filtered = PAYSLIPS.filter(p => p.year === year);
    return (
      <div>
        <PageHeader year={year} onYearChange={setYear} variant="cards" />
  
        {/* YTD strip — single soft-bordered container with 4 stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '20px 4px',
          marginBottom: 28,
        }}>
          {[
            { label: 'YTD Gross', value: YTD.gross },
            { label: 'YTD Net', value: YTD.net },
            { label: 'EPF', value: YTD.epf },
            { label: 'Tax (PCB)', value: YTD.tax },
          ].map((item, i, arr) => (
            <div key={i} style={{
              padding: '4px 24px',
              borderRight: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8, fontWeight: 500 }}>
                {item.label}
              </div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, marginRight: 3 }}>RM</span>
                {fmtCompact(item.value)}
              </div>
            </div>
          ))}
        </div>
  
        {/* Section label */}
        <div style={{
          fontSize: 12, fontWeight: 500, color: 'var(--ink-3)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
          marginBottom: 12,
        }}>Recent payslips</div>
  
        {/* Card grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}>
          {filtered.map(p => (
            <PayslipCard key={p.id} payslip={p} onClick={() => onOpenPayslip(p)} />
          ))}
        </div>
      </div>
    );
  }
  
  function PayslipCard({ payslip, onClick }) {
    const [hover, setHover] = useState(false);
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '20px 22px 18px',
          transition: 'border-color .15s, transform .15s',
          borderColor: hover ? 'oklch(0.82 0.006 60)' : 'var(--line)',
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {payslip.month} <span className="num" style={{ color: 'var(--ink-3)', fontWeight: 400 }}>{payslip.year}</span>
            </div>
            <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
              {payslip.payDate}
            </div>
          </div>
          <StatusPill status={payslip.status} />
        </div>
  
        {/* Net Pay (hero) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Net pay</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.018em' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500, marginRight: 3 }}>RM</span>
            {fmtCompact(payslip.net)}
          </div>
        </div>
  
        {/* Mini breakdown */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 0',
          borderTop: '1px solid var(--line)',
          fontSize: 12.5,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>Gross</span>
            <span className="num" style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{fmt(payslip.gross)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right', minWidth: 0 }}>
            <span style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>Deductions</span>
            <span className="num" style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>−{fmt(payslip.deductions)}</span>
          </div>
        </div>
  
        {/* Action */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              border: '1px solid var(--line-2)',
              borderRadius: 8,
              background: 'var(--surface)',
              fontSize: 12.5,
              fontWeight: 500,
              color: 'var(--ink)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background .15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.96 0.005 60)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            View details
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            aria-label="Download"
            style={{
              width: 36,
              border: '1px solid var(--line-2)',
              borderRadius: 8,
              background: 'var(--surface)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-2)',
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.96 0.005 60)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            {Icon.download(13)}
          </button>
        </div>
      </div>
    );
  }
  
  window.VariantCards = VariantCards;
  