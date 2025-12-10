import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const pagePermissions = {
  public: true,
  loginRequired: false,
};

const sections = [
  {
    title: "Coleta de Dados",
    content:
      "Coletamos apenas as informações necessárias para cadastrar usuários, operar pedidos e oferecer suporte. Todo dado é tratado conforme a LGPD e pode ser removido mediante solicitação.",
  },
  {
    title: "Uso das Informações",
    content:
      "Usamos seus dados para personalizar a experiência, emitir notas fiscais, prevenir fraudes e manter o marketplace seguro. Não vendemos informações para terceiros.",
  },
  {
    title: "Segurança e Armazenamento",
    content:
      "Aplicamos criptografia, monitoramento contínuo e backups redundantes. Os acessos são auditados e concedidos somente a equipes autorizadas.",
  },
  {
    title: "Seus Direitos",
    content:
      "Você pode solicitar acesso, correção ou exclusão dos dados enviando um e-mail para suporte@nativo.com. Respondemos em até 72 horas úteis.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold">
            Política de Privacidade e Segurança
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Protegemos seus dados em todas as etapas</h1>
          <p className="text-gray-600 mt-3">
            Esta política descreve como coletamos, utilizamos e armazenamos informações dentro do NATIVO Marketplace.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.title} className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                <p className="text-gray-600 mt-3 leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Canal de Privacidade</h3>
          <p className="text-gray-600 mt-2">
            Qualquer dúvida sobre segurança e LGPD pode ser enviada para{" "}
            <a href="mailto:privacidade@nativo.com" className="text-blue-600 font-semibold">
              privacidade@nativo.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

