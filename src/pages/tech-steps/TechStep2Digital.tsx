import { useTechSurveyStore } from '../../store/techSurveyStore';

const REDES_SOCIALES = [
  { id: 'Facebook', icon: '📘' },
  { id: 'Instagram', icon: '📷' },
  { id: 'LinkedIn', icon: '💼' },
  { id: 'TikTok', icon: '🎵' },
  { id: 'YouTube', icon: '▶️' },
  { id: 'Twitter/X', icon: '🐦' },
];

export default function TechStep2Digital() {
  const dp = useTechSurveyStore(s => s.digitalPresence);
  const update = useTechSurveyStore(s => s.updateDigitalPresence);

  const toggleRed = (red: string) => {
    const current = dp.redesActivas;
    const next = current.includes(red)
      ? current.filter(r => r !== red)
      : [...current, red];
    update({ redesActivas: next });
  };

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>
        Presencia Digital
      </h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '36px' }}>
        Evaluemos la presencia digital y canales en línea de su empresa.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Website */}
        <div>
          <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px', marginBottom: '12px' }}>
            <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Tiene sitio web?</span>
            <button
              onClick={() => update({ tieneWebsite: !dp.tieneWebsite, websiteActualizado: !dp.tieneWebsite ? dp.websiteActualizado : false })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${dp.tieneWebsite ? 'bg-accent' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dp.tieneWebsite ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {dp.tieneWebsite && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-border/30" style={{ padding: '12px 18px', marginLeft: '16px', marginBottom: '12px' }}>
              <span className="text-ink font-medium" style={{ fontSize: '12px' }}>¿Está actualizado?</span>
              <button
                onClick={() => update({ websiteActualizado: !dp.websiteActualizado })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${dp.websiteActualizado ? 'bg-accent' : 'bg-border'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dp.websiteActualizado ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}
        </div>

        {/* E-commerce */}
        <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px' }}>
          <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Tiene e-commerce?</span>
          <button
            onClick={() => update({ tieneEcommerce: !dp.tieneEcommerce })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${dp.tieneEcommerce ? 'bg-accent' : 'bg-border'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dp.tieneEcommerce ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Redes sociales */}
        <div>
          <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px', marginBottom: '12px' }}>
            <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Usa redes sociales?</span>
            <button
              onClick={() => update({ usaRedesSociales: !dp.usaRedesSociales, redesActivas: !dp.usaRedesSociales ? dp.redesActivas : [] })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${dp.usaRedesSociales ? 'bg-accent' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dp.usaRedesSociales ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {dp.usaRedesSociales && (
            <div style={{ marginLeft: '8px' }}>
              <p className="text-muted font-medium" style={{ fontSize: '11px', marginBottom: '10px' }}>Seleccione las redes activas</p>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {REDES_SOCIALES.map(red => {
                  const active = dp.redesActivas.includes(red.id);
                  return (
                    <button
                      key={red.id}
                      onClick={() => toggleRed(red.id)}
                      className={`rounded-full border-2 font-medium transition-all cursor-pointer ${
                        active
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border/40 bg-white text-muted hover:border-accent/30'
                      }`}
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      <span style={{ marginRight: '6px' }}>{red.icon}</span>
                      {red.id}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Marketing digital */}
        <div className="flex items-center justify-between bg-pale/50 rounded-xl border border-border/30" style={{ padding: '14px 18px' }}>
          <span className="text-ink font-medium" style={{ fontSize: '13px' }}>¿Realiza marketing digital?</span>
          <button
            onClick={() => update({ marketingDigital: !dp.marketingDigital })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${dp.marketingDigital ? 'bg-accent' : 'bg-border'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dp.marketingDigital ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
