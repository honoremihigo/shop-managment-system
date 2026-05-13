import { useState, useEffect } from 'react';

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowButton(false);
    setDeferredPrompt(null);
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstall}
      className="text-[11px] text-on-primary/70 hover:text-on-primary underline underline-offset-2 transition-colors"
    >
      Install App
    </button>
  );
};

export default InstallButton;