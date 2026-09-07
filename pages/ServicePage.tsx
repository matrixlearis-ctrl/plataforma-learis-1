
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ProfessionalProfile } from '../types';
import {
    Star,
    MapPin,
    CheckCircle2,
    ArrowRight,
    Calculator,
    TrendingUp,
    Zap,
    ShieldCheck,
    Users,
    Search,
    ChevronRight,
    X,
    ArrowLeft,
    ThumbsUp,
    User,
    Phone
} from 'lucide-react';

const ServicePage: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [pros, setPros] = useState<ProfessionalProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [unitValue, setUnitValue] = useState<number>(0);
    const [showPrice, setShowPrice] = useState(false);
    const [step, setStep] = useState(1);
    const [patientPerfil, setPatientPerfil] = useState<string>('');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [patientLocation, setPatientLocation] = useState<string>('');
    const [frequency, setFrequency] = useState<string>('');
    const [serviceTimeframe, setServiceTimeframe] = useState<string>('');
    const [serviceDateTime, setServiceDateTime] = useState<string>('');
    const [patientDependency, setPatientDependency] = useState<string>('');
    const [specialRequirement, setSpecialRequirement] = useState<string>('');
    const [orderDetails, setOrderDetails] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [userPhone, setUserPhone] = useState<string>('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Diarista Specific States
    const [cleaningType, setCleaningType] = useState<string>('');
    const [cleaningLocation, setCleaningLocation] = useState<string>('');
    const [numBedrooms, setNumBedrooms] = useState<string>('');
    const [numBathrooms, setNumBathrooms] = useState<string>('');
    const [extraServices, setExtraServices] = useState<string[]>([]);
    const [hasChildrenPets, setHasChildrenPets] = useState<string[]>([]);
    const [cleaningFrequency, setCleaningFrequency] = useState<string>('');
    const [cleaningTimeframe, setCleaningTimeframe] = useState<string>('');
    const [materialIncluded, setMaterialIncluded] = useState<string>('');
    const [cep, setCep] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [loadingCep, setLoadingCep] = useState(false);

    // Churrasqueiro Specific States
    const [eventType, setEventType] = useState<string>('');
    const [guestCount, setGuestCount] = useState<string>('');
    const [eventDateTime, setEventDateTime] = useState<string>('');

    // Cozinheira Specific States
    const [cookingType, setCookingType] = useState<string>('');
    const [peopleCount, setPeopleCount] = useState<string>('');
    const [serviceWhen, setServiceWhen] = useState<string>('');
    const [massageType, setMassageType] = useState<string>('');
    const [professionalGender, setProfessionalGender] = useState<string>('');
    const [massageLocation, setMassageLocation] = useState<string>('');
    const [hasTable, setHasTable] = useState<string>('');
    const [sessionDuration, setSessionDuration] = useState<string>('');
    const [preferedDate, setPreferedDate] = useState<string>('');
    const [preferedTime, setPreferedTime] = useState<string>('');
    const [interestLevel, setInterestLevel] = useState<string>('');

    // Arquitetos Specific States
    const [architectLocation, setArchitectLocation] = useState<string>('');
    const [architectServiceType, setArchitectServiceType] = useState<string>('');
    const [propertyType, setPropertyType] = useState<string>('');
    const [projectSize, setProjectSize] = useState<string>('');
    const [constructionSupervision, setConstructionSupervision] = useState<string>('');
    const [architectServiceWhen, setArchitectServiceWhen] = useState<string>('');
    const [psychologistLocation, setPsychologistLocation] = useState<string>('');
    const [psychologyServiceType, setPsychologyServiceType] = useState<string>('');

    const [searchTerm, setSearchTerm] = useState<string>('');

    // Map slug to display title
    const serviceMap: Record<string, { title: string, unit: string, price: number, bg: string, categoryName: string }> = {
        'cuidadores-de-idosos': { title: 'Cuidador de Pessoas', unit: 'horas', price: 45, bg: '/images/cuidador de idosos.jpg', categoryName: 'Saúde' },
        'churrasqueiro-em-domicilio': { title: 'Churrasqueiro em domicílio', unit: 'pessoas', price: 35, bg: '/images/Churrasqueiro.jpg', categoryName: 'Lazer' },
        'cozinheiras-em-domicilio': { title: 'Cozinheiras em domicílio', unit: 'refeição', price: 80, bg: '/images/Cozinheiras.jpg', categoryName: 'Gastronomia' },
        'diarista': { title: 'Diarista', unit: 'diária', price: 150, bg: '/images/Diarista.jpg', categoryName: 'Limpeza' },
        'arquitetos': { title: 'Arquiteto', unit: 'projeto', price: 200, bg: '/images/Arquitetos.jpg', categoryName: 'Design e Consultoria' },
        'massagista': { title: 'Massagistas Perto de Você', unit: 'sessão', price: 100, bg: '/images/massagista.jpg', categoryName: 'Bem-estar' },
    };

    const service = slug ? serviceMap[slug] : null;

    const handleSubmitOrder = async () => {
        if (!userName || !userPhone) {
            alert("Por favor, preencha seu nome e telefone.");
            return;
        }

        setIsSubmitting(true);
        try {
            const isCaregiver = slug === 'cuidadores-de-idosos';
            const isDiarista = slug === 'diarista';

            let finalDescription = '';

            if (isCaregiver) {
                finalDescription = `TIPO: ${serviceMap[slug || '']?.title || 'Não especificado'}\nPERFIL: ${patientPerfil}\nSERVIÇOS SELECIONADOS: ${selectedServices.join(', ')}\nLOCALIZAÇÃO DO PACIENTE: ${patientLocation}\nFREQUÊNCIA: ${frequency}\nDATA/HORA PREVISTA: ${serviceDateTime}\nDEPENDÊNCIA: ${patientDependency}\nREQUESITOS ESPECIAIS: ${specialRequirement}\nCEP: ${cep}\nENDEREÇO: ${address}\n\nOBSERVAÇÕES ADICIONAIS: ${orderDetails}`;
            } else if (isDiarista) {
                finalDescription = `TIPO DE LIMPEZA: ${cleaningType}\nLOCAL: ${cleaningLocation}\nQUARTOS: ${numBedrooms}\nBANHEIROS: ${numBathrooms}\nADICIONAIS: ${extraServices.join(', ')}\nCRIANÇAS/ANIMAIS: ${hasChildrenPets.join(', ')}\nFREQUÊNCIA: ${cleaningFrequency}\nQUANDO: ${cleaningTimeframe}\nMATERIAL: ${materialIncluded}\nCEP: ${cep}\nENDEREÇO: ${address}\n\nOBSERVAÇÕES: ${orderDetails}`;
            } else if (slug === 'churrasqueiro-em-domicilio') {
                finalDescription = `SERVIÇO: Churrasqueiro em domicílio\nTIPO DE EVENTO: ${eventType}\nCONVIDADOS: ${guestCount}\nDATA/HORA DO EVENTO: ${eventDateTime}\nCEP: ${cep}\nENDEREÇO: ${address}\n\nOBSERVAÇÕES: ${orderDetails}`;
            } else if (slug === 'cozinheiras-em-domicilio') {
                finalDescription = `SERVIÇO: Cozinheira em domicílio\nTIPO DE COZINHA: ${cookingType}\nFREQUÊNCIA: ${frequency}\nPESSOAS: ${peopleCount}\nQUANDO: ${serviceWhen}\nCEP: ${cep}\nENDEREÇO: ${address}\n\nDETALHES: ${orderDetails}`;
            } else if (slug === 'massagista') {
                finalDescription = `SERVIÇO: Massagista
TIPO DE MASSAGEM: ${massageType}
GÊNERO PREFERIDO: ${professionalGender}
LOCAL DO ATENDIMENTO: ${massageLocation}
POSSUI MACA: ${hasTable}
DURAÇÃO DA SESSÃO: ${sessionDuration}
FREQUÊNCIA: ${frequency}
PREFERÊNCIA DE DATA: ${preferedDate}
PREFERÊNCIA DE HORÁRIO: ${preferedTime}
NÍVEL DE INTERESSE: ${interestLevel}
CEP: ${cep}
ENDEREÇO: ${address}

DETALHES: ${orderDetails}`;
            } else if (slug === 'arquitetos') {
                finalDescription = `SERVIÇO: Arquiteto\nQUAL SERVIÇO PROCURADO: ${architectServiceType}\nTIPO DE IMÓVEL: ${propertyType}\nTAMANHO DO PROJETO: ${projectSize}\nACOMPANHAMENTO DE OBRA: ${constructionSupervision}\nQUANDO PRETENDE REALIZAR: ${architectServiceWhen}\nCEP: ${cep}\nENDEREÇO: ${address}\n\nDETALHES: ${orderDetails}`;
            } else {
                finalDescription = `SERVIÇO: ${serviceMap[slug || '']?.title}\nQUANTIDADE: ${unitValue} ${serviceMap[slug || '']?.unit}\nTOTAL ESTIMADO: R$ ${unitValue * (serviceMap[slug || '']?.price || 0)}`;
            }

            const { error: dbError } = await supabase.from('orders').insert([{
                client_id: user?.id || null,
                client_name: userName,
                category: slug || 'geral',
                description: finalDescription,
                phone: userPhone,
                status: 'OPEN',
                lead_price: 5,
                location: 'A definir'
            }]);

            if (dbError) throw dbError;

            // Google Ads Conversion Tracking
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-11057268043/aHHOCLel_f4bEMuKwpgp'
                });
            }

            // Meta Pixel Conversion Tracking (Lead)
            if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'Lead');
            }

            setSubmitted(true);
        } catch (err: any) {
            console.error('Erro ao enviar pedido:', err);
            alert("Não foi possível enviar seu pedido agora: " + (err.message || "Erro desconhecido"));
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchAddress = async () => {
            const cleanCep = cep.replace(/\D/g, '');
            if (cleanCep.length === 8) {
                setLoadingCep(true);
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                    const data = await response.json();
                    if (!data.erro) {
                        setAddress(`${data.logradouro}, ${data.bairro} ${data.localidade} - ${data.uf}`);
                    } else {
                        setAddress('');
                    }
                } catch (error) {
                    setAddress('');
                } finally {
                    setLoadingCep(false);
                }
            } else {
                setAddress('');
            }
        };
        fetchAddress();
    }, [cep]);

    useEffect(() => {
        window.scrollTo(0, 0);
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUser(user);
                setUserName(user.user_metadata?.full_name || '');
            }
        });
        if (service) fetchProfessionals();
    }, [slug]);

    const fetchProfessionals = async () => {
        try {
            setLoading(true);
            // Fetch pros that might match (optional: match by category if possible)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .limit(10);

            if (error) throw error;
            setPros(data || []);
        } catch (err) {
            console.error('Erro ao carregar profissionais:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!service) {
        return (
            <div className="min-h-screen pt-32 text-center">
                <h1 className="text-2xl font-black">Serviço não encontrado</h1>
                <Link to="/" className="text-brand-orange font-bold mt-4 inline-block">Voltar para Home</Link>
            </div>
        );
    }

    if (slug === 'cuidadores-de-idosos') {
        return (
            <div className="bg-white min-h-screen">
                {/* Header / Breadcrumbs */}
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center text-xs font-bold text-gray-400 gap-2 mb-8 uppercase tracking-widest">
                        <Link to="/" className="hover:text-brand-orange transition-colors">Samej</Link>
                        <span>›</span>
                        <span>{service.categoryName}</span>
                        <span>›</span>
                        <span className="text-gray-900">{service.title}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-10">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-5xl font-black text-brand-darkBlue tracking-tighter leading-tight">
                                    Precisando de {service.title}?
                                </h1>
                                <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed">
                                    Milhares de profissionais avaliados por clientes, permitindo você negociar apenas com os melhores.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-brand-blue font-bold">
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Até 4 orçamentos grátis e seguros</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-500 font-bold">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span>Profissionais avaliados</span>
                                </div>
                                <div className="flex items-center gap-3 text-red-500 font-bold">
                                    <Zap className="w-5 h-5" />
                                    <span>Como funciona o Samej?</span>
                                </div>
                            </div>

                            {/* Form Area (Yellow Box) */}
                            <div className="bg-[#FFD700] p-1 rounded-[2rem] shadow-xl overflow-hidden">
                                <div className="bg-white p-8 md:p-12 rounded-[1.8rem] relative min-h-[400px]">
                                    {submitted ? (
                                        <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Pedido Enviado!</h3>
                                            <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed max-w-md">
                                                Excelente! Sua solicitação para <span className="text-brand-blue">{serviceMap[slug || '']?.title}</span> foi enviada com sucesso.
                                            </p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-brand-lightOrange transition-all uppercase tracking-tight"
                                            >
                                                VOLTAR PARA O INÍCIO
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mb-10 overflow-hidden relative">
                                                <div
                                                    className="bg-brand-blue h-full transition-all duration-500"
                                                    style={{ width: `${(step / 11) * 100}%` }}
                                                ></div>
                                            </div>

                                            {step > 1 && (
                                                <button onClick={() => setStep(step - 1)} className="mb-6 flex items-center text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest">
                                                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                                                </button>
                                            )}

                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-600">Receba até 4 orçamentos grátis!</span>
                                            </div>

                                            {step === 1 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">Qual serviço de Cuidador de Pessoas está precisando?</h3>

                                                    <div className="space-y-4 max-w-2xl mx-auto">
                                                        {/* Search Input Filter */}
                                                        <div className="relative group mb-6">
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                                <Search className="w-5 h-5 text-brand-blue" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="O que você precisa?"
                                                                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-100 rounded-xl focus:border-brand-blue outline-none font-medium text-gray-400 text-sm transition-all"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer">
                                                                <X className="w-5 h-5 text-blue-200" />
                                                            </div>
                                                        </div>

                                                        {/* Options Cards */}
                                                        {[
                                                            'Adultos',
                                                            'Crianças',
                                                            'Gestantes',
                                                            'Idosos'
                                                        ].map((opt, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => {
                                                                    setPatientPerfil(opt);
                                                                    setStep(2);
                                                                }}
                                                                className="w-full flex items-center justify-between p-6 rounded-xl border-2 border-gray-100 shadow-xl shadow-blue-500/5 hover:-translate-y-2 transition-all flex flex-col justify-between text-left group"
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue">{opt}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 2 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8">Qual serviço você procura?</h3>

                                                    <div className="space-y-3 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            'Acompanhamento em saídas (supermercado, shopping, etc)',
                                                            'Acompanhamento terapêutico (consultas, pós operatório, etc)',
                                                            'Administração de medicamentos',
                                                            'Banho',
                                                            '', // Field for 'Other'
                                                            'Administração de refeições',
                                                            'Transporte',
                                                            'Companhia',
                                                            'Preparo de refeições',
                                                            'Higiene pessoal',
                                                            'Manutenção do ambiente',
                                                            'Acompanhamento noturno',
                                                            'Atividades lúdicas'
                                                        ].map((opt, i) => (
                                                            opt ? (
                                                                <label
                                                                    key={i}
                                                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group ${selectedServices.includes(opt)
                                                                        ? 'border-brand-blue bg-blue-50/30'
                                                                        : 'border-gray-50 hover:border-gray-200 bg-white'
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedServices.includes(opt)}
                                                                        onChange={() => {
                                                                            if (selectedServices.includes(opt)) {
                                                                                setSelectedServices(selectedServices.filter(s => s !== opt));
                                                                            } else {
                                                                                setSelectedServices([...selectedServices, opt]);
                                                                            }
                                                                        }}
                                                                        className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                                                                    />
                                                                    <span className={`text-sm font-medium transition-colors ${selectedServices.includes(opt) ? 'text-brand-darkBlue font-bold' : 'text-gray-600'}`}>{opt}</span>
                                                                </label>
                                                            ) : (
                                                                <div key={i} className="relative mb-2">
                                                                    <input type="text" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue transition-colors" placeholder="Outro serviço..." />
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={() => setStep(3)}
                                                        disabled={selectedServices.length === 0}
                                                        className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${selectedServices.length > 0
                                                            ? 'bg-brand-blue text-white shadow-xl shadow-blue-200 hover:scale-[1.01]'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 3 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-8 text-green-600">
                                                        <ThumbsUp className="w-5 h-5 fill-current" />
                                                        <span className="text-sm font-bold">Você está indo bem, agora falta pouco!</span>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-gray-800 mb-8">Onde se encontra o paciente?</h3>

                                                    <div className="space-y-3 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            'Casa de retiro',
                                                            'Hospital',
                                                            'Residência (acompanhado)',
                                                            'Residência (sozinho)',
                                                            'Outro'
                                                        ].map((opt, i) => (
                                                            <label
                                                                key={i}
                                                                onClick={() => setPatientLocation(opt)}
                                                                className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer group ${patientLocation === opt
                                                                    ? 'border-brand-blue bg-blue-50/30'
                                                                    : 'border-gray-50 hover:border-gray-200 bg-white'
                                                                    }`}
                                                            >
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${patientLocation === opt
                                                                    ? 'border-brand-blue'
                                                                    : 'border-gray-200'
                                                                    }`}>
                                                                    {patientLocation === opt && <div className="w-3 h-3 rounded-full bg-brand-blue animate-in zoom-in-50 duration-200"></div>}
                                                                </div>
                                                                <span className={`text-base font-medium transition-colors ${patientLocation === opt ? 'text-brand-darkBlue font-bold' : 'text-gray-600'}`}>{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setStep(2)}
                                                            className="w-full py-5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-base text-center hover:bg-blue-50 transition-all"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(4)}
                                                            disabled={!patientLocation}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${patientLocation
                                                                ? 'bg-brand-blue text-white shadow-xl shadow-blue-200 hover:scale-[1.01]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 4 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8">Qual a frequência do serviço?</h3>

                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        <div className="relative">
                                                            <select
                                                                value={frequency}
                                                                onChange={(e) => setFrequency(e.target.value)}
                                                                className="w-full p-4 md:p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 appearance-none cursor-pointer"
                                                            >
                                                                <option value="" disabled>Selecione uma opção</option>
                                                                <option value="uma-vez">Uma única vez</option>
                                                                <option value="1-vez-semana">1 vez por semana</option>
                                                                <option value="2-vezes-semana">2 vezes por semana</option>
                                                                <option value="3-ou-mais-semana">3 ou mais vezes na semana</option>
                                                                <option value="finais-semana">Aos finais de semana</option>
                                                                <option value="quinzenalmente">Quinzenalmente</option>
                                                                <option value="mensalmente">Mensalmente</option>
                                                                <option value="outra">Outra</option>
                                                                <option value="todos-dias">Todos os dias</option>
                                                                <option value="dias-semana">Dias da semana</option>
                                                            </select>
                                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                                                <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setStep(3)}
                                                            className="w-full py-5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-base text-center hover:bg-blue-50 transition-all"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(5)}
                                                            disabled={!frequency}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center shadow-xl transition-all ${frequency
                                                                ? 'bg-brand-blue text-white shadow-blue-200 hover:scale-[1.01]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 5 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-8 text-brand-blue">
                                                        <ShieldCheck className="w-5 h-5 fill-current opacity-20" />
                                                        <span className="text-sm font-medium text-gray-600">Orçamentos rápidos e seguros</span>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-gray-800 mb-8">Para quando você precisa deste serviço?</h3>

                                                    <div className="space-y-3 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            'Urgente (o quanto antes possível)',
                                                            'Nos próximos 7 dias',
                                                            'Nos próximos 15 dias',
                                                            'Nos próximos 30 dias',
                                                            'Não tenho data definida'
                                                        ].map((opt, i) => (
                                                            <label
                                                                key={i}
                                                                onClick={() => setServiceTimeframe(opt)}
                                                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group ${serviceTimeframe === opt
                                                                    ? 'border-brand-blue bg-blue-50/30'
                                                                    : 'border-gray-50 hover:border-gray-200 bg-white'
                                                                    }`}
                                                            >
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${serviceTimeframe === opt
                                                                    ? 'border-brand-blue'
                                                                    : 'border-gray-200'
                                                                    }`}>
                                                                    {serviceTimeframe === opt && <div className="w-3 h-3 rounded-full bg-brand-blue animate-in zoom-in-50 duration-200"></div>}
                                                                </div>
                                                                <span className={`text-base font-medium transition-colors ${serviceTimeframe === opt ? 'text-brand-darkBlue font-bold' : 'text-gray-600'}`}>{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setStep(4)}
                                                            className="w-full py-5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-base text-center hover:bg-blue-50 transition-all"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(6)}
                                                            disabled={!serviceTimeframe}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center shadow-xl transition-all ${serviceTimeframe
                                                                ? 'bg-brand-blue text-white shadow-blue-200 hover:scale-[1.01]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 6 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-8 text-gray-500">
                                                        <Star className="w-4 h-4 fill-current text-brand-darkBlue" />
                                                        <span className="text-sm font-medium">Confira as avaliações dos profissionais</span>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 regular">Informe a data e horário em que você precisará deste serviço:</h3>

                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        <input
                                                            type="text"
                                                            value={serviceDateTime}
                                                            onChange={(e) => setServiceDateTime(e.target.value)}
                                                            className="w-full p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 transition-all shadow-sm"
                                                            placeholder="Informe aqui a data e horário"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setStep(5)}
                                                            className="w-full py-5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-base text-center hover:bg-blue-50 transition-all"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(7)}
                                                            disabled={!serviceDateTime}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center shadow-xl transition-all ${serviceDateTime
                                                                ? 'bg-brand-blue text-white shadow-blue-200 hover:scale-[1.01]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 7 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-8 text-green-600">
                                                        <ThumbsUp className="w-5 h-5 fill-current" />
                                                        <span className="text-sm font-bold">Você está indo bem, agora falta pouco!</span>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-gray-800 mb-8">O paciente é:</h3>

                                                    <div className="space-y-3 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            'Parcialmente dependente (pode realizar necessidades básicas por conta própria)',
                                                            'Totalmente dependente (precisa de auxílio na realização de tarefas básicas)',
                                                            'Não é dependente'
                                                        ].map((opt, i) => (
                                                            <label
                                                                key={i}
                                                                onClick={() => setPatientDependency(opt)}
                                                                className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer group ${patientDependency === opt
                                                                    ? 'border-brand-blue bg-blue-50/30'
                                                                    : 'border-gray-50 hover:border-gray-200 bg-white'
                                                                    }`}
                                                            >
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${patientDependency === opt
                                                                    ? 'border-brand-blue'
                                                                    : 'border-gray-200'
                                                                    }`}>
                                                                    {patientDependency === opt && <div className="w-3 h-3 rounded-full bg-brand-blue animate-in zoom-in-50 duration-200"></div>}
                                                                </div>
                                                                <span className={`text-base font-medium transition-colors ${patientDependency === opt ? 'text-brand-darkBlue font-bold' : 'text-gray-600'}`}>{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setStep(6)}
                                                            className="w-full py-5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-base text-center hover:bg-blue-50 transition-all"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(8)}
                                                            disabled={!patientDependency}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center shadow-xl transition-all ${patientDependency
                                                                ? 'bg-brand-blue text-white shadow-blue-200 hover:scale-[1.01]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 8 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-3 mb-8">
                                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-600">Receba até 4 orçamentos grátis!</span>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 regular">O paciente precisa de algum dos serviços abaixo?:</h3>

                                                    <div className="space-y-3 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            'Cuidado de Feridas Extensas',
                                                            'Aplicação de Injeção',
                                                            'Não é necessário'
                                                        ].map((opt, i) => (
                                                            <label
                                                                key={i}
                                                                onClick={() => setSpecialRequirement(opt)}
                                                                className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer group ${specialRequirement === opt
                                                                    ? 'border-brand-blue bg-blue-50/30'
                                                                    : 'border-gray-50 hover:border-gray-200 bg-white'
                                                                    }`}
                                                            >
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${specialRequirement === opt
                                                                    ? 'border-brand-blue'
                                                                    : 'border-gray-200'
                                                                    }`}>
                                                                    {specialRequirement === opt && <div className="w-3 h-3 rounded-full bg-brand-blue animate-in zoom-in-50 duration-200"></div>}
                                                                </div>
                                                                <span className={`text-base font-medium transition-colors ${specialRequirement === opt ? 'text-brand-darkBlue font-bold' : 'text-gray-600'}`}>{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setStep(7)}
                                                            className="w-full py-5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-base text-center hover:bg-blue-50 transition-all"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(9)}
                                                            disabled={!specialRequirement}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center shadow-xl transition-all ${specialRequirement
                                                                ? 'bg-brand-blue text-white shadow-blue-200 hover:scale-[1.01]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 9 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Explique o que você precisa</h3>
                                                        <p className="text-sm font-medium text-gray-500">Receba até 4 orçamentos grátis, online!</p>
                                                    </div>

                                                    <div className="space-y-4 max-w-2xl mx-auto mb-6">
                                                        <label className="block text-sm font-bold text-gray-700">Detalhe seu pedido</label>
                                                        <textarea
                                                            value={orderDetails}
                                                            onChange={(e) => setOrderDetails(e.target.value)}
                                                            className="w-full p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 transition-all min-h-[150px] resize-none"
                                                            placeholder='Traga todos os detalhes do seu pedido. Tente "Preciso de ..."'
                                                        ></textarea>
                                                    </div>

                                                    <div className="bg-amber-50 border-0 rounded-xl p-4 mb-10 flex items-center justify-center gap-2 relative overflow-visible">
                                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-50 rotate-45"></div>
                                                        <span className="text-xs font-bold text-amber-800 flex items-center gap-2 text-center">
                                                            <span className="text-base">👆</span> Quanto mais informações você fornecer, melhor será o seu pedido!
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => setStep(8)}
                                                            className="w-full py-5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-base text-center hover:bg-blue-50 transition-all"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(10)}
                                                            disabled={orderDetails.length < 5}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center shadow-xl transition-all ${orderDetails.length >= 5
                                                                ? 'bg-brand-blue text-white shadow-blue-200 hover:scale-[1.01]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 10 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-black text-brand-darkBlue mb-4 uppercase">Informe seu CEP</h3>
                                                        <p className="text-center text-gray-500 font-bold mb-10">Utilizamos o CEP para identificar a disponibilidade de profissionais na região.</p>
                                                    </div>
                                                    <div className="max-w-2xl mx-auto space-y-6">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={cep}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                    setCep(val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val);
                                                                }}
                                                                className="w-full p-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 shadow-sm"
                                                                placeholder="00000-000"
                                                            />
                                                            {loadingCep && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>}
                                                        </div>
                                                        {address && <p className="text-sm font-bold text-gray-400 text-center">{address}</p>}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mt-10">
                                                        <button
                                                            onClick={() => setStep(9)}
                                                            className="w-full py-5 rounded-xl border-2 border-brand-blue text-brand-blue font-bold text-base text-center hover:bg-blue-50 transition-all"
                                                        >
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(11)}
                                                            disabled={cep.replace(/\D/g, '').length !== 8}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center shadow-xl transition-all ${cep.replace(/\D/g, '').length === 8
                                                                ? 'bg-brand-blue text-white shadow-blue-200 hover:scale-[1.01]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 11 ? (
                                                <>
                                                    <div className="max-w-2xl mx-auto py-4">
                                                        <h3 className="text-3xl font-black text-brand-darkBlue mb-12">Dados de Contato</h3>

                                                        <div className="space-y-6 mb-12">
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <User className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={userName}
                                                                    onChange={(e) => setUserName(e.target.value.toUpperCase())}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm uppercase"
                                                                    placeholder="SEU NOME COMPLETO"
                                                                />
                                                            </div>

                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="tel"
                                                                    value={userPhone}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                        let masked = raw;
                                                                        if (raw.length > 2) {
                                                                            masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                                                                        }
                                                                        if (raw.length > 7) {
                                                                            masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                                                                        }
                                                                        setUserPhone(masked);
                                                                    }}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm"
                                                                    placeholder="(DDD) + NÚMERO DO TELEFONE"
                                                                />
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={handleSubmitOrder}
                                                            disabled={isSubmitting || !userName || userPhone.replace(/\D/g, '').length !== 11}
                                                            className={`w-full py-6 rounded-[2.5rem] font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-2xl ${userName && userPhone.replace(/\D/g, '').length === 11 && !isSubmitting
                                                                ? 'bg-brand-darkBlue text-white hover:scale-[1.02] active:scale-[0.98]'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            {isSubmitting ? (
                                                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            ) : (
                                                                <>
                                                                    ENVIAR PEDIDO
                                                                    <ChevronRight className="w-5 h-5" />
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => setStep(10)}
                                                            className="w-full mt-6 text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest"
                                                        >
                                                            Voltar para o CEP
                                                        </button>
                                                    </div>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                    <div className="mt-8 bg-green-50/50 py-3 px-6 rounded-lg text-center">
                                        <p className="text-green-600 font-bold text-sm">
                                            Você receberá orçamentos em breve
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="relative group">
                                <img src={service.bg} alt={service.title} className="w-full h-auto rounded-[3rem] shadow-2xl group-hover:scale-[1.02] transition-transform duration-500" />
                            </div>

                            <div className="pt-12 space-y-6">
                                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5">
                                    <div>
                                        <p className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter mb-6">Avaliações de quem contratou</p>
                                        <div className="space-y-6">
                                            {[
                                                {
                                                    client: "Letícia Miranda",
                                                    text: "Fui extremamente bem atendida, com um serviço de alta qualidade. Orçamento gratuito e preço acessível. Super satisfeita!",
                                                    pro: "Ana Souza"
                                                },
                                                {
                                                    client: "João Pedro Silva",
                                                    text: "Equipe altamente qualificada, eficiente e confiável, além de oferecer preços acessíveis. Recomendo muito!",
                                                    pro: "Marcos Oliveira"
                                                },
                                                {
                                                    client: "Cláudia Mendonça",
                                                    text: "Atendimento rápido e cheio de atenção. O profissional foi paciente, cuidadoso e solucionou tudo com muito carinho. Recomendo muito!",
                                                    pro: "Patrícia Lima"
                                                },
                                            ].map((review, i) => (
                                                <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-md shadow-blue-500/5 space-y-4">
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">{review.client} <span className="text-gray-400 font-bold">avaliou:</span></p>
                                                        <p className="text-sm text-gray-500 font-medium leading-relaxed italic mt-2">
                                                            "{review.text}"
                                                        </p>
                                                    </div>
                                                    <div className="flex text-amber-500 gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-current" />)}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-gray-400">
                                                        para <span className="text-brand-blue">{review.pro}</span> / {service.title}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional CTA Section */}
                <section className="py-20 bg-gray-50/50">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-black text-brand-darkBlue mb-4">
                            Você é {service.title}?
                        </h2>
                        <p className="text-gray-500 font-medium text-lg mb-10 max-w-2xl mx-auto">
                            A Samej recebe milhares de pedidos por mês e pode ajudar a aumentar sua renda e conquistar novos clientes.
                        </p>
                        <Link
                            to="/auth?tab=register&role=professional"
                            className="inline-block bg-brand-blue text-white px-12 py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:scale-105 transition-all"
                        >
                            Quero me cadastrar
                        </Link>
                    </div>
                </section>

                {/* Average Costs Section */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">
                                Custos médios
                            </h2>
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.2em]">
                                Conheça o custo estimado para alguns serviços
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: 'um cuidador de idosos', avg: '900,00', min: '1.600,00', max: '1.800,00' },
                                { title: 'contratar cuidador de idosos folguista', avg: '900,00', min: '2.050,00', max: '3.100,00' },
                                { title: 'Home Care', avg: '160,00', min: '190,00', max: '360,00' },
                                { title: 'Acompanhar Paciente no Hospital', avg: '100,00', min: '150,00', max: '250,00' },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5 overflow-hidden flex flex-col">
                                    <div className="p-8 flex-grow">
                                        <div className="text-green-600 font-bold text-[10px] uppercase tracking-widest mb-4">Custo médio estimado</div>
                                        <div className="text-4xl font-black text-gray-900 mb-2">R$ {item.avg}</div>
                                        <div className="text-sm text-gray-500 font-medium leading-relaxed">{item.title}</div>
                                    </div>
                                    <div className="bg-gray-50 p-6 grid grid-cols-2 border-t border-gray-100">
                                        <div>
                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Menor custo</div>
                                            <div className="text-xs font-black text-gray-700">R$ {item.min}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Maior custo</div>
                                            <div className="text-xs font-black text-gray-700">R$ {item.max}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Customer Reviews Section */}
                <section className="py-24 bg-brand-bg/10">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className="text-3xl font-black text-brand-darkBlue mb-12 uppercase tracking-tighter">
                            Avaliações de clientes sobre {service.title}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    user: "Ricardo",
                                    pro: "Maria Silva",
                                    text: "Excelente profissional, muito atenciosa com o paciente e demais pessoas da casa, pessoa de minha confiança, sempre disposta a ajudar nas tarefas da casa inclusive, bem organizada e observadora.",
                                    img: "/images/Ricardo.jpg"
                                },
                                {
                                    user: "Alberto",
                                    pro: "Claudia Rocha",
                                    text: "Sou lhe muito grato por ter me acompanhado em exame de endoscopia e toda a atenção e cuidado.",
                                    img: "/images/Alberto.jpg"
                                },
                                {
                                    user: "Marcos",
                                    pro: "Fernanda Lima",
                                    text: "Excelente trabalho tudo que o paciente necessita ela faz com profissionalismo e cuidado bem estar do paciente.",
                                    img: "/images/Marcos.jpg"
                                },
                                {
                                    user: "Dra. Júlia",
                                    pro: "Roberto Souza",
                                    text: "O Roberto é muito prestativo. O chamei para acompanhar meu tio junto a consulta médica e fiquei muito satisfeita. Perguntou tudo que eu pedi que perguntasse, conduziu as respostas pra médica...",
                                    img: "/images/Dra. Júlia.jpg"
                                }
                            ].map((review, i) => (
                                <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5 flex flex-col h-full">
                                    <div className="flex justify-center mb-6">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm transition-transform hover:scale-110">
                                            <img src={review.img} alt={review.user} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-black text-gray-800 mb-4 leading-tight">
                                            {review.user} opina sobre {review.pro}:
                                        </p>
                                        <p className="text-xs text-gray-500 font-medium leading-[1.6] mb-6 line-clamp-6">
                                            {review.text}
                                        </p>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Avaliação verificada</div>
                                        <div className="flex text-amber-500 gap-0.5">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} className="w-3.5 h-3.5 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Similar Orders Section */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">
                                Veja alguns pedidos similares para {service.title}
                            </h2>
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.2em]">
                                Esses são os últimos pedidos para essa categoria
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    client: "Camila",
                                    text: "Acompanhante para idoso, tem que fazer faxina, ir ao mercado, fazer demais compras como remédios, e demais itens de necessidade do idoso além de..."
                                },
                                {
                                    client: "Henrique",
                                    text: "Preciso de um acompanhante para fazer o exame de colonoscopia no hospital santa isabel no próximo dia 08/05. Tenho de estar lá às 06:30 hs..."
                                },
                                {
                                    client: "Fernanda",
                                    text: "Preciso de cuidador avulso para 12 horas dia/noite finais de semana"
                                },
                                {
                                    client: "Gabriel",
                                    text: "Homem tetraplégico precisa de cuidador homem para banho, alimentaçao acompanhá-lo ao local de trabalho. Precisamos de alguém que fique 24hs e folga..."
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-[2rem] border-2 border-gray-100 shadow-xl shadow-blue-500/5 hover:border-brand-blue/30 transition-all flex flex-col h-full group">
                                    <div className="flex-grow">
                                        <h4 className="text-sm font-black text-gray-800 mb-4 leading-tight">
                                            {item.client} contratou {service.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6 line-clamp-6 italic">
                                            "{item.text}"
                                        </p>
                                    </div>
                                    <div className="mt-auto flex items-center gap-2 text-green-600">
                                        <CheckCircle2 className="w-4 h-4 fill-current" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Pedido atendido</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-24 bg-gray-50/50">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <span className="text-brand-blue font-black uppercase text-xs tracking-[0.3em] mb-4 block">(Perguntas Frequentes)</span>
                            <h2 className="text-3xl md:text-5xl font-black text-brand-darkBlue mb-8 tracking-tighter">
                                Principais dúvidas sobre {service.title}
                            </h2>
                            <div className="space-y-6 text-gray-600 font-medium text-lg leading-relaxed text-left">
                                <p>
                                    À medida que familiares queridos envelhecem, é comum que passem a necessitar de cuidados mais próximos, muitas vezes de forma contínua. No entanto, nem sempre há alguém disponível para acompanhá-los em tempo integral, e é nesse contexto que o cuidador se torna um profissional essencial.
                                </p>
                                <p>
                                    Mais do que alguém que apenas compartilha o mesmo espaço, o cuidador de idosos desempenha um papel fundamental na promoção do bem-estar e da qualidade de vida da pessoa assistida, além de proporcionar tranquilidade à família e aos amigos quanto à segurança e aos cuidados oferecidos.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-12">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-blue-500/5 border border-gray-100">
                                <h3 className="text-2xl font-black text-brand-darkBlue mb-6">Existem cuidadores especializados para quais públicos?</h3>
                                <div className="space-y-4 text-gray-600 leading-relaxed font-medium">
                                    <p>De modo geral, é possível encontrar cuidadores preparados para atender diferentes perfis, o que garante às famílias o suporte necessário em um momento tão delicado e significativo de suas vidas.</p>
                                    <p>A atuação mais comum é a do cuidador de idosos, profissional responsável por auxiliar pessoas da terceira idade que precisam de apoio e companhia, seja por dificuldades de locomoção ou por condições de saúde, como Alzheimer, Parkinson e outras enfermidades.</p>
                                    <p>Pessoas de outras faixas etárias também podem necessitar de cuidados, especialmente para atividades básicas do dia a dia, como banho, alimentação e o acompanhamento correto da rotina de medicamentos, essencial para a eficácia dos tratamentos.</p>
                                    <p>Já o cuidador de pessoas com deficiência (PCD) oferece suporte principalmente nas necessidades de locomoção, contribuindo para que tenham uma vida mais confortável e digna, com atenção não apenas aos aspectos físicos, mas também aos emocionais, sociais e psicológicos.</p>
                                    <p>Esses são apenas alguns exemplos — assim como os cuidados voltados a gestantes e crianças —, evidenciando que há profissionais capacitados para atender pessoas de todas as idades e condições de saúde.</p>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-blue-500/5 border border-gray-100">
                                <h3 className="text-2xl font-black text-brand-darkBlue mb-6">Quais as principais responsabilidades de um cuidador?</h3>
                                <div className="space-y-6 text-gray-600 leading-relaxed font-medium">
                                    <p>Algumas das principais atribuições são as seguintes:</p>
                                    <ul className="space-y-4">
                                        {[
                                            "Proporcionar companhia e estimular o convívio social, incentivando atividades como conversas, caminhadas, passeios, trabalhos manuais e outras práticas que contribuam para o bem-estar.",
                                            "Acompanhar a pessoa em suas atividades externas, como consultas e exames médicos, sessões de fisioterapia e compras no supermercado.",
                                            "Administrar os medicamentos nos horários corretos e nas dosagens prescritas pelos profissionais de saúde.",
                                            "Auxiliar na higiene pessoal, oferecendo suporte em tarefas como banho, escovação dos dentes e outros cuidados diários, quando necessário.",
                                            "Apoiar nas atividades domésticas, desde a organização e limpeza do ambiente — garantindo um espaço higienizado e confortável — até o preparo das refeições.",
                                            "Zelar pela segurança e pelo bem-estar da pessoa, mantendo atenção constante às suas necessidades físicas, emocionais e sociais."
                                        ].map((item, idx) => (
                                            <li key={idx} className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center flex-shrink-0 mt-1">
                                                    <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                                                </div>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-blue-500/5 border border-gray-100">
                                    <h3 className="text-xl font-black text-brand-darkBlue mb-4">Em que lugares o cuidador pode atender?</h3>
                                    <p className="text-gray-600 leading-relaxed font-medium text-sm">
                                        O cuidador e a cuidadora podem atender em residências, casas de retiro, hospitais e, basicamente, quaisquer outros ambientes em que as pessoas estiverem...
                                    </p>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-blue-500/5 border border-gray-100">
                                    <h3 className="text-xl font-black text-brand-darkBlue mb-4">Quais os cuidados ao contratar?</h3>
                                    <p className="text-gray-600 leading-relaxed font-medium text-sm">
                                        É essencial se assegurar sobre a responsabilidade, integridade e idoneidade do cuidador... além disso, é bem importante escolher profissionais com estudos na área.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-brand-darkBlue p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black mb-6">Quanto custa contratar um cuidador?</h3>
                                    <p className="text-white/80 leading-relaxed font-medium mb-8">
                                        Depende de uma série de variáveis, como o local, frequência, horário e condições de saúde. Para ter uma estimativa precisa, preencha o formulário e receba orçamentos gratuitamente.
                                    </p>
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <Link to="/pedir-orcamento" className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all">
                                            Pedir orçamento grátis
                                        </Link>
                                        <p className="text-xs text-white/50 font-bold italic">
                                            Depois de contratar o cuidador, não se esqueça de avaliar os serviços do profissional aqui na Samej!
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl"></div>
                            </div>
                        </div>
                    </div>
                </section>

            </div >
        );
    }

    if (slug === 'arquitetos') {
        const service = serviceMap[slug];
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="space-y-6 text-center lg:text-left">
                                <h1 className="text-4xl md:text-6xl font-black text-brand-darkBlue tracking-tighter leading-none">
                                    Precisando de Arquiteto?
                                </h1>
                                <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0">
                                    Milhares de profissionais avaliados por clientes, permitindo você negociar apenas com os melhores.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-brand-blue font-bold">
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Até 4 orçamentos grátis e seguros</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-500 font-bold">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span>Profissionais avaliados</span>
                                </div>
                                <div className="flex items-center gap-3 text-red-500 font-bold">
                                    <Zap className="w-5 h-5" />
                                    <span>Como funciona o Samej?</span>
                                </div>
                            </div>

                            {/* Form Card */}
                            <div className="bg-[#FFEB3B] p-2 md:p-6 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="bg-white p-6 md:p-12 rounded-[2.5rem] relative z-10 shadow-xl">
                                    {submitted ? (
                                        <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Pedido Enviado!</h3>
                                            <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed max-w-md">
                                                Excelente! Sua solicitação para <span className="text-brand-blue">{service.title}</span> foi enviada com sucesso.
                                            </p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-brand-lightOrange transition-all uppercase tracking-tight"
                                            >
                                                VOLTAR PARA O INÍCIO
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {step > 1 && (
                                                <button onClick={() => setStep(step - 1)} className="mb-6 flex items-center text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest">
                                                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                                                </button>
                                            )}

                                            {step === 1 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase tracking-tight">Qual o tipo de atendimento?</h3>
                                                    <div className="max-w-2xl mx-auto space-y-4">
                                                        <div className="relative group mb-6">
                                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-blue" />
                                                            <input
                                                                type="text"
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                placeholder="Online ou Presencial?"
                                                                className="w-full pl-12 pr-12 py-5 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-blue font-bold text-gray-600 transition-all shadow-sm"
                                                            />
                                                            {searchTerm && (
                                                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                    <X className="w-5 h-5 text-gray-300 hover:text-gray-500" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-3">
                                                            {["Online", "Presencial"].filter(type => type.toLowerCase().includes(searchTerm.toLowerCase())).map((type) => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => {
                                                                        setArchitectLocation(type);
                                                                        setStep(2);
                                                                    }}
                                                                    className="w-full p-5 text-left bg-white border-2 border-gray-50 rounded-2xl font-bold text-gray-600 flex items-center justify-between group hover:border-brand-blue/30 transition-all shadow-sm"
                                                                >
                                                                    {type}
                                                                    <ChevronRight className="w-5 h-5 text-brand-blue transition-transform group-hover:translate-x-1" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : step === 2 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase tracking-tight">Qual serviço você procura?</h3>
                                                    <div className="max-w-2xl mx-auto space-y-6">
                                                        <select
                                                            value={architectServiceType}
                                                            onChange={(e) => setArchitectServiceType(e.target.value)}
                                                            className="w-full p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-bold text-gray-600 transition-all shadow-sm appearance-none"
                                                        >
                                                            <option value="">Selecione uma opção</option>
                                                            <option value="Acompanhamento de obra">Acompanhamento de obra</option>
                                                            <option value="Projeto residencial">Projeto residencial</option>
                                                            <option value="Projeto de local comercial">Projeto de local comercial</option>
                                                            <option value="Projeto de escritório">Projeto de escritório</option>
                                                            <option value="Laudo técnico">Laudo técnico</option>
                                                            <option value="Projeto para interiores (arquiteto de interiores)">Projeto para interiores (arquiteto de interiores)</option>
                                                            <option value="Outro">Outro</option>
                                                        </select>
                                                        <button
                                                            onClick={() => setStep(3)}
                                                            disabled={!architectServiceType}
                                                            className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${architectServiceType ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 3 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <div className="flex items-center justify-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-widest mb-4">
                                                            <ShieldCheck className="w-4 h-4" /> Orçamentos rápidos e seguros
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-800 mb-8 uppercase tracking-tight">Qual é o tipo de imóvel?</h3>
                                                    </div>
                                                    <div className="max-w-md mx-auto space-y-4 mb-10">
                                                        {["Apartamento", "Prédio", "Lote de terreno", "Casa", "Outro"].map((option) => (
                                                            <label key={option} className="flex items-center p-4 bg-white border-2 border-transparent rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                                                                <input
                                                                    type="radio"
                                                                    name="propertyType"
                                                                    value={option}
                                                                    checked={propertyType === option}
                                                                    onChange={(e) => setPropertyType(e.target.value)}
                                                                    className="w-5 h-5 text-brand-blue border-gray-300 focus:ring-brand-blue"
                                                                />
                                                                <span className="ml-4 font-bold text-gray-600">{option}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button onClick={() => setStep(2)} className="flex-1 py-5 border-2 border-brand-blue text-brand-blue rounded-xl font-bold hover:bg-blue-50 transition-all">
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(4)}
                                                            disabled={!propertyType}
                                                            className={`flex-1 py-5 rounded-xl font-bold transition-all ${propertyType ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 4 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <div className="flex items-center justify-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-widest mb-4">
                                                            <Star className="w-4 h-4 fill-current text-brand-darkBlue" /> Confira as avaliações dos profissionais
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-800 mb-8 uppercase tracking-tight">Qual é o tamanho do seu projeto?</h3>
                                                    </div>
                                                    <div className="max-w-md mx-auto space-y-4 mb-10">
                                                        {[
                                                            { label: "Pequeno (até 50m²)", value: "Pequeno (até 50m²)" },
                                                            { label: "Médio (50 a 150m²)", value: "Médio (50 a 150m²)" },
                                                            { label: "Grande (150m² ou mais)", value: "Grande (150m² ou mais)" },
                                                            { label: "Não tenho um projeto", value: "Não tenho um projeto" }
                                                        ].map((option) => (
                                                            <label key={option.value} className="flex items-center p-4 bg-white border-2 border-transparent rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                                                                <input
                                                                    type="radio"
                                                                    name="projectSize"
                                                                    value={option.value}
                                                                    checked={projectSize === option.value}
                                                                    onChange={(e) => setProjectSize(e.target.value)}
                                                                    className="w-5 h-5 text-brand-blue border-gray-300 focus:ring-brand-blue"
                                                                />
                                                                <span className="ml-4 font-bold text-gray-600">{option.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button onClick={() => setStep(3)} className="flex-1 py-5 border-2 border-brand-blue text-brand-blue rounded-xl font-bold hover:bg-blue-50 transition-all">
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(5)}
                                                            disabled={!projectSize}
                                                            className={`flex-1 py-5 rounded-xl font-bold transition-all ${projectSize ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 5 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest mb-4">
                                                            <ThumbsUp className="w-4 h-4" /> Você está indo bem, agora falta pouco!
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-800 mb-8 uppercase tracking-tight">Você precisa do serviço de acompanhamento de obra?</h3>
                                                    </div>
                                                    <div className="max-w-md mx-auto space-y-4 mb-10">
                                                        {["Sim", "Não", "Não tenho certeza"].map((option) => (
                                                            <label key={option} className="flex items-center p-4 bg-white border-2 border-transparent rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                                                                <input
                                                                    type="radio"
                                                                    name="constructionSupervision"
                                                                    value={option}
                                                                    checked={constructionSupervision === option}
                                                                    onChange={(e) => setConstructionSupervision(e.target.value)}
                                                                    className="w-5 h-5 text-brand-blue border-gray-300 focus:ring-brand-blue"
                                                                />
                                                                <span className="ml-4 font-bold text-gray-600">{option}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button onClick={() => setStep(4)} className="flex-1 py-5 border-2 border-brand-blue text-brand-blue rounded-xl font-bold hover:bg-blue-50 transition-all">
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(6)}
                                                            disabled={!constructionSupervision}
                                                            className={`flex-1 py-5 rounded-xl font-bold transition-all ${constructionSupervision ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 6 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <div className="flex items-center justify-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-widest mb-4">
                                                            <Star className="w-4 h-4 fill-current text-brand-darkBlue" /> Confira as avaliações dos profissionais
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-800 mb-8 uppercase tracking-tight leading-tight">Quando você pretende realizar o serviço?</h3>
                                                    </div>
                                                    <div className="max-w-md mx-auto space-y-4 mb-10">
                                                        {[
                                                            "Urgente (o quanto antes possível)",
                                                            "Nos próximos 7 dias",
                                                            "Nos próximos 15 dias",
                                                            "Nos próximos 30 dias",
                                                            "Não tenho data definida"
                                                        ].map((option) => (
                                                            <label key={option} className="flex items-center p-4 bg-white border-2 border-transparent rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                                                                <input
                                                                    type="radio"
                                                                    name="architectServiceWhen"
                                                                    value={option}
                                                                    checked={architectServiceWhen === option}
                                                                    onChange={(e) => setArchitectServiceWhen(e.target.value)}
                                                                    className="w-5 h-5 text-brand-blue border-gray-300 focus:ring-brand-blue"
                                                                />
                                                                <span className="ml-4 font-bold text-gray-600">{option}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button onClick={() => setStep(5)} className="flex-1 py-5 border-2 border-brand-blue text-brand-blue rounded-xl font-bold hover:bg-blue-50 transition-all">
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(7)}
                                                            disabled={!architectServiceWhen}
                                                            className={`flex-1 py-5 rounded-xl font-bold transition-all ${architectServiceWhen ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 7 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-black text-brand-darkBlue mb-2">Explique o que você precisa</h3>
                                                        <p className="text-sm font-bold text-gray-400">Receba até 4 orçamentos grátis, online!</p>
                                                    </div>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        <label className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter">Detalhe seu pedido</label>
                                                        <div className="relative">
                                                            <textarea
                                                                value={orderDetails}
                                                                onChange={(e) => setOrderDetails(e.target.value)}
                                                                className="w-full p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 transition-all min-h-[150px] resize-none"
                                                                placeholder='Traga todos os detalhes do seu pedido. Tente "Preciso de ..."'
                                                            ></textarea>
                                                        </div>
                                                        <div className="bg-[#FFF9C4] p-4 rounded-xl flex items-center gap-3 text-[#5D4037] font-bold text-sm shadow-sm">
                                                            <span className="text-lg">👆</span>
                                                            Quanto mais informações você fornecer, melhor será o seu pedido!
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button onClick={() => setStep(6)} className="flex-1 py-5 border-2 border-brand-blue text-brand-blue rounded-xl font-bold hover:bg-blue-50 transition-all">
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(8)}
                                                            disabled={orderDetails.length < 5}
                                                            className={`flex-1 py-5 rounded-xl font-bold transition-all ${orderDetails.length >= 5 ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 8 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-black text-brand-darkBlue mb-4">Informe seu CEP</h3>
                                                        <p className="text-center text-gray-400 font-bold mb-10 text-sm">Utilizamos o CEP para identificar a disponibilidade de profissionais na região.</p>
                                                    </div>
                                                    <div className="max-w-xl mx-auto space-y-6 mb-10">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center px-1">
                                                                <label className="text-xs font-black text-gray-500 uppercase">CEP</label>
                                                                <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-blue hover:underline">Não lembra seu CEP?</a>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={cep}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                    setCep(val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val);
                                                                }}
                                                                className="w-full p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-bold text-gray-400 shadow-sm transition-all"
                                                                placeholder="00000-000"
                                                            />
                                                        </div>
                                                        {address && <p className="text-sm font-bold text-brand-blue text-center bg-blue-50 py-3 rounded-xl">{address}</p>}
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button onClick={() => setStep(7)} className="flex-1 py-5 border-2 border-brand-blue text-brand-blue rounded-xl font-bold hover:bg-blue-50 transition-all">
                                                            Voltar
                                                        </button>
                                                        <button
                                                            onClick={() => setStep(9)}
                                                            disabled={cep.replace(/\D/g, '').length !== 8}
                                                            className={`flex-1 py-5 rounded-xl font-bold transition-all ${cep.replace(/\D/g, '').length === 8 ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            Próximo
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 9 ? (
                                                <>
                                                    <div className="max-w-2xl mx-auto py-4">
                                                        <div className="text-center mb-10">
                                                            <h3 className="text-3xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Dados de Contato</h3>
                                                            <p className="text-gray-500 font-bold">Quase lá! Agora só precisamos saber quem você é.</p>
                                                        </div>
                                                        <div className="space-y-6 mb-12">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-black text-gray-400 uppercase px-2">NOME COMPLETO</label>
                                                                <input
                                                                    type="text"
                                                                    value={userName}
                                                                    onChange={(e) => setUserName(e.target.value.toUpperCase())}
                                                                    className="w-full px-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm uppercase"
                                                                    placeholder="DIGITE SEU NOME COMPLETO"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-black text-gray-400 uppercase px-2">TELEFONE (WHATSAPP)</label>
                                                                <input
                                                                    type="tel"
                                                                    value={userPhone}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                        let masked = raw;
                                                                        if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                                                                        if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                                                                        setUserPhone(masked);
                                                                    }}
                                                                    className="w-full px-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm"
                                                                    placeholder="(00) 00000-0000"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleSubmitOrder}
                                                            disabled={isSubmitting || !userName || userPhone.replace(/\D/g, '').length !== 11}
                                                            className={`w-full py-6 rounded-[2.5rem] font-bold text-2xl flex items-center justify-center gap-3 transition-all shadow-2xl ${userName && userPhone.replace(/\D/g, '').length === 11 && !isSubmitting ? 'bg-brand-orange text-white hover:scale-[1.02] shadow-orange-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <>ENVIAR PEDIDO<ChevronRight className="w-6 h-6" /></>}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8 text-center lg:text-left">
                            <div className="relative group overflow-hidden rounded-[3rem] shadow-3xl border-4 border-white mb-8">
                                <img
                                    src={service.bg}
                                    alt={service.title}
                                    className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5">
                                <p className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter mb-4">Informações Importantes</p>
                                <ul className="space-y-4 text-xs text-gray-500 font-bold uppercase tracking-tight">
                                    <li className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-orange rounded-full"></div> Orçamentos 100% Gratuitos</li>
                                    <li className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-orange rounded-full"></div> Profissionais Verificados</li>
                                    <li className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-orange rounded-full"></div> Atendimento Agilizado</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section: Avaliações de quem contratou - Horizontal Layout */}
                    <div className="mt-16 bg-white p-12 rounded-[3.5rem] border-4 border-gray-100 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="text-center mb-12">
                            <p className="text-xs font-black text-brand-blue uppercase tracking-widest mb-2 italic">Testemunhos Reais</p>
                            <h2 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tighter">Avaliações de quem contratou</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                            {[
                                {
                                    client: "Clara Faria",
                                    text: "Fui muito bem atendida e recebi um serviço de excelente qualidade. O orçamento é gratuito e o valor é acessível. Agradeço pelo atendimento!",
                                    pro: "Antônio Santos"
                                },
                                {
                                    client: "Antonio Santos",
                                    text: "Excelentes profissionais, rápidos, honestos e com bom preços. Recomendo muito",
                                    pro: "Vanessa Silva"
                                },
                                {
                                    client: "Fabio Melo",
                                    text: "O profissional é excelente, atendeu com rapidez, atenção e solucionou o problema. Recomendo!",
                                    pro: "Adriana Prado"
                                }
                            ].map((review, i) => (
                                <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-500/5 space-y-6 hover:scale-[1.03] transition-all duration-500 group">
                                    <div className="flex justify-center md:justify-start text-amber-500 gap-1">
                                        {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current transition-transform group-hover:rotate-12" />)}
                                    </div>
                                    <p className="text-base text-gray-600 font-medium leading-relaxed italic">
                                        "{review.text}"
                                    </p>
                                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex flex-col items-center md:items-start">
                                            <p className="text-sm font-black text-gray-900">{review.client}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">
                                                Para <span className="text-brand-blue font-black">{review.pro}</span>
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 bg-brand-bg rounded-full flex items-center justify-center text-brand-blue flex-shrink-0">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* New Sections for Architects */}
                    <div className="mt-24 space-y-24">
                        {/* Section: Você é Arquiteto? */}
                        <div className="text-center space-y-8 bg-gray-50/50 py-16 rounded-[4rem] border border-gray-100 shadow-inner">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-black text-brand-darkBlue tracking-tighter uppercase italic">Você é Arquiteto?</h2>
                                <p className="text-lg text-gray-500 font-bold max-w-2xl mx-auto leading-relaxed">
                                    O Samej recebe mais de <span className="text-brand-blue">10 mil pedidos por mês</span> e pode ajudar a aumentar sua renda
                                </p>
                            </div>
                            <Link
                                to="/auth?tab=register&role=professional"
                                className="inline-block bg-brand-blue text-white px-16 py-6 rounded-[2rem] font-black text-xl shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-105 hover:bg-blue-700 transition-all uppercase tracking-tighter"
                            >
                                Quero me cadastrar
                            </Link>
                        </div>

                        {/* Section: Custos médios */}
                        <div className="space-y-16">
                            <div className="text-center space-y-4">
                                <h2 className="text-5xl font-black text-brand-darkBlue tracking-tighter uppercase">Custos médios</h2>
                                <p className="text-xl text-gray-400 font-bold uppercase tracking-widest">Conheça o custo estimado para alguns serviços</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    { title: "Projeto Residencial", avg: "R$ 200,00", min: "R$ 1.500,00", max: "R$ 5.000,00" },
                                    { title: "contratar escritório de arquitetura", avg: "R$ 500,00", min: "R$ 2.750,00", max: "R$ 6.000,00" },
                                    { title: "Análise de Solo", avg: "R$ 40,00", min: "R$ 75,00", max: "R$ 150,00" },
                                    { title: "Projeto de Arquitetura", avg: "R$ 4.125,00", min: "R$ 80,00", max: "R$ 30,00" }, // Note: Min/Max inverted from print to match logic? No, following print: R$ 80 - R$ 30? Wait, print shows R$ 80,00 and R$ 30,00. That looks odd. I will use what's in the print.
                                    { title: "Instalar Elevador Residencial", avg: "R$ 40.000,00", min: "R$ 100.000,00", max: "R$ 180.000,00" },
                                    { title: "Acompanhamento de Obra", avg: "R$ 100,00", min: "R$ 250,00", max: "R$ 400,00" },
                                    { title: "Arquiteto Online", avg: "R$ 1.000,00", min: "R$ 7.000,00", max: "R$ 30.000,00" },
                                    { title: "Contratar Arquiteto", avg: "R$ 1.000,00", min: "R$ 6.000,00", max: "R$ 12.000,00" }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Custo médio estimado</span>
                                            <h4 className="text-2xl font-black text-brand-darkBlue">{item.avg}</h4>
                                            <p className="text-gray-400 font-bold text-xs">{item.title}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                            <div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Menor custo</span>
                                                <p className="font-black text-brand-darkBlue text-xs">{item.min}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Maior custo</span>
                                                <p className="font-black text-brand-darkBlue text-xs">{item.max}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Pedidos Similares */}
                        <div className="space-y-12">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black text-brand-darkBlue">Veja alguns pedidos similares para Serviços de Arquitetura</h2>
                                <p className="text-gray-400 font-bold">Esses são os últimos pedidos para essa categoria</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    {
                                        name: "Camila",
                                        text: "Projeto residencial em lote plano de 300m² (12x25) no Vale dos Cristais V. O projeto deve observar rigorosamente as normas construtivas do condomínio."
                                    },
                                    {
                                        name: "Mariana",
                                        text: "Projeto de sobrado compacto. O pavimento superior deve contemplar 3 dormitórios, sendo 1 suíte e um banheiro social. No térreo, ambientes integrados."
                                    },
                                    {
                                        name: "Fernanda",
                                        text: "Estudo de viabilidade e projeto para três unidades autônomas em terreno de esquina (7x18). Cada unidade com garagem privativa e máxima eficiência de área."
                                    },
                                    {
                                        name: "Gabriela",
                                        text: "Projeto arquitetônico para casa térrea em terreno de 10x20. Layout com sala de TV, sala de jantar, cozinha integrada, área de serviço e garagem para 2 veículos."
                                    },
                                    {
                                        name: "Letícia",
                                        text: "Projeto para residência térrea em terreno de 5x30 metros. Necessidade de 3 quartos (1 suíte), duas salas amplas, garagem para 2 carros e depósito."
                                    },
                                    {
                                        name: "Amanda",
                                        text: "Projeto para templo religioso em terreno de esquina (10x20). Edificação com dois pavimentos, contemplando mezanino interno e otimização de fluxo."
                                    },
                                    {
                                        name: "Patrícia",
                                        text: "Projeto residencial para terreno plano de 12x30. Casa com 3 quartos (sendo uma suíte), cozinha americana integrada às salas de estar e jantar."
                                    },
                                    {
                                        name: "Ricardo",
                                        text: "Aprovação e projeto para residência de aprox. 100m² em terreno de 11x25. Programa com três dormitórios, sendo uma suíte e sala de jantar anexa à cozinha."
                                    }
                                ].map((pedido, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                                        <div className="space-y-4">
                                            <p className="text-sm font-bold text-gray-500">
                                                <span className="font-black text-brand-darkBlue">{pedido.name}</span> contratou <span className="font-black text-brand-darkBlue">Arquiteto</span>
                                            </p>
                                            <p className="text-sm text-gray-400 leading-relaxed font-medium line-clamp-4">
                                                {pedido.text}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-tighter pt-4 border-t border-gray-50">
                                            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3" />
                                            </div>
                                            Pedido atendido
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Perguntas Frequentes (FAQ) */}
                        <div className="space-y-12">
                            <div className="text-center py-4 border-b border-orange-200 bg-orange-50/50 rounded-xl">
                                <h2 className="text-3xl font-black text-brand-darkBlue">Perguntas Frequentes</h2>
                            </div>
                            <div className="max-w-4xl mx-auto space-y-6 text-left">
                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-black text-brand-darkBlue">Por que contratar um arquiteto?</h3>
                                    <p>O arquiteto é um profissional essencial não apenas para a criação de projetos, mas para oferecer uma visão completa — uma verdadeira análise 360° — de construções e reformas. São muitos os motivos que tornam sua contratação um diferencial em qualquer obra.</p>
                                    <p>Além do projeto arquitetônico, o arquiteto possui habilitação técnica e legal para elaborar e coordenar projetos complementares, como cálculo estrutural, instalações elétricas e hidrossanitárias, paisagismo e design de interiores, garantindo integração e segurança em todas as etapas.</p>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-black text-brand-darkBlue">O que faz um arquiteto?</h3>
                                    <p>É comum pensar que o trabalho do arquiteto se resume à estética, mas sua atuação vai muito além disso. Embora o aspecto visual seja importante, o profissional também é responsável por planejar ambientes funcionais, confortáveis e alinhados às necessidades de quem vai utilizá-los.</p>
                                    <p>Em um projeto residencial, por exemplo, o arquiteto cuida de fatores como iluminação, ventilação, circulação, conforto térmico e funcionalidade, promovendo bem-estar e valorizando o espaço.</p>
                                    <p>Como uma obra envolve diversos profissionais e etapas técnicas que nem sempre são conhecidas pelo proprietário, o arquiteto atua como um grande aliado, planejando, organizando e gerenciando todo o processo, trazendo mais tranquilidade ao contratante.</p>
                                    <p>Os arquitetos especializados em interiores também desempenham um papel fundamental. Por conhecerem profundamente a estrutura e o conceito do projeto, conseguem integrar decoração, funcionalidade e estética de forma harmoniosa, aproveitando cada detalhe do espaço de maneira estratégica.</p>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-black text-brand-darkBlue">O que considerar antes de contratar um arquiteto?</h3>
                                    <p>Antes de fechar a contratação, vale observar alguns pontos importantes:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Quais serviços o profissional de arquitetura oferece</li>
                                        <li>Trabalhos já realizados, por meio da análise do portfólio</li>
                                        <li>Formação acadêmica e experiência profissional</li>
                                        <li>Alinhamento de expectativas em uma conversa inicial sobre suas necessidades e objetivos</li>
                                    </ul>
                                    <p>Também é essencial deixar claro o orçamento disponível, para que o arquiteto possa apresentar soluções adequadas à sua realidade. Na Samej, você pode solicitar orçamentos gratuitos e escolher o profissional que melhor se encaixa no seu projeto.</p>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-black text-brand-darkBlue">Que outros serviços de Reformas e Reparos posso contratar na Samej?</h3>
                                    <p className="text-gray-500 font-medium leading-relaxed">
                                        Na Samej, você também encontra profissionais qualificados para serviços como arquiteto presencial, automação residencial, construção de casas e chalés de madeira, afiação, entre muitos outros.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        );
    }

    if (slug === 'cozinheiras-em-domicilio') {
        const service = serviceMap[slug];
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-6xl font-black text-brand-darkBlue tracking-tighter leading-none">
                                    Precisando de Cozinheira?
                                </h1>
                                <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed">
                                    Milhares de profissionais avaliados por clientes, permitindo você negociar apenas com os melhores.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-brand-blue font-bold">
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Até 4 orçamentos grátis e seguros</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-500 font-bold">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span>Profissionais avaliados</span>
                                </div>
                                <div className="flex items-center gap-3 text-red-500 font-bold">
                                    <Zap className="w-5 h-5" />
                                    <span>Como funciona o Samej?</span>
                                </div>
                            </div>

                            {/* Form Card */}
                            <div className="bg-[#FFEB3B] p-2 md:p-6 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="bg-white p-6 md:p-12 rounded-[2.5rem] relative z-10 shadow-xl">
                                    {submitted ? (
                                        <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Pedido Enviado!</h3>
                                            <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed max-w-md">
                                                Excelente! Sua solicitação para <span className="text-brand-blue">{serviceMap[slug || '']?.title}</span> foi enviada com sucesso.
                                            </p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-brand-lightOrange transition-all uppercase tracking-tight"
                                            >
                                                VOLTAR PARA O INÍCIO
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mb-10 overflow-hidden relative">
                                                <div
                                                    className="bg-brand-blue h-full transition-all duration-500"
                                                    style={{ width: `${(step / 8) * 100}%` }}
                                                ></div>
                                            </div>

                                            {step > 1 && (
                                                <button onClick={() => setStep(step - 1)} className="mb-6 flex items-center text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest">
                                                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                                                </button>
                                            )}

                                            {step === 1 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">Qual serviço de Cozinheira está precisando?</h3>
                                                    <div className="max-w-2xl mx-auto space-y-4">
                                                        <div className="relative group">
                                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-blue" />
                                                            <input
                                                                type="text"
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                placeholder="O que você precisa?"
                                                                className="w-full pl-12 pr-12 py-5 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-brand-blue font-bold text-gray-600 transition-all shadow-sm"
                                                            />
                                                            {searchTerm && (
                                                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                    <X className="w-5 h-5 text-gray-300 hover:text-gray-500" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {[
                                                                "Ceia Natalina",
                                                                "Comida Brasileira",
                                                                "Comida Caseira",
                                                                "Comida Chinesa",
                                                                "Comida Congelada",
                                                                "Comida Especial",
                                                                "Comida Francesa",
                                                                "Comida Italiana",
                                                                "Comida Japonesa",
                                                                "Comida Saudável",
                                                                "Comida Vegetariana",
                                                                "Comida Árabe",
                                                                "Salgados",
                                                                "Kosher",
                                                                "Pizza e Lanches",
                                                                "Chinesa",
                                                                "Outras"
                                                            ].filter(type => type.toLowerCase().includes(searchTerm.toLowerCase())).map((type) => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => {
                                                                        setCookingType(type);
                                                                        setStep(2);
                                                                    }}
                                                                    className="w-full p-5 text-left bg-white border-2 border-gray-50 rounded-2xl font-bold text-gray-600 flex items-center justify-between group hover:border-brand-blue/30 transition-all shadow-sm"
                                                                >
                                                                    {type}
                                                                    <ChevronRight className="w-5 h-5 text-brand-blue transition-transform group-hover:translate-x-1" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : step === 2 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-6 text-green-600 font-bold text-sm">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        Receba até 4 orçamentos grátis!
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">Qual é o tipo de comida?</h3>
                                                    <div className="max-w-xl mx-auto mb-10">
                                                        <select
                                                            value={cookingType}
                                                            onChange={(e) => setCookingType(e.target.value)}
                                                            className={`w-full p-4 md:p-5 border-2 rounded-xl font-bold transition-all outline-none ${cookingType ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-red-500 text-gray-400'}`}
                                                        >
                                                            <option value="">Selecione uma opção</option>
                                                            <option value="Comida Caseira">Comida Caseira</option>
                                                            <option value="Comida Saudável">Comida Saudável</option>
                                                            <option value="Ceia Natalina">Ceia Natalina</option>
                                                            <option value="Comida Vegetariana">Comida Vegetariana</option>
                                                            <option value="Comida Congelada">Comida Congelada</option>
                                                            <option value="Comida Árabe">Comida Árabe</option>
                                                            <option value="Comida Italiana">Comida Italiana</option>
                                                            <option value="Comida Japonesa">Comida Japonesa</option>
                                                            <option value="Salgados">Salgados</option>
                                                            <option value="Kosher">Kosher</option>
                                                            <option value="Pizza e Lanches">Pizza e Lanches</option>
                                                            <option value="Comida Especial">Comida Especial</option>
                                                            <option value="Comida Brasileira">Comida Brasileira</option>
                                                            <option value="Comida Chinesa">Comida Chinesa</option>
                                                            <option value="Chinesa">Chinesa</option>
                                                            <option value="Outras">Outras</option>
                                                        </select>
                                                        {!cookingType && <p className="text-red-500 text-xs font-bold mt-2">Este campo é requerido</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => setStep(3)}
                                                        disabled={!cookingType}
                                                        className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${cookingType ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 3 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-6 text-brand-blue font-bold text-sm">
                                                        <Zap className="w-5 h-5 fill-current" />
                                                        Orçamentos rápidos e seguros
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase tracking-tight">Qual é a frequência do serviço?</h3>
                                                    <div className="space-y-4 max-w-md mx-auto mb-10">
                                                        {['Uma única vez', 'Diariamente', 'Semanalmente', 'Outra', 'Encomenda'].map((option) => (
                                                            <label key={option} className="flex items-center gap-4 p-4 border-2 border-gray-50 rounded-2xl cursor-pointer hover:border-brand-blue/30 transition-all font-bold text-gray-600 has-[:checked]:border-brand-blue has-[:checked]:bg-blue-50 has-[:checked]:text-brand-blue">
                                                                <input
                                                                    type="radio"
                                                                    name="frequency"
                                                                    value={option}
                                                                    checked={frequency === option}
                                                                    onChange={(e) => setFrequency(e.target.value)}
                                                                    className="w-5 h-5 accent-brand-blue"
                                                                />
                                                                {option}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setStep(4)} disabled={!frequency} className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${frequency ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 4 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-6 text-gray-500 font-bold text-sm">
                                                        <Star className="w-5 h-5 fill-current text-gray-400" />
                                                        Confira as avaliações dos profissionais
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">Para quantas pessoas o serviço será prestado?</h3>
                                                    <div className="space-y-4 max-w-md mx-auto mb-10">
                                                        {['1 pessoa', '2 a 4 pessoas', '4 a 8 pessoas', '9 ou mais pessoas', 'Não tenho certeza'].map((option) => (
                                                            <label key={option} className="flex items-center gap-4 p-4 border-2 border-gray-50 rounded-2xl cursor-pointer hover:border-brand-blue/30 transition-all font-bold text-gray-600 has-[:checked]:border-brand-blue has-[:checked]:bg-blue-50 has-[:checked]:text-brand-blue">
                                                                <input
                                                                    type="radio"
                                                                    name="peopleCount"
                                                                    value={option}
                                                                    checked={peopleCount === option}
                                                                    onChange={(e) => setPeopleCount(e.target.value)}
                                                                    className="w-5 h-5 accent-brand-blue"
                                                                />
                                                                {option}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setStep(5)} disabled={!peopleCount} className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${peopleCount ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 5 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-6 text-green-600 font-bold text-sm">
                                                        <ThumbsUp className="w-5 h-5 fill-current" />
                                                        Você está indo bem, agora falta pouco!
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">Quando você pretende realizar o serviço?</h3>
                                                    <div className="space-y-4 max-w-md mx-auto mb-10">
                                                        {['Urgente (o quanto antes possível)', 'Nos próximos 7 dias', 'Nos próximos 15 dias', 'Nos próximos 30 dias', 'Não tenho data definida'].map((option) => (
                                                            <label key={option} className="flex items-center gap-4 p-4 border-2 border-gray-50 rounded-2xl cursor-pointer hover:border-brand-blue/30 transition-all font-bold text-gray-600 has-[:checked]:border-brand-blue has-[:checked]:bg-blue-50 has-[:checked]:text-brand-blue">
                                                                <input
                                                                    type="radio"
                                                                    name="when"
                                                                    value={option}
                                                                    checked={serviceWhen === option}
                                                                    onChange={(e) => setServiceWhen(e.target.value)}
                                                                    className="w-5 h-5 accent-brand-blue"
                                                                />
                                                                {option}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setStep(6)} disabled={!serviceWhen} className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${serviceWhen ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 6 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-3xl font-black text-brand-darkBlue mb-2">Explique o que você precisa</h3>
                                                        <p className="text-sm font-bold text-gray-400">Receba até 4 orçamentos grátis, online!</p>
                                                    </div>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-12">
                                                        <label className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter">Detalhe seu pedido</label>
                                                        <textarea
                                                            value={orderDetails}
                                                            onChange={(e) => setOrderDetails(e.target.value)}
                                                            className="w-full p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 transition-all min-h-[150px] resize-none"
                                                            placeholder='Traga todos os detalhes do seu pedido. Tente "Preciso de ..."'
                                                        ></textarea>
                                                        <div className="bg-[#FFF9C4] p-4 rounded-xl flex items-center gap-3 text-[#5D4037] font-bold text-sm">
                                                            <Star className="w-5 h-5 fill-current text-brand-orange" />
                                                            Quanto mais informações você fornecer, melhor será o seu pedido!
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setStep(7)}
                                                        disabled={orderDetails.length < 5}
                                                        className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${orderDetails.length >= 5 ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 7 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-3xl font-black text-brand-darkBlue mb-4">Informe seu CEP</h3>
                                                        <p className="text-center text-gray-400 font-bold mb-10">Utilizamos o CEP para identificar a disponibilidade de profissionais na região.</p>
                                                    </div>
                                                    <div className="max-w-xl mx-auto space-y-6">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center px-1">
                                                                <label className="text-xs font-black text-gray-400 uppercase">CEP</label>
                                                                <button className="text-[10px] font-black text-brand-blue uppercase hover:underline">Não lembra seu CEP?</button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={cep}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                    setCep(val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val);
                                                                }}
                                                                className="w-full p-6 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-bold text-gray-600 shadow-sm"
                                                                placeholder="00000-000"
                                                            />
                                                        </div>
                                                        {address && <p className="text-sm font-bold text-gray-400 text-center bg-gray-50 py-3 rounded-xl">{address}</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => setStep(8)}
                                                        disabled={cep.replace(/\D/g, '').length !== 8}
                                                        className={`block w-full py-5 rounded-xl font-bold text-base text-center mt-10 transition-all ${cep.replace(/\D/g, '').length === 8 ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 8 ? (
                                                <>
                                                    <div className="max-w-2xl mx-auto py-4">
                                                        <div className="text-center mb-10">
                                                            <h3 className="text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Dados de Contato</h3>
                                                            <p className="text-gray-500 font-bold">Quase lá! Agora só precisamos saber quem você é.</p>
                                                        </div>
                                                        <div className="space-y-6 mb-12">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-black text-gray-400 uppercase px-2">NOME COMPLETO</label>
                                                                <input
                                                                    type="text"
                                                                    value={userName}
                                                                    onChange={(e) => setUserName(e.target.value.toUpperCase())}
                                                                    className="w-full px-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm uppercase"
                                                                    placeholder="DIGITE SEU NOME COMPLETO"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-black text-gray-400 uppercase px-2">TELEFONE (WHATSAPP)</label>
                                                                <input
                                                                    type="tel"
                                                                    value={userPhone}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                        let masked = raw;
                                                                        if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                                                                        if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                                                                        setUserPhone(masked);
                                                                    }}
                                                                    className="w-full px-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm"
                                                                    placeholder="(00) 00000-0000"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleSubmitOrder}
                                                            disabled={isSubmitting || !userName || userPhone.replace(/\D/g, '').length !== 11}
                                                            className={`w-full py-6 rounded-[2.5rem] font-bold text-2xl flex items-center justify-center gap-3 transition-all shadow-2xl ${userName && userPhone.replace(/\D/g, '').length === 11 && !isSubmitting ? 'bg-brand-orange text-white hover:scale-[1.02] shadow-orange-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <>ENVIAR PEDIDO<ChevronRight className="w-6 h-6" /></>}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="relative group overflow-hidden rounded-[4rem] shadow-3xl border-4 border-white mb-8">
                                <img
                                    src="/images/Cozinheiras.jpg"
                                    alt="Cozinheira em domicílio"
                                    className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5">
                                <p className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter mb-6">Avaliações de quem contratou</p>
                                <div className="space-y-6">
                                    {[
                                        {
                                            client: "Paula Silva",
                                            text: "Fui muito bem atendida e recebi um serviço de excelente qualidade. O orçamento é gratuito e o valor é acessível. Agradeço pelo atendimento!",

                                        },
                                        {
                                            client: "Carlos Silva",
                                            pro: "Marta Oliveira",
                                            text: "Profissionais de alto nível, ágeis, honestos e com preços justos. Recomendo com total confiança para quem busca um serviço de qualidade.",
                                        }
                                    ].map((review, i) => (
                                        <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-md space-y-4">
                                            <div>
                                                <p className="text-xs font-black text-gray-900">{review.client} <span className="text-gray-400 font-bold">avaliou:</span></p>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed italic mt-2">
                                                    "{review.text}"
                                                </p>
                                            </div>
                                            <div className="flex text-amber-500 gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-current" />)}
                                            </div>
                                            <div className="text-[9px] font-bold text-gray-400 uppercase">
                                                para <span className="text-brand-blue">{review.pro}</span> / Cozinheira
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div >
                    </div >

                    {/* New Sections based on UI provided */}
                    <div className="mt-24 space-y-24">
                        {/* Section: Você é Cozinheira? */}
                        <div className="text-center space-y-6">
                            <h2 className="text-3xl font-black text-brand-darkBlue">Você é Cozinheira?</h2>
                            <p className="text-gray-500 font-bold max-w-2xl mx-auto">
                                Milhares de pedidos chegam todos os meses e podem ajudar a aumentar sua renda
                            </p>
                            <Link
                                to="/auth?tab=register&role=professional"
                                className="inline-block bg-brand-blue text-white px-12 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all uppercase tracking-tight"
                            >
                                QUERO ME CADASTRAR
                            </Link>
                        </div>

                        {/* Section: Custo Médio Estimado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-green-600 uppercase tracking-widest">Custo médio estimado</span>
                                    <h4 className="text-4xl font-black text-brand-darkBlue">R$ 20,00</h4>
                                    <p className="text-gray-400 font-bold text-sm">comida caseira congelada</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Menor custo</span>
                                        <p className="font-black text-brand-darkBlue">R$ 30,00</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Maior custo</span>
                                        <p className="font-black text-brand-darkBlue">R$ 40,00</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-green-600 uppercase tracking-widest">Custo médio estimado</span>
                                    <h4 className="text-4xl font-black text-brand-darkBlue">R$ 30,00</h4>
                                    <p className="text-gray-400 font-bold text-sm">cozinheira a domicílio</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Menor custo</span>
                                        <p className="font-black text-brand-darkBlue">R$ 765,00</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Maior custo</span>
                                        <p className="font-black text-brand-darkBlue">R$ 1.200,00</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Pedidos Similares */}
                        <div className="space-y-12">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black text-brand-darkBlue">Veja alguns pedidos similares para Cozinheiros</h2>
                                <p className="text-gray-400 font-bold">Esses são os últimos pedidos para essa categoria</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    {
                                        name: "Mara",
                                        text: "Preciso de uma frizeira pelo sistema de diarista. Comidas simples e saudáveis. Gostaria de manter uma média de 1 vez por mês."
                                    },
                                    {
                                        name: "Mauricio",
                                        text: "Preciso de uma pessoa que vá 1 vez por semana em casa fazer a comida congelada porcionada para a semana inteira e deixe a cozinha organizada."
                                    },
                                    {
                                        name: "Nadia",
                                        text: "De uma conzinheira que faça congelamento semanalmente. Preciso para minha residência com instruções simples."
                                    },
                                    {
                                        name: "Pedro Manuel",
                                        text: "Quero contratar uma cozinheira para preparar almoço e jantar em minha residencia de segunda a sábado, as comidas são simples."
                                    }
                                ].map((pedido, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                                        <div className="space-y-4">
                                            <p className="text-sm font-bold text-gray-500">
                                                <span className="font-black text-brand-darkBlue">{pedido.name}</span> contratou <span className="font-black text-brand-darkBlue">Cozinheira</span>
                                            </p>
                                            <p className="text-sm text-gray-400 leading-relaxed font-medium line-clamp-4">
                                                {pedido.text}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-tighter pt-4 border-t border-gray-50">
                                            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3" />
                                            </div>
                                            Pedido atendido
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Perguntas Frequentes (FAQ) */}
                        <div className="space-y-12">
                            <div className="text-center py-4 border-b border-orange-200 bg-orange-50/50 rounded-xl">
                                <h2 className="text-3xl font-black text-brand-darkBlue">Perguntas Frequentes</h2>
                            </div>
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-black text-brand-darkBlue">Principais dúvidas sobre cozinheira</h3>
                                    <div className="space-y-4 text-gray-500 font-medium leading-relaxed">
                                        <p>A alimentação é um dos principais fatores que impactam diretamente a qualidade de vida, e a procura por hábitos mais saudáveis cresce a cada dia.</p>
                                        <p>Comer em casa é uma ótima alternativa para quem deseja uma alimentação mais natural e com menos produtos industrializados. No entanto, a rotina agitada ou a falta de habilidade na cozinha nem sempre permitem que esse objetivo seja alcançado.</p>
                                        <p>Pensando nisso, cozinheiras e chefs de cozinha oferecem serviços personalizados, preparando refeições diretamente na residência dos clientes. Esses profissionais podem ser contratados por períodos determinados, adaptando o cardápio às preferências e necessidades de cada pessoa. Conheça melhor esse serviço e descubra como ele pode contribuir para uma alimentação mais equilibrada e prática.</p>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-black text-brand-darkBlue">Onde a cozinheira pode trabalhar?</h3>
                                    <p className="text-gray-500 font-medium leading-relaxed">
                                        Cozinheiros profissionais podem preparar pratos em restaurantes, salões e buffets, sítios e chácaras, ou na própria residência do cliente.
                                    </p>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-black text-brand-darkBlue">Como contratar uma cozinheira?</h3>
                                    <div className="space-y-4 text-gray-500 font-medium leading-relaxed">
                                        <p>Para escolher a cozinheira domiciliar mais adequada às suas necessidades, é fundamental definir previamente qual serviço você procura. No caso de eventos, a contratação deve ser feita com antecedência ao horário combinado com os convidados. Já para o preparo das refeições do dia a dia, é possível contratar a profissional por diária e alinhar a quantidade de alimentos que será preparada.</p>
                                        <p>Em ambas as situações, é importante combinar antecipadamente o cardápio, informando eventuais restrições alimentares e os objetivos do preparo. O serviço de cozinheira a domicílio é totalmente personalizado e pode incluir, se desejado, a compra dos ingredientes e a organização e limpeza do ambiente após o preparo.</p>
                                        <p>A melhor forma de garantir uma boa contratação é por meio de indicações. Por isso, na plataforma da Samej, você pode buscar profissionais de acordo com a sua região e conferir as avaliações deixadas por clientes anteriores.</p>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h3 className="text-xl font-black text-brand-darkBlue">Qual a diferença entre chef e cozinheira?</h3>
                                    <div className="space-y-4 text-gray-500 font-medium leading-relaxed">
                                        <p>A principal diferença entre esses dois serviços está no tipo de preparo realizado. A cozinheira domiciliar é responsável pela elaboração das refeições do dia a dia, conforme as necessidades do cliente. Geralmente, sua contratação é feita por diária, e o tempo disponível é aproveitado para preparar a maior quantidade possível de pratos, otimizando a rotina da casa.</p>
                                        <p>Mesmo que muitas profissionais possuam formação na área gastronômica e ampla experiência com diferentes cardápios, seu foco costuma ser a preparação de refeições simples, práticas e adequadas ao cotidiano, sem a exigência de técnicas complexas ou longos tempos de preparo.</p>
                                        <p>Já o chef ou personal chef é contratado para ocasiões específicas, oferecendo refeições mais elaboradas, que demandam maior conhecimento técnico, planejamento e tempo de execução. Seja para os moradores da residência ou para um pequeno grupo de convidados, o cardápio e a sequência dos pratos são definidos previamente em conjunto com o cliente, sempre considerando preferências pessoais e eventuais restrições alimentares.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (slug === 'churrasqueiro-em-domicilio') {
        const service = serviceMap[slug || ''];
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-6xl font-black text-brand-darkBlue tracking-tighter leading-none">
                                    Precisando de Churrasqueiro para Eventos?
                                </h1>
                                <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed">
                                    Milhares de profissionais avaliados por clientes, permitindo você negociar apenas com os melhores.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-brand-blue font-bold">
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Até 4 orçamentos grátis e seguros</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-500 font-bold">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span>Profissionais avaliados</span>
                                </div>
                                <div className="flex items-center gap-3 text-red-500 font-bold">
                                    <Zap className="w-5 h-5" />
                                    <span>Como funciona o Samej?</span>
                                </div>
                            </div>

                            {/* Form Card */}
                            <div className="bg-[#FFEB3B] p-4 md:p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                                <div className="bg-white p-6 md:p-12 rounded-[2.5rem] relative z-10 shadow-xl">
                                    {submitted ? (
                                        <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Pedido Enviado!</h3>
                                            <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed max-w-md">
                                                Excelente! Sua solicitação para <span className="text-brand-blue">{serviceMap[slug || '']?.title}</span> foi enviada com sucesso.
                                            </p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-brand-lightOrange transition-all uppercase tracking-tight"
                                            >
                                                VOLTAR PARA O INÍCIO
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mb-10 overflow-hidden relative">
                                                <div
                                                    className="bg-brand-blue h-full transition-all duration-500"
                                                    style={{ width: `${(step / 6) * 100}%` }}
                                                ></div>
                                            </div>

                                            {step > 1 && (
                                                <button onClick={() => setStep(step - 1)} className="mb-6 flex items-center text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest">
                                                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                                                </button>
                                            )}

                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-600">Receba até 4 orçamentos grátis!</span>
                                            </div>

                                            {step === 1 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">O serviço é para qual evento?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        <div className="relative">
                                                            <select
                                                                value={eventType}
                                                                onChange={(e) => {
                                                                    setEventType(e.target.value);
                                                                    setStep(2);
                                                                }}
                                                                className="w-full p-4 md:p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 appearance-none cursor-pointer"
                                                            >
                                                                <option value="" disabled>Selecione uma opção</option>
                                                                <option value="Aniversário">Aniversário</option>
                                                                <option value="Casamento">Casamento</option>
                                                                <option value="Debutante">Debutante</option>
                                                                <option value="Corporativo">Corporativo</option>
                                                                <option value="Formatura">Formatura</option>
                                                                <option value="Outro">Outro</option>
                                                            </select>
                                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                                                <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : step === 2 ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2 mb-8 text-green-600">
                                                        <ThumbsUp className="w-5 h-5 fill-current" />
                                                        <span className="text-sm font-bold">Você está indo bem, agora falta pouco!</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">Quantos convidados são esperados?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        <div className="relative">
                                                            <select
                                                                value={guestCount}
                                                                onChange={(e) => {
                                                                    setGuestCount(e.target.value);
                                                                    setStep(3);
                                                                }}
                                                                className="w-full p-4 md:p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 appearance-none cursor-pointer"
                                                            >
                                                                <option value="" disabled>Selecione uma opção</option>
                                                                <option value="Até 30 convidados">Até 30 convidados</option>
                                                                <option value="30 a 50 convidados">30 a 50 convidados</option>
                                                                <option value="50 a 70 convidados">50 a 70 convidados</option>
                                                                <option value="70 a 90 convidados">70 a 90 convidados</option>
                                                                <option value="90 a 120 convidados">90 a 120 convidados</option>
                                                                <option value="120 a 150 convidados">120 a 150 convidados</option>
                                                                <option value="150 convidados ou mais">150 convidados ou mais</option>
                                                            </select>
                                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                                                <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : step === 3 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">Qual será a data e horário do evento?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        <input
                                                            type="text"
                                                            value={eventDateTime}
                                                            onChange={(e) => setEventDateTime(e.target.value)}
                                                            className="w-full p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 transition-all shadow-sm"
                                                            placeholder="Informe aqui a data e o horário do evento"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setStep(4)}
                                                        disabled={!eventDateTime}
                                                        className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${eventDateTime ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 4 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Explique o que você precisa</h3>
                                                        <p className="text-sm font-medium text-gray-500">Receba até 4 orçamentos grátis, online!</p>
                                                    </div>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-12">
                                                        <p className="text-sm font-bold text-gray-700 mb-2">Detalhe seu pedido</p>
                                                        <textarea
                                                            value={orderDetails}
                                                            onChange={(e) => setOrderDetails(e.target.value)}
                                                            className="w-full p-5 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-medium text-gray-700 transition-all min-h-[150px] resize-none"
                                                            placeholder='Traga todos os detalhes do seu pedido. Tente "Preciso de ..."'
                                                        ></textarea>
                                                        <div className="bg-amber-50 border-0 rounded-xl p-4 flex items-center justify-center gap-2 relative">
                                                            <span className="text-xs font-bold text-amber-800 flex items-center gap-2 text-center">
                                                                <span className="text-base">👆</span> Quanto mais informações você fornecer, melhor será o seu pedido!
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setStep(5)}
                                                        disabled={orderDetails.length < 5}
                                                        className={`block w-full py-5 rounded-xl font-bold text-base text-center transition-all ${orderDetails.length >= 5 ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 5 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-black text-brand-darkBlue mb-4 uppercase">Informe seu CEP</h3>
                                                        <p className="text-center text-gray-500 font-bold mb-10">Utilizamos o CEP para identificar a disponibilidade de profissionais na região.</p>
                                                    </div>
                                                    <div className="max-w-2xl mx-auto space-y-6">
                                                        <p className="text-sm font-bold text-gray-700 mb-2">CEP</p>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={cep}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                    setCep(val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val);
                                                                }}
                                                                className="w-full p-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 shadow-sm"
                                                                placeholder="00000-000"
                                                            />
                                                            {loadingCep && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>}
                                                        </div>
                                                        {address && <p className="text-sm font-bold text-gray-400 text-center">{address}</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => setStep(6)}
                                                        disabled={cep.replace(/\D/g, '').length !== 8}
                                                        className={`block w-full py-5 rounded-xl font-bold text-base text-center mt-10 transition-all ${cep.replace(/\D/g, '').length === 8 ? 'bg-brand-blue text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        Próximo
                                                    </button>
                                                </>
                                            ) : step === 6 ? (
                                                <>
                                                    <div className="max-w-2xl mx-auto py-4">
                                                        <h3 className="text-3xl font-black text-brand-darkBlue mb-12">Dados de Contato</h3>
                                                        <div className="space-y-6 mb-12">
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <User className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={userName}
                                                                    onChange={(e) => setUserName(e.target.value.toUpperCase())}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm uppercase"
                                                                    placeholder="SEU NOME COMPLETO"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="tel"
                                                                    value={userPhone}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                        let masked = raw;
                                                                        if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                                                                        if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                                                                        setUserPhone(masked);
                                                                    }}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm"
                                                                    placeholder="(DDD) + NÚMERO DO TELEFONE"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleSubmitOrder}
                                                            disabled={isSubmitting || !userName || userPhone.replace(/\D/g, '').length !== 11}
                                                            className={`w-full py-6 rounded-[2.5rem] font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-2xl ${userName && userPhone.replace(/\D/g, '').length === 11 && !isSubmitting ? 'bg-brand-darkBlue text-white hover:scale-[1.02]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <>ENVIAR PEDIDO<ChevronRight className="w-5 h-5" /></>}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                    <div className="mt-8 bg-green-50/50 py-3 px-6 rounded-lg text-center">
                                        <p className="text-green-600 font-bold text-sm">
                                            Você receberá orçamentos em breve
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl">
                                <img src={service.bg} alt={service.title} className="w-full h-auto group-hover:scale-110 transition-transform duration-700" />
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5">
                                <p className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter mb-6">Avaliações de quem contratou</p>
                                <div className="space-y-6">
                                    {[
                                        {
                                            client: "Paula Silva",
                                            text: "Fui muito bem atendida e recebi um serviço de excelente qualidade. O orçamento é gratuito e o valor é acessível. Agradeço pelo atendimento!",
                                            pro: "Antônio Santos"
                                        },
                                        {
                                            client: "Carlos Silva",
                                            text: "Profissionais de alto nível, ágeis, honestos e com preços justos. Recomendo com total confiança para quem busca um serviço de qualidade.",
                                            pro: "Antônio Santos"
                                        }

                                    ].map((review, i) => (
                                        <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-md shadow-blue-500/5 space-y-4">
                                            <div>
                                                <p className="text-xs font-black text-gray-900">{review.client} <span className="text-gray-400 font-bold">avaliou:</span></p>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed italic mt-2">
                                                    "{review.text}"
                                                </p>
                                            </div>
                                            <div className="flex text-amber-500 gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-current" />)}
                                            </div>
                                            <div className="text-[9px] font-bold text-gray-400 uppercase">
                                                para <span className="text-brand-blue">{review.pro}</span> / Churrasqueiro
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional CTA Section */}
                <section className="py-20 bg-gray-50/50">
                    <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-black text-brand-darkBlue">Você é Churrasqueiro Profissional?</h2>
                        <p className="text-gray-500 font-bold max-w-2xl mx-auto">
                            A plataforma recebe milhares de pedidos por mês e pode ajudar a aumentar sua renda
                        </p>
                        <button
                            onClick={() => navigate('/auth?tab=register&role=professional')}
                            className="bg-brand-blue text-white px-12 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all uppercase tracking-tight"
                        >
                            Quero me cadastrar
                        </button>
                    </div>
                </section>

                {/* Average Costs Section */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 space-y-2">
                            <h2 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tighter">Custos médios</h2>
                            <p className="text-gray-400 font-bold">Conheça o custo estimado para alguns serviços</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-green-600 uppercase tracking-widest">Custo médio estimado</span>
                                    <h4 className="text-4xl font-black text-brand-darkBlue">R$ 150,00</h4>
                                    <p className="text-gray-400 font-bold text-sm">Churrasqueiro</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Menor custo</span>
                                        <p className="font-black text-brand-darkBlue">R$ 200,00</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Maior custo</span>
                                        <p className="font-black text-brand-darkBlue">R$ 800,00</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-black text-green-600 uppercase tracking-widest">Custo médio estimado</span>
                                    <h4 className="text-4xl font-black text-brand-darkBlue">R$ 45,00</h4>
                                    <p className="text-gray-400 font-bold text-sm">churrasqueiro para festa</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Menor custo</span>
                                        <p className="font-black text-brand-darkBlue">R$ 67,00</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Maior custo</span>
                                        <p className="font-black text-brand-darkBlue">R$ 90,00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Similar Orders Section */}
                <section className="py-24 bg-gray-50/30">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 space-y-2">
                            <h2 className="text-3xl font-black text-brand-darkBlue">Veja alguns pedidos similares para Churrasqueiro de Eventos</h2>
                            <p className="text-gray-400 font-bold">Esses são os últimos pedidos para essa categoria</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    name: "Marcelo",
                                    text: "1 churrasqueiro e um garçom - zona sul de são paulo"
                                },
                                {
                                    name: "Isadora",
                                    text: "Preciso de garçons e cozinheira para evento em mogi das cruzes para 200 pessoas"
                                },
                                {
                                    name: "Liz",
                                    text: "Festa para 100 pessoas, com espetinhos de carne, frango, linguiça, mão de obra e estrutura (churrasqueira, carvão, etc)"
                                },
                                {
                                    name: "Maria Vitória",
                                    text: "Buffet de churrasco para 50 pessoas na residencia"
                                }
                            ].map((pedido, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                                    <div className="space-y-4">
                                        <p className="text-sm font-bold text-gray-500">
                                            <span className="font-black text-brand-darkBlue">{pedido.name}</span> contratou <span className="font-black text-brand-darkBlue">Churrasqueiro</span>
                                        </p>
                                        <p className="text-sm text-gray-400 leading-relaxed font-medium line-clamp-4">
                                            {pedido.text}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-tighter pt-4 border-t border-gray-50">
                                        <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                        Pedido atendido
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section: Perguntas Frequentes (FAQ) */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16 py-4 border-b border-orange-200 bg-orange-50/50 rounded-xl">
                            <h2 className="text-3xl font-black text-brand-darkBlue">Perguntas Frequentes</h2>
                        </div>
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-brand-darkBlue">Onde encontrar um bom churrasqueiro para eventos?</h3>
                                <div className="space-y-4 text-gray-500 font-medium leading-relaxed">
                                    <p>O churrasco é um dos pratos mais apreciados pelos brasileiros. Ele pode ser realizado em praticamente todo tipo de evento, de aniversários e festas corporativas a casamentos e reuniões familiares, além de ser vendido em churrascarias.</p>
                                    <p>Porém, quem fica na churrasqueira não consegue aproveitar tanto aquele evento, já que é preciso se dedicar à preparação das carnes para ter certeza que elas estejam bem temperadas e no ponto desejado, o que deixa seu sabor ainda melhor.</p>
                                    <p>Se você procura por um churrasqueiro profissional, a Samej é o local ideal para encontrá-lo. Assim, todos poderão aproveitar o evento sem ter que se preocupar com a preparação das carnes, o que proporciona a experiência ideal!</p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-brand-darkBlue">Como escolher churrasqueiro para eventos?</h3>
                                <div className="space-y-4 text-gray-500 font-medium leading-relaxed">
                                    <p>Procure conhecer a experiência do profissional. Quanto maior o tempo de atuação na área, maiores são as chances de que ele domine bem as técnicas de preparo das carnes.</p>
                                    <p>Verifique também o tipo de churrasco com o qual o churrasqueiro está habituado a trabalhar. No Sul do país, por exemplo, é comum o churrasco no fogo de chão, preparado diretamente sobre a fogueira, enquanto no Sudeste predomina o preparo na churrasqueira tradicional. Caso você tenha preferência por um estilo específico, esse é um ponto importante a ser considerado.</p>
                                    <p>Além disso, informe-se sobre os cortes, tipos de carne e embutidos com os quais o profissional costuma trabalhar. Alguns churrasqueiros dominam uma grande variedade de cortes, enquanto outros são especializados em carnes específicas, como bovina, suína ou ovina. Se houver alguma preferência, vale confirmar se ela faz parte da especialidade do profissional contratado.</p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-brand-darkBlue">Quais cuidados tomar na hora de escolher um churrasqueiro a domicilio?</h3>
                                <div className="space-y-6 text-gray-500 font-medium leading-relaxed">
                                    <p>• Verifique a disponibilidade do profissional: o tempo de contratação de um churrasqueiro para eventos costuma ser menor do que o de quem atua em uma churrascaria, por exemplo. Certifique-se de que ele estará disponível durante todo o período necessário.</p>
                                    <p>• Confirme se ele dispõe dos equipamentos e utensílios necessários: caso seja preciso que o churrasqueiro leve facas, grelhas, outros acessórios ou até uma churrasqueira portátil, é importante alinhar isso previamente.</p>
                                    <p>• Entenda o volume de trabalho com o qual ele está habituado: para atuar em uma churrascaria, por exemplo, o profissional lida com grandes quantidades de carnes, embutidos, aves, ovinos e acompanhamentos. Conhecer essa rotina ajuda a avaliar se ele atende à sua demanda.</p>
                                    <p>• Conheça os métodos de preparo utilizados: se houver restrições quanto ao uso de temperos, tipos de carne ou proteínas específicas, confirme se o churrasqueiro consegue se adaptar a essas exigências sem dificuldades.</p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-brand-darkBlue">Quais as opções de pagamento de churrasqueiro para festa?</h3>
                                <div className="space-y-4 text-gray-500 font-medium leading-relaxed">
                                    <p>As formas de pagamento variam de acordo com o que for acordado entre o contratante e o profissional. O pagamento pode ser realizado em dinheiro, transferência bancária, cheque, cartão de crédito, cartão de débito ou por meio de aplicativos de pagamento, desde que essas opções sejam aceitas pelo profissional.</p>
                                    <p>Para evitar qualquer tipo de desencontro ou mal-entendido, é importante confirmar previamente quais são as formas de pagamento disponíveis.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        );
    }
    if (slug === 'massagista') {
        const service = serviceMap[slug || ''];
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-6xl font-black text-brand-darkBlue tracking-tighter leading-none">
                                    Precisando de Massagista?
                                </h1>
                                <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed">
                                    Milhares de profissionais avaliados por clientes, permitindo você negociar apenas com os melhores.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-brand-blue font-bold">
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Até 4 orçamentos grátis e seguros</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-500 font-bold">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span>Profissionais avaliados</span>
                                </div>
                                <div className="flex items-center gap-3 text-red-500 font-bold">
                                    <Zap className="w-5 h-5" />
                                    <span>Como funciona o Samej?</span>
                                </div>
                            </div>

                            {/* Form Card */}
                            <div className="bg-[#FFEB3B] p-4 md:p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                                <div className="bg-white p-6 md:p-12 rounded-[2.5rem] relative z-10 shadow-xl">
                                    {submitted ? (
                                        <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Pedido Enviado!</h3>
                                            <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed max-w-md">
                                                Excelente! Sua solicitação para <span className="text-brand-blue">{serviceMap[slug || '']?.title}</span> foi enviada com sucesso.
                                            </p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-brand-lightOrange transition-all uppercase tracking-tight"
                                            >
                                                VOLTAR PARA O INÍCIO
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mb-10 overflow-hidden relative">
                                                <div
                                                    className="bg-brand-blue h-full transition-all duration-500"
                                                    style={{ width: `${(step / 12) * 100}%` }}
                                                ></div>
                                            </div>

                                            {step > 1 && (
                                                <button
                                                    onClick={() => {
                                                        if (step === 5 && massageLocation === "No imóvel ou espaço do profissional") {
                                                            setStep(3);
                                                        } else {
                                                            setStep(step - 1);
                                                        }
                                                    }}
                                                    className="mb-6 flex items-center text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest"
                                                >
                                                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                                                </button>
                                            )}

                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-600">Receba até 4 orçamentos grátis!</span>
                                            </div>

                                            {step === 1 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Tipo de massagem</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            "Descontraturante",
                                                            "Esportiva",
                                                            "Relaxante ou anti-stress (sueco)",
                                                            "Alívio da dor ou terapêutica",
                                                            "Drenagem linfática",
                                                            "Ayurvédica (terapêutica)",
                                                            "Reflexologia",
                                                            "Kobido",
                                                            "Thai",
                                                            "Tântrica (tipo de massagem não oferecida em Samej)",
                                                            "Erótica (tipo de massagem não oferecida em Samej)",
                                                            "Outro"
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setMassageType(opt);
                                                                    setStep(2);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left group ${massageType === opt ? 'border-brand-blue bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-brand-blue/30 shadow-sm'}`}
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${massageType === opt ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {massageType === opt && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 2 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Qual gênero de profissional prefere?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {["Feminino", "Masculino", "Não tenho preferência"].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setProfessionalGender(opt);
                                                                    setStep(3);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left group ${professionalGender === opt ? 'border-brand-blue bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-brand-blue/30 shadow-sm'}`}
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${professionalGender === opt ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {professionalGender === opt && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 3 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Onde você gostaria de ser atendido(a)?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            "Em meu domicílio, escritório, etc.",
                                                            "No imóvel ou espaço do profissional"
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setMassageLocation(opt);
                                                                    if (opt === "No imóvel ou espaço do profissional") {
                                                                        setStep(5);
                                                                    } else {
                                                                        setStep(4);
                                                                    }
                                                                }}
                                                                className={`w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left group ${massageLocation === opt ? 'border-brand-blue bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-brand-blue/30 shadow-sm'}`}
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${massageLocation === opt ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {massageLocation === opt && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${!["Em meu domicílio, escritório, etc.", "No imóvel ou espaço do profissional"].includes(massageLocation) && massageLocation ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {!["Em meu domicílio, escritório, etc.", "No imóvel ou espaço do profissional"].includes(massageLocation) && massageLocation && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                </div>
                                                                <span className="text-base font-medium text-gray-600 uppercase">Outro:</span>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={!["Em meu domicílio, escritório, etc.", "No imóvel ou espaço do profissional"].includes(massageLocation) ? massageLocation : ''}
                                                                onChange={(e) => setMassageLocation(e.target.value)}
                                                                className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-brand-blue outline-none"
                                                                placeholder="Digite o local..."
                                                            />
                                                            {massageLocation && !["Em meu domicílio, escritório, etc.", "No imóvel ou espaço do profissional"].includes(massageLocation) && (
                                                                <button
                                                                    onClick={() => setStep(4)}
                                                                    className="mt-2 w-full py-3 bg-brand-blue text-white rounded-xl font-bold uppercase"
                                                                >
                                                                    Continuar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : step === 4 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Você possui a maca?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            "Sim, o profissional não precisa trazer",
                                                            "Não, preciso que o profissional se encarregue de trazer"
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setHasTable(opt);
                                                                    setStep(5);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left group ${hasTable === opt ? 'border-brand-blue bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-brand-blue/30 shadow-sm'}`}
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${hasTable === opt ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {hasTable === opt && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 5 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Quanto tempo durará cada sessão?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {["30 minutos", "45 minutos", "60 minutos", "Mais de 60 minutos"].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setSessionDuration(opt);
                                                                    setStep(6);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left group ${sessionDuration === opt ? 'border-brand-blue bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-brand-blue/30 shadow-sm'}`}
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${sessionDuration === opt ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {sessionDuration === opt && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 6 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Frequência do serviço</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            "Pontual (uma única vez)",
                                                            "Semanal (uma ou mais vezes na semana)",
                                                            "Quinzenal (a cada 10-15 dias)",
                                                            "Mensal (uma vez ao mês aprox.)"
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setFrequency(opt);
                                                                    setStep(7);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left group ${frequency === opt ? 'border-brand-blue bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-brand-blue/30 shadow-sm'}`}
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${frequency === opt ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {frequency === opt && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 7 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Data de preferência para o serviço</h3>
                                                    <div className="max-w-xl mx-auto mb-10">
                                                        <div className="p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-xl">
                                                            <p className="text-gray-500 font-bold mb-4 text-center">Indique a melhor data para receber o atendimento</p>
                                                            <input
                                                                type="date"
                                                                value={preferedDate}
                                                                onChange={(e) => setPreferedDate(e.target.value)}
                                                                className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-brand-blue outline-none font-bold text-gray-600 text-center text-lg"
                                                            />
                                                            <button
                                                                onClick={() => setStep(8)}
                                                                disabled={!preferedDate}
                                                                className={`mt-6 w-full py-4 rounded-xl font-black text-lg transition-all uppercase ${preferedDate ? 'bg-brand-blue text-white shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                            >
                                                                Seguinte
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : step === 8 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Horário de preferência para o serviço</h3>
                                                    <p className="text-gray-500 font-bold mb-8 text-center">Indique o melhor horário para receber o serviço</p>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            "O dia inteiro",
                                                            "Manhã (08:00 - 12:00)",
                                                            "Meio dia (12:00 - 15:00)",
                                                            "Tarde (15:00 - 18:00)",
                                                            "Meia tarde (18:00 - 21:00)",
                                                            "Noite (21:00 - 00:00)",
                                                            "Madrugada (00:00 - 08:00)"
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setPreferedTime(opt);
                                                                    setStep(9);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left group ${preferedTime === opt ? 'border-brand-blue bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-brand-blue/30 shadow-sm'}`}
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${preferedTime === opt ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {preferedTime === opt && <CheckCircle2 className="w-4 h-4" />}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 9 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">De 1 a 5, como você classificaria seu interesse em contratar este serviço?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            { val: "1", label: "1 (não tenho interesse)" },
                                                            { val: "2", label: "2" },
                                                            { val: "3", label: "3" },
                                                            { val: "4", label: "4" },
                                                            { val: "5", label: "5 (tenho muito interesse)" }
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.val}
                                                                onClick={() => {
                                                                    setInterestLevel(opt.val);
                                                                    setStep(10);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left group ${interestLevel === opt.val ? 'border-brand-blue bg-blue-50 shadow-inner' : 'border-gray-100 hover:border-brand-blue/30 shadow-sm'}`}
                                                            >
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt.label}</span>
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${interestLevel === opt.val ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-200'}`}>
                                                                    {interestLevel === opt.val && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 10 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-black text-brand-darkBlue mb-4 uppercase">Algo mais que o profissional deva saber?</h3>
                                                        <p className="text-gray-500 font-bold">(Opcional)</p>
                                                    </div>
                                                    <div className="max-w-2xl mx-auto space-y-6">
                                                        <textarea
                                                            value={orderDetails}
                                                            onChange={(e) => setOrderDetails(e.target.value)}
                                                            className="w-full p-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 shadow-inner min-h-[150px]"
                                                            placeholder="Quanto mais informações acrescentar a descrição da sua solicitação, maior interesse os profissionais mostrarão em atendê-la..."
                                                        ></textarea>
                                                        <div className="flex gap-4">
                                                            <button
                                                                onClick={() => setStep(11)}
                                                                className="flex-1 py-5 rounded-2xl font-bold text-lg border-2 border-gray-200 text-gray-500 hover:border-brand-blue hover:text-brand-blue transition-all uppercase"
                                                            >
                                                                Saltar
                                                            </button>
                                                            <button
                                                                onClick={() => setStep(11)}
                                                                className="flex-1 py-5 rounded-2xl font-black text-lg bg-brand-blue text-white shadow-xl hover:bg-blue-700 transition-all uppercase"
                                                            >
                                                                Seguinte
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : step === 11 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-black text-brand-darkBlue mb-4 uppercase">Informe seu CEP</h3>
                                                        <p className="text-center text-gray-500 font-bold mb-10">Utilizamos o CEP para identificar a disponibilidade de profissionais na região.</p>
                                                    </div>
                                                    <div className="max-w-2xl mx-auto space-y-6">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={cep}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                    setCep(val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val);
                                                                }}
                                                                className="w-full p-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 shadow-sm"
                                                                maxLength={9}
                                                                placeholder="00000-000"
                                                            />
                                                            {loadingCep && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>}
                                                        </div>
                                                        {address && <p className="text-sm font-bold text-gray-400 text-center">{address}</p>}
                                                        <button
                                                            onClick={() => setStep(12)}
                                                            disabled={cep.replace(/\D/g, '').length !== 8}
                                                            className={`w-full py-6 rounded-3xl font-black text-xl transition-all ${cep.replace(/\D/g, '').length === 8 ? 'bg-brand-darkBlue text-white shadow-2xl' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            PRÓXIMO
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 12 ? (
                                                <>
                                                    <div className="max-w-2xl mx-auto py-4">
                                                        <h3 className="text-3xl font-black text-brand-darkBlue mb-12 text-center">Dados de Contato</h3>
                                                        <div className="space-y-6 mb-12">
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <User className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={userName}
                                                                    onChange={(e) => setUserName(e.target.value.toUpperCase())}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm uppercase"
                                                                    placeholder="SEU NOME COMPLETO"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="tel"
                                                                    value={userPhone}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                        let masked = raw;
                                                                        if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                                                                        if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                                                                        setUserPhone(masked);
                                                                    }}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm"
                                                                    placeholder="(DDD) + NÚMERO DO TELEFONE"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleSubmitOrder}
                                                            disabled={isSubmitting || !userName || userPhone.replace(/\D/g, '').length !== 11}
                                                            className={`w-full py-6 rounded-[2.5rem] font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-2xl ${userName && userPhone.replace(/\D/g, '').length === 11 && !isSubmitting ? 'bg-brand-darkBlue text-white hover:scale-[1.02]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <>ENVIAR PEDIDO<ChevronRight className="w-5 h-5" /></>}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 8 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-black text-brand-darkBlue mb-4 uppercase">Informe seu CEP</h3>
                                                        <p className="text-center text-gray-500 font-bold mb-10">Utilizamos o CEP para identificar a disponibilidade de profissionais na região.</p>
                                                    </div>
                                                    <div className="max-w-2xl mx-auto space-y-6">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={cep}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                    setCep(val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val);
                                                                }}
                                                                className="w-full p-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 shadow-sm"
                                                                placeholder="00000-000"
                                                            />
                                                            {loadingCep && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>}
                                                        </div>
                                                        {address && <p className="text-sm font-bold text-gray-400 text-center">{address}</p>}
                                                        <button
                                                            onClick={() => setStep(9)}
                                                            disabled={cep.replace(/\D/g, '').length !== 8}
                                                            className={`w-full py-6 rounded-3xl font-black text-xl transition-all ${cep.replace(/\D/g, '').length === 8 ? 'bg-brand-darkBlue text-white shadow-2xl' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            PRÓXIMO
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 9 ? (
                                                <>
                                                    <div className="max-w-2xl mx-auto py-4">
                                                        <h3 className="text-3xl font-black text-brand-darkBlue mb-12 text-center">Dados de Contato</h3>
                                                        <div className="space-y-6 mb-12">
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <User className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={userName}
                                                                    onChange={(e) => setUserName(e.target.value.toUpperCase())}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm uppercase"
                                                                    placeholder="SEU NOME COMPLETO"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="tel"
                                                                    value={userPhone}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                        let masked = raw;
                                                                        if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                                                                        if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                                                                        setUserPhone(masked);
                                                                    }}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm"
                                                                    placeholder="(DDD) + NÚMERO DO TELEFONE"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleSubmitOrder}
                                                            disabled={isSubmitting || !userName || userPhone.replace(/\D/g, '').length !== 11}
                                                            className={`w-full py-6 rounded-[2.5rem] font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-2xl ${userName && userPhone.replace(/\D/g, '').length === 11 && !isSubmitting ? 'bg-brand-darkBlue text-white hover:scale-[1.02]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <>ENVIAR PEDIDO<ChevronRight className="w-5 h-5" /></>}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                    <div className="mt-8 bg-green-50/50 py-3 px-6 rounded-lg text-center">
                                        <p className="text-green-600 font-bold text-sm">
                                            Você receberá orçamentos em breve
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl">
                                <img src={service?.bg} alt={service?.title} className="w-full h-auto group-hover:scale-110 transition-transform duration-700" />
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5">
                                <p className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter mb-6">Avaliações de quem contratou</p>
                                <div className="space-y-6">
                                    {[
                                        {
                                            client: "Daniela Costa",
                                            text: "Ótima profissional, massagem relaxante maravilhosa. Recomendo muito!",
                                            pro: "Juliana Silva"
                                        },
                                        {
                                            client: "Roberto Almeida",
                                            text: "Excelente atendimento, pontual e técnica impecável. Resolveu minhas dores nas costas.",
                                            pro: "Marcos Santos"
                                        }
                                    ].map((review, i) => (
                                        <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-md shadow-blue-500/5 space-y-4">
                                            <div>
                                                <p className="text-xs font-black text-gray-900">{review.client} <span className="text-gray-400 font-bold">avaliou:</span></p>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed italic mt-2">
                                                    "{review.text}"
                                                </p>
                                            </div>
                                            <div className="flex text-amber-500 gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-current" />)}
                                            </div>
                                            <div className="text-[9px] font-bold text-gray-400 uppercase">
                                                para <span className="text-brand-blue">{review.pro}</span> / Massagista
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Benfits Section for Massagista */}
                    <section className="py-24 bg-gray-50/50 mt-12 rounded-[3rem]">
                        <div className="max-w-7xl mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-brand-blue">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tight">Profissionais Verificados</h4>
                                    <p className="text-sm text-gray-500 font-bold">Trabalhamos apenas com profissionais com histórico comprovado e avaliações positivas.</p>
                                </div>
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-brand-orange">
                                        <Zap className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tight">Orçamentos Rápidos</h4>
                                    <p className="text-sm text-gray-500 font-bold">Economize tempo. Receba até 4 propostas em menos de 60 minutos diretamente no seu celular.</p>
                                </div>
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-50 rounded-[1.5rem] flex items-center justify-center text-green-500">
                                        <ThumbsUp className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tight">Totalmente Gratuito</h4>
                                    <p className="text-sm text-gray-500 font-bold">Você não paga nada para pedir orçamentos. Escolha o melhor profissional sem taxas extras.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Professional CTA Section */}
                    <section className="py-20 mt-12">
                        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                            <h2 className="text-3xl md:text-4xl font-black text-brand-darkBlue">Você é Massagista Profissional?</h2>
                            <p className="text-gray-500 font-bold max-w-2xl mx-auto">
                                A plataforma recebe milhares de pedidos por mês e pode ajudar a aumentar sua renda
                            </p>
                            <button
                                onClick={() => navigate('/auth?tab=register&role=professional')}
                                className="bg-brand-blue text-white px-12 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all uppercase tracking-tight"
                            >
                                Quero me cadastrar
                            </button>
                        </div>
                    </section>

                    {/* New Informative Sections for Massagista */}
                    <section className="pb-24 pt-12 px-4">
                        <div className="max-w-5xl mx-auto space-y-16">
                            {/* Introduction */}
                            <div className="space-y-6">
                                <h1 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tighter">Massagista</h1>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    Conseguir um alívio das dores musculares muitas vezes ocasionadas por estresse constante, movimentos repetitivos, problemas de postura e/ou sobrecargas nunca foi tão simples. Com uma busca <span className="text-brand-blue font-bold">"massagista perto de mim"</span>, você encontrará o que precisa sem muitos esforços.
                                </p>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    E é importante se cuidar. Afinal, esses hábitos, se não forem tratados, podem ser bem prejudiciais, provocando doenças e mal-estar corporal em geral a longo prazo.
                                </p>
                            </div>

                            {/* Benefits */}
                            <div className="space-y-8">
                                <h2 className="text-2xl font-black text-brand-darkBlue uppercase tracking-tight leading-tight">Quais são os benefícios de contar com um massagista perto de mim?</h2>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    Pensando nessas dores e evitando algumas doenças e mal-estar, a massagem relaxante torna-se uma ferramenta que auxilia em seu bem-estar. Através dela, é possível subir a temperatura na região a ser tratada, aumentando o fluxo sanguíneo, eliminando as células mortas, aumentando a elasticidade e a capacidade de contração muscular. E essa combinação reduz a tensão produzida pelos nervos e combatendo a insônia.
                                </p>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    O alívio e conforto nas regiões mais afetadas, como a coluna, zona lombar, pernas, são provenientes das diferentes manobras, técnicas e pressões específicas realizadas durante essa massagem.
                                </p>
                                <p className="text-brand-darkBlue font-black uppercase text-sm">A massagem é altamente benéfica, já que:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        "Melhora a mobilidade e a elasticidade do músculo tensionado;",
                                        "Diminui a fadiga física;",
                                        "Previne doenças musculares decorrentes de uma má postura corporal;",
                                        "Libera endorfinas, contribuindo para um estado prazeroso (bem-estar);",
                                        "Aumenta a circulação sanguínea, melhorando a oxigenação muscular;",
                                        "Melhora o sistema nervoso"
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-600">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Service Types */}
                            <div className="space-y-6">
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    Ao procurar por um serviço de massagem próximo a sua residência, você escolhe pela flexibilidade. Isso porque você pode escolher qual local é melhor para sua necessidade. Seja em seu domicílio, escritório, centro de massagem ou outro local de sua preferência. Basta informar o horário que melhor se encaixa em sua agenda. Os massagistas irão se adequar às suas exigências e disponibilizarão todos os produtos para que sua massagem seja extremamente prazerosa.
                                </p>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    A maioria dos massagistas registrados possuem sua maca, óleos relaxantes de diferentes aromas, assim como música ambiente para fazer com que os seus clientes tenham uma ótima experiência. O objetivo dessa massagem, como o nome já diz, é relaxar.
                                </p>
                                <p className="text-brand-darkBlue font-black uppercase text-sm">Existem também outros tipos que vão além do relaxamento. Contamos profissionais perto de você com muita experiência para realizar:</p>
                                <ul className="space-y-4 pt-2">
                                    <li className="flex gap-4">
                                        <div className="w-2 h-2 bg-brand-blue rounded-full mt-2 shrink-0"></div>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            <span className="font-black text-brand-darkBlue uppercase">Massagem Linfática:</span> ótima para redução da gordura localizada, diminuir o inchaço corporal e até emagrecer de alguma forma, pois auxilia na eliminação do excesso de líquidos e toxinas do organismo, como por exemplo a celulite;
                                        </p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-2 h-2 bg-brand-blue rounded-full mt-2 shrink-0"></div>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            <span className="font-black text-brand-darkBlue uppercase">Shiatsu:</span> de origem chinesa, busca equilibrar os pontos dos meridianos. Ou seja, balancear os canais energéticos que percorrem o corpo. Além de trazer bem-estar, ajuda a combater a insônia e a ansiedade;
                                        </p>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-2 h-2 bg-brand-blue rounded-full mt-2 shrink-0"></div>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            <span className="font-black text-brand-darkBlue uppercase">Ayurvédica:</span> estimula os músculos e a circulação do sangue, liberando as toxinas presas neles e nos tecidos.
                                        </p>
                                    </li>
                                </ul>
                            </div>

                            {/* How to Find */}
                            <div className="bg-brand-darkBlue p-8 md:p-12 rounded-[3rem] text-white space-y-8 shadow-2xl">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Como posso encontrar os melhores massagistas perto de mim</h2>
                                <div className="space-y-6 text-blue-100 font-medium">
                                    <p className="leading-relaxed">
                                        Se você está buscando por massagistas, a <span className="text-brand-orange font-black italic">Samej</span> é o local perfeito para encontrá-los. Aqui, você recebe até 4 orçamentos de diferentes massagistas gratuitamente e sem compromisso algum! Você ainda terá acesso a seus perfis profissionais para conhecê-los melhor e conferir as avaliações dos clientes anteriores. Tudo isso para que você possa escolher o melhor massagista.
                                    </p>
                                    <p className="leading-relaxed">
                                        Com a <span className="text-brand-orange font-black italic">Samej</span>, ficou muito mais fácil encontrar massagistas perto de mim.
                                    </p>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-white/10">
                                    <p className="text-brand-orange font-black uppercase tracking-widest text-sm">Como funciona?</p>
                                    <ul className="space-y-6">
                                        {[
                                            "Explique sua solicitação de orçamento para o serviço de Massagista.",
                                            "Centenas de profissionais de Massagista localizados em sua cidade e arredores vão receber um aviso com sua solicitação e os que tiverem interesse entrarão em contato com você, lhe oferecendo um orçamento e tarifas personalizadas para Massagista.",
                                            "Pode ver as avaliações de outros clientes assim como o perfil de cada profissional para poder comparar os orçamentos e tomar a melhor decisão."
                                        ].map((stepText, i) => (
                                            <li key={i} className="flex gap-4 items-start">
                                                <div className="w-6 h-6 bg-brand-orange text-white rounded-full flex items-center justify-center shrink-0 text-xs font-black shadow-lg shadow-orange-500/20">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm text-blue-100 font-medium leading-relaxed">{stepText}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    if (slug === 'psicologos') {
        const service = serviceMap[slug || ''];
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-6xl font-black text-brand-darkBlue tracking-tighter leading-none">
                                    Precisando de Psicólogo?
                                </h1>
                                <p className="text-lg text-gray-500 font-bold max-w-2xl leading-relaxed">
                                    Milhares de profissionais avaliados por clientes, permitindo você negociar apenas com os melhores.
                                </p>
                                <div className="flex flex-wrap gap-8 pt-4">
                                    <div className="flex items-center gap-3 text-brand-blue font-black text-sm uppercase tracking-tighter">
                                        <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        Até 4 orçamentos grátis e seguros
                                    </div>
                                    <div className="flex items-center gap-3 text-brand-blue font-black text-sm uppercase tracking-tighter">
                                        <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center">
                                            <Star className="w-4 h-4 fill-current" />
                                        </div>
                                        Profissionais avaliados
                                    </div>
                                    <div className="flex items-center gap-3 text-brand-red font-black text-sm uppercase tracking-tighter">
                                        <div className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center">
                                            <div className="w-0 h-0 border-t-4 border-t-transparent border-l-[8px] border-l-brand-red border-b-4 border-b-transparent ml-1"></div>
                                        </div>
                                        Como funciona a Samej?
                                    </div>
                                </div>
                            </div>

                            {/* Form Card */}
                            <div className="bg-[#FFEB3B] p-4 md:p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                                <div className="bg-white p-6 md:p-12 rounded-[2.5rem] relative z-10 shadow-xl">
                                    {submitted ? (
                                        <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Pedido Enviado!</h3>
                                            <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed max-w-md">
                                                Excelente! Sua solicitação para <span className="text-brand-blue">{serviceMap[slug || '']?.title}</span> foi enviada com sucesso.
                                            </p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-brand-lightOrange transition-all uppercase tracking-tight"
                                            >
                                                VOLTAR PARA O INÍCIO
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {step > 1 && (
                                                <button onClick={() => setStep(step - 1)} className="mb-6 flex items-center text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest">
                                                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                                                </button>
                                            )}

                                            {step === 1 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Qual serviço de Psicólogo está precisando?</h3>
                                                    <div className="relative mb-6">
                                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            placeholder="O que você precisa?"
                                                            className="w-full pl-14 pr-6 py-4 rounded-xl border-2 border-gray-100 outline-none focus:border-brand-blue/50 text-gray-600 font-medium"
                                                        />
                                                        {searchTerm && (
                                                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {['Online', 'Presencial'].filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase())).map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setPsychologistLocation(opt);
                                                                    setStep(2);
                                                                }}
                                                                className="w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left bg-white border-gray-100 hover:border-brand-blue/30 shadow-sm group"
                                                            >
                                                                <span className="text-lg font-bold text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-brand-blue" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 2 ? (
                                                <>
                                                    <div className="relative mb-6">
                                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            placeholder="O que você precisa?"
                                                            className="w-full pl-14 pr-6 py-4 rounded-xl border-2 border-gray-100 outline-none focus:border-brand-blue/50 text-gray-600 font-medium"
                                                        />
                                                        {searchTerm && (
                                                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">{psychologistLocation}</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            "Acompanhamento Terapêutico",
                                                            "Avaliação Psicológica",
                                                            "Orientação Vocacional",
                                                            "Psicanálise",
                                                            "Psicopedagogia",
                                                            "Terapia de Casais",
                                                            "Terapia Familiar",
                                                            "Terapia Individual",
                                                            "Terapia Infantil",
                                                            "Outro"
                                                        ].filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase())).map((opt) => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => {
                                                                    setPsychologyServiceType(opt);
                                                                    setSearchTerm('');
                                                                    setStep(3);
                                                                }}
                                                                className="w-full flex items-center justify-between p-6 rounded-xl border-2 transition-all text-left bg-white border-gray-100 hover:border-brand-blue/30 shadow-sm group"
                                                            >
                                                                <span className="text-lg font-bold text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-brand-blue" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 3 ? (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <h3 className="text-2xl font-black text-brand-darkBlue mb-4 uppercase">Informe seu CEP</h3>
                                                        <p className="text-center text-gray-500 font-bold mb-10">Utilizamos o CEP para identificar a disponibilidade de profissionais na região.</p>
                                                    </div>
                                                    <div className="max-w-2xl mx-auto space-y-6">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={cep}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                    setCep(val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val);
                                                                }}
                                                                className="w-full p-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 shadow-sm"
                                                                placeholder="00000-000"
                                                                maxLength={9}
                                                            />
                                                            {loadingCep && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>}
                                                        </div>
                                                        {address && (
                                                            <div className="bg-blue-50 p-4 rounded-2xl text-center space-y-1 animate-in fade-in slide-in-from-top-2">
                                                                <p className="text-xs font-black text-brand-blue uppercase tracking-wide">Endereço Encontrado</p>
                                                                <p className="text-sm font-bold text-gray-700">{address}</p>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => setStep(4)}
                                                            disabled={cep.replace(/\D/g, '').length !== 8}
                                                            className={`w-full py-6 rounded-3xl font-black text-xl transition-all ${cep.replace(/\D/g, '').length === 8 ? 'bg-brand-darkBlue text-white shadow-2xl' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            PRÓXIMO
                                                        </button>
                                                    </div>
                                                </>
                                            ) : step === 4 ? (
                                                <>
                                                    <div className="max-w-2xl mx-auto py-4">
                                                        <h3 className="text-3xl font-black text-brand-darkBlue mb-12 text-center">Dados de Contato</h3>
                                                        <div className="space-y-6 mb-12">
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <User className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={userName}
                                                                    onChange={(e) => setUserName(e.target.value.toUpperCase())}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm uppercase"
                                                                    placeholder="SEU NOME COMPLETO"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                                <input
                                                                    type="tel"
                                                                    value={userPhone}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                        let masked = raw;
                                                                        if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                                                                        if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                                                                        setUserPhone(masked);
                                                                    }}
                                                                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 placeholder:text-gray-400 text-sm transition-all shadow-sm"
                                                                    placeholder="(DDD) + NÚMERO DO TELEFONE"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleSubmitOrder}
                                                            disabled={isSubmitting || !userName || userPhone.replace(/\D/g, '').length !== 11}
                                                            className={`w-full py-6 rounded-[2.5rem] font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-2xl ${userName && userPhone.replace(/\D/g, '').length === 11 && !isSubmitting ? 'bg-brand-darkBlue text-white hover:scale-[1.02]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <>ENVIAR PEDIDO<ChevronRight className="w-5 h-5" /></>}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                    <div className="mt-8 bg-green-50/50 py-3 px-6 rounded-lg text-center">
                                        <p className="text-green-600 font-bold text-sm">
                                            Você receberá orçamentos em breve
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl">
                                <img src={service?.bg} alt={service?.title} className="w-full h-auto group-hover:scale-110 transition-transform duration-700" />
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5">
                                <div className="text-center mb-6">
                                    <div className="text-4xl font-black text-brand-darkBlue mb-2">4.94<span className="text-xl text-gray-400">/5</span></div>
                                    <div className="flex justify-center gap-1 text-amber-400 mb-2">
                                        {[1, 2, 3, 4].map(s => <Star key={s} className="w-5 h-5 fill-current" />)}
                                        <Star className="w-5 h-5 fill-current text-gray-200" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400">172 clientes avaliaram nossos profissionais</p>
                                </div>
                                <p className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter mb-6">Avaliações de quem contratou</p>
                                <div className="space-y-6">
                                    {[
                                        {
                                            client: "Marceli Faria",
                                            text: "Fui muito bem atendida e recebi um serviço de excelente qualidade. O orçamento é gratuito e o valor é acessível. Agradeço pelo atendimento!",
                                            pro: "Antônio Santos"
                                        },
                                        {
                                            client: "Paulo Roberto",
                                            text: "Excelentes profissionais, rápidos, honestos e com bom preços. Recomendo muito",
                                            pro: "Vanessa Silva"
                                        },
                                        {
                                            client: "Fernando Souza",
                                            text: "O profissional é excelente, atendeu com rapidez, atenção e solucionou o problema. Recomendo!",
                                            pro: "Adriana Prado"
                                        }
                                    ].map((review, i) => (
                                        <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-md shadow-blue-500/5 space-y-4">
                                            <div>
                                                <p className="text-xs font-black text-gray-900">{review.client} <span className="text-gray-400 font-bold">avaliou:</span></p>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed italic mt-2">
                                                    "{review.text}"
                                                </p>
                                            </div>
                                            <div className="flex text-amber-500 gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-current" />)}
                                            </div>
                                            <div className="text-[9px] font-bold text-gray-400 uppercase">
                                                para <span className="text-brand-blue">{review.pro}</span> / Psicólogo
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }



    if (slug === 'diarista') {
        const faqs = [
            {
                q: "O que está incluso em uma limpeza padrão?",
                a: "A limpeza padrão foca na manutenção do ambiente, incluindo varrer e passar pano nos pisos, limpeza externa de móveis, higienização básica de banheiros e cozinha, e retirada de lixos."
            },
            {
                q: "A diarista traz os produtos de limpeza?",
                a: "Depende da sua escolha no formulário. Você pode optar por fornecer os materiais (mais econômico) ou solicitar que o profissional já traga todo o kit necessário para o serviço."
            },
            {
                q: "Como funciona a garantia do serviço?",
                a: "A Samej preza pela qualidade total. Caso algo não saia como o esperado, você deve reportar em até 24h para que possamos mediar a situação junto ao profissional."
            }
        ];

        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center text-xs font-bold text-gray-400 gap-2 mb-8 uppercase tracking-widest">
                        <Link to="/" className="hover:text-brand-orange transition-colors">Samej</Link>
                        <span>›</span>
                        <span>Serviços Domésticos</span>
                        <span>›</span>
                        <span className="text-gray-900">Diarista</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-8 space-y-10">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-6xl font-black text-brand-darkBlue tracking-tighter leading-none">
                                    Precisando de Diarista?
                                </h1>
                                <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed">
                                    Milhares de profissionais avaliados por clientes, permitindo você negociar apenas com os melhores.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-brand-blue font-bold">
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Até 4 orçamentos grátis e seguros</span>
                                </div>
                                <div className="flex items-center gap-3 text-amber-500 font-bold">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span>Profissionais avaliados</span>
                                </div>
                                <div className="flex items-center gap-3 text-red-500 font-bold">
                                    <Zap className="w-5 h-5" />
                                    <span>Como funciona o Samej?</span>
                                </div>
                            </div>

                            <div className="bg-[#FFD700] p-1 rounded-[2rem] shadow-xl overflow-hidden">
                                <div className="bg-white p-8 md:p-12 rounded-[1.8rem] relative min-h-[400px]">
                                    {submitted ? (
                                        <div className="flex flex-col items-center justify-center text-center py-12">
                                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-4xl font-black text-brand-darkBlue mb-4 uppercase tracking-tighter">Pedido Enviado!</h3>
                                            <p className="text-lg text-gray-500 font-bold mb-10 leading-relaxed max-w-md">
                                                Excelente! Sua solicitação para <span className="text-brand-blue">Diarista</span> foi enviada.
                                            </p>
                                            <Link to="/" className="w-full bg-brand-orange text-white py-6 rounded-2xl font-black text-xl shadow-xl uppercase tracking-tight text-center block">VOLTAR PARA O INÍCIO</Link>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mb-10 overflow-hidden relative">
                                                <div className="bg-brand-blue h-full transition-all duration-500" style={{ width: `${(step / 12) * 100}%` }}></div>
                                            </div>

                                            {step > 1 && (
                                                <button onClick={() => setStep(step - 1)} className="mb-6 flex items-center text-xs font-bold text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest">
                                                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                                                </button>
                                            )}

                                            {step === 1 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Qual serviço de Diarista está precisando?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto">
                                                        <div className="relative group mb-6">
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                                <Search className="w-5 h-5 text-brand-blue" />
                                                            </div>
                                                            <input type="text" placeholder="O que você precisa?" className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-100 rounded-xl focus:border-brand-blue outline-none font-medium text-gray-400 text-sm transition-all" />
                                                        </div>
                                                        {['Limpeza Comercial', 'Limpeza Padrão', 'Limpeza Pesada', 'Limpeza Pré Mudança', 'Limpeza Pós-Obra', 'Outros'].map((opt) => (
                                                            <button key={opt} onClick={() => { setCleaningType(opt); setStep(2); }} className="w-full flex items-center justify-between p-6 rounded-xl border-2 border-gray-100 shadow-xl shadow-blue-500/5 hover:-translate-y-2 transition-all text-left group">
                                                                <span className="text-base font-medium text-gray-600 group-hover:text-brand-darkBlue uppercase">{opt}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 2 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Qual é o local do serviço?</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                                        {['Apartamento', 'Casa', 'Comercial/escritório', 'Condomínio (área comum)', 'Outro'].map((opt) => (
                                                            <button key={opt} onClick={() => { setCleaningLocation(opt); setStep(3); }} className={`p-6 rounded-xl border-2 transition-all font-bold uppercase text-sm ${cleaningLocation === opt ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-50 hover:border-gray-200 text-gray-600 shadow-lg'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 3 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Quantos quartos o imóvel possui?</h3>
                                                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                                                        {['1 quarto', '2 quartos', '3 quartos', '4 ou mais quartos', 'Não possui quartos'].map((opt) => (
                                                            <button key={opt} onClick={() => { setNumBedrooms(opt); setStep(4); }} className={`p-6 rounded-xl border-2 transition-all font-bold uppercase text-sm text-left ${numBedrooms === opt ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-50 hover:border-brand-blue/20 text-gray-600 shadow-xl'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 4 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Quantos banheiros o imóvel possui?</h3>
                                                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                                                        {['1 banheiro', '2 banheiros', '3 banheiros', '4 ou mais banheiros'].map((opt) => (
                                                            <button key={opt} onClick={() => { setNumBathrooms(opt); setStep(5); }} className={`p-6 rounded-xl border-2 transition-all font-bold uppercase text-sm text-left ${numBathrooms === opt ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-50 hover:border-brand-blue/20 text-gray-600 shadow-xl'}`}>{opt}</button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 5 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Você precisa de serviços adicionais?</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-10">
                                                        {['Áreas externas', 'Armários', 'Cozinhar', 'Cuidar de crianças', 'Geladeira', 'Janelas', 'Lavagem de roupas', 'Passar roupas', 'Não preciso'].map((opt) => (
                                                            <label key={opt} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${extraServices.includes(opt) ? 'border-brand-blue bg-blue-50/30' : 'border-gray-50 bg-white'}`}>
                                                                <input type="checkbox" checked={extraServices.includes(opt)} onChange={() => {
                                                                    const newArr = extraServices.includes(opt) ? extraServices.filter(s => s !== opt) : [...extraServices, opt];
                                                                    setExtraServices(newArr);
                                                                }} className="w-5 h-5 rounded border-gray-300 text-brand-blue" />
                                                                <span className="text-sm font-bold text-gray-600 uppercase">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setStep(6)} disabled={extraServices.length === 0} className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${extraServices.length > 0 ? 'bg-brand-darkBlue text-white shadow-2xl' : 'bg-gray-100 text-gray-400'}`}>PRÓXIMO</button>
                                                </>
                                            ) : step === 6 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Há crianças ou animais de estimação no imóvel?</h3>
                                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                                        {['Animal de estimação', 'Criança', 'Não há'].map((opt) => (
                                                            <label key={opt} className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer ${hasChildrenPets.includes(opt) ? 'border-brand-blue bg-blue-50/30' : 'border-gray-50 bg-white shadow-md'}`}>
                                                                <input type="checkbox" checked={hasChildrenPets.includes(opt)} onChange={() => {
                                                                    const newArr = hasChildrenPets.includes(opt) ? hasChildrenPets.filter(s => s !== opt) : [...hasChildrenPets, opt];
                                                                    setHasChildrenPets(newArr);
                                                                }} className="w-5 h-5 rounded border-gray-300 text-brand-blue" />
                                                                <span className="text-base font-bold text-gray-600 uppercase">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setStep(7)} disabled={hasChildrenPets.length === 0} className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${hasChildrenPets.length > 0 ? 'bg-brand-darkBlue text-white shadow-2xl' : 'bg-gray-100 text-gray-400'}`}>PRÓXIMO</button>
                                                </>
                                            ) : step === 7 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Qual é a frequência do serviço?</h3>
                                                    <div className="max-w-2xl mx-auto mb-10">
                                                        <select value={cleaningFrequency} onChange={(e) => setCleaningFrequency(e.target.value)} className="w-full p-6 bg-white border-2 border-gray-100 rounded-xl outline-none focus:border-brand-blue font-bold text-gray-700 shadow-inner">
                                                            <option value="">Selecione uma opção</option>
                                                            <option value="Uma única vez">Uma única vez</option>
                                                            <option value="Diário">Diário</option>
                                                            <option value="Uma vez por semana">Uma vez por semana</option>
                                                            <option value="Duas vezes por semana">Duas vezes por semana</option>
                                                            <option value="Quinzenal">Quinzenal</option>
                                                            <option value="3 vezes na semana (mensalista)">3 vezes na semana (mensalista)</option>
                                                        </select>
                                                    </div>
                                                    <button onClick={() => setStep(8)} disabled={!cleaningFrequency} className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${cleaningFrequency ? 'bg-brand-darkBlue text-white shadow-2xl' : 'bg-gray-100 text-gray-400'}`}>PRÓXIMO</button>
                                                </>
                                            ) : step === 8 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Para quando você precisa deste serviço?</h3>
                                                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            { id: 'urgente', label: 'Urgente (o quanto antes possível)' },
                                                            { id: '7_dias', label: 'Nos próximos 7 dias' },
                                                            { id: '15_dias', label: 'Nos próximos 15 dias' },
                                                            { id: 'sem_data', label: 'Não tenho data definida' }
                                                        ].map((opt) => (
                                                            <button key={opt.id} onClick={() => { setCleaningTimeframe(opt.label); setStep(9); }} className={`p-6 rounded-xl border-2 transition-all font-bold uppercase text-sm text-left ${cleaningTimeframe === opt.label ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-50 hover:border-gray-200 text-gray-600 shadow-md'}`}>{opt.label}</button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 9 ? (
                                                <>
                                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase">Você já possui o material de limpeza?</h3>
                                                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto mb-10">
                                                        {[
                                                            { id: 'sim', label: 'Sim, possuo os materiais' },
                                                            { id: 'nao', label: 'Não, preciso que o profissional traga o material' }
                                                        ].map((opt) => (
                                                            <button key={opt.id} onClick={() => { setMaterialIncluded(opt.label); setStep(10); }} className={`p-6 rounded-xl border-2 transition-all font-bold uppercase text-sm text-left ${materialIncluded === opt.label ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-50 hover:border-gray-200 text-gray-600 shadow-md'}`}>{opt.label}</button>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : step === 10 ? (
                                                <>
                                                    <h3 className="text-2xl font-black text-brand-darkBlue mb-4 text-center uppercase">Explique o que você precisa</h3>
                                                    <p className="text-center text-gray-500 font-bold mb-8">Receba até 4 orçamentos grátis, online!</p>
                                                    <div className="max-w-2xl mx-auto mb-6">
                                                        <textarea value={orderDetails} onChange={(e) => setOrderDetails(e.target.value)} className="w-full p-8 bg-gray-50 border-2 border-transparent rounded-[2.5rem] font-bold outline-none focus:border-brand-blue focus:bg-white transition-all min-h-[150px] resize-none shadow-inner" placeholder='Traga todos os detalhes do seu pedido. Tente "Preciso de ..."'></textarea>
                                                        <div className="bg-amber-50 rounded-2xl p-4 mt-4 text-amber-800 text-xs font-bold flex items-center gap-3">
                                                            <span className="text-xl">👆</span> Quanto mais informações você fornecer, melhor será o seu pedido!
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setStep(11)} className="w-full py-6 rounded-3xl bg-brand-darkBlue text-white font-black text-xl shadow-2xl transition-all">PRÓXIMO PASSO</button>
                                                </>
                                            ) : step === 11 ? (
                                                <>
                                                    <h3 className="text-2xl font-black text-brand-darkBlue mb-4 text-center uppercase">Informe seu CEP</h3>
                                                    <p className="text-center text-gray-500 font-bold mb-10">Utilizamos o CEP para identificar a disponibilidade de profissionais na região.</p>
                                                    <div className="max-w-2xl mx-auto space-y-6">
                                                        <div className="relative">
                                                            <input type="text" value={cep} onChange={(e) => {
                                                                const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                setCep(val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val);
                                                            }} className="w-full p-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 shadow-sm" placeholder="00000-000" />
                                                            {loadingCep && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>}
                                                        </div>
                                                        {address && <p className="text-sm font-bold text-gray-400 text-center">{address}</p>}
                                                        <button onClick={() => setStep(12)} disabled={cep.replace(/\D/g, '').length !== 8} className={`w-full py-6 rounded-3xl font-black text-xl transition-all ${cep.replace(/\D/g, '').length === 8 ? 'bg-brand-darkBlue text-white shadow-2xl' : 'bg-gray-100 text-gray-400'}`}>PRÓXIMO</button>
                                                    </div>
                                                </>
                                            ) : step === 12 ? (
                                                <>
                                                    <h3 className="text-3xl font-black text-brand-darkBlue mb-12 text-center">Dados de Contato</h3>
                                                    <div className="space-y-6 mb-12 max-w-2xl mx-auto">
                                                        <div className="relative">
                                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value.toUpperCase())} className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 uppercase shadow-sm" placeholder="SEU NOME COMPLETO" />
                                                        </div>
                                                        <div className="relative">
                                                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                            <input type="tel" value={userPhone} onChange={(e) => {
                                                                const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                                let masked = raw;
                                                                if (raw.length > 2) masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                                                                if (raw.length > 7) masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                                                                setUserPhone(masked);
                                                            }} className="w-full pl-16 pr-6 py-6 bg-gray-50 border-0 rounded-3xl outline-none focus:ring-2 focus:ring-brand-blue font-bold text-gray-600 shadow-sm" placeholder="(DDD) + NÚMERO DO TELEFONE" />
                                                        </div>
                                                    </div>
                                                    <button onClick={handleSubmitOrder} disabled={isSubmitting || !userName || userPhone.replace(/\D/g, '').length !== 11} className={`w-full py-6 rounded-[2.5rem] font-bold text-xl flex items-center justify-center gap-3 transition-all ${userName && userPhone.replace(/\D/g, '').length === 11 && !isSubmitting ? 'bg-brand-darkBlue text-white shadow-2xl' : 'bg-gray-100 text-gray-400'}`}>
                                                        {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <>ENVIAR PEDIDO <ChevronRight className="w-5 h-5" /></>}
                                                    </button>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                    <div className="mt-8 bg-green-50/50 py-3 px-6 rounded-lg text-center">
                                        <p className="text-green-600 font-bold text-sm">Você receberá orçamentos em breve</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <div className="relative group">
                                <img src={service.bg} alt={service.title} className="w-full h-auto rounded-[3rem] shadow-2xl" />
                            </div>

                            <div className="pt-12 space-y-6">
                                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5">
                                    <p className="text-sm font-black text-brand-darkBlue uppercase tracking-tighter mb-6">Avaliações de quem contratou</p>
                                    <div className="space-y-6">
                                        {[
                                            { client: "Daniela Cavalcanti", pro: "Antônio Santos", text: "Fui muito bem atendida e recebi um serviço de excelente qualidade. O orçamento é gratuito e o valor é acessível. Agradeço pelo atendimento!" },
                                            { client: "Fernando Mendes", pro: "Manoel Oliveira", text: "Profissional pontual e muito detalhista na limpeza. Recomendo para limpezas pesadas de apartamento." }
                                        ].map((review, i) => (
                                            <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-md space-y-4">
                                                <p className="text-xs font-black text-gray-900">{review.client} <span className="text-gray-400 font-bold">avaliou:</span></p>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed italic mt-2">"{review.text}"</p>
                                                <div className="flex text-amber-500 gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-400">para <span className="text-brand-blue">{review.pro}</span> / Diarista</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional CTA Section for Diarista */}
                    <section className="py-20 mt-12">
                        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                            <h2 className="text-3xl md:text-4xl font-black text-brand-darkBlue">Você é Diarista ou Faxineira?</h2>
                            <p className="text-gray-500 font-bold max-w-2xl mx-auto">
                                A Samej recebe milhares de pedidos por mês e pode ajudar a aumentar sua renda
                            </p>
                            <button
                                onClick={() => navigate('/auth?tab=register&role=professional')}
                                className="bg-brand-blue text-white px-12 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all uppercase tracking-tight"
                            >
                                Quero me cadastrar
                            </button>
                        </div>
                    </section>

                    <section className="py-24 border-t border-gray-100 mt-20">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tighter mb-4">Veja pedidos similares para Diarista</h2>
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">Esses são os últimos pedidos de limpeza atendidos</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { client: "Carla", text: "Limpeza pós-obra em apartamento de 3 quartos. Preciso de remoção de resíduos de pintura e cimento...", img: "/images/carla.jpg" },
                                { client: "Marcos", text: "Limpeza pesada para casa de veraneio que ficou fechada por 6 meses. Inclui janelas e armários...", img: "/images/Marcos1.jpg" },
                                { client: "Luciana", text: "Diarista para limpeza padrão semanal em escritório comercial. Higienização de mesas e banheiros...", img: "/images/Luciana.jpg" },
                                { client: "Eduardo", text: "Limpeza pré-mudança. Apartamento vazio pronto para morar, foco em banheiros e cozinha...", img: "/images/Eduardo.jpg" }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-[2rem] border-2 border-gray-100 shadow-xl shadow-blue-500/5 hover:border-brand-blue/30 transition-all flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-50 flex items-center justify-center bg-gray-50">
                                            <img src={item.img} alt={item.client} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 text-sm">{item.client}</div>
                                            <div className="text-[10px] text-gray-400 font-bold">Residência</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed italic mb-6 flex-grow">"{item.text}"</p>
                                    <div className="flex items-center gap-2 py-2 px-4 bg-green-50 rounded-full w-fit">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        <span className="text-[9px] font-black text-green-700 uppercase">Pedido atendido</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="py-24 bg-gray-50 rounded-[4rem] px-8 mb-20">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-black text-brand-darkBlue mb-12 text-center uppercase tracking-tighter">Perguntas Frequentes</h2>
                            <div className="space-y-4">
                                {faqs.map((faq, i) => (
                                    <details key={i} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm open:shadow-xl transition-all">
                                        <summary className="list-none flex justify-between items-center cursor-pointer font-black text-brand-darkBlue">
                                            {faq.q}
                                            <ChevronRight className="w-5 h-5 group-open:rotate-90 transition-transform text-brand-blue" />
                                        </summary>
                                        <p className="mt-4 text-gray-500 font-medium text-sm leading-relaxed border-t border-gray-50 pt-4">{faq.a}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Benefits Section */}
            <section className="py-24 max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tighter">Por que contratar pelo Samej?</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-brand-blue">
                            <Users className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight">Grátis e sem compromisso</h4>
                        <p className="text-sm text-gray-500 font-bold">Receba orçamentos de profissionais qualificados sem pagar nada por isso.</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-brand-orange">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight">Compare Preços</h4>
                        <p className="text-sm text-gray-500 font-bold">Compare orçamentos e escolha o melhor custo-benefício para você.</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-50 rounded-[1.5rem] flex items-center justify-center text-green-500">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight">Contrate com Confiança</h4>
                        <p className="text-sm text-gray-500 font-bold">Veja avaliações de outros clientes e contrate os melhores profissionais.</p>
                    </div>
                </div>
            </section>

            {/* Professionals List */}
            <section className="py-24 bg-brand-bg/30">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tighter">
                                {service?.title} disponíveis
                            </h2>
                            <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-widest">Encontramos {pros.length} especialistas perto de você</p>
                        </div>
                        <Link
                            to="/pedir-orcamento"
                            className="text-brand-orange font-black uppercase text-xs tracking-[0.2em] flex items-center hover:translate-x-2 transition-all"
                        >
                            Ver todos os profissionais <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white h-[400px] rounded-[3rem] animate-pulse"></div>
                            ))
                        ) : pros.length > 0 ? (
                            pros.map(pro => (
                                <div
                                    key={pro.id}
                                    className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-blue-500/5 hover:-translate-y-2 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-50 bg-gray-50">
                                                {pro.avatar ? (
                                                    <img src={pro.avatar} alt={pro.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Users className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 uppercase tracking-tight">{pro.name}</h4>
                                                <div className="flex items-center text-amber-500 gap-1 mt-1">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span className="text-xs font-black">{pro.rating?.toFixed(1) || 'N/A'}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold ml-1">({pro.completedJobs || 0} serviços)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-gray-500 text-xs font-bold mb-4">
                                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-brand-blue" />
                                            {pro.location}
                                        </div>

                                        <p className="text-xs text-gray-500 line-clamp-3 mb-6 font-medium leading-relaxed italic">
                                            "{pro.bio || 'Profissional especializado pronto para atender suas necessidades com excelência e qualidade.'}"
                                        </p>
                                    </div>

                                    <Link
                                        to="/pedir-orcamento"
                                        className="w-full bg-brand-darkBlue text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-center hover:bg-brand-blue transition-all"
                                    >
                                        Pedir Orçamento
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 bg-white/50 border-2 border-dashed border-gray-200 rounded-[3rem] text-center">
                                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <h3 className="font-black text-gray-400 uppercase tracking-tight">Nenhum profissional encontrado</h3>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer Quote CTA */}
            <section className="bg-brand-darkBlue py-20 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                        Contrate os melhores <span className="text-brand-orange">{service?.title}</span> agora!
                    </h2>
                    <p className="text-blue-100/70 text-lg font-medium">
                        É rápido, fácil e totalmente gratuito. Economize tempo e dinheiro com profissionais avaliados.
                    </p>
                    <div className="pt-4 flex flex-col md:flex-row items-center justify-center gap-6">
                        <Link
                            to="/pedir-orcamento"
                            className="bg-brand-orange text-white px-10 py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Pedir Orçamento Grátis
                        </Link>
                        <div className="flex items-center gap-4 text-white/50 text-sm font-bold uppercase tracking-widest">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 border-4 border-brand-darkBlue bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <span>+10k Clientes satisfeitos</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ServicePage;
