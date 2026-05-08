import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, X, Eye, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const InvoiceUpload = ({ concertId, currentInvoice, onUploadSuccess, token }) => {
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non autorisé. Utilisez PDF, JPEG, PNG ou WebP');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(
        `${API}/api/musicians/me/concerts/${concertId}/upload-invoice`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Facture uploadée avec succès');
      setShowUploadDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleView = () => {
    window.open(
      `${API}/api/musicians/me/concerts/${concertId}/invoice?auth=${token}`,
      '_blank'
    );
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette facture ?')) return;

    setDeleting(true);
    try {
      await axios.delete(
        `${API}/api/musicians/me/concerts/${concertId}/invoice`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      toast.success('Facture supprimée');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {currentInvoice ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="rounded-full gap-2"
          >
            <Eye className="w-4 h-4" />
            Voir la facture
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Supprimer
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUploadDialog(true)}
          className="rounded-full gap-2"
        >
          <Upload className="w-4 h-4" />
          Uploader facture
        </Button>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uploader une facture</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-primary/5">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-3 text-primary" />
                  <p className="mb-2 text-sm"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
                  <p className="text-xs text-muted-foreground">PDF, JPEG, PNG ou WebP (max. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="space-y-4">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-xl bg-black/5"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 rounded-full"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                    <FileText className="w-10 h-10 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Fichier sélectionné :</p>
                  <p>{selectedFile.name}</p>
                  <p className="text-xs mt-1">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUploadDialog(false);
              setSelectedFile(null);
              setPreviewUrl(null);
            }}>
              Annuler
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceUpload;
