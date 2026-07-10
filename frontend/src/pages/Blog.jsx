import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { ArrowLeft, Music, Clock, ArrowRight } from "lucide-react";
import EzoicAdPlaceholder from "../components/EzoicAdPlaceholder";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Blog public Jam Connexion — Build 95.5
 * Accessible sans login. Contenu SEO-friendly pour AdSense.
 */
export default function Blog() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await axios.get(`${API}/blog`);
        setArticles(res.data?.articles || []);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
    document.title = "Blog Jam Connexion — Guides musiciens & jam sessions";
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="blog-page">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-gradient">Jam Connexion</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-gradient mb-4">
            Le Blog Jam Connexion
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Guides, conseils et coulisses du monde des musiciens, des jams et
            des établissements. Tout pour mieux vivre sa passion musicale.
          </p>
        </div>

        {loading && (
          <div className="text-center py-20 text-muted-foreground">Chargement…</div>
        )}

        {!loading && articles.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            Les premiers articles arrivent bientôt 🎵
          </div>
        )}

        {!loading && articles.length > 0 && (
          <>
            {/* Build 95.10 — Emplacement pub Ezoic top blog */}
            <div className="mb-8">
              <EzoicAdPlaceholder id={101} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                className="group block"
                data-testid={`blog-card-${article.slug}`}
              >
                <article className="h-full glassmorphism rounded-2xl p-6 border border-white/10 hover:border-primary/40 transition-all hover:-translate-y-1">
                  <div className="text-5xl mb-4">{article.cover_emoji || "🎵"}</div>
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {article.reading_minutes} min
                    </span>
                  </div>
                  <h2 className="font-heading font-bold text-xl mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    Lire l&apos;article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </article>
              </Link>
            ))}
            </div>
            {/* Build 95.10 — Emplacement pub Ezoic bottom blog */}
            <div className="mt-12">
              <EzoicAdPlaceholder id={102} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
