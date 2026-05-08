/**
 * ProfileHeader Component
 * Reusable header with edit/save/cancel buttons
 */

import React from 'react';
import { Button } from '../ui/button';
import { Pencil, Save, X } from 'lucide-react';

export const ProfileHeader = ({
  title,
  subtitle,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
  disableSave = false
}) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        {subtitle && <p className="text-gray-400">{subtitle}</p>}
      </div>
      
      <div className="flex gap-2">
        {!editing ? (
          <Button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <>
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={saving}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={onSave}
              disabled={saving || disableSave}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};