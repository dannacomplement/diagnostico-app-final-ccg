import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, companyName, pdfBase64, profLevel, instLevel, urgencia, companySize } = req.body;

  if (!email || !pdfBase64) {
    return res.status(400).json({ error: 'Missing email or pdfBase64' });
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'CCG Diagnostico <onboarding@resend.dev>';
  const safeName = (companyName || 'diagnostico')
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const levelBadge = (level: string) => {
    const colors: Record<string, string> = {
      'Bajo': '#dc2626',
      'Medio': '#f59e0b',
      'Alto': '#16a34a',
      'Avanzado': '#16a34a',
      'Critica': '#dc2626',
      'Alta': '#f59e0b',
      'Media': '#6366f1',
      'Baja': '#16a34a',
    };
    const bg = colors[level] || '#64748b';
    return `<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:${bg};color:white;font-size:12px;font-weight:600;">${level}</span>`;
  };

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `Reporte Ejecutivo — ${companyName || 'Diagnostico Empresarial'}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1b2a4a 0%,#2d4a7a 100%);padding:32px 36px;border-radius:12px 12px 0 0;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.3px;">
              Reporte Ejecutivo
            </h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">
              Diagnostico Empresarial — Complement Consulting Group
            </p>
          </div>

          <!-- Company banner -->
          <div style="background:#f1f5f9;padding:20px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#1b2a4a;">
              ${companyName || 'Su Empresa'}
            </p>
            ${companySize ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">Empresa ${companySize}</p>` : ''}
          </div>

          <!-- Indicators -->
          ${(profLevel || instLevel || urgencia) ? `
          <div style="padding:24px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
              Indicadores Clave
            </p>
            <table cellpadding="0" cellspacing="0" style="width:100%;">
              <tr>
                ${profLevel ? `
                <td style="padding:8px 0;width:33%;vertical-align:top;">
                  <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Profesionalizacion</p>
                  <p style="margin:6px 0 0;">${levelBadge(profLevel)}</p>
                </td>` : ''}
                ${instLevel ? `
                <td style="padding:8px 0;width:33%;vertical-align:top;">
                  <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Institucionalizacion</p>
                  <p style="margin:6px 0 0;">${levelBadge(instLevel)}</p>
                </td>` : ''}
                ${urgencia ? `
                <td style="padding:8px 0;width:33%;vertical-align:top;">
                  <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Urgencia</p>
                  <p style="margin:6px 0 0;">${levelBadge(urgencia)}</p>
                </td>` : ''}
              </tr>
            </table>
          </div>
          ` : ''}

          <!-- Body -->
          <div style="padding:28px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 16px;">
              Estimado/a,
            </p>
            <p style="font-size:15px;line-height:1.7;color:#334155;margin:0 0 16px;">
              Gracias por completar el diagnostico empresarial de <strong>${companyName || 'su empresa'}</strong>.
              Adjunto encontrara su <strong>Reporte Ejecutivo</strong> en formato PDF con el analisis completo.
            </p>
            <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 8px;">
              El reporte incluye:
            </p>
            <ul style="font-size:14px;line-height:1.8;color:#475569;margin:0 0 20px;padding-left:20px;">
              <li>Resumen ejecutivo con indicadores clave</li>
              <li>Clasificacion de empresa y margenes financieros</li>
              <li>Analisis de profesionalizacion e institucionalizacion</li>
              <li>Fortalezas identificadas y focos rojos</li>
              <li>Areas de oportunidad con prioridades</li>
              <li>Recomendaciones y siguientes pasos</li>
            </ul>

            <!-- CTA -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:24px 0;">
              <p style="margin:0;font-size:14px;color:#1b2a4a;font-weight:600;">
                Siguientes pasos
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#475569;line-height:1.6;">
                Le invitamos a revisar el reporte y agendar una sesion con nuestro equipo para discutir los hallazgos
                y definir un plan de accion personalizado para su empresa.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;padding:20px 36px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
              Este correo fue generado automaticamente al completar la encuesta de diagnostico.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">
              Complement Consulting Group
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Reporte_${safeName}.pdf`,
          content: pdfBase64,
          contentType: 'application/pdf',
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}
