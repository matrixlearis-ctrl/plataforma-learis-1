import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
    return (
        <div className="bg-white min-h-screen py-24 px-4">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-flex items-center text-brand-darkBlue font-bold mb-8 hover:text-brand-orange transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Voltar para Home
                </Link>

                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-black text-brand-darkBlue mb-10 text-center uppercase tracking-tight">
                        Termos e Condições Gerais de Uso
                    </h1>

                    <div className="prose prose-blue max-w-none text-gray-600">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">1. Identificação</h2>
                        <p className="mb-6">
                            SAMEJ (“SAMEJ”) é uma plataforma digital de intermediação tecnológica de serviços de construção civil, atualmente operada por pessoa física, com atuação no Rio de Janeiro/RJ, por meio do site e/ou aplicativo SAMEJ (“Plataforma”).
                            <br /><br />
                            Estes Termos e Condições Gerais de Uso (“Termos”) regulam a utilização da Plataforma por todos os usuários, sejam Contratantes (clientes que solicitam orçamentos) ou Profissionais (prestadores de serviços cadastrados), doravante denominados em conjunto “Usuários”.
                            <br /><br />
                            Ao acessar, cadastrar-se ou utilizar a Plataforma, o Usuário declara que leu, compreendeu e concorda integralmente com estes Termos e com a Política de Privacidade do SAMEJ.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">2. Objeto</h2>
                        <p className="mb-6">
                            2.1. A Plataforma SAMEJ tem como finalidade:
                            <br />a) Permitir que Contratantes solicitem orçamentos de serviços de construção civil de forma gratuita;
                            <br />b) Disponibilizar essas solicitações aos Profissionais cadastrados;
                            <br />c) Permitir que os Profissionais utilizem créditos virtuais (“Moedas”) para acessar os dados de contato dos Contratantes;
                            <br />d) Viabilizar o contato direto entre Contratantes e Profissionais, sem qualquer interferência do SAMEJ.
                            <br /><br />
                            2.2. O SAMEJ atua exclusivamente como intermediador tecnológico, não participando de negociações, contratos ou da execução dos serviços.
                            <br /><br />
                            2.3. O SAMEJ não garante a contratação, a execução, o resultado, a qualidade ou o prazo dos serviços negociados entre os Usuários.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">3. Capacidade para Cadastro</h2>
                        <p className="mb-6">
                            3.1. A Plataforma está disponível apenas para pessoas físicas ou jurídicas legalmente capazes, nos termos da legislação brasileira.
                            <br /><br />
                            3.2. É vedado o cadastro de menores de 18 (dezoito) anos.
                            <br /><br />
                            3.3. Cada Usuário poderá manter apenas um único cadastro, vinculado a um telefone e endereço de e-mail válidos.
                            <br /><br />
                            3.4. O SAMEJ poderá suspender ou excluir cadastros que apresentem indícios de fraude, duplicidade ou uso indevido.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">4. Cadastro e Responsabilidades do Usuário</h2>
                        <p className="mb-6">
                            4.1. O Usuário compromete-se a fornecer informações verdadeiras, completas e atualizadas.
                            <br />4.2. O Usuário é o único responsável pela veracidade das informações fornecidas, respondendo civil e criminalmente por dados falsos ou inexatos.
                            <br />4.3. O acesso à conta é pessoal e intransferível, sendo responsabilidade do Usuário manter o sigilo de suas credenciais de acesso.
                            <br />4.4. É proibida a cessão, venda, aluguel ou qualquer forma de transferência da conta a terceiros.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">5. Funcionamento do Modelo de Moedas</h2>
                        <p className="mb-6">
                            5.1. A solicitação de orçamentos pelos Contratantes é gratuita.
                            <br />  5.2. Os Profissionais poderão visualizar solicitações disponíveis e, caso desejem acessar os dados de contato do Contratante, deverão utilizar Moedas.
                            <br />  5.3. Ao utilizar Moedas, o Profissional reconhece que está pagando exclusivamente pelo acesso às informações de contato, não havendo garantia de fechamento de negócio.
                            <br />5.4. O SAMEJ não se responsabiliza por negociações não concluídas, ausência de resposta do Contratante ou informações incorretas fornecidas por este.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">6. Moedas, Pagamentos e Reembolsos</h2>
                        <p className="mb-6">
                            6.1. As Moedas são créditos virtuais, pessoais e intransferíveis, vinculadas exclusivamente à conta do Profissional.
                            <br />6.2. O valor das Moedas e a quantidade exigida para acesso aos contatos poderão variar conforme tipo de serviço, localização e demanda.
                            <br />6.3. As Moedas adquiridas não são convertíveis em dinheiro e não serão reembolsadas, salvo nas hipóteses previstas em lei.
                            <br />6.4. Moedas concedidas de forma promocional ou gratuita não são reembolsáveis em nenhuma hipótese.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">7. Cancelamento e Encerramento de Conta</h2>
                        <p className="mb-6">
                            7.1. O Usuário poderá solicitar o cancelamento de sua conta a qualquer momento.
                            <br />7.2. O cancelamento da conta não gera direito à restituição de Moedas não utilizadas.
                            <br />7.3. O SAMEJ poderá encerrar ou suspender contas que violem estes Termos, sem que isso gere direito a indenização.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">8. Privacidade e Dados Pessoais</h2>
                        <p className="mb-6">
                            8.1. Os dados pessoais dos Usuários serão tratados conforme a Política de Privacidade do SAMEJ e a legislação aplicável, especialmente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">9. Condutas Proibidas</h2>
                        <p className="mb-6">
                            É vedado aos Usuários:
                            <br />a) Utilizar a Plataforma para fins ilícitos;
                            <br />b) Inserir informações falsas ou enganosas;
                            <br />c) Comercializar ou repassar dados obtidos por meio da Plataforma;
                            <br />d) Burlar sistemas de cobrança ou segurança;
                            <br />e) Utilizar indevidamente o nome ou a marca SAMEJ.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">10. Sanções</h2>
                        <p className="mb-6">
                            10.1. O SAMEJ poderá, a seu exclusivo critério, advertir, suspender ou excluir Usuários que violem estes Termos.
                            <br />10.2. Em caso de fraude ou uso indevido, Moedas existentes poderão ser canceladas sem direito a reembolso.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">11. Limitação de Responsabilidade</h2>
                        <p className="mb-6">
                            11.1. O SAMEJ não se responsabiliza por falhas técnicas, indisponibilidade do sistema ou problemas decorrentes da conexão do Usuário.
                            <br />11.2. O SAMEJ não responde por atos, serviços, prejuízos ou obrigações assumidas entre Contratantes e Profissionais.
                            <br />11.3. O Usuário reconhece que negociações realizadas por meio da Plataforma ocorrem por sua conta e risco.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">12. Propriedade Intelectual</h2>
                        <p className="mb-6">
                            12.1. Todos os direitos sobre a Plataforma, incluindo marca, layout, sistemas e conteúdos, pertencem ao SAMEJ, sendo vedado seu uso sem autorização.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">13. Indenização</h2>
                        <p className="mb-6">
                            13.1. O Usuário compromete-se a indenizar o SAMEJ por quaisquer danos, prejuízos ou reclamações decorrentes de sua conduta ou violação destes Termos.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">14. Alterações dos Termos</h2>
                        <p className="mb-6">
                            14.1. O SAMEJ poderá alterar estes Termos a qualquer momento, mediante publicação na Plataforma.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">15. Legislação Aplicável e Foro</h2>
                        <p className="mb-6">
                            15.1. Estes Termos são regidos pelas leis da República Federativa do Brasil.
                            <br />15.2. Fica eleito o foro da Comarca do Rio de Janeiro/RJ, com renúncia de qualquer outro, por mais privilegiado que seja.
                        </p>
                    </div>

                    <div className="mt-12 pt-10 border-t border-gray-100/50 text-center">
                        <p className="text-gray-400 text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;
