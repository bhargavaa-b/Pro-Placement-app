import React, { useState } from 'react';
import { ShieldCheck, FileText, Cookie, RefreshCw, Trash2, CheckCircle2, X } from 'lucide-react';
import { removeSavedProfile, clearSecureVault } from '../utils/securityVault';
import { deleteCandidateFromFirestore, auth } from '../lib/firebase';

export type LegalModalType = 'PRIVACY' | 'TERMS' | 'COOKIE' | 'REFUND' | 'DELETE_ACCOUNT' | null;

interface LegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
  activeEmail?: string;
  onAccountDeleted?: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  activeModal,
  onClose,
  activeEmail = '',
  onAccountDeleted,
}) => {
  const [deleteEmailInput, setDeleteEmailInput] = useState(activeEmail);
  const [deleteStatus, setDeleteStatus] = useState<'IDLE' | 'DELETING' | 'DONE' | 'ERROR'>('IDLE');
  const [deleteMessage, setDeleteMessage] = useState('');

  if (!activeModal) return null;

  const handleSelfServiceDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (deleteEmailInput || activeEmail).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setDeleteStatus('ERROR');
      setDeleteMessage('Please enter a valid registered email address.');
      return;
    }

    setDeleteStatus('DELETING');
    setDeleteMessage('');

    try {
      await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      removeSavedProfile(targetEmail);
      await deleteCandidateFromFirestore().catch(() => {});

      if (activeEmail && activeEmail.trim().toLowerCase() === targetEmail) {
        clearSecureVault();
        auth.signOut().catch(() => {});
        onAccountDeleted?.();
      }

      setDeleteStatus('DONE');
      setDeleteMessage(
        `Account and all associated training records for ${targetEmail} have been permanently erased from local storage and cloud databases.`
      );
    } catch {
      setDeleteStatus('ERROR');
      setDeleteMessage('Unable to complete deletion right now. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden text-gray-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2.5">
            {activeModal === 'PRIVACY' && <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />}
            {activeModal === 'TERMS' && <FileText className="w-5 h-5 text-[#D4AF37]" />}
            {activeModal === 'COOKIE' && <Cookie className="w-5 h-5 text-[#D4AF37]" />}
            {activeModal === 'REFUND' && <RefreshCw className="w-5 h-5 text-[#D4AF37]" />}
            {activeModal === 'DELETE_ACCOUNT' && <Trash2 className="w-5 h-5 text-red-600" />}
            <h2 id="legal-modal-title" className="text-lg font-bold text-gray-900 tracking-tight">
              {activeModal === 'PRIVACY' && 'Privacy Policy & Google Play Data Safety'}
              {activeModal === 'TERMS' && 'Terms and Conditions'}
              {activeModal === 'COOKIE' && 'Cookie & Storage Policy'}
              {activeModal === 'REFUND' && 'Refund Policy'}
              {activeModal === 'DELETE_ACCOUNT' && 'Account & Data Deletion Portal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close legal modal"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-sans">
          {activeModal === 'PRIVACY' && (
            <>
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-gray-800 text-xs">
                <strong>Data Privacy & Play Store Data Safety Commitment:</strong> Pro Placement by 3LLION Ventures collects only the minimum necessary information required for your placement training. We do not sell, rent, or share your personal data with third-party advertisers.
              </div>
              <h3 className="text-base font-bold text-gray-900">1. Information We Collect</h3>
              <p>
                We only collect information directly entered by you to personalize your placement roadmap:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li><strong>Account Identity:</strong> Candidate full name, email address, institution/college name, and graduation year.</li>
                <li><strong>Learning Activity:</strong> Solved DSA problem IDs, completed aptitude drills, daily streak count, and coding runner high score.</li>
                <li><strong>Microphone & Voice Input (Ephemeral Processing):</strong> Microphone access is requested strictly when you start a Voice Coach session. Speech is processed ephemerally in real time to generate communication feedback; raw audio recordings are never stored on our servers.</li>
              </ul>

              <h3 className="text-base font-bold text-gray-900">2. Storage, Encryption & Security</h3>
              <p>
                All data transmitted between your device and our cloud databases (Firebase Firestore and Supabase) is encrypted in transit via HTTPS/TLS 1.3. Candidate email PII is isolated inside restricted security rules accessible only to the verified account owner.
              </p>

              <h3 className="text-base font-bold text-gray-900">3. User Rights & Permanent Account/Data Deletion</h3>
              <p>
                In compliance with Google Play User Data Policy, India DPDP Act 2023, and GDPR, you can permanently delete your account and all associated local and cloud records at any time directly from the <strong>Profile &rarr; Delete Account &amp; Data</strong> section or via the <strong>Account &amp; Data Deletion Portal</strong> link in the footer (`/?legal=delete-account`).
              </p>

              <h3 className="text-base font-bold text-gray-900">4. Third-Party Sharing & Advertising</h3>
              <p>
                We do not include third-party advertising SDKs, behavioral trackers, or marketing cookies.
              </p>

              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Publisher: 3LLION Ventures · Developer: Bhargava B
              </p>
            </>
          )}

          {activeModal === 'TERMS' && (
            <>
              <h3 className="text-base font-bold text-gray-900">1. Terms of Use</h3>
              <p>
                By using Pro Placement under 3LLION Ventures, you agree to these educational terms of service.
              </p>

              <h3 className="text-base font-bold text-gray-900">2. Educational Purpose & Non-Affiliation Disclaimer</h3>
              <p>
                Pro Placement is an independent educational training and interview preparation platform developed for students and engineering candidates. Pro Placement and 3LLION Ventures are independent entities and are not affiliated with, endorsed by, or sponsored by any third-party technology corporations or recruitment boards.
              </p>

              <h3 className="text-base font-bold text-gray-900">3. Intellectual Property</h3>
              <p>
                All platform practice sets, curriculum modules, and interactive tools are original educational materials provided for personal learning use.
              </p>
            </>
          )}

          {activeModal === 'COOKIE' && (
            <>
              <h3 className="text-base font-bold text-gray-900">1. How Storage Is Used</h3>
              <p>
                Pro Placement uses essential browser local storage to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Keep you signed into your candidate profile across reloads.</li>
                <li>Preserve your daily practice progress and game high score.</li>
                <li>Save your solved DSA questions and completed aptitude modules.</li>
              </ul>
            </>
          )}

          {activeModal === 'REFUND' && (
            <>
              <h3 className="text-base font-bold text-gray-900">1. Satisfaction Guarantee</h3>
              <p>
                3LLION Ventures provides students with a transparent satisfaction guarantee.
              </p>

              <h3 className="text-base font-bold text-gray-900">2. 7-Day Refund Policy</h3>
              <p>
                If a candidate enrolls in any optional mentorship program through 3LLION Ventures, a full refund can be requested within 7 days of purchase.
              </p>
            </>
          )}

          {activeModal === 'DELETE_ACCOUNT' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
                <strong>Permanent Account &amp; Data Deletion (Google Play / GDPR / DPDP Compliance):</strong> Submitting this form immediately and permanently deletes your candidate profile, email address, solved DSA/Aptitude records, and streak history from local storage, Express server storage, Supabase, and Firebase Firestore.
              </div>

              <form onSubmit={handleSelfServiceDeletion} className="space-y-3">
                <div>
                  <label htmlFor="delete-account-email" className="block text-xs font-bold text-gray-800 mb-1">
                    Registered Candidate Email Address
                  </label>
                  <input
                    id="delete-account-email"
                    type="email"
                    required
                    value={deleteEmailInput}
                    onChange={(e) => setDeleteEmailInput(e.target.value)}
                    placeholder="you@college.edu"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-red-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={deleteStatus === 'DELETING'}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {deleteStatus === 'DELETING'
                    ? 'Erasing Account & Cloud Data...'
                    : 'Permanently Delete My Account & Data'}
                </button>
              </form>

              {deleteStatus === 'DONE' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{deleteMessage}</span>
                </div>
              )}

              {deleteStatus === 'ERROR' && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {deleteMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#18181B] hover:bg-black text-white font-medium text-xs rounded-xl transition"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const CookieConsentBanner: React.FC = () => {
  const [consentGiven, setConsentGiven] = useState(() => {
    return Boolean(localStorage.getItem('pro_placement_cookie_consent'));
  });

  const handleAccept = () => {
    localStorage.setItem('pro_placement_cookie_consent', 'true');
    setConsentGiven(true);
  };

  const handleDecline = () => {
    localStorage.setItem('pro_placement_cookie_consent', 'declined');
    setConsentGiven(true);
  };

  if (consentGiven) return null;

  return (
    <aside
      aria-label="Cookie and data storage consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white border border-gray-200 rounded-2xl p-4 shadow-xl text-gray-900"
    >
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-gray-900">Storage Preferences</h4>
          <p className="text-gray-600 leading-relaxed">
            We use essential local storage to remember your daily progress and solved questions. No third-party ad tracking.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleAccept}
              className="px-3.5 py-1.5 bg-[#18181B] hover:bg-black text-white font-medium rounded-lg text-xs transition"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs transition border border-gray-200"
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
