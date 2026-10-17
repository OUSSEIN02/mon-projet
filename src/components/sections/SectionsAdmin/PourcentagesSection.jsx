import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Percent, Save, Info, AlertCircle, CheckCircle, Bike, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader'; // Ajustez le chemin si nécessaire

const PourcentagesSection = () => {
  const [percentage, setPercentage] = useState('');
  const [simAmount, setSimAmount] = useState(5000); // Montant par défaut pour l'exemple
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // 1. Chargement de la valeur actuelle
  useEffect(() => {
    fetchPercentage();
  }, []);

  const fetchPercentage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/settings/delivery-percentage');
      const val = response.data.percentage !== undefined ? response.data.percentage : 70;
      setPercentage(val.toString());
    } catch (err) {
      console.error("Erreur chargement pourcentage:", err);
      setError("Impossible de charger les paramètres de pourcentage.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Gestion de la saisie du pourcentage
  const handlePercentageChange = (e) => {
    const value = e.target.value;
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setPercentage(value);
    }
  };

  // 3. Sauvegarde
  const handleSave = async (e) => {
    e.preventDefault();
    const numPercentage = parseFloat(percentage);
    
    if (isNaN(numPercentage) || percentage === '') {
      toast.error('Veuillez entrer un pourcentage valide entre 0 et 100.');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.post('/admin/settings/delivery-percentage', { 
        percentage: numPercentage 
      });
      toast.success('Répartition des revenus mise à jour avec succès !');
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Calculs dynamiques pour la simulation
  const currentPct = parseFloat(percentage) || 0;
  const platformPct = (100 - currentPct).toFixed(1);
  const driverShare = Math.round(simAmount * (currentPct / 100));
  const platformShare = simAmount - driverShare;

  const formatMoney = (amount) => amount.toLocaleString('fr-FR');

  if (isLoading) {
    return <Loader text="Chargement des paramètres..." fullScreen={false} size="lg" />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pc-container">
      <div className="pc-header">
        <div className="pc-header-title">
          <h2>Configuration des Pourcentages</h2>
          <p className="pc-subtitle">Définissez la part des frais de livraison reversée aux livreurs</p>
        </div>
      </div>

      {error && (
        <div className="pc-error-box">
          <AlertCircle size={18} className="pc-error-icon" />
          <span className="pc-error-text">{error}</span>
          <button className="pc-error-retry" onClick={fetchPercentage}>Réessayer</button>
        </div>
      )}

      <div className="pc-grid">
        {/* COLONNE GAUCHE : Formulaire de configuration */}
        <div className="pc-card">
          <div className="pc-card-header">
            <div className="pc-icon-wrapper">
              <Percent size={24} />
            </div>
            <div>
              <h3 className="pc-card-title">Part du Livreur</h3>
              <p className="pc-card-desc">Pourcentage du montant total de la livraison attribué au livreur.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="pc-form">
            <div className="pc-input-group">
              <label htmlFor="percentage" className="pc-label">
                Pourcentage reversé au livreur (%)
              </label>
              <div className="pc-input-wrapper">
                <input
                  type="number"
                  id="percentage"
                  value={percentage}
                  onChange={handlePercentageChange}
                  className="pc-input"
                  placeholder="Ex: 70"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                />
                <span className="pc-input-suffix">%</span>
              </div>
              <p className="pc-hint">
                Le reste, soit <strong>{platformPct}%</strong>, sera conservé par la plateforme (frais de service et gestion).
              </p>
            </div>

            <div className="pc-actions">
              <button
                type="submit"
                className="pc-btn pc-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="pc-spinner"></span>
                    <span>Sauvegarde en cours...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Enregistrer les modifications</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* COLONNE DROITE : Simulation interactive */}
        <div className="pc-sim-card">
          <div className="pc-sim-header">
            <Info size={20} className="pc-sim-icon" />
            <h3 className="pc-sim-title">Simulation de répartition</h3>
          </div>
          
          <div className="pc-sim-input-group">
            <label className="pc-sim-label">Montant payé par le client (FCFA)</label>
            <input 
              type="number" 
              value={simAmount} 
              onChange={(e) => setSimAmount(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
              className="pc-sim-input"
              min="0"
              step="100"
            />
          </div>

          <div className="pc-sim-breakdown">
            <div className="pc-sim-row pc-sim-total">
              <span>Montant total de la course</span>
              <span className="pc-sim-value">{formatMoney(simAmount)} FCFA</span>
            </div>
            
            <div className="pc-sim-divider"></div>
            
            <div className="pc-sim-row pc-sim-driver">
              <div className="pc-sim-label-icon">
                <Bike size={18} />
                <span>Part du Livreur ({currentPct}%)</span>
              </div>
              <span className="pc-sim-value pc-sim-value-highlight">{formatMoney(driverShare)} FCFA</span>
            </div>
            
            <div className="pc-sim-row pc-sim-platform">
              <div className="pc-sim-label-icon">
                <Building2 size={18} />
                <span>Part de la Plateforme ({platformPct}%)</span>
              </div>
              <span className="pc-sim-value">{formatMoney(platformShare)} FCFA</span>
            </div>
          </div>

          <div className="pc-sim-note">
            <Info size={14} />
            <span>Cet exemple illustre comment les frais sont divisés automatiquement à chaque nouvelle commande.</span>
          </div>
        </div>
      </div>

      <div className="pc-panel">
        <div className="pc-panel-head">
          <h3>Informations importantes</h3>
        </div>
        <div className="pc-legend-grid">
          <div className="pc-legend-item">
            <div className="pc-legend-header">
              <CheckCircle size={16} className="pc-icon-green" />
              <span className="pc-legend-title">Application future uniquement</span>
            </div>
            <span className="pc-legend-desc">La modification s'appliquera uniquement aux <strong>nouvelles commandes</strong> créées après la sauvegarde. L'historique des courses passées reste inchangé.</span>
          </div>
          <div className="pc-legend-item">
            <div className="pc-legend-header">
              <Percent size={16} className="pc-icon-orange" />
              <span className="pc-legend-title">Calcul automatique</span>
            </div>
            <span className="pc-legend-desc">Le système calcule et enregistre automatiquement la part du livreur dans la base de données lors de la validation de la commande par le client.</span>
          </div>
        </div>
      </div>

      <style>{`
        .pc-container { 
          --pc-primary: #f97316; 
          --pc-primary-hover: #ea580c; 
          --pc-orange: #f97316; 
          --pc-orange-light: #fff7ed; 
          --pc-green: #10b981; 
          --pc-green-light: #d1fae5;
          --pc-blue: #3b82f6;
          --pc-bg: #ffffff; 
          --pc-bg-secondary: #f8fafc; 
          --pc-border: #e2e8f0; 
          --pc-text: #0f172a; 
          --pc-text-muted: #64748b; 
          --pc-radius: 12px; 
          --pc-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);  
          color: var(--pc-text); 
          background: transparent; 
          padding: 24px; 
          width: 100%; 
          box-sizing: border-box; 
        }
        .pc-container * { box-sizing: border-box; }
        
        .pc-header { margin-bottom: 24px; }
        .pc-header-title h2 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: var(--pc-text); }
        .pc-subtitle { margin: 0; font-size: 14px; color: var(--pc-text-muted); }
        
        .pc-error-box { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px; color: #991b1b; font-size: 14px; }
        .pc-error-icon { flex-shrink: 0; } 
        .pc-error-text { flex: 1; }
        .pc-error-retry { margin-left: auto; background: none; border: none; color: #991b1b; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }
        .pc-error-retry:hover { background: #fee2e2; }

        /* GRILLE PRINCIPALE */
        .pc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        
        .pc-card, .pc-sim-card { background: var(--pc-bg); padding: 24px; border-radius: var(--pc-radius); box-shadow: var(--pc-shadow); border: 1px solid var(--pc-border); }
        
        .pc-card-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--pc-border); }
        .pc-icon-wrapper { width: 48px; height: 48px; border-radius: 10px; background: var(--pc-orange-light); display: flex; align-items: center; justify-content: center; color: var(--pc-orange); flex-shrink: 0; }
        .pc-card-title { margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: var(--pc-text); }
        .pc-card-desc { margin: 0; font-size: 14px; color: var(--pc-text-muted); line-height: 1.4; }

        .pc-form { display: flex; flex-direction: column; gap: 24px; }
        .pc-input-group { width: 100%; }
        .pc-label { display: block; font-size: 14px; font-weight: 600; color: var(--pc-text); margin-bottom: 8px; }
        .pc-input-wrapper { position: relative; display: flex; align-items: center; }
        .pc-input { width: 100%; padding: 12px 40px 12px 16px; border: 1px solid var(--pc-border); border-radius: 8px; font-size: 16px; font-weight: 600; color: var(--pc-text); outline: none; transition: all 0.2s; background: white; }
        .pc-input:focus { border-color: var(--pc-primary); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1); }
        .pc-input-suffix { position: absolute; right: 16px; font-size: 16px; font-weight: 600; color: var(--pc-text-muted); pointer-events: none; }
        .pc-hint { margin-top: 8px; font-size: 13px; color: var(--pc-text-muted); }
        .pc-hint strong { color: var(--pc-text); }

        .pc-actions { display: flex; justify-content: flex-end; padding-top: 8px; border-top: 1px solid var(--pc-border); }
        .pc-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; }
        .pc-btn-primary { background: var(--pc-primary); color: white; }
        .pc-btn-primary:hover:not(:disabled) { background: var(--pc-primary-hover); }
        .pc-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .pc-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: pc-spin 0.8s linear infinite; }
        @keyframes pc-spin { to { transform: rotate(360deg); } }

        /* STYLES DE LA SIMULATION */
        .pc-sim-card { border-top: 4px solid var(--pc-blue); }
        .pc-sim-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .pc-sim-icon { color: var(--pc-blue); }
        .pc-sim-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--pc-text); }
        
        .pc-sim-input-group { margin-bottom: 20px; }
        .pc-sim-label { display: block; font-size: 13px; font-weight: 600; color: var(--pc-text-muted); margin-bottom: 6px; }
        .pc-sim-input { width: 100%; padding: 10px 12px; border: 1px solid var(--pc-border); border-radius: 8px; font-size: 18px; font-weight: 700; color: var(--pc-text); outline: none; transition: border-color 0.2s; }
        .pc-sim-input:focus { border-color: var(--pc-blue); }

        .pc-sim-breakdown { background: var(--pc-bg-secondary); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .pc-sim-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px; }
        .pc-sim-total { font-weight: 700; color: var(--pc-text); font-size: 15px; }
        .pc-sim-divider { height: 1px; background: var(--pc-border); margin: 8px 0; }
        .pc-sim-label-icon { display: flex; align-items: center; gap: 8px; color: var(--pc-text-muted); }
        .pc-sim-driver .pc-sim-label-icon { color: var(--pc-green); font-weight: 600; }
        .pc-sim-platform .pc-sim-label-icon { color: var(--pc-text-muted); }
        .pc-sim-value { font-weight: 600; }
        .pc-sim-value-highlight { color: var(--pc-green); font-size: 16px; font-weight: 700; }

        .pc-sim-note { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--pc-text-muted); line-height: 1.4; background: #eff6ff; padding: 10px; border-radius: 6px; color: #1e40af; }

        /* PANNEAU INFÉRIEUR */
        .pc-panel { padding: 20px; background: var(--pc-bg-secondary); border-radius: var(--pc-radius); border: 1px solid var(--pc-border); }
        .pc-panel-head { margin-bottom: 16px; }
        .pc-panel-head h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--pc-text); }
        .pc-legend-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        .pc-legend-item { padding: 16px; background: white; border-radius: 8px; border: 1px solid var(--pc-border); }
        .pc-legend-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .pc-icon-orange { color: var(--pc-orange); } 
        .pc-icon-green { color: var(--pc-green); }
        .pc-legend-title { font-weight: 600; font-size: 14px; color: var(--pc-text); }
        .pc-legend-desc { font-size: 13px; color: var(--pc-text-muted); line-height: 1.5; display: block; }

        /* RESPONSIVE */
        @media (max-width: 900px) { 
          .pc-grid { grid-template-columns: 1fr; } 
        }
        @media (max-width: 640px) { 
          .pc-container { padding: 16px; }
          .pc-header-title h2 { font-size: 20px; }
          .pc-error-box { flex-direction: column; align-items: flex-start; gap: 8px; } 
          .pc-error-retry { margin-left: 0; width: 100%; text-align: center; padding: 8px; background: #fee2e2; border-radius: 6px; } 
          .pc-actions { justify-content: stretch; }
          .pc-btn { width: 100%; justify-content: center; }
          .pc-sim-row { flex-direction: column; align-items: flex-start; gap: 4px; }
          .pc-sim-value { align-self: flex-end; }
        }
      `}</style>
    </motion.div>
  );
};

export default PourcentagesSection;