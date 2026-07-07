import { Link } from 'react-router-dom';
import { Zap, Droplet, Wind, Hammer, Paintbrush, Building2, Cpu, Truck } from 'lucide-react';

const tradeIcons: Record<string, typeof Zap> = {
  Electrician: Zap,
  Plumber: Droplet,
  'AC & Cooling': Wind,
  Carpenter: Hammer,
  Painter: Paintbrush,
  Mason: Building2,
  Electronics: Cpu,
  Moving: Truck,
};

export function Footer() {
  return (
    <footer className="bg-bg-2 border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-1.5 mb-3">
              <span className="font-display font-extrabold text-xl">
                <span className="text-primary-mid">Skill</span>
                <span className="text-text">Bridge</span>
              </span>
            </Link>
            <p className="text-sm text-text-2 max-w-xs">
              Nigeria's KYC-verified skilled technician marketplace. Built for trust, designed for Nigeria.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/find" className="text-sm text-text-2 hover:text-primary-mid transition-colors">Find a Pro</Link></li>
              <li><Link to="/jobs" className="text-sm text-text-2 hover:text-primary-mid transition-colors">Job Board</Link></li>
              <li><Link to="/shops" className="text-sm text-text-2 hover:text-primary-mid transition-colors">Shops</Link></li>
              <li><Link to="/subscribe" className="text-sm text-text-2 hover:text-primary-mid transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text mb-3">Trades</h4>
            <ul className="space-y-2">
              {Object.entries(tradeIcons).slice(0, 5).map(([trade]) => (
                <li key={trade}>
                  <Link to={`/find?trade=${encodeURIComponent(trade)}`} className="text-sm text-text-2 hover:text-primary-mid transition-colors">
                    {trade}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-text-2 hover:text-primary-mid transition-colors">About</Link></li>
              <li><Link to="/" className="text-sm text-text-2 hover:text-primary-mid transition-colors">Privacy</Link></li>
              <li><Link to="/" className="text-sm text-text-2 hover:text-primary-mid transition-colors">Terms</Link></li>
              <li><Link to="/" className="text-sm text-text-2 hover:text-primary-mid transition-colors">Help</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-3">
            Built for Nigeria
          </p>
          <p className="text-sm text-text-3">
            (c) {new Date().getFullYear()} SkillBridge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
