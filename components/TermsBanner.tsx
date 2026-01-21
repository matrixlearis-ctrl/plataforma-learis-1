import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TermsBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted terms
        const hasAccepted = localStorage.getItem('samej_terms_accepted');
        if (!hasAccepted) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('samej_terms_accepted', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-gray-600 text-sm md:text-base font-medium text-center md:text-left">
                    Utilizamos cookies para oferecer melhor experiência. Ao continuar navegando, você concorda com nossos <Link to="/termos" className="text-brand-blue font-bold underline hover:text-brand-darkBlue">Termos de Uso</Link> e Política de Privacidade.
                </p>
                <button
                    onClick={handleAccept}
                    className="bg-brand-orange text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-brand-lightOrange transition-colors shadow-lg active:scale-95 whitespace-nowrap"
                >
                    Concordo e Fechar
                </button>
            </div>
        </div>
    );
};

export default TermsBanner;
