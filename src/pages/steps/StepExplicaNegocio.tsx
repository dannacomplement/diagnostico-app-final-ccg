import { useDiagnosticStore } from '../../store/diagnosticStore';

export default function StepExplicaNegocio() {
  const descripcion = useDiagnosticStore(s => s.descripcionNegocio);
  const setDescripcion = useDiagnosticStore(s => s.setDescripcionNegocio);

  return (
    <div className="card">
      <h2 className="font-serif text-navy" style={{ fontSize: '17px', marginBottom: '8px' }}>Explícanos tu negocio</h2>
      <p className="text-muted leading-relaxed" style={{ fontSize: '13px', marginBottom: '40px' }}>
        Describa brevemente a qué se dedica su empresa: qué productos o servicios ofrece, quiénes son sus clientes principales, y qué la hace diferente en su mercado.
      </p>

      <div>
        <label className="block font-medium text-ink" style={{ fontSize: '12px', marginBottom: '10px' }}>
          Descripción del negocio
        </label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Ej: Somos una empresa familiar dedicada a la manufactura de productos alimenticios para el mercado regional. Nuestros principales clientes son tiendas de autoservicio y distribuidores mayoristas..."
          className="w-full border border-border bg-pale focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-none transition-all leading-relaxed"
          style={{ padding: '14px 18px', fontSize: '13px', borderRadius: '12px' }}
          rows={8}
        />
        <p className="text-muted" style={{ fontSize: '11px', marginTop: '10px' }}>
          Esta información nos ayuda a entender mejor el contexto de su empresa para generar un diagnóstico más preciso.
        </p>
      </div>
    </div>
  );
}
