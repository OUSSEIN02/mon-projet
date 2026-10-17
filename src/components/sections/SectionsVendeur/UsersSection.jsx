import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Users, Edit, Trash2, ChevronLeft, ChevronRight, 
  AlertTriangle, CheckCircle, Clock, Shield, Key 
} from 'lucide-react';

import apiClient from '../../../services/apiClient'; // Ajustez le chemin si nécessaire
import toast from 'react-hot-toast';
import defaultAvatar from '../../../assets/default-avatar.jpg'; // Image par défaut pour les avatars

const UsersSection = () => {
  const navigate = useNavigate();
  
  // États des données
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États des filtres et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // États de la modale
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Récupérer les rôles pour le filtre (au montage du composant)
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await apiClient.get('/dashboard/roles', {
            headers: { 'Authorization': `Bearer ${token}` }
        }); 
        
        const rolesData = response.data.data || response.data;
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (error) {
        console.error("Erreur chargement rôles:", error);
        // Fallback en cas d'erreur
        setRoles([
          { slug: 'admin', name: 'Administrateur' },
          { slug: 'manager', name: 'Manager' },
          { slug: 'support', name: 'Support' },
          { slug: 'user', name: 'Utilisateur standard' },
        ]);
      }
    };
    fetchRoles();
  }, []);

  // 2. Récupérer les utilisateurs (déclenché quand les filtres ou la page changent)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });

      const token = localStorage.getItem('access_token');
      const response = await apiClient.get(`/dashboard/users?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
      
      
      const responseData = response.data;
      const usersList = responseData.data || responseData; // Gère les deux formats courants
      
      setUsers(Array.isArray(usersList) ? usersList : []);
      setTotalItems(responseData.total || usersList.length);
      setTotalPages(responseData.last_page || 1);
      
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      toast.error("Impossible de charger la liste des utilisateurs");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, roleFilter]);

  // Debounce pour éviter de spammer l'API à chaque frappe clavier
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); // Attend 500ms après la dernière frappe

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Fonction utilitaire pour extraire les permissions uniques
  const getUniquePermissions = (roles) => {
    if (!roles || !Array.isArray(roles)) return [];
    const perms = new Map();
    roles.forEach(role => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(perm => {
          if (!perms.has(perm.name)) {
            perms.set(perm.name, perm);
          }
        });
      }
    });
    return Array.from(perms.values());
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // 3. Suppression dynamique
  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    
    try {
    const token = localStorage.getItem('access_token');
      await apiClient.delete(`/dashboard/users/${userToDelete.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
      
      toast.success("Utilisateur supprimé avec succès");
      closeDeleteModal();
      
      // Rafraîchir la liste pour mettre à jour la pagination correctement
      // Si on est sur la dernière page et qu'on supprime le dernier élément, on recule d'une page
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchUsers();
      }
      
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la suppression";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Gestionnaires de changement de filtre (réinitialisent la page à 1)
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="us-container">
      
      {/* Header */}
      <div className="us-header">
        <div className="us-header-content">
          <div className="us-header-left">
            <h2 className="us-title">
              <Users className="us-title-icon" size={28} />
              Utilisateurs
            </h2>
            <p className="us-subtitle">
              Gérez les utilisateurs, leurs rôles et leurs permissions
            </p>
          </div>
          <div className="us-header-right">
            <button 
              onClick={() => navigate('/dashboard/users-create')}
              className="us-btn us-btn-primary"
            >
              <Plus size={18} />
              Nouvel utilisateur
            </button>

            <button 
              onClick={() => navigate('/dashboard/create-roles')}
              className="us-btn us-btn-primary us-btn-primary2"
            >
              <Plus size={18} />
              Nouveau Role
            </button>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="us-card us-filters">
        <div className="us-filters-grid">
          <div className="us-filter-group us-filter-search">
            <label htmlFor="search" className="us-filter-label">Rechercher</label>
            <div className="us-input-wrapper">
              <Search className="us-input-icon" size={18} />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="us-input"
                placeholder="Rechercher par nom, email..."
              />
            </div>
          </div>

          <div className="us-filter-group">
            <label htmlFor="role-filter" className="us-filter-label">Rôle</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={handleRoleChange}
              className="us-select"
            >
              <option value="">Tous les rôles</option>
              {roles.map(role => (
                <option key={role.slug || role.id} value={role.slug || role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="us-card us-list-card">
        
        {loading && (
          <div className="us-loading">
            <div className="us-spinner"></div>
            <p className="us-loading-text">Chargement des utilisateurs...</p>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="us-empty">
            <Users className="us-empty-icon" size={48} />
            <h3 className="us-empty-title">Aucun utilisateur trouvé</h3>
            <p className="us-empty-text">
              {searchTerm || roleFilter ? "Aucun résultat ne correspond à vos filtres." : "Commencez par créer un nouvel utilisateur"}
            </p>
            {!searchTerm && !roleFilter && (
              <button 
                onClick={() => navigate('/users/create')}
                className="us-btn us-btn-primary"
              >
                <Plus size={18} />
                Créer un utilisateur
              </button>
            )}
          </div>
        )}

        {!loading && users.length > 0 && (
          <>
            {/* Vue mobile */}
            <div className="us-mobile-list">
              <div className="us-mobile-items">
                {users.map(user => (
                  <div key={user.id} className="us-mobile-item">
                    <div className="us-mobile-header">
                      <div className="us-mobile-user">
                      <div className="us-avatar us-avatar-sm">
                            <img 
                            src={user.avatarlivreur || user.avatarVendeur || defaultAvatar} 
                            alt={user.name || 'Avatar'} 
                            className="us-avatar-img"
                            onError={(e) => {
                                e.currentTarget.onerror = null; // Évite une boucle infinie si l'image par défaut échoue aussi
                                e.currentTarget.src = defaultAvatar;
                            }}
                            />
                        </div>
                        <div className="us-mobile-info">
                          <div className="us-mobile-name">{user.name || 'Utilisateur'}</div>
                          <div className="us-mobile-email">{user.email}</div>
                          <div className="us-mobile-status">
                            <span className={`us-badge-status ${user.email_verified_at ? 'us-verified' : 'us-pending'}`}>
                              <span className="us-status-dot"></span>
                              {user.email_verified_at ? 'Vérifié' : 'En attente'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="us-mobile-actions">
                        <button 
                          onClick={() => navigate(`/dashboard/users-roles-permissions/${user.id}`)}
                          className="us-icon-btn us-icon-btn-edit"
                          title="Modifier"
                        >
                          <Edit size={22} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(user)}
                          className="us-icon-btn us-icon-btn-delete"
                          title="Supprimer"
                        >
                          <Trash2 size={22} />
                        </button>
                      </div>
                    </div>

                    <div className="us-mobile-section">
                      <p className="us-mobile-section-title">
                        <Shield size={14} /> Rôles
                      </p>
                      <div className="us-badges">
                        {user.roles && user.roles.map((role, idx) => (
                          <span key={idx} className="us-badge us-badge-role">{role.name}</span>
                        ))}
                      </div>
                    </div>

                    <div className="us-mobile-section">
                      <p className="us-mobile-section-title">
                        <Key size={14} /> Permissions
                      </p>
                      <div className="us-badges">
                        {getUniquePermissions(user.roles).map((perm, idx) => (
                          <span key={idx} className="us-badge us-badge-perm">{perm.name}</span>
                        ))}
                        {getUniquePermissions(user.roles).length === 0 && (
                          <span className="us-empty-perm">Aucune permission spécifique</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vue desktop */}
            <div className="us-desktop-table">
              <table className="us-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôles</th>
                    <th>Permissions</th>
                    <th>Statut</th>
                    <th className="us-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                      <div className="us-user-cell">
                        <div className="us-avatar us-avatar-sm">
                            <img 
                            src={user.avatarlivreur || user.avatarVendeur || defaultAvatar} 
                            alt={user.name || 'Avatar'} 
                            className="us-avatar-img"
                            onError={(e) => {
                                e.currentTarget.onerror = null; // Évite une boucle infinie si l'image par défaut échoue aussi
                                e.currentTarget.src = defaultAvatar;
                            }}
                            />
                        </div>

                        <div className="us-user-info">
                            <div className="us-user-name">{user.name || 'Utilisateur'}</div>
                            <div className="us-user-email">{user.email}</div>
                        </div>
                        </div>
                      </td>
                      <td>
                        <div className="us-badges">
                          {user.roles && user.roles.map((role, idx) => (
                            <span key={idx} className="us-badge us-badge-role">{role.name}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="us-badges us-badges-wrap">
                          {getUniquePermissions(user.roles).slice(0, 3).map((perm, idx) => (
                            <span key={idx} className="us-badge us-badge-perm">{perm.name}</span>
                          ))}
                          {getUniquePermissions(user.roles).length > 3 && (
                            <span className="us-badge us-badge-more">
                              +{getUniquePermissions(user.roles).length - 3}
                            </span>
                          )}
                          {getUniquePermissions(user.roles).length === 0 && (
                            <span className="us-empty-perm">Aucune</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`us-badge-status ${user.email_verified_at ? 'us-verified' : 'us-pending'}`}>
                          {user.email_verified_at ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {user.email_verified_at ? 'Vérifié' : 'En attente'}
                        </span>
                      </td>
                      <td>
                        <div className="us-actions-cell">
                          <button 
                            onClick={() => navigate(`/dashboard/users-roles-permissions/${user.id}`)}
                            className="us-icon-btn us-icon-btn-edit"
                            title="Modifier"
                          >
                            <Edit size={22} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(user)}
                            className="us-icon-btn us-icon-btn-delete"
                            title="Supprimer"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="us-pagination">
                <div className="us-pagination-info">
                  <p className="us-pagination-info-mobile">
                    Page {currentPage} sur {totalPages}
                  </p>
                  <p className="us-pagination-info-desktop">
                    Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur{' '}
                    <span className="font-medium">{totalItems}</span> résultats
                  </p>
                </div>
                <div className="us-pagination-buttons">
                  <button 
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="us-btn us-btn-pagination"
                  >
                    <ChevronLeft size={18} />
                    <span className="us-btn-text-mobile">Précédent</span>
                  </button>
                  <button 
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="us-btn us-btn-pagination"
                  >
                    <span className="us-btn-text-mobile">Suivant</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de suppression */}
      {showDeleteModal && userToDelete && (
        <div className="us-modal-overlay" onClick={closeDeleteModal}>
          <div className="us-modal" onClick={(e) => e.stopPropagation()}>
            <div className="us-modal-body">
              <div className="us-modal-icon-wrapper">
                <AlertTriangle size={28} className="us-modal-icon" />
              </div>
              <h3 className="us-modal-title">Supprimer l'utilisateur</h3>
              <p className="us-modal-text">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>"{userToDelete.name}"</strong> ?<br/>
                Cette action est irréversible et supprimera toutes ses données associées.
              </p>
              <div className="us-modal-actions">
                <button 
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="us-btn us-btn-secondary"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="us-btn us-btn-danger"
                >
                  {isDeleting ? (
                    <>
                      <div className="us-btn-spinner"></div>
                      Suppression...
                    </>
                  ) : (
                    'Supprimer définitivement'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Unique et Préfixé (us-) avec couleurs Orange (#F26A22) et Noir */}
      <style>{`
        .us-container { max-width: 1280px; margin: 0 auto; padding: 24px; color: #111827; }
        .us-container * { box-sizing: border-box; }
        .us-header { margin-bottom: 24px; }
        .us-header-content { display: flex; flex-direction: column; gap: 16px; }
        .us-header-left { min-width: 0; flex: 1; }
        .us-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 12px; }
        .us-title-icon { color: #F26A22; }
        .us-subtitle { margin-top: 4px; font-size: 14px; color: #6b7280; }
        .us-header-right { display: flex; gap:20px; flex-wrap: wrap; }
        .us-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; text-decoration: none; white-space: nowrap; }
        .us-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .us-btn-primary { background: #F26A22; color: white; box-shadow: 0 2px 4px rgba(242, 106, 34, 0.2); }
        .us-btn-primary2 { background: #000; color: white; box-shadow: 0 2px 4px rgba(242, 106, 34, 0.2); }
        .us-btn-primary:hover:not(:disabled) { background: #d95a1a; transform: translateY(-1px); }
        .us-btn-secondary { background: white; color: #111827; border-color: #d1d5db; }
        .us-btn-secondary:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
        .us-btn-danger { background: #dc2626; color: white; }
        .us-btn-danger:hover:not(:disabled) { background: #b91c1c; }
        .us-btn-pagination { background: white; color: #111827; border-color: #d1d5db; padding: 10px 16px; font-weight: 500; }
        .us-btn-pagination:hover:not(:disabled) { background: #f9fafb; border-color: #F26A22; color: #F26A22; }
        .us-btn-spinner { width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: us-spin 0.8s linear infinite; }
        @keyframes us-spin { to { transform: rotate(360deg); } }
        .us-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f3f4f6; overflow: hidden; }
        .us-filters { margin-bottom: 24px; padding: 24px; }
       .us-filters-grid {
  display: flex;
  gap: 20px;
  align-items: end;
}

.us-filter-search {
  flex: 2;
}

.us-filter-group:not(.us-filter-search) {
  flex: 1;
}
        .us-filter-group { display: flex; flex-direction: column; }
        .us-filter-label { display: block; font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px; }
        .us-input-wrapper { position: relative; }
        .us-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .us-input, .us-select { width: 100%; padding: 10px 14px 10px 42px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; color: #111827; transition: all 0.2s; }
        .us-select { padding-left: 14px; cursor: pointer; }
        .us-input::placeholder { color: #9ca3af; }
        .us-input:focus, .us-select:focus { outline: none; border-color: #F26A22; box-shadow: 0 0 0 3px rgba(242, 106, 34, 0.1); }
        .us-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 256px; }
        .us-spinner { width: 48px; height: 48px; border: 3px solid #f3f4f6; border-top-color: #F26A22; border-radius: 50%; animation: us-spin 0.8s linear infinite; }
        .us-loading-text { margin-top: 16px; color: #6b7280; font-weight: 500; }
        .us-empty { text-align: center; padding: 48px 20px; }
        .us-empty-icon { color: #d1d5db; margin: 0 auto; }
        .us-empty-title { margin-top: 8px; font-size: 16px; font-weight: 600; color: #111827; }
        .us-empty-text { margin-top: 4px; font-size: 14px; color: #6b7280; }
        .us-empty .us-btn { margin-top: 24px; }
        .us-avatar { width: 48px; height: 48px; border-radius: 50%; background: #fff0eb; color: #F26A22; font-weight: 700; font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .us-avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .us-avatar-sm { width: 40px; height: 40px; font-size: 16px; }
        .us-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .us-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .us-badge-role { background: #fff0eb; color: #c24b0e; border: 1px solid rgba(242, 106, 34, 0.2); }
        .us-badge-perm { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
        .us-badge-more { background: #111827; color: white; }
        .us-badge-status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .us-verified { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .us-pending { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .us-status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .us-verified .us-status-dot { background: #22c55e; }
        .us-pending .us-status-dot { background: #f59e0b; }
        .us-empty-perm { font-size: 12px; color: #9ca3af; font-style: italic; }
        .us-icon-btn {  cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; }
        .us-icon-btn-edit { color: #374151; border-color: #e5e7eb; }
        
        .us-icon-btn-delete { color: #dc2626; border-color: #fecaca; }
        
        .us-mobile-list { display: block; }
        .us-mobile-items { border-top: 1px solid #f3f4f6; }
        .us-mobile-item { padding: 20px; border-bottom: 1px solid #f3f4f6; transition: background 0.2s; }
        .us-mobile-item:hover { background: #fafafa; }
        .us-mobile-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .us-mobile-user { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
        .us-mobile-info { min-width: 0; }
        .us-mobile-name { font-size: 15px; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .us-mobile-email { font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .us-mobile-status { margin-top: 6px; }
        .us-mobile-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .us-mobile-section { margin-bottom: 14px; }
        .us-mobile-section:last-child { margin-bottom: 0; }
        .us-mobile-section-title { font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .us-desktop-table { display: none; overflow-x: auto; }
        .us-table { width: 100%; border-collapse: collapse; }
        .us-table thead { background: #fafafa; }
        .us-table th { padding: 14px 24px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f3f4f6; }
        .us-th-actions { width: 1%; white-space: nowrap; text-align: right; }
        .us-table td { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .us-table tbody tr { transition: background 0.2s; }
        .us-table tbody tr:hover { background: #fafafa; }
        .us-table tbody tr:last-child td { border-bottom: none; }
        .us-user-cell { display: flex; align-items: center; gap: 16px; }
        .us-user-name { font-size: 14px; font-weight: 600; color: #111827; }
        .us-user-email { font-size: 13px; color: #6b7280; }
        .us-badges-wrap { max-width: 320px; }
        .us-actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
        .us-pagination { padding: 20px 24px; border-top: 1px solid #f3f4f6; background: #fafafa; display: flex; flex-direction: column; gap: 16px; }
        .us-pagination-info-mobile { font-size: 14px; color: #6b7280; margin: 0; }
        .us-pagination-info-desktop { display: none; font-size: 14px; color: #6b7280; margin: 0; }
        .us-pagination-info .font-medium { font-weight: 600; color: #111827; }
        .us-pagination-buttons { display: flex; justify-content: space-between; gap: 8px; width: 100%; }
        .us-btn-text-mobile { display: inline; }
        .us-modal-overlay { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; animation: us-fade-in 0.2s ease-out; }
        @keyframes us-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .us-modal { background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); max-width: 448px; width: 100%; animation: us-scale-in 0.2s ease-out; border: 1px solid #f3f4f6; }
        @keyframes us-scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .us-modal-body { padding: 32px 24px; text-align: center; }
        .us-modal-icon-wrapper { width: 56px; height: 56px; border-radius: 50%; background: #fef2f2; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .us-modal-icon { color: #dc2626; }
        .us-modal-title { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
        .us-modal-text { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 28px 0; }
        .us-modal-actions { display: flex; justify-content: center; gap: 12px; }
        .us-modal-actions .us-btn { flex: 1; }
        @media (min-width: 640px) {
          .us-filters-grid { grid-template-columns: 2fr 1fr; gap: 24px; }
          .us-filter-search { grid-column: span 2; }
          .us-mobile-list { display: none; }
          .us-desktop-table { display: block; }
          .us-pagination { flex-direction: row; align-items: center; justify-content: space-between; }
          .us-pagination-info-mobile { display: none; }
          .us-pagination-info-desktop { display: block; }
          .us-pagination-buttons { width: auto; }
        }
        @media (min-width: 1024px) {
          .us-header-content { flex-direction: row; align-items: center; justify-content: space-between; }
          .us-header-right { margin-top: 0;   }
          
        }
        @media (max-width: 639px) {
          .us-container { padding: 16px; }
          .us-title { font-size: 22px; }
          .us-btn { width: 100%; }
          .us-btn-pagination { flex: 1; }
        }
      `}</style>
    </div>
  );
};

export default UsersSection;