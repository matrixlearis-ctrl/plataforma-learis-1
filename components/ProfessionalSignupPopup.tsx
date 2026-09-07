import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfessionalSignupPopupProps {
    onClose: () => void;
}

const ProfessionalSignupPopup: React.FC<ProfessionalSignupPopupProps> = ({ onClose }) => {
    return (
        <div className="fixed bottom-32 sm:bottom-6 right-6 z-[100] animate-in slide-in-from-right-full duration-700">
            <div className="bg-[#f0f9ff] rounded-2xl shadow-2xl border border-blue-100 overflow-hidden max-w-[360px] flex relative group">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 p-1 bg-white/80 hover:bg-white rounded-full text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Image Section with Hexagonal Accent */}
                <div className="hidden sm:block w-[120px] relative overflow-hidden bg-brand-lightOrange/10">
                    <div className="absolute inset-0 bg-brand-orange/5 clip-path-hex origin-center scale-150"></div>
                    <img
                        src="/images/popup.png"
                        alt="Profissional"
                        className="w-full h-full object-cover object-center relative z-[1]"
                    />
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col justify-center space-y-3">
                    <h3 className="text-2xl font-black text-gray-800 leading-tight tracking-tight">
                        Profissional?
                    </h3>

                    <Link
                        to="/auth"
                        onClick={onClose}
                        className="text-[#0091ea] font-black text-lg hover:text-brand-blue transition-colors flex items-center group/link"
                    >
                        Junte-se à Samej
                        <span className="ml-2 transform group-hover/link:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalSignupPopup;
