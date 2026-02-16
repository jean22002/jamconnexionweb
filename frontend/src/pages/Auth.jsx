import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Music, Guitar, Mic2, Music2, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });

  useEffect(() => {
    const urlRole = searchParams.get("role");
    if (urlRole && ["musician", "venue", "melomane"].includes(urlRole)) {
      setRole(urlRole);
      setMode("register");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const user = await login(formData.email, formData.password);
        toast.success("Connexion réussie!");
        navigate(user.role === "musician" ? "/musician" : user.role === "venue" ? "/venue" : "/melomane");
      } else {
        if (!role) {
          toast.error("Veuillez sélectionner un type de compte");
          setLoading(false);
          return;
        }
        if (!acceptedTerms) {
          toast.error("Vous devez accepter les conditions générales d'utilisation");
          setLoading(false);
          return;
        }
        // Vérifier que les mots de passe correspondent
        if (formData.password !== formData.confirmPassword) {
          toast.error("Les mots de passe ne correspondent pas");
          setLoading(false);
          return;
        }
        const user = await register(formData.email, formData.password, formData.name, role);
        toast.success("Compte créé avec succès!");
        navigate(user.role === "musician" ? "/musician" : user.role === "venue" ? "/venue" : "/melomane");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const backgroundImage = role === "venue" 
    ? "https://images.pexels.com/photos/9419374/pexels-photo-9419374.jpeg"
    : role === "melomane"
    ? "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg"
    : "https://images.pexels.com/photos/10438494/pexels-photo-10438494.jpeg";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm"></div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center neon-border animate-pulse-glow">
              <Music className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-heading font-bold text-4xl text-gradient">Jam Connexion</h1>
            <p className="text-muted-foreground text-lg max-w-md">
              {role === "venue" 
                ? "Attirez des musiciens talentueux dans votre établissement"
                : role === "melomane"
                ? "Découvrez les meilleurs concerts et événements musicaux"
                : "Trouvez les meilleurs spots pour jouer près de chez vous"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="font-heading font-bold text-3xl mb-2">
                {mode === "login" ? "Connexion" : "Créer un compte"}
              </h2>
              <p className="text-muted-foreground">
                {mode === "login" 
                  ? "Connectez-vous à votre compte" 
                  : "Rejoignez la communauté musicale"
                }
              </p>
            </div>

            <Tabs value={mode} onValueChange={setMode} className="w-full">
              <TabsList className="flex w-full bg-muted/50 rounded-full p-1 gap-1">
                <TabsTrigger 
                  value="login" 
                  className="rounded-full flex-1 data-[state=active]:bg-primary data-[state=active]:text-white"
                  data-testid="tab-login"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="rounded-full flex-1 data-[state=active]:bg-primary data-[state=active]:text-white"
                  data-testid="tab-register"
                >
                  Inscription
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <TabsContent value="register" className="space-y-6 mt-0">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label>Je suis</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole("musician")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          role === "musician" 
                            ? "border-primary bg-primary/10" 
                            : "border-white/10 hover:border-white/30"
                        }`}
                        data-testid="role-musician"
                      >
                        <Guitar className={`w-8 h-8 mx-auto mb-2 ${role === "musician" ? "text-primary" : "text-muted-foreground"}`} />
                        <p className={`font-medium ${role === "musician" ? "text-white" : "text-muted-foreground"}`}>
                          Musicien
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Gratuit</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          // Rediriger vers le formulaire d'inscription établissement dédié
                          navigate("/venue-register");
                        }}
                        className={`p-4 rounded-xl border-2 transition-all border-white/10 hover:border-secondary/50 hover:bg-secondary/10`}
                        data-testid="role-venue"
                      >
                        <Mic2 className={`w-8 h-8 mx-auto mb-2 text-secondary`} />
                        <p className={`font-medium text-white`}>
                          Établissement
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">12,99€/mois</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setRole("melomane")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          role === "melomane" 
                            ? "border-orange-500 bg-orange-500/10" 
                            : "border-white/10 hover:border-white/30"
                        }`}
                        data-testid="role-melomane"
                      >
                        <Music2 className={`w-8 h-8 mx-auto mb-2 ${role === "melomane" ? "text-orange-500" : "text-muted-foreground"}`} />
                        <p className={`font-medium ${role === "melomane" ? "text-white" : "text-muted-foreground"}`}>
                          Mélomane
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Gratuit</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={role === "venue" ? "Nom de l'établissement" : "Votre nom"}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 bg-black/20 border-white/10 focus:border-primary/50"
                      required={mode === "register"}
                      data-testid="input-name"
                    />
                  </div>
                </TabsContent>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 bg-black/20 border-white/10 focus:border-primary/50"
                    required
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 bg-black/20 border-white/10 focus:border-primary/50"
                    required
                    data-testid="input-password"
                  />
                </div>

                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`h-12 bg-black/20 border-white/10 focus:border-primary/50 ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword 
                          ? 'border-red-500 focus:border-red-500' 
                          : ''
                      }`}
                      required
                      data-testid="input-confirm-password"
                    />
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <X className="w-3 h-3" />
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length > 0 && (
                      <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                        <Check className="w-3 h-3" />
                        Les mots de passe correspondent
                      </p>
                    )}
                  </div>
                )}

                {mode === "register" && (
                  <div className="flex items-start space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-black/20 text-primary focus:ring-primary focus:ring-offset-0"
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                      J&apos;accepte les{" "}
                      <Link to="/cgu" className="text-primary hover:underline" target="_blank">
                        Conditions Générales d&apos;Utilisation
                      </Link>
                      {" "}et les{" "}
                      <Link to="/cgv" className="text-primary hover:underline" target="_blank">
                        Conditions Générales de Vente
                      </Link>
                    </label>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full font-heading font-semibold hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all"
                  disabled={loading}
                  data-testid="submit-btn"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : mode === "login" ? (
                    "Se connecter"
                  ) : (
                    "Créer mon compte"
                  )}
                </Button>
              </form>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
