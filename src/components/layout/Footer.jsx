import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Shield, HelpCircle, FileText } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function Footer({ primaryColor = "#2563eb", secondaryColor = "#06b6d4" }) {
  const quickLinks = [
    { label: "Política de Privacidade", icon: Shield, href: createPageUrl("PrivacyPolicy") },
    { label: "Termos de Uso", icon: FileText, href: createPageUrl("TermsConditions") },
    { label: "Ajuda / FAQ", icon: HelpCircle, href: createPageUrl("HelpFAQ") },
  ];

  return (
    <footer className="bg-gray-100 text-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-2xl font-bold tracking-wide text-gray-900">NATIVO</p>
            <p className="mt-3 text-sm text-gray-700">
              O marketplace que aproxima clientes e lojistas locais com tecnologia,
              transparência e segurança.
            </p>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span>Atendimento 100% digital</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <a href="mailto:suporte@nativo.com" className="hover:text-gray-900 transition-colors">
                  suporte@nativo.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600" />
                <span>(11) 4002-8922</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900 mb-4">Documentação Legal</p>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900 mb-4">Ajuda Rápida</p>
            <ul className="space-y-3 text-sm text-gray-700">
              <li>
                <Link to={createPageUrl("HelpFAQ")} className="hover:text-gray-900 transition-colors">
                  Como funcionam as campanhas?
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("HelpFAQ")} className="hover:text-gray-900 transition-colors">
                  Como acompanhar meus pedidos?
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("HelpFAQ")} className="hover:text-gray-900 transition-colors">
                  Sou lojista: como participar?
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900 mb-4">Experiência Segura</p>
            <p className="text-sm text-gray-700">
              Utilizamos criptografia, monitoramento contínuo e processos de segurança
              para proteger seus dados e garantir uma experiência confiável em todas as etapas.
            </p>
            <div className="mt-4 rounded-xl p-4 text-sm bg-gray-200 text-gray-900">
              <p className="font-semibold">Transparência e suporte</p>
              <p>Conte com nossa equipe para esclarecer dúvidas e garantir o sucesso da sua loja.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-300 pt-6 text-sm text-gray-700 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span>&copy; {new Date().getFullYear()} NATIVO. Todos os direitos reservados.</span>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wide text-gray-600">
            <span>Marketplace seguro</span>
            <span>LGPD / GDPR compliant</span>
            <span>Suporte dedicado</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

