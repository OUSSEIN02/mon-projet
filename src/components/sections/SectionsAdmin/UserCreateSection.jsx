import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, 
  Check, Shield, Loader2, Info
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import toast from 'react-hot-toast';

const UserCreateSection = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!userId;

  // --- États du formulaire principal ---
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  // --- États des rôles ---
  const [roles, setRoles] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  // --- États du modal mot de passe ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});

  // --- Visibilité des mots de passe ---
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Chargement des rôles (commun à création et édition)
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiClient.get('/dashboard/roles/users');
        const rolesData = response.data.data || response.data;
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (error) {
        console.error("Erreur chargement rôles:", error);
        toast.error("Impossible de charger les rôles");
      }
    };
    fetchRoles();
  }, []);

  // 2. Chargement de l'utilisateur (si mode édition)
  useEffect(() => {
    if (isEditMode) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          const response = await apiClient.get(`/dashboard/users/${userId}`);
          const user = response.data.data || response.data;
          
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            password: ''
          });
          
          if (user.roles && Array.isArray(user.roles)) {
            setSelectedRoleIds(user.roles.map(r => r.id));
          }
        } catch (error) {
          console.error("Erreur chargement utilisateur:", error);
          toast.error("Impossible de charger les données de l'utilisateur");
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [isEditMode, userId]);

  // --- Handlers du formulaire principal ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRoleToggle = (roleId) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId) 
        : [...prev, roleId]
    );
    if (errors.roles) setErrors(prev => ({ ...prev, roles: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    if (!isEditMode && !formData.password) {
      newErrors.password = 'Le mot de passe est requis pour la création';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (selectedRoleIds.length === 0) {
      newErrors.roles = 'Sélectionnez au moins un rôle';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role_ids: selectedRoleIds,
        ...(formData.password && { password: formData.password })
      };

      if (isEditMode) {
        await apiClient.put(`/dashboard/users/${userId}`, payload);
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        await apiClient.post('/dashboard/users', payload);
        toast.success('Utilisateur créé avec succès');
      }
      
      setTimeout(() => navigate('/dashboard/users-roles-permissions'), 500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Une erreur est survenue';
      toast.error(errorMsg);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers du modal mot de passe ---
  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Au moins 6 caractères';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setSubmittingPassword(true);
    try {
      await apiClient.put(`/dashboard/users/${userId}/password`, {
        password: passwordData.newPassword,
        password_confirmation: passwordData.confirmPassword
      });
      toast.success('Mot de passe modifié avec succès');
      closePasswordModal();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de la modification';
      toast.error(errorMsg);
    } finally {
      setSubmittingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
  };

  const goBack = () => navigate('/dashboard/users-roles-permissions');

  if (loading && isEditMode) {
    return (
      <div className="uc-container">
        <div className="uc-loading">
          <div className="uc-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="uc-container">
      {/* Header avec breadcrumb */}
      <div className="uc-header">
        <nav className="uc-breadcrumb" aria-label="Breadcrumb">
          <button onClick={goBack} className="uc-breadcrumb-link">
            <ArrowLeft size={16} />
            <span>Retour aux utilisateurs</span>
          </button>
          <span className="uc-breadcrumb-separator">/</span>
          <span className="uc-breadcrumb-current">
            {isEditMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </span>
        </nav>

        <div className="uc-title-section">
          <h2 className="uc-title">
            {isEditMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <p className="uc-subtitle">
            {isEditMode 
              ? 'Modifiez les informations de l\'utilisateur et ses permissions' 
              : 'Créez un nouvel utilisateur et attribuez-lui des rôles'}
          </p>
        </div>
      </div>

      {/* Message d'information important */}
      <div className="uc-info-box">
        <Info size={20} className="uc-info-icon" />
        <div className="uc-info-content">
          <h4 className="uc-info-title">Utilisateurs de gestion uniquement</h4>
          <p className="uc-info-text">
            Cette section est réservée à la création des membres de votre équipe interne (secrétaires, administrateurs, collaborateurs, etc.). 
            Pour gérer les <strong>livreurs</strong> et les <strong>vendeurs</strong>, veuillez vous rendre dans les sections dédiées du menu latéral.
          </p>
        </div>
      </div>

      {/* Formulaire principal */}
      <form onSubmit={handleSubmit} className="uc-card">
        <div className="uc-card-body">
          <h3 className="uc-section-title">Informations de base</h3>
          
          <div className="uc-form-grid">
            {/* Nom */}
            <div className="uc-form-group">
              <label htmlFor="name" className="uc-label">
                Nom complet <span className="uc-required">*</span>
              </label>
              <div className="uc-input-wrapper">
                <User size={18} className="uc-input-icon" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`uc-input ${errors.name ? 'uc-error' : ''}`}
                  placeholder="Jean Dupont"
                />
              </div>
              {errors.name && <p className="uc-error-text">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="uc-form-group">
              <label htmlFor="email" className="uc-label">
                Adresse email <span className="uc-required">*</span>
              </label>
              <div className="uc-input-wrapper">
                <Mail size={18} className="uc-input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`uc-input ${errors.email ? 'uc-error' : ''}`}
                  placeholder="jean@exemple.com"
                />
              </div>
              {errors.email && <p className="uc-error-text">{errors.email}</p>}
            </div>

            {/* Téléphone */}
            <div className="uc-form-group">
              <label htmlFor="phone" className="uc-label">Numéro de téléphone</label>
              <div className="uc-input-wrapper">
                <Phone size={18} className="uc-input-icon" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="uc-input"
                  placeholder="+241 06 00 00 00"
                />
              </div>
            </div>

            {/* Mot de passe (uniquement création) */}
            {!isEditMode && (
              <div className="uc-form-group">
                <label htmlFor="password" className="uc-label">
                  Mot de passe <span className="uc-required">*</span>
                </label>
                <div className="uc-input-wrapper">
                  <Lock size={18} className="uc-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`uc-input ${errors.password ? 'uc-error' : ''}`}
                    placeholder="Minimum 6 caractères"
                  />
                  <button
                    type="button"
                    className="uc-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="uc-error-text">{errors.password}</p>}
              </div>
            )}
          </div>

          {/* Section des rôles et permissions */}
          <div className="uc-roles-section">
            <h3 className="uc-section-title">Rôles et permissions</h3>
            {errors.roles && <p className="uc-error-text uc-error-block">{errors.roles}</p>}
            
            <div className="uc-roles-grid">
              {roles.map(role => {
                const isSelected = selectedRoleIds.includes(role.id);
                return (
                  <div 
                    key={role.id} 
                    className={`uc-role-card ${isSelected ? 'uc-role-selected' : ''}`}
                  >
                    <div className="uc-role-header">
                      <div className="uc-role-checkbox-wrapper">
                        <input
                          type="checkbox"
                          id={`role-${role.id}`}
                          checked={isSelected}
                          onChange={() => handleRoleToggle(role.id)}
                          className="uc-checkbox"
                        />
                        {isSelected && <Check size={14} className="uc-checkbox-icon" />}
                      </div>
                      <div className="uc-role-info">
                        <h4 className="uc-role-name">{role.name}</h4>
                        {role.description && (
                          <p className="uc-role-description">{role.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {role.permissions && role.permissions.length > 0 && (
                      <div className="uc-permissions-list">
                        <div className="uc-permissions-grid">
                          {role.permissions.map((permission) => (
                            <span 
                              key={permission.id} 
                              className="uc-permission-item"
                            >
                              {permission.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(!role.permissions || role.permissions.length === 0) && (
                      <p className="uc-no-permissions">Aucune permission</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="uc-card-footer">
          <button type="button" onClick={goBack} className="uc-btn uc-btn-secondary">
            Annuler
          </button>
          
          {isEditMode && (
            <button 
              type="button" 
              onClick={() => setShowPasswordModal(true)} 
              className="uc-btn uc-btn-outline"
            >
              <Lock size={16} />
              Modifier le mot de passe
            </button>
          )}

          <button 
            type="submit" 
            disabled={submitting} 
            className="uc-btn uc-btn-primary"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="uc-spinner-btn" />
                {isEditMode ? 'Mise à jour...' : 'Création...'}
              </>
            ) : (
              isEditMode ? 'Mettre à jour' : 'Créer l\'utilisateur'
            )}
          </button>
        </div>
      </form>

      {/* Modal de changement de mot de passe */}
      {showPasswordModal && (
        <div className="uc-modal-overlay" onClick={closePasswordModal}>
          <div className="uc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="uc-modal-header">
              <h3 className="uc-modal-title">Modifier le mot de passe</h3>
              <p className="uc-modal-subtitle">
                Définissez un nouveau mot de passe pour <strong>{formData.name}</strong>
              </p>
            </div>
            
            <form onSubmit={handlePasswordUpdate} className="uc-modal-body">
              <div className="uc-form-group">
                <label className="uc-label">Nouveau mot de passe</label>
                <div className="uc-input-wrapper">
                  <Lock size={18} className="uc-input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`uc-input ${passwordErrors.newPassword ? 'uc-error' : ''}`}
                    placeholder="Minimum 6 caractères"
                  />
                  <button
                    type="button"
                    className="uc-input-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="uc-error-text">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="uc-form-group">
                <label className="uc-label">Confirmer le mot de passe</label>
                <div className="uc-input-wrapper">
                  <Lock size={18} className="uc-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`uc-input ${passwordErrors.confirmPassword ? 'uc-error' : ''}`}
                    placeholder="Répétez le mot de passe"
                  />
                  <button
                    type="button"
                    className="uc-input-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="uc-error-text">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <div className="uc-modal-actions">
                <button 
                  type="button" 
                  onClick={closePasswordModal} 
                  className="uc-btn uc-btn-secondary"
                  disabled={submittingPassword}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="uc-btn uc-btn-primary"
                  disabled={submittingPassword}
                >
                  {submittingPassword ? (
                    <>
                      <Loader2 size={18} className="uc-spinner-btn" />
                      Modification...
                    </>
                  ) : (
                    'Modifier le mot de passe'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Unique et Préfixé (uc-) */}
      <style>{`
        .uc-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          color: #111827;
        }
        .uc-container * {
          box-sizing: border-box;
        }

        /* Header & Breadcrumb */
        .uc-header { margin-bottom: 24px; }
        .uc-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 16px; color: #6b7280; }
        .uc-breadcrumb-link { display: flex; align-items: center; gap: 6px; color: #6b7280; background: none; border: none; cursor: pointer; font-size: 14px; transition: color 0.2s; }
        .uc-breadcrumb-link:hover { color: #F26A22; }
        .uc-breadcrumb-separator { color: #d1d5db; }
        .uc-breadcrumb-current { font-weight: 500; color: #111827; }
        .uc-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 4px 0; }
        .uc-subtitle { font-size: 14px; color: #6b7280; margin: 0; }

        /* Info Box (NOUVEAU) */
        .uc-info-box {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .uc-info-icon {
          color: #2563eb;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .uc-info-content { flex: 1; }
        .uc-info-title {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
        }
        .uc-info-text {
          margin: 0;
          font-size: 13px;
          color: #1e3a8a;
          line-height: 1.5;
        }
        .uc-info-text strong {
          color: #1e40af;
          font-weight: 600;
        }

        /* Carte principale */
        .uc-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f3f4f6; overflow: hidden; }
        .uc-card-body { padding: 24px; }
        .uc-section-title { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 20px 0; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; }

        /* Formulaire Grid */
        .uc-form-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .uc-form-group { display: flex; flex-direction: column; }
        .uc-label { font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .uc-required { color: #dc2626; }
        .uc-input-wrapper { position: relative; display: flex; align-items: center; }
        .uc-input-icon { position: absolute; left: 12px; color: #9ca3af; pointer-events: none; }
        .uc-input { width: 100%; padding: 10px 14px 10px 40px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #111827; background: white; transition: all 0.2s; }
        .uc-input:focus { outline: none; border-color: #F26A22; box-shadow: 0 0 0 3px rgba(242, 106, 34, 0.1); }
        .uc-input.uc-error { border-color: #dc2626; }
        .uc-input.uc-error:focus { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        .uc-input-toggle { position: absolute; right: 12px; background: none; border: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; padding: 4px; }
        .uc-input-toggle:hover { color: #6b7280; }
        .uc-error-text { font-size: 12px; color: #dc2626; margin-top: 4px; margin-bottom: 0; }
        .uc-error-block { margin-bottom: 16px; font-weight: 500; }

        /* Section Rôles */
        .uc-roles-section { margin-top: 32px; }
        .uc-roles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .uc-role-card { display: flex; flex-direction: column; padding: 20px; border: 2px solid #e5e7eb; border-radius: 10px; background: white; transition: all 0.2s; min-height: 200px; }
        .uc-role-card:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .uc-role-card.uc-role-selected { border-color: #F26A22; background: #fff7ed; box-shadow: 0 2px 8px rgba(242, 106, 34, 0.15); }
        .uc-role-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
        .uc-role-checkbox-wrapper { position: relative; flex-shrink: 0; margin-top: 2px; }
        .uc-checkbox { width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 5px; cursor: pointer; appearance: none; transition: all 0.2s; }
        .uc-role-selected .uc-checkbox { background: #F26A22; border-color: #F26A22; }
        .uc-checkbox-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; pointer-events: none; }
        .uc-role-info { flex: 1; }
        .uc-role-name { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 4px 0; }
        .uc-role-description { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.4; }

        /* Liste des permissions */
        .uc-permissions-list { margin-top: auto; padding-top: 16px; border-top: 1px solid #f3f4f6; }
        .uc-permissions-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .uc-permission-item { display: inline-flex; align-items: center; padding: 6px 12px; background: #f3f4f6; color: #374151; border-radius: 6px; font-size: 12px; font-weight: 500; border: 1px solid #e5e7eb; transition: all 0.2s; }
        .uc-role-selected .uc-permission-item { background: white; border-color: #fdba74; color: #c24b0e; }
        .uc-no-permissions { font-size: 13px; color: #9ca3af; font-style: italic; margin: 0; margin-top: auto; padding-top: 16px; border-top: 1px solid #f3f4f6; }

        /* Footer & Boutons */
        .uc-card-footer { padding: 16px 24px; background: #f9fafb; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap; }
        .uc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .uc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .uc-btn-primary { background: #F26A22; color: white; box-shadow: 0 2px 4px rgba(242, 106, 34, 0.2); }
        .uc-btn-primary:hover:not(:disabled) { background: #d95a1a; }
        .uc-btn-secondary { background: white; color: #374151; border-color: #d1d5db; }
        .uc-btn-secondary:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
        .uc-btn-outline { background: white; color: #F26A22; border-color: #fdba74; }
        .uc-btn-outline:hover:not(:disabled) { background: #fff7ed; border-color: #F26A22; }
        .uc-spinner-btn { animation: uc-spin 1s linear infinite; }
        @keyframes uc-spin { to { transform: rotate(360deg); } }

        /* Modal */
        .uc-modal-overlay { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; animation: uc-fade-in 0.2s ease-out; }
        @keyframes uc-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .uc-modal { background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto; animation: uc-scale-in 0.2s ease-out; }
        @keyframes uc-scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .uc-modal-header { padding: 24px 24px 0 24px; }
        .uc-modal-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 8px 0; }
        .uc-modal-subtitle { font-size: 14px; color: #6b7280; margin: 0; }
        .uc-modal-body { padding: 24px; }
        .uc-modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }

        /* Loading State */
        .uc-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #6b7280; }
        .uc-spinner { width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top-color: #F26A22; border-radius: 50%; animation: uc-spin 0.8s linear infinite; margin-bottom: 16px; }

        /* Responsive */
        @media (min-width: 640px) {
          .uc-form-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 639px) {
          .uc-roles-grid { grid-template-columns: 1fr; }
          
          .uc-info-box {
            flex-direction: column;
            gap: 12px;
          }
          .uc-info-icon {
            margin-top: 0;
          }
          
          .uc-modal-actions {
            flex-direction: column;
            gap: 12px;
          }
          .uc-modal-actions .uc-btn {
            width: 100%;
            justify-content: center;
            white-space: normal;
          }
          .uc-card-footer {
            flex-direction: column-reverse;
            align-items: stretch;
          }
          .uc-card-footer .uc-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default UserCreateSection;