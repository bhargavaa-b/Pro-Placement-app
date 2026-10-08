import React, { useState } from 'react';
import { ShieldCheck, FileText, Cookie, RefreshCw, X } from 'lucide-react';

export type LegalModalType = 'PRIVACY' | 'TERMS' | 'COOKIE' | 'REFUND' | null;

interface LegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ activeModal, onClose }) => {
  if (!activeModal) return null;

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
            <h2 id="legal-modal-title" className="text-lg font-bold text-gray-900 tracking-tight">
              {activeModal === 'PRIVACY' && 'Privacy Policy'}
              {activeModal === 'TERMS' && 'Terms and Conditions'}
              {activeModal === 'COOKIE' && 'Cookie & Storage Policy'}
              {activeModal === 'REFUND' && 'Refund Policy'}
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
                <strong>Data Privacy Commitment:</strong> Pro Placement by 3LLION Ventures collects only the minimum necessary information required for your placement training. We do not sell or share your personal data.
              </div>
              <h3 className="text-base font-bold text-gray-900">1. Information We Collect</h3>
              <p>
                We only collect information directly entered by you to personalize your placement roadmap:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Candidate name, email ID, and college/institution details.</li>
                <li>Practice history: solved DSA problem IDs, aptitude quiz scores, and daily progress.</li>
                <li>Voice practice transcripts: Processed in real time for feedback; audio is not stored.</li>
              </ul>

              <h3 className="text-base font-bold text-gray-900">2. Storage & Security</h3>
              <p>
                Your candidate profile and study progress are stored in your client browser's local storage and synchronized with our server database.
              </p>

              <h3 className="text-base font-bold text-gray-900">3. Third-Party Integrations</h3>
              <p>
                We do not include third-party advertising trackers or marketing cookies.
              </p>

              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                3LLION Ventures. Contact: privacy@3llionventures.com.
              </p>
            </>
          )}

          {activeModal === 'TERMS' && (
            <>
              <h3 className="text-base font-bold text-gray-900">1. Terms of Use</h3>
              <p>
                By using Pro Placement under 3LLION Ventures, you agree to these standard educational terms of service.
              </p>

              <h3 className="text-base font-bold text-gray-900">2. Educational Use</h3>
              <p>
                Pro Placement is designed strictly as an educational learning and preparation environment for students and candidates.
              </p>

              <h3 className="text-base font-bold text-gray-900">3. Intellectual Property</h3>
              <p>
                All platform questions, curriculum modules, and interactive tools are provided for personal educational use.
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
                <li>Keep you signed into your candidate profile.</li>
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
                If a candidate enrolls in any premium mentorship course through Pro Placement, a full refund can be requested within 7 days of purchase.
              </p>
            </>
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
