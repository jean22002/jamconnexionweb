import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { buildImageUrl } from '../../utils/urlBuilder';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useProfile = (token, geoPosition) => {
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    pseudo: "", 
    age: null, 
    profile_image: "", 
    cover_image: "",
    bio: "",
    instruments: [], 
    music_styles: [], 
    experience_years: 0, 
    experience_level: "",
    city: "", 
    department: "", 
    region: "", 
    phone: "", 
    website: "", 
    facebook: "", 
    instagram: "", 
    youtube: "", 
    bandcamp: "",
    has_band: false,
    band: { name: "", photo: "", facebook: "", instagram: "", youtube: "", website: "", bandcamp: "" },
    bands: [],
    concerts: []
  });

  const [soloProfile, setSoloProfile] = useState({
    has_solo: false,
    band_type: "",
    repertoire_type: "",
    show_duration: "",
    music_styles: [],
    description: "",
    looking_for_concerts: true,
    payment_methods: []
  });

  const [currentBand, setCurrentBand] = useState({
    name: "",
    photo: "",
    description: "",
    members_count: null,
    music_styles: [],
    band_type: "",
    repertoire_type: "",
    show_duration: "",
    city: "",
    postal_code: "",
    department: "",
    department_name: "",
    region: "",
    facebook: "",
    instagram: "",
    youtube: "",
    website: "",
    bandcamp: "",
    looking_for_concerts: true,
    looking_for_members: false,
    is_public: true,
    is_association: false,
    association_name: "",
    has_label: false,
    label_name: "",
    label_city: "",
    payment_methods: []
  });

  const [editingBandIndex, setEditingBandIndex] = useState(null);
  const [showBandDialog, setShowBandDialog] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/musicians/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const profileData = response.data;
      let bandsArray = profileData.bands || [];
      
      if (profileData.has_band && profileData.band && profileData.band.name && bandsArray.length === 0) {
        bandsArray = [profileData.band];
      }

      const profile_image_url = buildImageUrl(profileData.profile_image);
      const cover_image_url = buildImageUrl(profileData.cover_image);

      setProfileForm({
        pseudo: profileData.pseudo || "",
        age: profileData.age || null,
        profile_image: profile_image_url,
        cover_image: cover_image_url,
        bio: profileData.bio || "",
        instruments: profileData.instruments || [],
        music_styles: profileData.music_styles || [],
        experience_years: profileData.experience_years || 0,
        experience_level: profileData.experience_level || "",
        city: profileData.city || "",
        department: profileData.department || "",
        region: profileData.region || "",
        phone: profileData.phone || "",
        website: profileData.website || "",
        facebook: profileData.facebook || "",
        instagram: profileData.instagram || "",
        youtube: profileData.youtube || "",
        bandcamp: profileData.bandcamp || "",
        has_band: profileData.has_band || false,
        band: profileData.band || { name: "", photo: "", facebook: "", instagram: "", youtube: "", website: "", bandcamp: "" },
        bands: bandsArray,
        concerts: profileData.concerts || []
      });

      setProfile(profileData);

      if (profileData.solo_profile) {
        setSoloProfile(profileData.solo_profile);
      }

      return profileData;
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
      throw error;
    }
  }, [token]);

  const normalizeImageUrl = (url) => {
    if (!url) return url;
    
    let normalizedUrl = url;
    if (normalizedUrl.includes(process.env.REACT_APP_BACKEND_URL)) {
      normalizedUrl = normalizedUrl.replace(process.env.REACT_APP_BACKEND_URL, '');
    }
    normalizedUrl = normalizedUrl.replace(/\/api\/api\//, '/api/');
    if (!normalizedUrl.startsWith('/api/uploads')) {
      normalizedUrl = normalizedUrl.replace(/^\/?(uploads\/)/, '/api/uploads/');
    }
    return normalizedUrl;
  };

  const saveProfile = async () => {
    try {
      const method = profile ? "put" : "post";
      
      const profileData = {
        ...profileForm,
        solo_profile: soloProfile,
        ...(geoPosition && {
          latitude: geoPosition.latitude,
          longitude: geoPosition.longitude
        })
      };
      
      // Normalize image URLs
      profileData.profile_image = normalizeImageUrl(profileData.profile_image);
      profileData.cover_image = normalizeImageUrl(profileData.cover_image);
      
      const response = await axios[method](`${API}/musicians`, profileData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      toast.success("Profil mis à jour!");
      
      setProfile(response.data);
      
      const saved_profile_image = buildImageUrl(response.data.profile_image);
      const saved_cover_image = buildImageUrl(response.data.cover_image);
      
      setProfileForm(prev => ({
        ...prev,
        profile_image: saved_profile_image,
        cover_image: saved_cover_image
      }));
      
      setEditingProfile(false);
      
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
      throw error;
    }
  };

  const openBandDialog = (index = null) => {
    if (index !== null) {
      setEditingBandIndex(index);
      setCurrentBand(profileForm.bands[index]);
    } else {
      setEditingBandIndex(null);
      setCurrentBand({
        name: "",
        photo: "",
        description: "",
        members_count: null,
        music_styles: [],
        band_type: "",
        repertoire_type: "",
        show_duration: "",
        city: "",
        postal_code: "",
        department: "",
        department_name: "",
        region: "",
        facebook: "",
        instagram: "",
        youtube: "",
        website: "",
        bandcamp: "",
        looking_for_concerts: true,
        looking_for_members: false,
        is_public: true,
        is_association: false,
        association_name: "",
        has_label: false,
        label_name: "",
        label_city: "",
        payment_methods: []
      });
    }
    setShowBandDialog(true);
  };

  const saveBand = () => {
    if (!currentBand.name.trim()) {
      toast.error("Le nom du groupe est requis");
      return;
    }

    if (editingBandIndex !== null) {
      const newBands = [...profileForm.bands];
      newBands[editingBandIndex] = currentBand;
      setProfileForm({ ...profileForm, bands: newBands });
    } else {
      setProfileForm({ ...profileForm, bands: [...profileForm.bands, currentBand] });
    }
    
    setShowBandDialog(false);
    toast.success(editingBandIndex !== null ? "Groupe modifié" : "Groupe ajouté");
  };

  const deleteBand = (index) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce groupe ?")) {
      const newBands = profileForm.bands.filter((_, i) => i !== index);
      setProfileForm({ ...profileForm, bands: newBands });
      toast.success("Groupe supprimé");
    }
  };

  return {
    profile,
    profileForm,
    setProfileForm,
    soloProfile,
    setSoloProfile,
    currentBand,
    setCurrentBand,
    editingBandIndex,
    showBandDialog,
    setShowBandDialog,
    editingProfile,
    setEditingProfile,
    fetchProfile,
    saveProfile,
    openBandDialog,
    saveBand,
    deleteBand
  };
};
