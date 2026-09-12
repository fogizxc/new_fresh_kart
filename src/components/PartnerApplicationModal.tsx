import { useState, type FormEvent } from 'react';
import {
  Bike,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  User,
  X
} from 'lucide-react';
import { api, type PartnerApplicationInput } from '../services/api';

interface Props {
  type: 'shopkeeper' | 'employee';
  onClose: () => void;
}

export function PartnerApplicationModal({ type, onClose }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [postalCode, setPostalCode] = useState('110001');
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [preferredCallAt, setPreferredCallAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [consent, setConsent] = useState(false);

  // Shopkeeper fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Grocery / Kirana');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  // Employee fields
  const [qualification, setQualification] = useState('High School');
  const [experience, setExperience] = useState('1');
  const [preferredRole, setPreferredRole] = useState('Delivery Partner (Two Wheeler)');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ referenceId: string; scheduledCallAt: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Please accept the background verification consent to proceed.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload: PartnerApplicationInput = {
        type,
        fullName,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        idProofType,
        idProofNumber,
        preferredCallAt: new Date(preferredCallAt).toISOString(),
        consent,
        ...(type === 'shopkeeper'
          ? {
              businessName,
              businessType,
              gstin: gstin.toUpperCase(),
              pan: pan.toUpperCase()
            }
          : {
              qualification,
              experience,
              preferredRole,
              emergencyContactName,
              emergencyContactPhone
            })
      };

      const result = await api.submitPartnerApplication(payload);
      setSuccess({ referenceId: result.referenceId, scheduledCallAt: result.scheduledCallAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application submission failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ea] text-[#3c7358]">
              {type === 'shopkeeper' ? <Store size={22} /> : <Bike size={22} />}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#819087]">
                Official Partner Onboarding
              </span>
              <h2 className="heading text-xl font-extrabold text-[#173d2e]">
                {type === 'shopkeeper' ? 'Shopkeeper & Merchant Application' : 'Delivery Rider Partner Application'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <X size={20} />
          </button>
        </div>

        {/* Form Body or Success Screen */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="heading mt-4 text-2xl font-extrabold text-[#173d2e]">
                Application Submitted!
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#52655b]">
                Your partner onboarding request has been queued for verification. A FreshCart onboarding executive will review your ID proofs and connect with you.
              </p>

              <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-[#fafbf8] p-5 text-left border border-black/5">
                <div className="text-xs font-bold text-[#819087]">Application Reference ID</div>
                <div className="mt-1 font-mono text-base font-extrabold text-[#173d2e]">
                  {success.referenceId}
                </div>
                <div className="mt-4 text-xs font-bold text-[#819087]">Verification Call Window</div>
                <div className="mt-1 text-xs font-semibold text-[#203229]">
                  {new Date(success.scheduledCallAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-6 rounded-2xl bg-[#173d2e] px-8 py-3 text-xs font-extrabold text-white hover:bg-[#122e23]"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-800">
                  {error}
                </div>
              )}

              {/* Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#819087]">
                  1. Contact Information
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#52655b]">Full Legal Name</label>
                    <input
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="As on Government ID"
                      className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#52655b]">Email Address</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#52655b]">Phone Number</label>
                    <input
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#52655b]">City & State</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <input
                        required
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="City"
                        className="rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                      <input
                        required
                        value={state}
                        onChange={e => setState(e.target.value)}
                        placeholder="State"
                        className="rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#52655b]">Street Address & PIN</label>
                  <div className="mt-1 grid grid-cols-[1fr_120px] gap-2">
                    <input
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Shop or residential address"
                      className="rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                    />
                    <input
                      required
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      className="rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                    />
                  </div>
                </div>
              </div>

              {/* ID Proof Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#819087]">
                  2. Identity Proof & Credentials
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#52655b]">ID Proof Type</label>
                    <select
                      value={idProofType}
                      onChange={e => setIdProofType(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#52655b]">ID Document Number</label>
                    <input
                      required
                      value={idProofNumber}
                      onChange={e => setIdProofNumber(e.target.value)}
                      placeholder="e.g. 1234 5678 9012"
                      className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                    />
                  </div>
                </div>
              </div>

              {/* Role Specific Section */}
              {type === 'shopkeeper' ? (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#819087]">
                    3. Store & Tax Verification
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#52655b]">Business / Store Name</label>
                      <input
                        required
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        placeholder="e.g. Green Valley Fresh Market"
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#52655b]">Business Type</label>
                      <input
                        required
                        value={businessType}
                        onChange={e => setBusinessType(e.target.value)}
                        placeholder="e.g. Fruits & Veggies, Dairy, Kirana"
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#52655b]">GSTIN (15 Digits)</label>
                      <input
                        required
                        value={gstin}
                        onChange={e => setGstin(e.target.value)}
                        maxLength={15}
                        placeholder="07AAAAA0000A1Z5"
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#52655b]">PAN Card Number</label>
                      <input
                        required
                        value={pan}
                        onChange={e => setPan(e.target.value)}
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#819087]">
                    3. Rider Experience & Emergency Contact
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-[#52655b]">Preferred Role</label>
                      <input
                        required
                        value={preferredRole}
                        onChange={e => setPreferredRole(e.target.value)}
                        placeholder="e.g. Express Rider, Warehouse Packer"
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#52655b]">Experience (Years)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        max="30"
                        value={experience}
                        onChange={e => setExperience(e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#52655b]">Emergency Contact Name</label>
                      <input
                        value={emergencyContactName}
                        onChange={e => setEmergencyContactName(e.target.value)}
                        placeholder="Family member or contact"
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#52655b]">Emergency Contact Phone</label>
                      <input
                        value={emergencyContactPhone}
                        onChange={e => setEmergencyContactPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Call timing & Consent */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#819087]">
                  4. Verification Schedule
                </h4>
                <div>
                  <label className="block text-xs font-bold text-[#52655b]">
                    Preferred Callback Window
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={preferredCallAt}
                    onChange={e => setPreferredCallAt(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-black/10 bg-[#fafbf8] p-3 text-xs font-semibold outline-none focus:border-[#6f9f83]"
                  />
                </div>

                <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-md text-[#173d2e] focus:ring-[#173d2e]"
                  />
                  <span className="text-xs font-medium leading-relaxed text-[#52655b]">
                    I certify that all details provided are accurate. I consent to FreshCart verifying my credentials, GSTIN/ID documents, and scheduling a partner verification call.
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 rounded-2xl border border-black/10 py-3 text-xs font-black text-[#52655b] hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-2/3 rounded-2xl bg-[#173d2e] py-3 text-xs font-black text-white hover:bg-[#122e23] disabled:opacity-50"
                >
                  {saving ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
