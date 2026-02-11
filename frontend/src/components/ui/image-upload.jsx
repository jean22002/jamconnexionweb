import { useState, useRef } from "react";
import axios from "axios";
import { Upload, X, Loader2, User, Music, Image as ImageIcon } from "lucide-react";
import { Button } from "./button";
import ImageCropper from "./image-cropper";

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * Image Upload Component with Crop Functionality
 * Handles file upload with validation, cropping, and preview
 */
export function ImageUpload({
  value,
  onChange,
  token,
  uploadEndpoint,
  placeholder = "Sélectionner une image",
  icon: Icon = Upload,
  previewClassName = "w-full h-32",
  disabled = false,
  aspectRatio = "1/1", // "1/1" for profile (square), "16/9" for cover
  cropShape = "rect" // "rect" or "round"
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez JPG, PNG, GIF ou WebP.");
      return;
    }

    // Validate file size (10MB max for cropping)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("Fichier trop volumineux. Maximum 10MB.");
      return;
    }

    setError(null);
    
    // Create preview URL and show cropper
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    setShowCropper(false);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "cropped-image.jpg");

      const response = await axios.post(`${API}${uploadEndpoint}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      // Construct full image URL
      const imageUrl = `${API}${response.data.url}`;
      console.log('📸 Image upload successful:', {
        backendResponse: response.data.url,
        constructedUrl: imageUrl,
        API: API
      });
      onChange?.(imageUrl);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange?.("");
    setError(null);
  };

  return (
    <>
      {/* Image Cropper Dialog */}
      {showCropper && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={aspectRatio}
          cropShape={cropShape}
          open={showCropper}
        />
      )}

      <div className="space-y-2">
      {value && (
        <div className="relative group">
          <img
            src={value}
            alt="Preview"
            className={`${previewClassName} object-cover border-2 border-white/10 group-hover:border-primary/50 transition-colors rounded-lg`}
            onError={(e) => {
              console.error('❌ Image failed to load:', {
                src: value,
                error: e
              });
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', value);
            }}
          />
          <button
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
            type="button"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="w-full rounded-full border-dashed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Icon className="w-4 h-4 mr-2" />
              {value ? "Changer" : placeholder}
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF ou WebP. Max 5MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      </div>
    </>
  );
}

/**
 * Specialized components for different contexts
 */

// Musician Profile Image Upload
export function MusicianImageUpload({ value, onChange, token, photoType = "profile", disabled }) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      token={token}
      uploadEndpoint={`/api/upload/musician-photo?photo_type=${photoType}`}
      placeholder={photoType === "profile" ? "Photo de profil" : "Photo de couverture"}
      icon={photoType === "profile" ? User : Music}
      previewClassName={photoType === "profile" ? "w-24 h-24 rounded-full" : "w-full h-32 rounded-xl"}
      aspectRatio={photoType === "profile" ? "1/1" : "16/9"}
      cropShape={photoType === "profile" ? "round" : "rect"}
      disabled={disabled}
    />
  );
}

// Venue Profile Image Upload
export function VenueImageUpload({ value, onChange, token, photoType = "profile", disabled }) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      token={token}
      uploadEndpoint={`/api/upload/venue-photo?photo_type=${photoType}`}
      placeholder={photoType === "profile" ? "Photo de profil" : "Photo de couverture"}
      icon={photoType === "profile" ? User : ImageIcon}
      previewClassName={photoType === "profile" ? "w-24 h-24 rounded-xl" : "w-full h-32 rounded-xl"}
      aspectRatio={photoType === "profile" ? "1/1" : "16/9"}
      cropShape="rect"
      disabled={disabled}
    />
  );
}

// Melomane Profile Image Upload
export function MelomaneImageUpload({ value, onChange, token, disabled }) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      token={token}
      uploadEndpoint="/api/upload/melomane-photo"
      placeholder="Photo de profil"
      icon={User}
      previewClassName="w-24 h-24 rounded-full"
      aspectRatio="1/1"
      cropShape="round"
      disabled={disabled}
    />
  );
}
