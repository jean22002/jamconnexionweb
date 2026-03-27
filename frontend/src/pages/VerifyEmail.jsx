import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "../components/ui/button";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | already | error | expired | no-token
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      setMessage("Aucun token de verification fourni.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          if (data.already_verified) {
            setStatus("already");
            setMessage("Votre email a deja ete verifie.");
          } else {
            setStatus("success");
            setMessage("Votre email a ete verifie avec succes !");
          }
          if (data.email) setEmail(data.email);
        } else if (res.status === 400) {
          setStatus("expired");
          setMessage(data.detail || "Le lien de verification a expire.");
        } else {
          setStatus("error");
          setMessage(data.detail || "Token de verification invalide.");
        }
      } catch {
        setStatus("error");
        setMessage("Erreur de connexion au serveur. Veuillez reessayer.");
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    setResendMsg("");
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification?email=${encodeURIComponent(resendEmail)}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setResendMsg("Un nouvel email de verification a ete envoye !");
      } else {
        setResendMsg(data.detail || "Impossible de renvoyer l'email.");
      }
    } catch {
      setResendMsg("Erreur de connexion. Veuillez reessayer.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="verify-email-page">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <h1 className="text-2xl font-bold" data-testid="verify-loading">Verification en cours...</h1>
              <p className="text-muted-foreground">Veuillez patienter pendant que nous verifions votre email.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-green-500" data-testid="verify-success">Email verifie !</h1>
              <p className="text-muted-foreground">{message}</p>
              {email && <p className="text-sm text-muted-foreground">Compte : <strong>{email}</strong></p>}
              <Link to="/auth">
                <Button className="mt-4 w-full" data-testid="verify-login-btn">
                  Se connecter
                </Button>
              </Link>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle className="w-16 h-16 text-blue-500 mx-auto" />
              <h1 className="text-2xl font-bold text-blue-500" data-testid="verify-already">Deja verifie</h1>
              <p className="text-muted-foreground">{message}</p>
              <Link to="/auth">
                <Button className="mt-4 w-full" data-testid="verify-login-btn">
                  Se connecter
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h1 className="text-2xl font-bold text-red-500" data-testid="verify-error">Erreur de verification</h1>
              <p className="text-muted-foreground">{message}</p>
              <Link to="/auth">
                <Button variant="outline" className="mt-4 w-full" data-testid="verify-login-btn">
                  Retour a la connexion
                </Button>
              </Link>
            </>
          )}

          {status === "no-token" && (
            <>
              <Mail className="w-16 h-16 text-muted-foreground mx-auto" />
              <h1 className="text-2xl font-bold" data-testid="verify-no-token">Lien invalide</h1>
              <p className="text-muted-foreground">{message}</p>
              <Link to="/auth">
                <Button variant="outline" className="mt-4 w-full" data-testid="verify-login-btn">
                  Retour a la connexion
                </Button>
              </Link>
            </>
          )}

          {status === "expired" && (
            <>
              <XCircle className="w-16 h-16 text-orange-500 mx-auto" />
              <h1 className="text-2xl font-bold text-orange-500" data-testid="verify-expired">Lien expire</h1>
              <p className="text-muted-foreground">{message}</p>
              <div className="mt-6 space-y-3">
                <p className="text-sm text-muted-foreground">Entrez votre email pour recevoir un nouveau lien :</p>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  data-testid="resend-email-input"
                />
                <Button
                  onClick={handleResend}
                  disabled={resending || !resendEmail}
                  className="w-full"
                  data-testid="resend-verification-btn"
                >
                  {resending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Renvoyer le lien de verification
                </Button>
                {resendMsg && <p className="text-sm text-muted-foreground" data-testid="resend-message">{resendMsg}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
