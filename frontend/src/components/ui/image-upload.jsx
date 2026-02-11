import { useState, useRef } from "react";
import { Button } from "./button";
import { Upload, X, Loader2, User, Music, Image } from "lucide-react";
import axios from "axios";
import { ImageCropperDialog } from "./image-cropper";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function ImageUpload({ 
  value, 
  onChange, 
  onUpload,
  token,
  uploadEndpoint = "/upload/image",
  folder = "profiles",
  placeholder = "Photo",
  icon: Icon = User,
  className = "",
  previewClassName = "w-24 h-24 rounded-full",
  disabled = false,
  enableCrop = true, // Enable cropping by default
  cropAspectRatio = 1, // 1 for square, 16/9 for banner
  cropShape = "rect" // "rect" or "round"
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Format non supporté. Utilisez JPG, PNG, GIF ou WebP.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Fichier trop volumineux. Maximum 5MB.");
      return;
    }

    setError(null);

    // If cropping is enabled, show cropper
    if (enableCrop) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    } else {
      // Upload directly without cropping
      uploadFile(file);
    }
  };

  const handleCropComplete = async (croppedBlob) => {
    // Convert blob to file
    const croppedFile = new File([croppedBlob], "cropped-image.jpg", {
      type: "image/jpeg",
    });
    
    await uploadFile(croppedFile);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) {
        formData.append("folder", folder);
      }

      const response = await axios.post(`${API}${uploadEndpoint}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      onChange?.(imageUrl);
      onUpload?.(imageUrl);
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

  const handleRemove = () => {
    onChange?.("");
    setError(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className={`relative ${previewClassName} overflow-hidden bg-muted/50 flex items-center justify-center border border-white/10`}>
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
            </>
          ) : (
            <Icon className="w-8 h-8 text-muted-foreground" />
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        {!disabled && (
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-white/20 gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {value ? "Changer" : placeholder}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, GIF ou WebP. Max 5MB.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export function ProfileImageUpload({ value, onChange, token, disabled }) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      token={token}
      uploadEndpoint="/upload/musician-photo"
      placeholder="Photo de profil"
      icon={User}
      previewClassName="w-24 h-24 rounded-full"
      disabled={disabled}
    />
  );
}

export function BandImageUpload({ value, onChange, token, disabled }) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      token={token}
      uploadEndpoint="/upload/band-photo"
      placeholder="Photo du groupe"
      icon={Music}
      previewClassName="w-24 h-24 rounded-xl"
      disabled={disabled}
    />
  );
}

export function VenueImageUpload({ value, onChange, token, photoType = "profile", disabled }) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      token={token}
      uploadEndpoint={`/upload/venue-photo?photo_type=${photoType}`}
      placeholder={photoType === "profile" ? "Photo de profil" : "Photo de couverture"}
      icon={photoType === "profile" ? User : Image}
      previewClassName={photoType === "profile" ? "w-24 h-24 rounded-xl" : "w-full h-32 rounded-xl"}
      disabled={disabled}
    />
  );
}

export function MelomaneImageUpload({ value, onChange, token, disabled }) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      token={token}
      uploadEndpoint="/upload/melomane-photo"
      placeholder="Photo de profil"
      icon={User}
      previewClassName="w-24 h-24 rounded-full"
      disabled={disabled}
    />
  );
}
