import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const TESTIMONIALS = [
  {
    name: "Maria Silva",
    role: "Lojista",
    avatar: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?fit=crop&w=150&h=150",
    quote: "O NATIVO revolucionou minha forma de vender. Consegui expandir meu negócio e alcançar clientes que jamais imaginaria.",
    rating: 5
  },
  {
    name: "Pedro Almeida",
    role: "Cliente",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?fit=crop&w=150&h=150",
    quote: "Descobri produtos locais incríveis que não encontraria em lugar nenhum. Os preços são ótimos e o contato direto com vendedores facilita tudo.",
    rating: 5
  },
  {
    name: "Fernanda Costa",
    role: "Artesã",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?fit=crop&w=150&h=150",
    quote: "Como artesã, sempre tive dificuldade em encontrar canais de venda. O NATIVO me conectou com pessoas que realmente valorizam produtos artesanais.",
    rating: 4
  }
];

export default function Testimonials({ appearanceSettings = {} }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const scrollPrev = () => {
    setCurrentIndex(prev => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };
  
  const scrollNext = () => {
    setCurrentIndex(prev => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  const TestimonialCard = ({ testimonial }) => (
    <Card className="h-full">
      <CardContent className="p-4 sm:p-5 flex flex-col h-full">
        <div className="mb-3 text-blue-500">
          <Quote className="w-8 h-8 opacity-20" />
        </div>
        
        <p className="text-sm text-gray-700 mb-4 flex-grow leading-relaxed">
          "{testimonial.quote}"
        </p>
        
        <div className="flex items-center gap-2.5 mt-auto pt-3 border-t">
          <img 
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h4 className="font-medium text-sm">{testimonial.name}</h4>
            <p className="text-xs text-gray-500">{testimonial.role}</p>
          </div>
          
          <div className="ml-auto flex">
            {Array(5).fill(0).map((_, i) => (
              <svg 
                key={i}
                className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        <h2 
          className="text-xl sm:text-2xl font-bold mb-2"
          style={{ color: appearanceSettings?.primaryColor || appearanceSettings?.buttonPrimaryColor || '#2563eb' }}
        >
          O que dizem sobre nós
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto">
          Histórias reais de lojistas e compradores que fazem parte da comunidade NATIVO
        </p>
      </div>
      
      {isMobile ? (
        <div className="relative">
          <div className="overflow-hidden">
            <div className="transition-transform duration-300 ease-in-out">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="w-full px-4"
              >
                <TestimonialCard testimonial={TESTIMONIALS[currentIndex]} />
              </motion.div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg z-10"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white rounded-full shadow-lg z-10"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex justify-center gap-2 mt-4">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}