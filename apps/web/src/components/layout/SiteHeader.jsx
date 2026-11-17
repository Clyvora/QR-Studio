import { Link } from "react-router";
import { LockKeyhole, Sun, Moon, Monitor } from "lucide-react";
import { Logo } from "../ui/icons.jsx";
import { Button } from "../ui/Button.jsx";
import { useTheme } from "../../lib/theme.jsx";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const order = ["system", "light", "dark"];
  const next = order[(order.indexOf(theme) + 1) % order.length];
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Theme: ${theme}. Switch to ${next}.`} title={`Theme: ${theme}`}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export function SiteHeader() {
  return (
    <header className="qr-topbar">
      <div className="qr-topbar-inner">
        <Link to="/studio" className="qr-brand" aria-label="Clyvora QR Studio">
          <Logo className="h-6 w-6" />
          <span>Clyvora</span>
        </Link>
        <span className="qr-brand-divider" aria-hidden="true" />
        <span className="qr-brand-product">QR Studio</span>
        <span className="qr-local-status"><LockKeyhole size={14} aria-hidden="true" /> Works in your browser</span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="qr-footer">
      <div className="qr-footer-inner">
        <span>Made to be simple. Made to stay yours.</span>
        <a href="https://github.com/Clyvora/QRCODE/blob/main/LICENSE" target="_blank" rel="noreferrer">License</a>
      </div>
    </footer>
  );
}
