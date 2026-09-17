import React, { useState } from 'react';
import { MapPin, Check, Navigation, Search, X } from 'lucide-react';

interface LocationModalProps { isOpen: boolean; onClose: () => void; currentAddress: string; onSelectAddress: (address: string, coords?: { lat: number; lng: number }) => void; }
const PRESET_LOCALITIES = [
  { name: 'Connaught Place, Central Delhi', tag: 'Popular', detail: 'Block A-M, Inner Circle, New Delhi 110001', lat: 28.6304, lng: 77.2177, eta: '10-15 mins' },
  { name: 'Lajpat Nagar IV, South Delhi', tag: 'Quick Delivery', detail: 'Central Market, Lajpat Nagar, New Delhi 110024', lat: 28.5678, lng: 77.2433, eta: '12-18 mins' },
  { name: 'Karol Bagh, West Delhi', tag: 'Market Hub', detail: 'Ajmal Khan Road, Karol Bagh, New Delhi 110005', lat: 28.6517, lng: 77.1906, eta: '15-20 mins' },
  { name: 'Hauz Khas Enclave, South Delhi', tag: 'Express Zone', detail: 'Aurobindo Marg, Hauz Khas, New Delhi 110016', lat: 28.5494, lng: 77.2001, eta: '10-16 mins' },
  { name: 'Saket District Centre, South Delhi', tag: 'Active', detail: 'Press Enclave Marg, Saket, New Delhi 110017', lat: 28.5245, lng: 77.2066, eta: '18-25 mins' },
  { name: 'Indirapuram / Noida Sector 62', tag: 'NCR Hub', detail: 'Expressway corridor, Sector 62, Noida 201309', lat: 28.6280, lng: 77.3649, eta: '20-25 mins' }
];

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, currentAddress, onSelectAddress }) => {
  const [search, setSearch] = useState('');
  if (!isOpen) return null;
  const filtered = PRESET_LOCALITIES.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase()));

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      onSelectAddress(currentAddress || 'Current location');
      onClose();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude: lat, longitude: lng } = position.coords;
        onSelectAddress(`Current location (${lat.toFixed(5)}, ${lng.toFixed(5)})`, { lat, lng });
        onClose();
      },
      () => {
        onSelectAddress(currentAddress || 'Current location');
        onClose();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex items-center gap-2.5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173d2e] text-white"><MapPin size={20} /></div><div><h3 className="font-extrabold text-base text-[#173d2e]">Select Delivery Location</h3><p className="text-xs text-[#6e7f76]">To view closest neighborhood merchants & fastest ETAs</p></div></div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 text-slate-500"><X size={18} /></button>
        </div>
        <div className="p-5">
          <button onClick={handleUseCurrentLocation} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-extrabold text-[#173d2e] border border-emerald-200 hover:bg-emerald-100 transition-colors"><Navigation size={15} /><span>Detect Current GPS Location</span></button>
          <div className="relative mt-4"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search area, landmark or pincode..." className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs font-medium outline-none focus:border-[#173d2e] focus:ring-1 focus:ring-[#173d2e]" /></div>
          <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1"><p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Quick Select Neighborhoods</p>{filtered.map(item => { const isSelected = currentAddress.includes(item.name.split(',')[0]); return <button key={item.name} onClick={() => { onSelectAddress(item.name, { lat: item.lat, lng: item.lng }); onClose(); }} className={`flex w-full items-start justify-between rounded-2xl p-3 text-left border transition-all ${isSelected ? 'border-[#173d2e] bg-emerald-50/40 ring-1 ring-[#173d2e]' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/70'}`}><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-extrabold text-xs text-[#173d2e] truncate">{item.name}</span><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">{item.eta}</span></div><p className="mt-0.5 text-[11px] text-slate-500 truncate">{item.detail}</p></div>{isSelected && <Check size={16} className="text-[#173d2e] shrink-0 ml-2 mt-0.5" />}</button>; })}</div>
        </div>
      </div>
    </div>
  );
};
