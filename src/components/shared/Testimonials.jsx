import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import './Testimonials.css';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Marie K.",
      role: "Commerçante",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
      text: "Grâce à Gabon Livraison Express, mes courses et colis sont livrés rapidement et sans souci. Je recommande !",
      rating: 5,
      tag: "Très satisfaite"
    },
    {
      id: 2,
      name: "Jean-Paul M.",
      role: "Restaurateur",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JeanPaul",
      text: "Livraisons rapides, livreurs professionnels, jamais déçu. Excellent service !",
      rating: 5,
      tag: "Excellent service"
    },
    {
      id: 3,
      name: "Sophie N.",
      role: "Pharmacienne",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
      text: "Un service fiable pour mes livraisons de médicaments. Mes clients sont toujours satisfaits.",
      rating: 5,
      tag: "Service fiable"
    },
    {
      id: 4,
      name: "Patrick L.",
      role: "Artisan",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Patrick",
      text: "Simple, rapide et efficace. J'ai pu développer mon activité grâce à ce service de livraison.",
      rating: 5,
      tag: "Efficace"
    }
  ];

  // Rotation automatique des témoignages
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const currentTestimonial = testimonials[currentIndex];

  // Positions pour les avatars (en cercle)
  const avatarPositions = [
    { top: '10%', left: '15%', delay: 0 },
    { top: '15%', right: '10%', delay: 0.1 },
    { bottom: '20%', left: '20%', delay: 0.2 },
    { bottom: '15%', right: '15%', delay: 0.3 },
  ];

  return (
    <section className="testimonials-section" id="avis">
      <div className="testimonials-container">
        {/* Badge supérieur */}
     
        {/* Titre principal */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="testimonials-title"
        >
          Ce que disent nos utilisateurs
        </motion.h2>

        {/* Zone principale du témoignage */}
        <div className="testimonials-main">
          {/* Avatars décoratifs */}
          {testimonials.slice(0, 4).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              className={`avatar-item ${index === currentIndex % 4 ? 'active' : ''}`}
              style={avatarPositions[index]}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                delay: avatarPositions[index].delay,
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div className="avatar-wrapper">
                <img src={testimonial.avatar} alt={testimonial.name} />
                {index === currentIndex % 4 && (
                  <motion.div 
                    className="avatar-ring"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                  />
                )}
              </div>
              {index === currentIndex % 4 && (
                <motion.div 
                  className="avatar-tag"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {testimonial.tag}
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Témoignage principal */}
          <div className="main-testimonial">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="testimonial-content"
              >
                <Quote className="quote-icon" size={40} />
                
                <motion.p 
                  className="testimonial-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentTestimonial.text}
                </motion.p>

                <motion.div 
                  className="testimonial-author"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="author-info">
                    <h4>{currentTestimonial.name}</h4>
                    <span className="author-role">{currentTestimonial.role}</span>
                  </div>
                  <div className="rating">
                    {[...Array(currentTestimonial.rating)].map((_, i) => (
                      <Star key={i} size={18} fill="#F4712F" className="star-filled" />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Points de navigation */}
          <div className="testimonials-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Voir témoignage ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Éléments décoratifs */}
        <div className="decorative-dots">
          <div className="dot-deco" style={{ top: '20%', left: '5%' }}></div>
          <div className="dot-deco" style={{ top: '60%', right: '5%' }}></div>
          <div className="dot-deco" style={{ bottom: '10%', left: '10%' }}></div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;