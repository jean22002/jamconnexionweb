import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "./button";
import { Slider } from "./slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { ZoomIn, ZoomOut, RotateCw, Crop } from "lucide-react";

/**
 * Image Cropper Component
 * Allows users to crop and zoom images before uploading
 * 
 * @param {string} imageSrc - Source URL of the image to crop
 * @param {function} onCropComplete - Callback with cropped image blob
 * @param {function} onCancel - Callback when user cancels
 * @param {string} aspectRatio - Aspect ratio (e.g., "1/1" for profile, "16/9" for cover)
 * @param {boolean} open - Dialog open state
 */
export default function ImageCropper({ 
  imageSrc, 
  onCropComplete, 
  onCancel, 
  aspectRatio = "1/1",
  cropShape = "rect", // "rect" or "round"
  open = true 
}) {
  console.log('[ImageCropper] Component mounted/updated', { imageSrc: imageSrc?.substring(0, 50), open, aspectRatio, cropShape });
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Parse aspect ratio string to number
  const getAspectRatioValue = () => {
    if (aspectRatio === "1/1") return 1;
    if (aspectRatio === "16/9") return 16 / 9;
    if (aspectRatio === "4/3") return 4 / 3;
    if (aspectRatio === "3/2") return 3 / 2;
    return 1;
  };

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg", 0.95);
    });
  };

  const handleCropConfirm = async () => {
    try {
      setProcessing(true);
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl h-[90vh] glassmorphism border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary" />
            Recadrer l'image
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-black/40 rounded-lg overflow-hidden" style={{ minHeight: "400px" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={getAspectRatioValue()}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            style={{
              containerStyle: {
                backgroundColor: "rgba(0,0,0,0.5)"
              },
              cropAreaStyle: {
                border: "2px solid #a855f7"
              }
            }}
          />
        </div>

        <div className="space-y-4 py-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                Zoom
              </label>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <RotateCw className="w-4 h-4" />
                Rotation
              </label>
              <span className="text-sm text-muted-foreground">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={processing}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCropConfirm}
            disabled={processing}
            className="bg-primary hover:bg-primary/90"
          >
            {processing ? "Traitement..." : "Valider le recadrage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
