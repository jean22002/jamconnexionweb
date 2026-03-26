import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { MapPin, User } from "lucide-react";
import LazyImage from "../../components/LazyImage";

// Profile tabs components
import InfoTab from "./profile/InfoTab";
import StylesTab from "./profile/StylesTab";
import SoloTab from "./profile/SoloTab";
import BandTab from "./profile/BandTab";
import ConcertsTab from "./profile/ConcertsTab";
import SettingsTab from "./profile/SettingsTab";

const BAND_TYPES = [
  "Duo acoustique",
  "Trio acoustique",
  "Quatuor acoustique",
  "Duo electro acoustique",
  "Trio electro acoustique",
  "Quatuor électro acoustique",
  "Groupe de reprise",
  "Groupe tribute",
  "Groupe de compos",
  "Autre"
];

const REPERTOIRE_TYPES = ["Compos", "Reprises", "Compos + Reprises"];

const SHOW_DURATIONS = [
  "30mn", "45mn", "1h", "1h15", "1h30", "1h45", 
  "2h", "2h15", "2h30", "2h45", 
  "3h", "3h15", "3h30", "3h45", 
  "4h", "4h15", "4h30", "4h45", 
  "5h", "5h15", "5h30", "5h45", "6h"
];

export default function ProfileEditModal({
  open,
  onOpenChange,
  profile,
  profileForm,
  setProfileForm,
  soloProfile,
  setSoloProfile,
  passwordForm,
  setPasswordForm,
  changingPassword,
  token,
  geoPosition,
  logout,
  addToList,
  removeFromList,
  handleSaveProfile,
  handleChangePassword,
  handleOpenBandDialog,
  addConcert,
  removeConcert,
  setNewConcert,
  newConcert,
  API
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2" data-testid="profile-btn">
          {profile?.profile_image ? (
            <LazyImage 
              src={profile.profile_image} 
              alt={profile.pseudo} 
              className="w-8 h-8 rounded-full object-cover" 
            />
          ) : (
            <User className="w-5 h-5" />
          )}
          Mon Profil
        </Button>
      </DialogTrigger>
      <DialogContent className="glassmorphism border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Mon Profil Musicien</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="flex w-full overflow-x-auto bg-muted/50 rounded-full p-1 gap-1 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent scroll-smooth snap-x snap-mandatory">
            <TabsTrigger value="info" className="rounded-full whitespace-nowrap flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm snap-center min-w-[70px] sm:min-w-auto">Infos</TabsTrigger>
            <TabsTrigger value="styles" className="rounded-full whitespace-nowrap flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm snap-center min-w-[70px] sm:min-w-auto">Styles</TabsTrigger>
            <TabsTrigger value="solo" className="rounded-full whitespace-nowrap flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm snap-center min-w-[70px] sm:min-w-auto">Solo</TabsTrigger>
            <TabsTrigger value="band" className="rounded-full whitespace-nowrap flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm snap-center min-w-[70px] sm:min-w-auto">Groupe</TabsTrigger>
            <TabsTrigger value="concerts" className="rounded-full whitespace-nowrap flex-shrink-0 px-3 sm:px-4 text-xs sm:text-sm snap-center min-w-[80px] sm:min-w-auto">Concerts</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full whitespace-nowrap flex-shrink-0 px-2 sm:px-4 text-xs sm:text-sm snap-center min-w-[90px] sm:min-w-auto">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <InfoTab
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              token={token}
              addToList={addToList}
              removeFromList={removeFromList}
            />
          </TabsContent>

          {/* Onglet Styles musicaux */}
          <TabsContent value="styles" className="space-y-4 mt-4">
            <StylesTab
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              addToList={addToList}
              removeFromList={removeFromList}
            />
          </TabsContent>

          {/* Onglet Solo - Simplified for brevity - You'll need to add the full content */}
          <TabsContent value="solo" className="space-y-4 mt-4">
            <SoloTab
              soloProfile={soloProfile}
              setSoloProfile={setSoloProfile}
              token={token}
              addToList={addToList}
              removeFromList={removeFromList}
            />
          </TabsContent>

          {/* Onglet Groupe - Placeholder */}
          <TabsContent value="band" className="space-y-4 mt-4">
            <BandTab
              profileForm={profileForm}
              handleOpenBandDialog={handleOpenBandDialog}
            />
          </TabsContent>

          {/* Onglet Concerts - Placeholder */}
          <TabsContent value="concerts" className="space-y-4 mt-4">
            <ConcertsTab
              profileForm={profileForm}
              setProfileForm={setProfileForm}
            />
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <SettingsTab
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              handleChangePassword={handleChangePassword}
            />
          </TabsContent>
        </Tabs>

        <Button onClick={handleSaveProfile} className="w-full mt-4 bg-primary hover:bg-primary/90 rounded-full" data-testid="save-profile-btn">
          Sauvegarder
        </Button>
      </DialogContent>
    </Dialog>
  );
}
