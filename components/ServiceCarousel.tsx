import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SERVICES = [
    { id: 'construcao', name: 'Construções', image: '/images/construcao.jpg' },
    { id: 'reformas', name: 'Reformas', image: '/images/reforma.jpg' },
    { id: 'eletricista', name: 'Serviço de Eletricista', image: '/images/eletricista.jpg' },
    { id: 'telhado', name: 'Telhado', image: '/images/telhado.jpg' },
    { id: 'pintura', name: 'Serviço de pintura', image: '/images/pintura.jpg' },
    { id: 'limpeza', name: 'Limpeza', image: '/images/limpeza.jpg' },
    { id: 'jardinagem', name: 'Jardinagem', image: '/images/jardinagem.jpg' },
];

const ServiceCarousel: React.FC = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const cardWidth = scrollContainerRef.current.offsetWidth / 3;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -cardWidth : cardWidth,
                behavior: 'smooth'
            });
        }
    };

    // Efeito de auto-scroll (da direita para a esquerda)
    useEffect(() => {
        const interval = setInterval(() => {
            if (scrollContainerRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

                // Se chegar ao final, volta pro começo
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    scroll('right');
                }
            }
        }, 4000); // 4 segundos entre cada movimento

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-12 md:px-20 relative">
                {/* Header Section */}
                <div className="text-center mb-16 space-y-3">
                    <h2 className="text-3xl md:text-5xl font-black text-brand-darkBlue tracking-tight">
                        Principais serviços pedidos
                    </h2>
                    <p className="text-gray-500 font-bold uppercase text-[12px] tracking-[0.2em]">
                        Os serviços mais realizados de cada categoria
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative group">
                    {/* Navigation Arrows - SEMPRE VISÍVEIS E FORA DAS FOTOS */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute -left-12 md:-left-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-brand-blue hover:text-brand-orange transition-all border border-gray-100 flex shadow-blue-900/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute -right-12 md:-right-16 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-brand-blue hover:text-brand-orange transition-all border border-gray-100 flex shadow-blue-900/10"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Cards Scrollable Area */}
                    <div
                        ref={scrollContainerRef}
                        className="flex space-x-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 md:px-0 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {SERVICES.map((service) => (
                            <div
                                key={service.id}
                                className="flex-shrink-0 w-full md:w-[calc(33.333%-16px)] snap-start"
                            >
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden group/card mb-4 mx-1">
                                    {/* Top Image */}
                                    <div className="h-48 md:h-56 relative overflow-hidden">
                                        <img
                                            src={service.image}
                                            alt={service.name}
                                            onError={(e) => {
                                                e.currentTarget.src = `https://picsum.photos/seed/${service.id}/600/400`;
                                            }}
                                            className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                                        />
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 md:p-8 text-center space-y-4">
                                        <p className="font-bold text-gray-800 text-sm md:text-base">
                                            {service.name}
                                        </p>
                                        <Link
                                            to={`/pedir-orcamento?category=${service.id}`}
                                            className="inline-block text-[#0091ea] font-black text-sm md:text-base hover:text-brand-orange transition-colors"
                                        >
                                            Solicitar orçamento
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ServiceCarousel;
