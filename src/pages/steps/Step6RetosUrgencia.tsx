import { useDiagnosticStore } from '../../store/diagnosticStore';
import { URGENCY_OPTIONS } from '../../config/constants';

export default function Step6RetosUrgencia() {
  const retos = useDiagnosticStore(s => s.retos);
  const setReto = useDiagnosticStore(s => s.setReto);
  const urgencia = useDiagnosticStore(s => s.urgencia);
  const setUrgencia = useDiagnosticStore(s => s.setUrgencia);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Principales Retos y Nivel de Urgencia</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '40px' }}>Mencione los 3 principales retos o problemas que enfrenta actualmente su empresa.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '40px' }}>
        {retos.map((reto, i) => (
          <div key={i}>
            <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '10px' }}>Reto o problema #{i + 1}</label>
            <textarea
              value={reto}
              onChange={e => setReto(i, e.target.value)}
              placeholder={`Describa su reto principal #${i + 1}...`}
              className="w-full border border-border bg-pale focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-none transition-all leading-relaxed"
              style={{ padding: '14px 18px', fontSize: '13px', borderRadius: '12px' }}
              rows={3}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-border/50" style={{ paddingTop: '32px' }}>
        <h3 className="font-semibold text-navy uppercase tracking-wide" style={{ fontSize: '11px', marginBottom: '10px' }}>Nivel de Urgencia</h3>
        <p className="text-muted" style={{ fontSize: '12px', marginBottom: '20px' }}>
          Todos nuestros servicios se programan con anticipación. ¿Qué tan urgente considera empezar su proceso de profesionalización e institucionalización?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {URGENCY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setUrgencia(opt.value)}
              className={`w-full text-left rounded-xl border transition-all cursor-pointer
                ${urgencia === opt.value
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-border hover:border-mid/50 bg-white'
                }
              `}
              style={{ padding: '16px 22px' }}
            >
              <span className={`font-semibold ${urgencia === opt.value ? 'text-accent' : 'text-ink'}`} style={{ fontSize: '13px' }}>
                {opt.label}
              </span>
              <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>{opt.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
