import { useState, useRef } from 'react';
import { useDiagnosticStore } from '../store/diagnosticStore';
import { useSettingsStore } from '../store/settingsStore';

export default function SettingsPage() {
  const setView = useDiagnosticStore(s => s.setView);
  const companyLogo = useSettingsStore(s => s.companyLogo);
  const companyLogoIcon = useSettingsStore(s => s.companyLogoIcon);
  const setCompanyLogo = useSettingsStore(s => s.setCompanyLogo);

  const [preview, setPreview] = useState<string | null>(null);
  const [previewIcon, setPreviewIcon] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);

  // Whether we have unsaved changes
  const hasChanges = preview !== null || previewIcon !== null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'icon') {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione un archivo de imagen (PNG, JPG, SVG).');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe exceder 2MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (target === 'logo') {
        setPreview(dataUrl);
      } else {
        setPreviewIcon(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess(false);

    const logoToSave = preview !== null ? preview : companyLogo;
    const iconToSave = previewIcon !== null ? previewIcon : companyLogoIcon;

    const ok = await setCompanyLogo(logoToSave, iconToSave);

    if (ok) {
      setPreview(null);
      setPreviewIcon(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Error al guardar. Verifique que la tabla app_settings exista en Supabase.');
    }
    setSaving(false);
  }

  async function handleRemoveLogo() {
    setSaving(true);
    setError('');
    const ok = await setCompanyLogo(null, null);
    if (ok) {
      setPreview(null);
      setPreviewIcon(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Error al eliminar el logo.');
    }
    setSaving(false);
  }

  const displayLogo = preview ?? companyLogo;
  const displayIcon = previewIcon ?? companyLogoIcon;

  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="w-full mx-auto" style={{ maxWidth: '600px', padding: '40px 24px' }}>

        {/* Back button */}
        <button
          onClick={() => setView('home')}
          className="flex items-center text-muted hover:text-ink transition-colors cursor-pointer"
          style={{ gap: '6px', marginBottom: '28px', fontSize: '13px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </button>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="font-serif text-navy" style={{ fontSize: '22px', marginBottom: '6px' }}>
            Configuracion
          </h1>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            Personalice la apariencia del sistema para todas las cuentas.
          </p>
        </div>

        {/* Logo principal */}
        <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '32px', marginBottom: '20px' }}>
          <h2 className="font-bold text-navy" style={{ fontSize: '15px', marginBottom: '4px' }}>
            Logo principal
          </h2>
          <p className="text-muted" style={{ fontSize: '12px', marginBottom: '20px' }}>
            Este logo aparece en la pagina de inicio de sesion y en la portada principal. Se recomienda una imagen horizontal (PNG o SVG) con fondo transparente.
          </p>

          {/* Current logo preview */}
          <div className="flex items-center" style={{ gap: '20px', marginBottom: '20px' }}>
            <div
              className="flex items-center justify-center bg-pale rounded-xl border border-border/40"
              style={{ width: '200px', height: '80px', overflow: 'hidden' }}
            >
              {displayLogo ? (
                <img src={displayLogo} alt="Logo" className="object-contain" style={{ maxWidth: '180px', maxHeight: '70px' }} />
              ) : (
                <img src="/logo-complement.svg" alt="Logo por defecto" className="object-contain" style={{ maxWidth: '180px', maxHeight: '70px' }} />
              )}
            </div>
            <div>
              <p className="text-ink font-medium" style={{ fontSize: '12px', marginBottom: '4px' }}>
                {displayLogo ? 'Logo personalizado' : 'Logo por defecto'}
              </p>
              <p className="text-muted" style={{ fontSize: '11px' }}>
                {displayLogo ? 'Se muestra en login, portada y reportes.' : 'Usando logo de Complement por defecto.'}
              </p>
            </div>
          </div>

          {/* Upload button */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={(e) => handleFileSelect(e, 'logo')}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-accent text-white font-semibold hover:bg-mid transition-colors cursor-pointer"
              style={{ fontSize: '12px', padding: '10px 20px', borderRadius: '10px' }}
            >
              Seleccionar imagen
            </button>
            {(displayLogo) && (
              <button
                onClick={handleRemoveLogo}
                disabled={saving}
                className="text-error font-semibold hover:bg-error/10 transition-colors cursor-pointer"
                style={{ fontSize: '12px', padding: '10px 16px', borderRadius: '10px' }}
              >
                Quitar logo
              </button>
            )}
          </div>
        </div>

        {/* Logo icono (header) */}
        <div className="bg-white rounded-2xl border border-border/40 shadow-sm" style={{ padding: '32px', marginBottom: '20px' }}>
          <h2 className="font-bold text-navy" style={{ fontSize: '15px', marginBottom: '4px' }}>
            Icono del encabezado
          </h2>
          <p className="text-muted" style={{ fontSize: '12px', marginBottom: '20px' }}>
            Icono pequeno que aparece en la barra de navegacion superior. Se recomienda una imagen cuadrada (PNG o SVG) con fondo transparente.
          </p>

          {/* Current icon preview */}
          <div className="flex items-center" style={{ gap: '20px', marginBottom: '20px' }}>
            <div
              className="flex items-center justify-center bg-navy rounded-xl"
              style={{ width: '64px', height: '64px', overflow: 'hidden' }}
            >
              {displayIcon ? (
                <img src={displayIcon} alt="Icono" className="object-contain" style={{ maxWidth: '48px', maxHeight: '48px' }} />
              ) : (
                <img src="/icon-complement.svg" alt="Icono por defecto" className="object-contain" style={{ maxWidth: '48px', maxHeight: '48px' }} />
              )}
            </div>
            <div>
              <p className="text-ink font-medium" style={{ fontSize: '12px', marginBottom: '4px' }}>
                {displayIcon ? 'Icono personalizado' : 'Icono por defecto'}
              </p>
              <p className="text-muted" style={{ fontSize: '11px' }}>
                Se muestra en la barra superior de navegacion.
              </p>
            </div>
          </div>

          {/* Upload button */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <input
              ref={iconFileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={(e) => handleFileSelect(e, 'icon')}
              className="hidden"
            />
            <button
              onClick={() => iconFileRef.current?.click()}
              className="bg-accent text-white font-semibold hover:bg-mid transition-colors cursor-pointer"
              style={{ fontSize: '12px', padding: '10px 20px', borderRadius: '10px' }}
            >
              Seleccionar icono
            </button>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="bg-error/10 rounded-xl" style={{ padding: '12px 16px', marginBottom: '16px' }}>
            <p className="text-error font-medium" style={{ fontSize: '12px' }}>{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-success/10 rounded-xl" style={{ padding: '12px 16px', marginBottom: '16px' }}>
            <p className="text-success font-medium" style={{ fontSize: '12px' }}>Logo actualizado correctamente para todas las cuentas.</p>
          </div>
        )}

        {/* Save button */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-navy text-white font-bold hover:bg-navy/90 disabled:opacity-50 transition-colors cursor-pointer"
            style={{ fontSize: '14px', padding: '14px 24px', borderRadius: '12px' }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}

        {/* Info note */}
        <div className="bg-accent/5 rounded-xl" style={{ padding: '16px 20px', marginTop: '24px' }}>
          <p className="text-muted" style={{ fontSize: '11px', lineHeight: '1.6' }}>
            <strong className="text-ink">Nota:</strong> Los cambios de logo se aplican globalmente a todas las cuentas del sistema, incluyendo la pagina de inicio de sesion, el panel principal y los reportes en pantalla. Para que los cambios tomen efecto en la tabla <code className="bg-pale text-ink rounded px-1">app_settings</code>, asegurese de que exista en Supabase con columnas <code className="bg-pale text-ink rounded px-1">key (text PK)</code> y <code className="bg-pale text-ink rounded px-1">value (text)</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
