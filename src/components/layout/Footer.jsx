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
      <div className="max-w-[95%] 2xl:max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-base sm:text-lg font-bold tracking-wide text-gray-900">NATIVO</p>
            <p className="mt-1.5 text-[11px] sm:text-xs text-gray-700 leading-relaxed">
              O marketplace que aproxima clientes e lojistas locais com tecnologia,
              transparência e segurança.
            </p>
            <div className="mt-2 space-y-1 text-[11px] sm:text-xs text-gray-700">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gray-600" />
                <span>Atendimento 100% digital</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-gray-600" />
                <a href="mailto:suporte@nativo.com" className="hover:text-gray-900 transition-colors">
                  suporte@nativo.com
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-600" />
                <span>(11) 4002-8922</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Documentação Legal</p>
            <ul className="space-y-1.5">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Ajuda Rápida</p>
            <ul className="space-y-1.5 text-[11px] sm:text-xs text-gray-700">
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
            <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Experiência Segura</p>
            <p className="text-[11px] sm:text-xs text-gray-700 leading-relaxed">
              Utilizamos criptografia, monitoramento contínuo e processos de segurança
              para proteger seus dados e garantir uma experiência confiável em todas as etapas.
            </p>
            <div className="mt-2 rounded-lg p-2.5 text-[11px] sm:text-xs bg-gray-200 text-gray-900">
              <p className="font-semibold">Transparência e suporte</p>
              <p className="mt-0.5">Conte com nossa equipe para esclarecer dúvidas e garantir o sucesso da sua loja.</p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-300 pt-3 text-[11px] sm:text-xs text-gray-700 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>&copy; {new Date().getFullYear()} NATIVO. Todos os direitos reservados.</span>
          <div className="flex flex-wrap gap-2.5 text-[10px] sm:text-[11px] uppercase tracking-wide text-gray-600">
            <span>Marketplace seguro</span>
            <span>LGPD / GDPR compliant</span>
            <span>Suporte dedicado</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

