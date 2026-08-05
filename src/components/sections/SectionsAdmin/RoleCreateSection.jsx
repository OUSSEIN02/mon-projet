import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Lock, Check, Plus, Minus, 
  AlertTriangle, Loader2, Settings
} from 'lucide-react';
import apiClient from '../../../services/apiClient'; // Ajustez le chemin
import toast from 'react-hot-toast';

const RoleCreateSection = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!roleId;

  // États du formulaire
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  // États des permissions
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);

 
    // 1. Chargement des permissions disponibles (déjà groupées par le backend)
    useEffect(() => {
        const fetchPermissions = async () => {
          try {
            const response = await apiClient.get('/dashboard/permissions');
            const data = response.data.data || response.data;
            
            // ✅ Utiliser directement les données car le backend les envoie déjà groupées
            if (Array.isArray(data)) {
              setPermissionGroups(data);
            } else {
              console.error("Format de données inattendu:", data);
              toast.error("Format de données des permissions invalide");
            }
          } catch (error) {
            console.error("Erreur chargement permissions:", error);
            toast.error("Impossible de charger les permissions");
          }
        };
        fetchPermissions();
      }, []);


  // 2. Chargement du rôle (si mode édition)
  useEffect(() => {
    if (isEditMode) {
      const fetchRole = async () => {
        setLoading(true);
        try {
          const response = await apiClient.get(`/dashboard/roles/${roleId}`);
          const role = response.data.data || response.data;
          
          setFormData({
            name: role.name || '',
            slug: role.slug || '',
            description: role.description || ''
          });
          
          if (role.permissions && Array.isArray(role.permissions)) {
            setSelectedPermissions(role.permissions.map(p => p.id));
          }
          
          // Simule un rôle système (ex: si slug === 'admin' ou 'super-admin')
          setIsSystemRole(role.slug === 'admin' || role.slug === 'super-admin');
        } catch (error) {
          console.error("Erreur chargement rôle:", error);
          toast.error("Impossible de charger les données du rôle");
        } finally {
          setLoading(false);
        }
      };
      fetchRole();
    }
  }, [isEditMode, roleId]);



  // Génération automatique du slug
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
  };

  const handleDescriptionChange = (e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  // Gestion des permissions
  const togglePermission = (permId) => {
    console.log(permId);
    if (isSystemRole) return;
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
    if (errors.permissions) setErrors(prev => ({ ...prev, permissions: '' }));
  };

  const toggleGroup = (group) => {
    if (isSystemRole) return;
    const groupPermIds = group.permissions.map(p => p.id);
    const allSelected = groupPermIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !groupPermIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...groupPermIds])]);
    }
  };

  const toggleAll = () => {
    if (isSystemRole) return;
    const allPermIds = permissionGroups.flatMap(g => g.permissions.map(p => p.id));
    const allSelected = allPermIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allPermIds);
    }
  };

  // Helpers d'état des groupes
  const isGroupFullySelected = (group) => {
    return group.permissions.every(p => selectedPermissions.includes(p.id));
  };

  const isGroupPartiallySelected = (group) => {
    const selectedCount = group.permissions.filter(p => selectedPermissions.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < group.permissions.length;
  };

  // Validation et Soumission
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom du rôle est requis';
    if (!formData.slug.trim()) newErrors.slug = 'Le slug est requis';
    if (selectedPermissions.length === 0) newErrors.permissions = 'Sélectionnez au moins une permission';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSystemRole && isEditMode && !showSystemModal) {
      setShowSystemModal(true);
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        permission_ids: selectedPermissions
      };

      if (isEditMode) {
        await apiClient.put(`/dashboard/roles/${roleId}`, payload);
        toast.success('Rôle mis à jour avec succès');
      } else {
        await apiClient.post('/dashboard/users-roles-permissions', payload);
        toast.success('Rôle créé avec succès');
      }
      
      setTimeout(() => navigate('/dashboard/roles'), 500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Une erreur est survenue';
      toast.error(errorMsg);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
      setShowSystemModal(false);
    }
  };

  const goBack = () => navigate('/dashboard/users-roles-permissions');

  if (loading && isEditMode) {
    return (
      <div className="rc-container">
        <div className="rc-loading">
          <div className="rc-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  const totalSelected = selectedPermissions.length;

  return (
    <div className="rc-container">
      {/* Header avec breadcrumb */}
      <div className="rc-header">
        <nav className="rc-breadcrumb" aria-label="Breadcrumb">
          <button onClick={goBack} className="rc-breadcrumb-link">
            <ArrowLeft size={16} />
            <span>Retour aux rôles</span>
          </button>
          <span className="rc-breadcrumb-separator">/</span>
          <span className="rc-breadcrumb-current">
            {isEditMode ? 'Modifier le rôle' : 'Nouveau rôle'}
          </span>
        </nav>

        <div className="rc-title-section">
          <h2 className="rc-title">
            {isEditMode ? 'Modifier le rôle' : 'Nouveau rôle'}
          </h2>
          <p className="rc-subtitle">
            {isEditMode 
              ? 'Modifiez les détails et les permissions du rôle' 
              : 'Créez un nouveau rôle et définissez ses permissions'}
          </p>
        </div>
      </div>

      {/* Formulaire principal */}
      <form onSubmit={handleSubmit} className="rc-form">
        {/* Carte Informations de base */}
        <div className="rc-card">
          <div className="rc-card-body">
            <h3 className="rc-section-title">Informations de base</h3>

            <div className="rc-form-grid">
              <div className="rc-form-group">
                <label htmlFor="name" className="rc-label">
                  Nom du rôle <span className="rc-required">*</span>
                </label>
                <input 
                  type="text" 
                  id="name" 
                  value={formData.name} 
                  onChange={handleNameChange}
                  className={`rc-input ${errors.name ? 'rc-error' : ''}`}
                  placeholder="Ex: Gestionnaire de contenu"
                />
                {errors.name && <p className="rc-error-text">{errors.name}</p>}
              </div>

              <div className="rc-form-group">
                <label htmlFor="slug" className="rc-label">
                  Slug <span className="rc-required">*</span>
                </label>
                <div className="rc-input-wrapper">
                  <input 
                    type="text" 
                    id="slug" 
                    value={formData.slug} 
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    readOnly={isSystemRole}
                    className={`rc-input ${isSystemRole ? 'rc-readonly' : ''} ${errors.slug ? 'rc-error' : ''}`}
                    placeholder="ex: content-manager"
                  />
                  {isSystemRole && <Lock size={18} className="rc-input-icon-right" />}
                </div>
                {errors.slug && <p className="rc-error-text">{errors.slug}</p>}
                <p className="rc-hint">Identifiant unique utilisé dans le système</p>
              </div>

              <div className="rc-form-group rc-col-span-2">
                <label htmlFor="description" className="rc-label">Description</label>
                <textarea 
                  id="description" 
                  rows="3" 
                  value={formData.description} 
                  onChange={handleDescriptionChange}
                  className="rc-textarea"
                  placeholder="Description des responsabilités et accès accordés par ce rôle"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Carte Permissions */}
        <div className="rc-card">
          <div className="rc-card-body">
            <div className="rc-perm-header">
              <div className="rc-perm-title-wrapper">
                <h3 className="rc-section-title rc-mb-0">Permissions</h3>
                {totalSelected > 0 && (
                  <span className="rc-perm-count">{totalSelected} sélectionnée(s)</span>
                )}
              </div>
              <button 
                type="button" 
                onClick={toggleAll} 
                disabled={isSystemRole}
                className="rc-btn rc-btn-sm rc-btn-outline"
              >
                {totalSelected > 0 && totalSelected === permissionGroups.flatMap(g => g.permissions).length ? (
                  <><Minus size={14} /> Tout désélectionner</>
                ) : (
                  <><Plus size={14} /> Tout sélectionner</>
                )}
              </button>
            </div>

            <div className="rc-perm-groups">
              {permissionGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="rc-perm-group">
                  <div className="rc-perm-group-header">
                    <div className="rc-perm-group-title">
                      <h4>{group.name}</h4>
                      {isGroupPartiallySelected(group) && (
                        <span className="rc-badge rc-badge-warning">Sélection partielle</span>
                      )}
                      {isGroupFullySelected(group) && (
                        <span className="rc-badge rc-badge-success">Tout sélectionné</span>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => toggleGroup(group)}
                      disabled={isSystemRole}
                      className="rc-btn-link"
                    >
                      {isGroupFullySelected(group) ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>

                  <div className="rc-perm-grid">
                    {group.permissions.map(perm => {
                        const isSelected = selectedPermissions.includes(perm.id); // ✅ perm.id est maintenant un vrai nombre (1, 2, 3...)
                        
                        return (
                        <label 
                            key={perm.id} 
                            className={`rc-perm-item ${isSelected ? 'rc-perm-selected' : ''}`}
                        >
                            <div className="rc-perm-checkbox-wrapper">
                            <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => !isSystemRole && togglePermission(perm.id)} // ✅ Utilise le vrai ID
                                disabled={isSystemRole}
                                className="rc-checkbox"
                            />
                            {isSelected && <Check size={14} className="rc-checkbox-icon" />}
                            </div>
                            <div className="rc-perm-info">
                            <span className="rc-perm-name">{perm.name}</span>
                            <p className="rc-perm-desc">{perm.description || 'Aucune description'}</p>
                            </div>
                        </label>
                        );
                    })}
                    </div>
                </div>
              ))}
            </div>

            {errors.permissions && (
              <div className="rc-error-block">
                <AlertTriangle size={20} />
                <p>Sélectionnez au moins une permission pour ce rôle</p>
              </div>
            )}

            {isSystemRole && (
              <div className="rc-warning-block">
                <AlertTriangle size={20} />
                <div>
                  <h4>Rôle système</h4>
                  <p>Ce rôle est essentiel au fonctionnement du système. La modification de ses permissions peut avoir des conséquences importantes sur l'application.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions du formulaire */}
        <div className="rc-form-actions">
          <button type="button" onClick={goBack} className="rc-btn rc-btn-secondary">
            <ArrowLeft size={16} /> Annuler
          </button>

          <button type="submit" disabled={submitting} className="rc-btn rc-btn-primary">
            {submitting ? (
              <><Loader2 size={18} className="rc-spinner-btn" /> Traitement...</>
            ) : (
              isEditMode ? 'Mettre à jour' : 'Créer le rôle'
            )}
          </button>
        </div>
      </form>

      {/* Modal de confirmation rôle système */}
      {showSystemModal && (
        <div className="rc-modal-overlay" onClick={() => setShowSystemModal(false)}>
          <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rc-modal-icon-wrapper rc-warning-bg">
              <AlertTriangle size={24} className="rc-warning-text" />
            </div>
            <h3 className="rc-modal-title">Modifier un rôle système</h3>
            <p className="rc-modal-text">
              Vous êtes sur le point de modifier un rôle système. Cette action peut avoir des conséquences importantes sur le fonctionnement de l'application. Êtes-vous sûr de vouloir continuer ?
            </p>
            <div className="rc-modal-actions">
              <button onClick={() => setShowSystemModal(false)} className="rc-btn rc-btn-secondary">
                Annuler
              </button>
              <button onClick={handleSubmit} className="rc-btn rc-btn-warning">
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Unique et Préfixé (rc-) */}
      <style>{`
        :root {
          --rc-primary: #F26A22;
          --rc-primary-hover: #d95a1a;
          --rc-primary-light: #fff7ed;
          --rc-text: #111827;
          --rc-text-muted: #6b7280;
          --rc-border: #e5e7eb;
          --rc-bg: #f9fafb;
          --rc-danger: #dc2626;
          --rc-warning: #f59e0b;
          --rc-warning-bg: #fef3c7;
          --rc-warning-text: #92400e;
          --rc-success: #16a34a;
          --rc-success-bg: #dcfce7;
          --rc-success-text: #166534;
        }

        .rc-container {
          max-width: 1024px;
          margin: 0 auto;
          padding: 24px;
          color: var(--rc-text);
          
        }
        .rc-container * { box-sizing: border-box; }

        /* Header */
        .rc-header { margin-bottom: 24px; }
        .rc-breadcrumb {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; margin-bottom: 16px; color: var(--rc-text-muted);
        }
        .rc-breadcrumb-link {
          display: flex; align-items: center; gap: 6px;
          color: var(--rc-text-muted); background: none; border: none;
          cursor: pointer; font-size: 14px; transition: color 0.2s;
        }
        .rc-breadcrumb-link:hover { color: var(--rc-primary); }
        .rc-breadcrumb-separator { color: #d1d5db; }
        .rc-breadcrumb-current { font-weight: 500; color: var(--rc-text); }
        .rc-title { font-size: 24px; font-weight: 700; color: var(--rc-text); margin: 0 0 4px 0; }
        .rc-subtitle { font-size: 14px; color: var(--rc-text-muted); margin: 0; }

        /* Cartes */
        .rc-card {
          background: white; border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid var(--rc-border);
          margin-bottom: 24px; overflow: hidden;
        }
        .rc-card-body { padding: 24px; }
        .rc-section-title {
          font-size: 18px; font-weight: 600; color: var(--rc-text);
          margin: 0 0 20px 0; padding-bottom: 12px; border-bottom: 1px solid var(--rc-border);
        }
        .rc-mb-0 { margin-bottom: 0; }

        /* Formulaire */
        .rc-form-grid {
          display: grid; grid-template-columns: 1fr; gap: 20px;
        }
        .rc-col-span-2 { grid-column: span 1; }
        .rc-form-group { display: flex; flex-direction: column; }
        .rc-label { font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .rc-required { color: var(--rc-danger); }
        .rc-input, .rc-textarea {
          width: 100%; padding: 10px 14px; border: 1px solid #d1d5db;
          border-radius: 8px; font-size: 14px; color: var(--rc-text);
          background: white; transition: all 0.2s;
        }
        .rc-textarea { resize: vertical; min-height: 80px; }
        .rc-input:focus, .rc-textarea:focus {
          outline: none; border-color: var(--rc-primary);
          box-shadow: 0 0 0 3px rgba(242, 106, 34, 0.1);
        }
        .rc-input.rc-error, .rc-textarea.rc-error { border-color: var(--rc-danger); }
        .rc-input.rc-readonly { background: var(--rc-bg); cursor: not-allowed; }
        .rc-input-wrapper { position: relative; }
        .rc-input-icon-right {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          color: #9ca3af;
        }
        .rc-hint { font-size: 12px; color: var(--rc-text-muted); margin-top: 4px; }
        .rc-error-text { font-size: 12px; color: var(--rc-danger); margin-top: 4px; margin-bottom: 0; }

        /* Permissions Header */
        .rc-perm-header {
          display: flex; flex-direction: column; gap: 16px;
          margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--rc-border);
        }
        .rc-perm-title-wrapper { display: flex; align-items: center; gap: 12px; }
        .rc-perm-count { font-size: 13px; color: var(--rc-text-muted); }

        /* Groupes de permissions */
        .rc-perm-groups { display: flex; flex-direction: column; gap: 24px; }
        .rc-perm-group {
          background: var(--rc-bg); border-radius: 8px; padding: 16px;
        }
        .rc-perm-group-header {
          display: flex; flex-direction: column; gap: 12px;
          margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;
        }
        .rc-perm-group-title { display: flex; align-items: center; gap: 8px; }
        .rc-perm-group-title h4 { font-size: 14px; font-weight: 600; color: var(--rc-text); margin: 0; }
        
        .rc-badge {
          display: inline-flex; align-items: center; padding: 2px 8px;
          border-radius: 9999px; font-size: 11px; font-weight: 600;
        }
        .rc-badge-warning { background: var(--rc-warning-bg); color: var(--rc-warning-text); }
        .rc-badge-success { background: var(--rc-success-bg); color: var(--rc-success-text); }

        .rc-perm-grid {
          display: grid; grid-template-columns: 1fr; gap: 12px;
        }
        .rc-perm-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px; background: white; border-radius: 6px;
          border-left: 3px solid transparent;
          cursor: pointer; transition: all 0.2s;
        }
        .rc-perm-item:hover { background: #f3f4f6; }
        .rc-perm-item.rc-perm-selected {
          background: var(--rc-primary-light);
          border-left-color: var(--rc-primary);
        }
        .rc-perm-checkbox-wrapper { position: relative; margin-top: 2px; flex-shrink: 0; }
        .rc-checkbox {
          width: 18px; height: 18px; border: 2px solid #d1d5db;
          border-radius: 4px; cursor: pointer; appearance: none; transition: all 0.2s;
        }
        .rc-perm-selected .rc-checkbox { background: var(--rc-primary); border-color: var(--rc-primary); }
        .rc-checkbox-icon {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%); color: white; pointer-events: none;
        }
        .rc-perm-info { flex: 1; }
        .rc-perm-name {
          display: block; font-size: 14px; font-weight: 500;
          color: var(--rc-text); margin-bottom: 2px;
        }
        .rc-perm-selected .rc-perm-name { color: #9a3412; }
        .rc-perm-desc {
          font-size: 12px; color: var(--rc-text-muted); margin: 0;
        }
        .rc-perm-selected .rc-perm-desc { color: #c24b0e; }

        /* Alertes */
        .rc-error-block, .rc-warning-block {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px; border-radius: 8px; margin-top: 24px;
        }
        .rc-error-block { background: #fef2f2; border-left: 4px solid var(--rc-danger); color: #991b1b; }
        .rc-warning-block { background: var(--rc-warning-bg); border-left: 4px solid var(--rc-warning); color: var(--rc-warning-text); }
        .rc-warning-block h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; }
        .rc-warning-block p { margin: 0; font-size: 13px; line-height: 1.4; }

        /* Boutons */
        .rc-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 20px; font-size: 14px; font-weight: 600;
          border-radius: 8px; border: 1px solid transparent;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .rc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .rc-btn-sm { padding: 6px 12px; font-size: 13px; }
        .rc-btn-primary { background: var(--rc-primary); color: white; }
        .rc-btn-primary:hover:not(:disabled) { background: var(--rc-primary-hover); }
        .rc-btn-secondary { background: white; color: #374151; border-color: #d1d5db; }
        .rc-btn-secondary:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
        .rc-btn-outline { background: white; color: var(--rc-primary); border-color: #fdba74; }
        .rc-btn-outline:hover:not(:disabled) { background: var(--rc-primary-light); border-color: var(--rc-primary); }
        .rc-btn-warning { background: var(--rc-warning); color: white; }
        .rc-btn-warning:hover:not(:disabled) { background: #d97706; }
        .rc-btn-link {
          background: none; border: none; color: var(--rc-primary);
          font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .rc-btn-link:hover:not(:disabled) { color: var(--rc-primary-hover); text-decoration: underline; }
        .rc-spinner-btn { animation: rc-spin 1s linear infinite; }
        @keyframes rc-spin { to { transform: rotate(360deg); } }

        .rc-form-actions {
          display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap;
        }

        /* Modal */
        .rc-modal-overlay {
          position: fixed; inset: 0; background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; padding: 16px; z-index: 50;
          animation: rc-fade-in 0.2s ease-out;
        }
        @keyframes rc-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .rc-modal {
          background: white; border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          max-width: 448px; width: 100%; padding: 24px;
          animation: rc-scale-in 0.2s ease-out; text-align: center;
        }
        @keyframes rc-scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .rc-modal-icon-wrapper {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
        }
        .rc-warning-bg { background: var(--rc-warning-bg); }
        .rc-warning-text { color: var(--rc-warning); }
        .rc-modal-title { font-size: 18px; font-weight: 700; color: var(--rc-text); margin: 0 0 8px 0; }
        .rc-modal-text { font-size: 14px; color: var(--rc-text-muted); line-height: 1.5; margin: 0 0 24px 0; }
        .rc-modal-actions { display: flex; justify-content: center; gap: 12px; }

        /* Loading */
        .rc-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 400px; color: var(--rc-text-muted);
        }
        .rc-spinner {
          width: 40px; height: 40px; border: 3px solid #f3f4f6;
          border-top-color: var(--rc-primary); border-radius: 50%;
          animation: rc-spin 0.8s linear infinite; margin-bottom: 16px;
        }

        /* Responsive */
        @media (min-width: 640px) {
          .rc-form-grid { grid-template-columns: repeat(2, 1fr); }
          .rc-col-span-2 { grid-column: span 2; }
          .rc-perm-header { flex-direction: row; justify-content: space-between; align-items: center; }
          .rc-perm-group-header { flex-direction: row; justify-content: space-between; align-items: center; }
          .rc-perm-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .rc-perm-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default RoleCreateSection;