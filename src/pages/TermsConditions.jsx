import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ListRestart } from "lucide-react";

export const pagePermissions = {
  public: true,
  loginRequired: false,
};

const clauses = [
  {
    title: "1. Aceite dos Termos",
    text:
      "Ao criar uma conta ou anunciar produtos, você confirma que leu e concordou com estes termos. Atualizações são comunicadas nos canais oficiais.",
  },
  {
    title: "2. Responsabilidades do Lojista",
    text:
      "Lojistas devem cadastrar informações verdadeiras, manter estoque atualizado e cumprir prazos de entrega. O descumprimento pode suspender o acesso ao marketplace.",
  },
  {
    title: "3. Responsabilidades do Cliente",
    text:
      "Clientes devem utilizar meios de pagamento autorizados e respeitar a política de trocas do lojista. Reclamações devem ser registradas via central de suporte.",
  },
  {
    title: "4. Pagamentos e Segurança",
    text:
      "Transações são processadas com provedores certificados. Podemos solicitar dados adicionais em caso de auditoria antifraude.",
  },
  {
    title: "5. Suspensão e Cancelamento",
    text:
      "Reservamo-nos o direito de suspender contas por uso indevido, violação de direitos ou atividades suspeitas.",
  },
];

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <ListRestart className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase">Termos e Condições de Uso</p>
            <h1 className="text-3xl font-bold text-gray-900">Regras claras para uma experiência justa</h1>
          </div>
        </div>

        <div className="space-y-6">
          {clauses.map((clause) => (
            <Card key={clause.title} className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900">{clause.title}</h2>
                <p className="text-gray-600 mt-3 leading-relaxed">{clause.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-sm text-blue-900">
          <p>
            Em caso de dúvidas sobre estes termos, envie uma mensagem para{" "}
            <a href="mailto:legal@nativo.com" className="font-semibold text-blue-700">
              legal@nativo.com
            </a>{" "}
            ou consulte nossa central de ajuda.
          </p>
        </div>
      </div>
    </div>
  );
}

