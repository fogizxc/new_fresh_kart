import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Heart, Sparkles, RefreshCw } from 'lucide-react';

export const BlinkitFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white pt-12 pb-24 text-[#203229]">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Philosophy */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173d2e] text-xl text-white">
                🌿
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-[#173d2e]">FreshCart</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#718279]">
                  Hyperlocal Quick Commerce
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#55695f]">
              India's authentic neighborhood grocery network connecting local kirana storekeepers directly
              with households within 15–25 minutes. No dark warehouses, pure local empowerment.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-black text-emerald-800">
              <ShieldCheck size={16} />
              <span>100% Verified Local Sellers</span>
            </div>
          </div>

          {/* Col 2: Quick Links & Tabs */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#173d2e]">
              Popular Categories
            </h4>
            <ul className="mt-3 space-y-2 text-xs font-semibold text-[#55695f]">
              <li>
                <a href="#fresh-picks" className="hover:text-[#173d2e]">
                  Farm Fresh Vegetables & Hydroponics
                </a>
              </li>
              <li>
                <a href="#fresh-picks" className="hover:text-[#173d2e]">
                  Dairy, Eggs & Fresh Paneer Blocks
                </a>
              </li>
              <li>
                <a href="#fresh-picks" className="hover:text-[#173d2e]">
                  Atta, Rice, Pulses & Organic Pantry
                </a>
              </li>
              <li>
                <a href="#fresh-picks" className="hover:text-[#173d2e]">
                  Cold Pressed Juices & Quick Munchies
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Guarantee */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#173d2e]">
              FreshCart Promise
            </h4>
            <div className="mt-3 space-y-2.5 text-xs text-[#55695f]">
              <div className="flex items-start gap-2">
                <Sparkles size={15} className="text-[#3b7a5d] shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Replacements:</strong> Freshness verified upon pickup by your local
                  rider.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <RefreshCw size={15} className="text-[#3b7a5d] shrink-0 mt-0.5" />
                <span>
                  <strong>Hassle-Free Refunds:</strong> Direct UPI returns if you're not completely
                  delighted.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Heart size={15} className="text-[#3b7a5d] shrink-0 mt-0.5" />
                <span>
                  <strong>Support Local Kiranas:</strong> 100% revenue credited to verified neighborhood
                  merchants.
                </span>
              </div>
            </div>
          </div>

          {/* Col 4: Contact Us */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#173d2e]">Contact Us</h4>
            <div className="mt-3 space-y-2.5 text-xs text-[#55695f]">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#3b7a5d]" />
                <span className="font-bold">+91 1800 200 4545 (Toll Free 24x7)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#3b7a5d]" />
                <span>support@freshcart.quickcommerce.in</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-[#3b7a5d] shrink-0 mt-0.5" />
                <span>Connaught Place, Barakhamba Road, New Delhi 110001</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FreshCart Technologies. Hyperlocal Grocery Delivery Platform.</p>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Merchant Onboarding Agreement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
