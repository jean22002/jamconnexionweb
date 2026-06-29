import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import DOMPurify from "isomorphic-dompurify";
import { Button } from "../components/ui/button";
import { ArrowLeft, Music, Clock, Calendar } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Article de blog individuel — Build 95.5
 * Rendu markdown simple (titres, paragraphes, listes).
 */
export default function BlogPost() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`${API}/blog/${slug}`);
        setArticle(res.data);
        document.title = `${res.data.title} — Jam Connexion`;
        const meta = document.querySelector('meta[name="description"]');
        if (meta && res.data.excerpt) meta.setAttribute("content", res.data.excerpt);
      } catch (e) {
        if (e?.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background" data-testid="blog-post">
      <header className="sticky top-0 z-50 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-border">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl text-gradient">Jam Connexion</span>
            </Link>
            <Link to="/blog">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tous les articles
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && <p className="text-center text-muted-foreground py-20">Chargement…</p>}

        {notFound && (
          <div className="text-center py-20">
            <p className="text-2xl font-heading mb-4">Article introuvable</p>
            <Link to="/blog">
              <Button>Voir tous les articles</Button>
            </Link>
          </div>
        )}

        {article && !loading && (
          <article>
            <div className="text-7xl mb-6 text-center">{article.cover_emoji || "🎵"}</div>

            <div className="flex items-center justify-center gap-3 mb-4 text-xs flex-wrap">
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {article.reading_minutes} min de lecture
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {new Date(article.published_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1
              className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-gradient text-center mb-8"
              data-testid="blog-post-title"
            >
              {article.title}
            </h1>

            <p className="text-lg text-muted-foreground italic text-center mb-12 leading-relaxed">
              {article.excerpt}
            </p>

            <div
              className="glassmorphism rounded-3xl p-6 sm:p-10 prose-blog"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(renderMarkdown(article.content), {
                  ALLOWED_TAGS: ["h1", "h2", "h3", "p", "ul", "ol", "li", "strong", "em", "a", "blockquote", "br"],
                  ALLOWED_ATTR: ["href", "target", "rel"],
                }),
              }}
            />

            {article.tags?.length > 0 && (
              <div className="mt-10 flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tags :
                </span>
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-black/20 border border-white/10 text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-12 p-6 rounded-2xl bg-primary/10 border border-primary/30 text-center">
              <p className="font-heading font-semibold text-lg mb-2">
                🎵 Vous avez aimé cet article&nbsp;?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Inscrivez-vous gratuitement sur Jam Connexion et trouvez votre prochain
                concert, musicien ou jam session.
              </p>
              <Link to="/auth">
                <Button className="rounded-full bg-primary hover:bg-primary/90">
                  Créer mon compte
                </Button>
              </Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

/**
 * Minimal markdown → HTML renderer (sans dépendance externe).
 * Couvre : titres h1-h3, gras, italique, listes (- ou *), liens, paragraphes, blockquotes.
 */
function renderMarkdown(md) {
  if (!md) return "";
  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  for (let raw of lines) {
    let line = escapeHtml(raw.trimEnd());
    if (line.trim() === "") {
      if (inList) { html += "</ul>"; inList = false; }
      continue;
    }
    // Headings
    if (/^### /.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3>${line.slice(4)}</h3>`;
      continue;
    }
    if (/^## /.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2>${line.slice(3)}</h2>`;
      continue;
    }
    if (/^# /.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h1>${line.slice(2)}</h1>`;
      continue;
    }
    // List items
    if (/^[-*] /.test(line)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inlineMd(line.slice(2))}</li>`;
      continue;
    }
    // Blockquote
    if (/^> /.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<blockquote>${inlineMd(line.slice(2))}</blockquote>`;
      continue;
    }
    // Paragraph
    if (inList) { html += "</ul>"; inList = false; }
    html += `<p>${inlineMd(line)}</p>`;
  }
  if (inList) html += "</ul>";
  return html;
}

function inlineMd(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}
