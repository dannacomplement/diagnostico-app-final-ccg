import type { SavedDiagnostic } from './types';
import { getPdfBase64 } from './exportPdf';

export async function sendReportEmail(diagnostic: SavedDiagnostic): Promise<void> {
  const email = diagnostic.datosGenerales.email;
  if (!email) return;

  const pdfBase64 = getPdfBase64(diagnostic);

  const res = await fetch('/api/send-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      companyName: diagnostic.datosGenerales.nombreComercial,
      pdfBase64,
      profLevel: diagnostic.profesionalizacion.level,
      instLevel: diagnostic.institucionalizacion.level,
      urgencia: diagnostic.urgenciaLevel,
      companySize: diagnostic.companySize.size,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al enviar el correo');
  }
}
