// components/ui/ConfirmationModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", cancelText = "Annuler", isDanger = false }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="cm-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="cm-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cm-header">
            <div className={`cm-icon-wrapper ${isDanger ? 'cm-icon-danger' : 'cm-icon-info'}`}>
              <AlertTriangle size={24} />
            </div>
            <h3 className="cm-title">{title}</h3>
            <button className="cm-close" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="cm-body">
            <p className="cm-message">{message}</p>
          </div>
          <div className="cm-footer">
            <button className="cm-btn cm-btn-secondary" onClick={onClose}>{cancelText}</button>
            <button className={`cm-btn ${isDanger ? 'cm-btn-danger' : 'cm-btn-primary'}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
      <style>{`
        .cm-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
        .cm-modal { background: #ffffff; border-radius: 16px; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); overflow: hidden; }
        .cm-header { display: flex; align-items: flex-start; gap: 16px; padding: 24px 24px 0 24px; }
        .cm-icon-wrapper { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cm-icon-danger { background: #fef2f2; color: #dc2626; }
        .cm-icon-info { background: #eff6ff; color: #2563eb; }
        .cm-title { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; flex: 1; padding-top: 4px; }
        .cm-close { background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s; display: flex; }
        .cm-close:hover { background: #f1f5f9; color: #0f172a; }
        .cm-body { padding: 16px 24px 24px 24px; }
        .cm-message { margin: 0; font-size: 15px; color: #475569; line-height: 1.5; }
        .cm-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .cm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .cm-btn-secondary { background: #ffffff; color: #0f172a; border-color: #e2e8f0; }
        .cm-btn-secondary:hover { background: #f1f5f9; }
        .cm-btn-primary { background: #2563eb; color: white; }
        .cm-btn-primary:hover { background: #1d4ed8; }
        .cm-btn-danger { background: #dc2626; color: white; }
        .cm-btn-danger:hover { background: #b91c1c; }
        @media (max-width: 640px) {
          .cm-footer { flex-direction: column-reverse; }
          .cm-footer .cm-btn { width: 100%; }
          .cm-header { padding: 20px 20px 0 20px; }
          .cm-body { padding: 16px 20px 20px 20px; }
          .cm-footer { padding: 16px 20px; }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default ConfirmationModal;