import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export const pagePermissions = {
  public: true,
  loginRequired: false,
};

const faqs = [
  {
    question: "Como funciona o NATIVO?",
    answer:
      "O marketplace conecta compradores a lojas locais. O pagamento ocorre pela plataforma e o pedido fica disponível para acompanhamento em tempo real.",
  },
  {
    question: "Como participar de uma campanha?",
    answer:
      "Lojistas podem acessar Perfil > Campanhas, escolher uma campanha ativa e cadastrar produtos com desconto mínimo exigido. A aprovação é realizada pelo time do marketplace.",
  },
  {
    question: "Como abrir um chamado de suporte?",
    answer:
      "Acesse Ajuda > Abrir Chamado, informe o pedido ou produto e descreva o ocorrido. Nossa equipe responde em até 24h úteis.",
  },
  {
    question: "Quais são as formas de pagamento aceitas?",
    answer:
      "Aceitamos cartão de crédito, PIX e boleto via parceiros certificados. Algumas lojas também permitem pagamento na retirada.",
  },
];

export default function HelpFAQ() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="w-10 h-10 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase">Central de Ajuda</p>
            <h1 className="text-3xl font-bold text-gray-900">Perguntas frequentes</h1>
            <p className="text-gray-600 mt-1">Respostas rápidas sobre o funcionamento do marketplace.</p>
          </div>
        </div>

        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-base font-semibold text-gray-900">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="mt-10 text-sm text-gray-600">
          <p>
            Não encontrou o que procurava? Envie um e-mail para{" "}
            <a href="mailto:ajuda@nativo.com" className="text-blue-600 font-semibold">
              ajuda@nativo.com
            </a>{" "}
            ou fale conosco pelo WhatsApp oficial.
          </p>
        </div>
      </div>
    </div>
  );
}

