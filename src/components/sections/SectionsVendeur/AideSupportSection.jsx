
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  AlertCircle,
  MessageCircle,
  Mail,
  Phone,
  BookOpen,
  Video,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Send,
  Clock,
  CheckCircle,
  ThumbsUp,
  ExternalLink,
  Users,
  Settings,
  Shield,
  DollarSign,
  Globe,
  Smartphone,
  Star
} from 'lucide-react';

const AideSupportSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('tous');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { id: 'tous', label: 'Tous', icon: HelpCircle },
    { id: 'compte', label: 'Compte', icon: Users },
    { id: 'commandes', label: 'Commandes', icon: AlertCircle },
    { id: 'livraisons', label: 'Livraisons', icon: Globe },
    { id: 'paiements', label: 'Paiements', icon: DollarSign },
    { id: 'technique', label: 'Technique', icon: Settings }
  ];

  const faqs = [
    {
      id: 1,
      category: 'compte',
      question: 'Comment créer un compte vendeur ?',
      answer: 'Pour créer un compte vendeur, cliquez sur "S\'inscrire" en haut à droite, sélectionnez "Vendeur" et remplissez le formulaire d\'inscription. Vous devrez fournir les informations de votre entreprise (nom, SIRET, coordonnées) et attendre la validation de notre équipe.',
      popular: true
    },
    {
      id: 2,
      category: 'compte',
      question: 'Comment réinitialiser mon mot de passe ?',
      answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Vous recevrez un email avec un lien pour réinitialiser votre mot de passe. Suivez les instructions pour créer un nouveau mot de passe sécurisé.',
      popular: true
    },
    {
      id: 3,
      category: 'commandes',
      question: 'Comment gérer les commandes en attente ?',
      answer: 'Rendez-vous dans la section "Commandes" de votre tableau de bord. Vous y verrez toutes les commandes avec leur statut. Pour les commandes en attente, vous pouvez les assigner à un livreur ou les accepter directement depuis l\'interface.',
      popular: false
    },
    {
      id: 4,
      category: 'livraisons',
      question: 'Comment suivre une livraison en temps réel ?',
      answer: 'Dans la section "Livraisons", cliquez sur la livraison que vous souhaitez suivre. Vous verrez la position du livreur en temps réel sur la carte, ainsi que le temps estimé d\'arrivée (ETA) et l\'historique des étapes de la livraison.',
      popular: true
    },
    {
      id: 5,
      category: 'paiements',
      question: 'Comment sont effectués les paiements ?',
      answer: 'Les paiements sont sécurisés via notre partenaire de paiement. Les fonds sont bloqués pendant la livraison et sont libérés une fois la commande confirmée par le client. Vous pouvez consulter vos transactions dans la section "Paiements" de votre tableau de bord.',
      popular: false
    },
    {
      id: 6,
      category: 'technique',
      question: 'L\'application mobile est-elle disponible ?',
      answer: 'Oui, notre application mobile est disponible sur Google Play et l\'App Store. Vous pouvez la télécharger gratuitement pour gérer vos activités en déplacement, suivre les livraisons et recevoir des notifications en temps réel.',
      popular: false
    },
    {
      id: 7,
      category: 'commandes',
      question: 'Que faire en cas de litige avec une commande ?',
      answer: 'En cas de litige, rendez-vous dans la section "Litiges" de votre tableau de bord. Vous pouvez ouvrir un litige en décrivant le problème et en fournissant les preuves nécessaires. Notre équipe traitera votre demande dans les plus brefs délais.',
      popular: false
    },
    {
      id: 8,
      category: 'compte',
      question: 'Comment modifier les informations de mon entreprise ?',
      answer: 'Allez dans "Paramètres" puis "Informations de l\'entreprise". Vous pouvez y modifier vos coordonnées, votre adresse, votre zone d\'activité et vos informations de contact. Certaines modifications peuvent nécessiter une validation par notre équipe.',
      popular: false
    }
  ];

  const guides = [
    {
      title: 'Guide d\'inscription vendeur',
      description: 'Apprenez à créer votre compte vendeur en quelques minutes',
      icon: Users,
      duration: '5 min',
      category: 'compte'
    },
    {
      title: 'Gestion des commandes',
      description: 'Tout savoir sur la gestion de vos commandes',
      icon: AlertCircle,
      duration: '10 min',
      category: 'commandes'
    },
    {
      title: 'Optimisation des livraisons',
      description: 'Conseils pour améliorer vos délais de livraison',
      icon: Globe,
      duration: '8 min',
      category: 'livraisons'
    },
    {
      title: 'Sécurisation des paiements',
      description: 'Comment garantir la sécurité des transactions',
      icon: DollarSign,
      duration: '6 min',
      category: 'paiements'
    }
  ];

  const supportContacts = [
    { icon: Mail, label: 'Email', value: 'support@gabon-livraison.com', action: 'Envoyer un email' },
    { icon: Phone, label: 'Téléphone', value: '+241 01 23 45 67', action: 'Appeler' },
    { icon: MessageCircle, label: 'Chat en direct', value: 'Disponible 24h/24', action: 'Démarrer le chat' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'tous' || faq.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container"
    >
      <div className="section-header">
        <div>
          <h2>Aide & Support</h2>
          <p className="section-subtitle">Trouvez des réponses à vos questions et contactez notre équipe</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filters-bar">
        <div className="search-wrapper" style={{ maxWidth: '600px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher dans l'aide..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="categories-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              border: `1px solid ${activeCategory === cat.id ? 'var(--orange)' : 'var(--border)'}`,
              background: activeCategory === cat.id ? 'var(--orange-light)' : 'transparent',
              color: activeCategory === cat.id ? 'var(--orange)' : 'var(--text-muted)',
              fontWeight: activeCategory === cat.id ? '600' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            <cat.icon size={16} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Contact Support */}
      <div className="panel" style={{ marginBottom: '24px', background: 'var(--orange-light)' }}>
        <div className="panel-head">
          <h3>Besoin d'aide ?</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Notre équipe est là pour vous aider
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {supportContacts.map((contact, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fff', borderRadius: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                <contact.icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contact.label}</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{contact.value}</div>
              </div>
              <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                {contact.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-head">
          <h3>Foire Aux Questions (FAQ)</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {filteredFaqs.length} questions trouvées
          </span>
        </div>
        <div className="faq-list">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
              <button
                onClick={() => toggleFaq(faq.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '8px 4px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {faq.popular && (
                    <span style={{ fontSize: '10px', background: 'var(--orange)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                      Populaire
                    </span>
                  )}
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{faq.question}</span>
                </div>
                {expandedFaq === faq.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {expandedFaq === faq.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  style={{ padding: '12px 4px', color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '14px' }}
                >
                  <p style={{ margin: 0 }}>{faq.answer}</p>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
                      <ThumbsUp size={14} /> Utile
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
                      <MessageCircle size={14} /> Poser une question
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Guides & Tutoriels */}
      <div className="panel">
        <div className="panel-head">
          <h3>Guides & Tutoriels</h3>
          <a href="#" className="see-all">Voir tous les guides</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {guides.map((guide, idx) => (
            <div key={idx} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '10px', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', marginBottom: '12px' }}>
                <guide.icon size={20} />
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{guide.title}</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {guide.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {guide.duration}
                </span>
                <button className="action-btn" style={{ color: 'var(--orange)' }}>
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plus de ressources */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <BookOpen size={32} style={{ color: 'var(--orange)', marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Documentation</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>Guides détaillés pour chaque fonctionnalité</p>
          <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 16px' }}>Consulter</button>
        </div>

        <div style={{ padding: '16px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <Video size={32} style={{ color: 'var(--blue)', marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Vidéos tutoriels</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>Apprenez en vidéo pas à pas</p>
          <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 16px' }}>Voir les vidéos</button>
        </div>

        <div style={{ padding: '16px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <Star size={32} style={{ color: 'var(--purple)', marginBottom: '8px' }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Communauté</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>Échangez avec d'autres utilisateurs</p>
          <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 16px' }}>Rejoindre</button>
        </div>
      </div>
    </motion.div>
  );
};

export default AideSupportSection;