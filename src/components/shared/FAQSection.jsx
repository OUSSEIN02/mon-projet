import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import './FAQSection.css';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0); // Premier item ouvert par défaut

  const faqItems = [
    {
      question: "Qu'est-ce que Gabon Livraison Express ?",
      answer: {
        highlight: "Notre objectif :",
        highlightText: " rendre la livraison rapide, fiable, locale, à moindre coût et accessible à tous. Gabon Livraison Express est une application créée pour permettre d'envoyer colis, repas, courses ou documents selon vos besoins, partout au Gabon.",
        fullText: "Nous connectons les clients, les commerçants et les livreurs pour des envois rapides, fiables et accessibles à tous, dans les 9 provinces du pays."
      }
    },
    {
      question: "Comment puis-je créer un compte ?",
      answer: {
        highlight: null,
        highlightText: null,
        fullText: "Cliquez sur 'Devenir Vendeur' ou 'Devenir Livreur' en haut de la page. Remplissez le formulaire avec vos informations (identité, véhicule, zone de couverture). Après validation KYC sous 48h, votre compte sera activé et vous pourrez commencer immédiatement."
      }
    },
    {
      question: "Quels types de livraison puis-je effectuer ?",
      answer: {
        highlight: null,
        highlightText: null,
        fullText: "Nous proposons plusieurs types de livraisons : colis standards, repas de restaurants, courses alimentaires, documents urgents, et livraisons groupées (mode Standard) pour réduire les coûts sur les envois non urgents."
      }
    },
    {
      question: "Comment suivre ma livraison en temps réel ?",
      answer: {
        highlight: null,
        highlightText: null,
        fullText: "Une fois votre commande créée, vous recevez un lien de suivi. Vous et votre client pouvez visualiser la position du livreur sur une carte en direct, avec des notifications à chaque étape : livreur assigné, colis récupéré, livraison confirmée."
      }
    },
    {
      question: "Quels sont les modes de paiement disponibles ?",
      answer: {
        highlight: null,
        highlightText: null,
        fullText: "Nous acceptons Airtel Money, Moov Money, les virements bancaires, et le paiement en espèces à la livraison. Le choix du payeur (client ou vendeur) est flexible et configurable à chaque commande."
      }
    },
    {
      question: "Dans quelles zones opérez-vous ?",
      answer: {
        highlight: null,
        highlightText: null,
        fullText: "Nous couvrons les 9 provinces du Gabon : Estuaire (Libreville, Owendo, Akanda), Haut-Ogooué, Moyen-Ogooué, Ngounié, Nyanga, Ogooué-Ivindo, Ogooué-Lolo, Ogooué-Maritime (Port-Gentil) et Woleu-Ntem."
      }
    }
  ];

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-container">
        {/* En-tête */}
        <div className="faq-header">
          <h2 className="faq-title">
            Bien plus qu'une simple livraison, une expérience locale.
          </h2>
          <p className="faq-subtitle">
            Gabon Livraison Express est une application 100 % pensée pour le Gabon. 
            Elle connecte les clients, les commerçants et les livreurs pour des envois 
            rapides, fiables et accessibles à tous.
          </p>
        </div>

        {/* Liste FAQ */}
        <div className="faq-list">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div
                key={index}
                className={`faq-item ${isOpen ? 'open' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Question + Bouton */}
                <button 
                  className="faq-question"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{item.question}</span>
                  <motion.div 
                    className="faq-toggle-btn"
                    animate={{ rotate: isOpen ? 0 : 0 }}
                  >
                    {isOpen ? <X size={20} /> : <Plus size={20} />}
                  </motion.div>
                </button>

                {/* Réponse animée */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="faq-answer-content">
                        {item.answer.highlight && (
                          <p className="faq-answer-highlight">
                            <strong>{item.answer.highlight}</strong>{item.answer.highlightText}
                          </p>
                        )}
                        {item.answer.fullText && (
                          <p className="faq-answer-text">{item.answer.fullText}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;