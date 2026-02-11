/**
 * ProfileImageSection Component
 * Reusable component for profile and cover image upload
 */

import React from 'react';
import { Label } from '../ui/label';

export const ProfileImageSection = ({
  profileImageValue,
  coverImageValue,
  onProfileImageChange,
  onCoverImageChange,
  ImageUploadComponent,
  token,
  disabled = false,
  showCoverImage = true
}) => {
  return (
    <div className="space-y-6">
      {/* Profile Image */}
      <div className="space-y-2">
        <Label>Photo de profil</Label>
        <ImageUploadComponent
          value={profileImageValue}
          onChange={onProfileImageChange}
          token={token}
          photoType="profile"
          disabled={disabled}
        />
      </div>

      {/* Cover Image (optional) */}
      {showCoverImage && (
        <div className="space-y-2">
          <Label>Photo de couverture</Label>
          <ImageUploadComponent
            value={coverImageValue}
            onChange={onCoverImageChange}
            token={token}
            photoType="cover"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};