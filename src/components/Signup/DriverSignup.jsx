


import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, User, Bike, AlertCircle, MapPin, FileText,
  ArrowLeft, Shield, Clock, DollarSign, AlertTriangle, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient'; // Adaptez le chemin si nécessaire
import './DriverSignup.css';
import Header from '../header/header';
import Footer from '../footer/footer';

const DriverSignup = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '', prenom: '', whatsapp: '', email: '',
    password: '', password_confirmation: '', // Ajouté pour la création du compte
    photoIdentite: null, photoPieceIdentite: null, photoMoto: null,
    numeroPlaque: '', numeroPlaqueSuffix: '', // Séparé pour gérer les 2 inputs
    etatMoto: '', experience: '', zonesLivraison: []
  });
  
  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({
    photoIdentite: null, photoPieceIdentite: null, photoMoto: null
  });

  const zonesGabon = [
    'Estuaire (Libreville, Owendo, Akanda)', 'Haut-Ogooué (Franceville)', 
    'Moyen-Ogooué (Lambaréné)', 'Ngounié (Mouila)', 'Nyanga (Tchibanga)', 
    'Ogooué-Ivindo (Makokou)', 'Ogooué-Lolo (Koulamoutou)', 
    'Ogooué-Maritime (Port-Gentil)', 'Woleu-Ntem (Oyem)'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreviews(prev => {
          if (prev[name]) URL.revokeObjectURL(prev[name]);
          return { ...prev, [name]: objectUrl };
        });
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        zonesLivraison: checked 
          ? [...prev.zonesLivraison, value]
          : prev.zonesLivraison.filter(z => z !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'Le numéro WhatsApp est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 caractères';
    
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.photoIdentite) newErrors.photoIdentite = 'Photo d\'identité requise';
    if (!formData.photoPieceIdentite) newErrors.photoPieceIdentite = 'Photo de la pièce d\'identité requise';
    if (!formData.photoMoto) newErrors.photoMoto = 'Photo de la moto requise';
    
    const fullPlaque = `${formData.numeroPlaque}${formData.numeroPlaqueSuffix}`;
    if (!fullPlaque.trim()) newErrors.numeroPlaque = 'Numéro de plaque requis';
    
    if (!formData.etatMoto) newErrors.etatMoto = 'Veuillez sélectionner l\'état de la moto';
    if (!formData.experience) newErrors.experience = 'Veuillez répondre';
    if (formData.zonesLivraison.length === 0) {
      newErrors.zonesLivraison = 'Veuillez sélectionner au moins une zone';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    
    // Utilisation de FormData pour envoyer des fichiers
    const data = new FormData();
    data.append('nom', formData.nom);
    data.append('prenom', formData.prenom);
    data.append('whatsapp', formData.whatsapp);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('password_confirmation', formData.password_confirmation);
    
    // Combinaison de la plaque
    data.append('numero_plaque', `${formData.numeroPlaque}${formData.numeroPlaqueSuffix}`);
    data.append('etat_moto', formData.etatMoto);
    data.append('experience', formData.experience);
    
    // Envoi des fichiers
    if (formData.photoIdentite) data.append('photo_identite', formData.photoIdentite);
    if (formData.photoPieceIdentite) data.append('photo_piece_identite', formData.photoPieceIdentite);
    if (formData.photoMoto) data.append('photo_moto', formData.photoMoto);
    
    // Envoi du tableau de zones
    formData.zonesLivraison.forEach(zone => {
      data.append('zones_livraison[]', zone);
    });

    try {
      const response = await apiClient.post('/livreurs/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message || "Inscription soumise avec succès !");
      
      // Réinitialisation et redirection après succès
      setFormData({
        nom: '', prenom: '', whatsapp: '', email: '',
        password: '', password_confirmation: '',
        photoIdentite: null, photoPieceIdentite: null, photoMoto: null,
        numeroPlaque: '', numeroPlaqueSuffix: '',
        etatMoto: '', experience: '', zonesLivraison: []
      });
      setPreviews({ photoIdentite: null, photoPieceIdentite: null, photoMoto: null });
      
      setTimeout(() => navigate('/auth'), 2000); // Redirection vers la connexion après 2s
      
    } catch (err) {
      console.error("Erreur inscription:", err);
      
      if (err.response?.status === 422) {
        // Mapping des erreurs de validation Laravel vers l'état React
        const apiErrors = err.response.data.errors;
        const mappedErrors = {};
        
        // Adaptation des noms de champs Laravel vers les noms d'état React
        if (apiErrors.numero_plaque) mappedErrors.numeroPlaque = apiErrors.numero_plaque[0];
        if (apiErrors.photo_identite) mappedErrors.photoIdentite = apiErrors.photo_identite[0];
        if (apiErrors.photo_piece_identite) mappedErrors.photoPieceIdentite = apiErrors.photo_piece_identite[0];
        if (apiErrors.photo_moto) mappedErrors.photoMoto = apiErrors.photo_moto[0];
        if (apiErrors.zones_livraison) mappedErrors.zonesLivraison = apiErrors.zones_livraison[0];
        
        // Pour les champs texte simples, on garde le même nom
        ['nom', 'prenom', 'whatsapp', 'email', 'password', 'password_confirmation', 'etat_moto', 'experience'].forEach(field => {
          if (apiErrors[field]) mappedErrors[field] = apiErrors[field][0];
        });

        setErrors(mappedErrors);
        toast.error("Veuillez corriger les erreurs indiquées.");
      } else {
        toast.error(err.response?.data?.message || "Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadZone = ({ name, label, icon: Icon, preview }) => (
    <div className="file-upload-zone">
      <input type="file" name={name} accept="image/*" onChange={handleChange} className="file-input" id={name} />
      <label htmlFor={name} className={`file-upload-label ${errors[name] ? 'border-red-500' : ''}`}>
        {preview ? (
          <div className="file-preview">
            <img src={preview} alt={label} />
            <div className="file-preview-overlay"><span>Cliquer pour changer</span></div>
          </div>
        ) : (
          <>
            <Icon size={32} className="upload-icon" />
            <span className="upload-text">{label}</span>
            <span className="upload-hint">PNG, JPEG uniquement (Max 2Mo)</span>
          </>
        )}
      </label>
      {errors[name] && <p className="error-text">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="driver-signup-page">
      <Header />
      <div className="driver-container">
        <AnimatePresence mode="wait">
          {!showForm ? (
            // ... (Votre code "conditions" reste inchangé, je le condense pour la lisibilité)
            <motion.div key="conditions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="conditions-wrapper">
               <div className="conditions-header">
                <h1 className="brand-title">Gabon Livraison Express</h1>
                <p className="brand-subtitle">Devenez livreur partenaire</p>
              </div>
              <div className="conditions-content">
                <h2>Conditions Générales d'Utilisation - Livreur Partenaire</h2>
                <p className="conditions-intro">
                  Bienvenue sur <strong>Gabon Livraison Express</strong> ! Avant de vous inscrire en tant que livreur partenaire, 
                  merci de lire attentivement les conditions ci-dessous. En créant un compte, vous acceptez pleinement ces conditions.
                </p>

                <div className="conditions-sections">
                  <section className="condition-block">
                    <h3><Shield size={18} /> 1. Objet et Acceptation</h3>
                    <p className="condition-text">
                      Gabon Livraison Express est une plateforme numérique mettant en relation des vendeurs (commerçants), 
                      des livreurs partenaires indépendants et des clients finaux pour la livraison de colis au Gabon. 
                      En vous inscrivant, vous reconnaissez être un <strong>prestataire indépendant</strong> et non un salarié 
                      de la plateforme.
                    </p>
                  </section>

                  <section className="condition-block">
                    <h3><User size={18} /> 2. Conditions d'Éligibilité</h3>
                    <ul>
                      <li>Être âgé d'au moins <strong>18 ans</strong> et résider au Gabon.</li>
                      <li>Posséder une <strong>pièce d'identité valide</strong> (CNI, passeport ou permis de conduire).</li>
                      <li>Disposer d'un <strong>smartphone</strong> compatible avec l'application et d'une connexion internet.</li>
                      <li>Posséder un <strong>moyen de transport en bon état</strong> (moto, scooter, vélo ou véhicule utilitaire).</li>
                      <li>Avoir un <strong>casier judiciaire vierge</strong> pour les infractions liées aux biens.</li>
                      <li>Fournir une <strong>photo selfie récente</strong> pour la vérification KYC.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3><Clock size={18} /> 3. Fonctionnement du Système d'Attribution</h3>
                    <ul>
                      <li>Les livraisons sont attribuées <strong>automatiquement</strong> en fonction de votre position GPS, 
                          de vos disponibilités déclarées et du volume de colis dans votre zone.</li>
                      <li>En cas d'échec d'attribution automatique, l'administrateur peut procéder à une 
                          <strong> attribution manuelle</strong>.</li>
                      <li>Il n'y a pas de bouton « accepter » : <strong>toute course reçue doit être exécutée</strong> 
                          sous peine de pénalité.</li>
                      <li>Vous devez maintenir votre statut à jour : <strong>Disponible</strong>, <strong>En livraison</strong> 
                          ou <strong>Indisponible</strong>.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3><MapPin size={18} /> 4. Zones de Couverture et Tarification</h3>
                    <ul>
                      <li>Vous ne pouvez opérer que dans les <strong>zones que vous avez sélectionnées</strong> lors de votre inscription.</li>
                      <li>Les tarifs sont définis par la plateforme selon une grille : 
                          <strong> tarif de base + tarif par kilomètre</strong> (en FCFA).</li>
                      <li>La plateforme se réserve le droit d'ajuster les tarifs selon la zone, 
                          l'heure (heures de pointe) et la distance.</li>
                      <li>Les frais de livraison sont payés par le client ou le vendeur selon le mode choisi.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3><AlertTriangle size={18} /> 5. Obligations du Livreur Partenaire</h3>
                    <ul>
                      <li>Assurer des livraisons <strong>rapides, sécurisées et respectueuses</strong> du client et du colis.</li>
                      <li>Vérifier l'intégrité du colis avant et après transport (photo de preuve obligatoire).</li>
                      <li>Respecter les <strong>instructions spécifiques</strong> laissées par le vendeur ou le client 
                          (code d'entrée, étage, contact).</li>
                      <li>Ne pas ouvrir, altérer ou consommer le contenu des colis sous peine de 
                          <strong> suspension immédiate</strong> et poursuites.</li>
                      <li>Toute <strong>fraude, vol ou comportement irrespectueux</strong> entraîne la résiliation 
                          définitive du compte.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3><Bike size={18} /> 6. Véhicule et Sécurité</h3>
                    <ul>
                      <li>Vous certifiez que votre véhicule est en <strong>bon état de fonctionnement</strong> 
                          et conforme à la réglementation gabonaise.</li>
                      <li>Vous devez fournir : <strong>photo du véhicule, numéro de plaque, et état du véhicule</strong>.</li>
                      <li>Le port du <strong>casque</strong> (pour les deux-roues) est <strong>obligatoire</strong>.</li>
                      <li>Vous êtes responsable de l'entretien et de l'assurance de votre véhicule.</li>
                      <li>En cas d'accident, vous devez immédiatement notifier la plateforme et les autorités compétentes.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3><DollarSign size={18} /> 7. Rémunération et Paiements</h3>
                    <ul>
                      <li>Vos gains sont calculés automatiquement par la plateforme selon la grille tarifaire en vigueur.</li>
                      <li>La plateforme prélève une <strong>commission</strong> sur chaque livraison (pourcentage variable).</li>
                      <li>Vous pouvez retirer vos gains à tout moment via votre <strong>portefeuille numérique</strong> 
                          (Airtel Money, Moov Money ou virement bancaire).</li>
                      <li>Les paiements sont effectués sous <strong>24 à 72 heures</strong> après validation de la livraison.</li>
                      <li>En cas de <strong>litige</strong> (colis endommagé, non-livraison), le paiement peut être suspendu 
                          jusqu'à résolution.</li>
                      <li>La transparence est totale : <strong>chaque course est enregistrée</strong> avec preuve photo et géolocalisation.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3>8. Litiges et Responsabilités</h3>
                    <ul>
                      <li>En cas de problème (colis endommagé, retard, non-livraison), un système de 
                          <strong> litige</strong> est disponible dans l'application.</li>
                      <li>La plateforme agit en tant que <strong>médiateur</strong> entre le vendeur, le livreur et le client.</li>
                      <li>Le livreur est <strong>responsable</strong> des dommages causés aux colis durant le transport.</li>
                      <li>Une <strong>valeur déclarée</strong> peut être renseignée pour les colis de valeur ; 
                          en cas de perte, l'indemnisation est plafonnée à cette valeur.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3>9. Suspension et Résiliation</h3>
                    <ul>
                      <li>La plateforme peut <strong>suspendre temporairement</strong> un compte en cas de :
                          <ul>
                            <li>Non-respect des horaires déclarés</li>
                            <li>Évaluation client inférieure à 3/5 de manière répétée</li>
                            <li>Signalement de comportement inapproprié</li>
                          </ul>
                      </li>
                      <li>La <strong>résiliation définitive</strong> intervient en cas de : vol, fraude, violence, 
                          récidive après suspension.</li>
                      <li>Vous pouvez résilier votre compte à tout moment depuis les paramètres de l'application.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3>10. Protection des Données Personnelles</h3>
                    <ul>
                      <li>Vos données (identité, géolocalisation, historique) sont collectées pour le bon fonctionnement du service.</li>
                      <li>Conformément à la <strong>loi gabonaise n°001/2011</strong> sur la protection des données, 
                          vous disposez d'un droit d'accès, de rectification et de suppression.</li>
                      <li>Vos données ne sont pas revendues à des tiers. Elles peuvent être partagées avec les autorités 
                          sur réquisition judiciaire.</li>
                    </ul>
                  </section>

                  <section className="condition-block">
                    <h3>11. Droit Applicable</h3>
                    <p className="condition-text">
                      Ces conditions sont régies par le <strong>droit de la République Gabonaise</strong>. 
                      Tout litige sera soumis aux tribunaux compétents de <strong>Libreville</strong>, 
                      après tentative de résolution amiable.
                    </p>
                  </section>
                </div>

                <div className="conditions-legal">
                  <p>
                    En cliquant sur « Accepter », vous reconnaissez avoir lu, compris et accepté intégralement les présentes conditions, 
                    ainsi que le <a href="#" className="legal-link">Contrat de Prestation de Services</a> qui régit votre activité 
                    en tant que livreur partenaire indépendant au Gabon.
                  </p>
                </div>
              </div>
              <div className="conditions-actions">
                <button type="button" className="btn-secondary" onClick={() => window.history.back()}>Retour</button>
                <button type="button" className="btn-primary" onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  Accepter et continuer
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="driver-form-wrapper">
              <div className="form-header">
                <button type="button" className="back-to-conditions" onClick={() => setShowForm(false)}>
                  <ArrowLeft size={18} /> Retour aux conditions
                </button>
                <h1>Formulaire d'inscription Livreur</h1>
                <p>Rejoignez l'équipe Gabon Livraison Express</p>
              </div>

              <div className="info-note">
                <AlertCircle size={18} />
                <div>
                  <strong>Note :</strong> La photo d'identité numérique doit être une photo récente de vous. 
                  La photo de la pièce d'identité doit être une photo claire de votre carte d'identité, passeport ou permis de conduire.
                </div>
              </div>

              <form onSubmit={handleSubmit} className="driver-form">
                <section className="form-section">
                  <h2>Informations Personnelles</h2>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nom *</label>
                      <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex: MOUSSAVOU" className={errors.nom ? 'error' : ''} />
                      {errors.nom && <p className="error-text">{errors.nom}</p>}
                    </div>
                    <div className="form-group">
                      <label>Prénom(s) *</label>
                      <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Ex: Jean" className={errors.prenom ? 'error' : ''} />
                      {errors.prenom && <p className="error-text">{errors.prenom}</p>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Numéro WhatsApp *</label>
                      <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="+241 077 00 00 00" className={errors.whatsapp ? 'error' : ''} />
                      {errors.whatsapp && <p className="error-text">{errors.whatsapp}</p>}
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="votre@email.com" className={errors.email ? 'error' : ''} />
                      {errors.email && <p className="error-text">{errors.email}</p>}
                    </div>
                  </div>
                  
                  {/* NOUVEAU : Champs Mot de passe pour la création du compte */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mot de passe *</label>
                      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 caractères" className={errors.password ? 'error' : ''} />
                      {errors.password && <p className="error-text">{errors.password}</p>}
                    </div>
                    <div className="form-group">
                      <label>Confirmer le mot de passe *</label>
                      <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} placeholder="Répétez le mot de passe" className={errors.password_confirmation ? 'error' : ''} />
                      {errors.password_confirmation && <p className="error-text">{errors.password_confirmation}</p>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Photo d'identité numérique (selfie) *</label>
                      <FileUploadZone name="photoIdentite" label="Photo de vous" icon={User} preview={previews.photoIdentite} />
                    </div>
                    <div className="form-group full-width">
                      <label>Photo de la pièce d'identité *</label>
                      <FileUploadZone name="photoPieceIdentite" label="Carte d'identité / Passeport" icon={FileText} preview={previews.photoPieceIdentite} />
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <h2>Informations sur le véhicule</h2>
                  <div className="form-group full-width">
                    <label>Photo de la moto *</label>
                    <FileUploadZone name="photoMoto" label="Cliquez pour téléverser la photo de votre véhicule" icon={Bike} preview={previews.photoMoto} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Numéro de plaque *</label>
                      <div className="plaque-input-group">
                        <input 
                          type="text" 
                          name="numeroPlaque" 
                          value={formData.numeroPlaque} 
                          onChange={handleChange} 
                          placeholder="2AA" 
                          maxLength={3}
                          className={`plaque-prefix ${errors.numeroPlaque ? 'error' : ''}`} 
                        />
                        <span className="plaque-separator">-</span>
                        <input 
                          type="text" 
                          name="numeroPlaqueSuffix" 
                          value={formData.numeroPlaqueSuffix} 
                          onChange={handleChange} 
                          placeholder="0000" 
                          maxLength={4}
                          className={`plaque-number ${errors.numeroPlaque ? 'error' : ''}`} 
                        />
                      </div>
                      {errors.numeroPlaque && <p className="error-text">{errors.numeroPlaque}</p>}
                    </div>
                    <div className="form-group">
                      <label>État du véhicule *</label>
                      <select name="etatMoto" value={formData.etatMoto} onChange={handleChange} className={errors.etatMoto ? 'error' : ''}>
                        <option value="">Sélectionnez l'état</option>
                        <option value="excellent">Excellent</option>
                        <option value="bon">Bon</option>
                        <option value="moyen">Moyen</option>
                        <option value="correct">Correct</option>
                      </select>
                      {errors.etatMoto && <p className="error-text">{errors.etatMoto}</p>}
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <h2>Expérience Professionnelle</h2>
                  <div className="form-group">
                    <label>Avez-vous déjà travaillé comme livreur ?</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input type="radio" name="experience" value="oui" checked={formData.experience === 'oui'} onChange={handleChange} />
                        <span className="radio-custom"></span> Oui
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="experience" value="non" checked={formData.experience === 'non'} onChange={handleChange} />
                        <span className="radio-custom"></span> Non
                      </label>
                    </div>
                    {errors.experience && <p className="error-text">{errors.experience}</p>}
                  </div>

                  <div className="zones-section">
                    <div className="zones-header">
                      <MapPin size={20} />
                      <h3>Zones de livraison</h3>
                    </div>
                    <p className="zones-description">Sélectionnez les provinces du Gabon où vous souhaitez effectuer des livraisons.</p>
                    <div className="zones-grid">
                      {zonesGabon.map((zone) => (
                        <label key={zone} className={`checkbox-label ${errors.zonesLivraison ? 'error-border' : ''}`}>
                          <input type="checkbox" value={zone} checked={formData.zonesLivraison.includes(zone)} onChange={handleChange} />
                          <span className="checkmark"></span>
                          {zone}
                        </label>
                      ))}
                    </div>
                    {errors.zonesLivraison && (
                      <div className="warning-message">
                        <AlertCircle size={16} />
                        {errors.zonesLivraison}
                      </div>
                    )}
                  </div>
                </section>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={isSubmitting}>
                    Retour aux conditions
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Envoi en cours...
                      </>
                    ) : (
                      "Soumettre ma candidature"
                    )}
                  </button>
                </div>
              </form>
              <div className="login-prompt">
                <p>Vous avez déjà un compte ? <Link to="/auth" className="login-link">Se connecter</Link></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default DriverSignup;