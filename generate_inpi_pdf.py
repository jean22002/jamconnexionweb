from fpdf import FPDF
from datetime import datetime

class JamConnexionPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "Jam Connexion - Document descriptif pour depot INPI e-Soleau", align="C")
        self.ln(4)
        self.set_draw_color(160, 50, 220)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(140, 140, 140)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}} - Confidentiel - {datetime.now().strftime('%d/%m/%Y')}", align="C")

    def titre_section(self, num, titre):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(120, 40, 200)
        self.cell(0, 10, f"{num}. {titre}", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(120, 40, 200)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(4)

    def sous_titre(self, titre):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(60, 60, 60)
        self.cell(0, 8, titre, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def paragraphe(self, texte):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, texte)
        self.ln(3)

    def puce(self, texte):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        x = self.get_x()
        self.cell(8, 5.5, "-")
        self.multi_cell(0, 5.5, texte)
        self.ln(1)

    def puce_bold(self, label, texte):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.cell(8, 5.5, "-")
        self.set_font("Helvetica", "B", 10)
        self.write(5.5, f"{label} : ")
        self.set_font("Helvetica", "", 10)
        self.multi_cell(0, 5.5, texte)
        self.ln(1)


pdf = JamConnexionPDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# Page de titre
pdf.ln(30)
pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(120, 40, 200)
pdf.cell(0, 15, "JAM CONNEXION", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(5)
pdf.set_font("Helvetica", "", 14)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 8, "Plateforme de mise en relation entre musiciens", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 8, "et scenes de musique live", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(15)
pdf.set_draw_color(160, 50, 220)
pdf.set_line_width(0.8)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(15)
pdf.set_font("Helvetica", "B", 12)
pdf.set_text_color(60, 60, 60)
pdf.cell(0, 8, "Document descriptif du projet", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 8, "pour depot de propriete intellectuelle", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 8, "INPI - Enveloppe e-Soleau", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(20)
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 7, f"Date de generation : {datetime.now().strftime('%d %B %Y').replace('March', 'mars')}", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, "Version : 1.0", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, "Statut : Application en production", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, "URL : https://jamconnexion.com", align="C", new_x="LMARGIN", new_y="NEXT")

# Page 2 - Sommaire
pdf.add_page()
pdf.set_font("Helvetica", "B", 16)
pdf.set_text_color(120, 40, 200)
pdf.cell(0, 12, "SOMMAIRE", new_x="LMARGIN", new_y="NEXT")
pdf.ln(5)
sommaire = [
    "Presentation generale",
    "Problematique et vision",
    "Utilisateurs cibles",
    "Fonctionnalites principales",
    "Architecture technique",
    "Modele economique",
    "Base de donnees et collections",
    "Interfaces utilisateur",
    "Integrations tierces",
    "Securite et authentification",
    "Propriete intellectuelle et originalite",
]
for i, item in enumerate(sommaire, 1):
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 7, f"  {i}. {item}", new_x="LMARGIN", new_y="NEXT")

# Section 1
pdf.add_page()
pdf.titre_section("1", "PRESENTATION GENERALE")
pdf.paragraphe(
    "Jam Connexion est une application web de mise en relation entre musiciens, "
    "melomanes et etablissements de musique live (cafes-concerts, bars, salles de spectacle). "
    "La plateforme permet aux musiciens de trouver des lieux ou jouer (jams sessions, boeufs musicaux, concerts) "
    "et aux etablissements de decouvrir et attirer des talents locaux."
)
pdf.paragraphe(
    "L'application est accessible a l'adresse https://jamconnexion.com et fonctionne comme une "
    "application web progressive (PWA) compatible desktop et mobile. Elle est deployee en production "
    "et connectee a une base de donnees MongoDB Atlas hebergee dans le cloud."
)
pdf.paragraphe(
    "Le projet a ete concu, developpe et mis en production par son createur en tant qu'oeuvre originale. "
    "Le present document a pour objet de decrire de maniere exhaustive le concept, les fonctionnalites "
    "et l'architecture technique du projet, dans le cadre d'un depot de propriete intellectuelle "
    "aupres de l'INPI via le service e-Soleau."
)

# Section 2
pdf.titre_section("2", "PROBLEMATIQUE ET VISION")
pdf.sous_titre("Le constat")
pdf.paragraphe(
    "En France, des milliers de musiciens amateurs et semi-professionnels cherchent des lieux pour "
    "pratiquer leur art en live. Parallelement, de nombreux cafes-concerts et bars a musique "
    "cherchent a animer leurs soirees avec des artistes locaux. Pourtant, il n'existe pas de "
    "plateforme dediee pour connecter ces deux mondes de maniere simple et efficace."
)
pdf.sous_titre("La solution Jam Connexion")
pdf.paragraphe(
    "Jam Connexion comble ce manque en offrant un espace numerique ou musiciens et etablissements "
    "peuvent se trouver, echanger et collaborer. La plateforme se distingue par sa specialisation "
    "dans la musique live locale (jams, boeufs, concerts) et sa geolocalisation avancee permettant "
    "de trouver des opportunites a proximite."
)
pdf.sous_titre("La vision")
pdf.paragraphe(
    "Devenir la reference francaise de la mise en relation dans l'ecosysteme de la musique live "
    "locale, en connectant chaque musicien avec les scenes qui lui correspondent."
)

# Section 3
pdf.titre_section("3", "UTILISATEURS CIBLES")
pdf.sous_titre("Musiciens (gratuit)")
pdf.puce("Musiciens amateurs, semi-professionnels et professionnels")
pdf.puce("Recherchent des lieux pour jouer en jam session ou en concert")
pdf.puce("Souhaitent se connecter avec d'autres musiciens locaux")
pdf.puce("Veulent consulter le materiel disponible, les styles musicaux et les conditions des etablissements")
pdf.puce("Peuvent creer et gerer des profils de groupes (bands)")
pdf.ln(3)

pdf.sous_titre("Etablissements (abonnement payant)")
pdf.puce("Cafes-concerts, bars a musique, salles de spectacle, restaurants avec scene")
pdf.puce("Cherchent a attirer des musiciens pour animer leurs soirees")
pdf.puce("Publient des evenements : boeufs musicaux, concerts, dates ouvertes aux candidatures")
pdf.puce("Gerent un planning avec des creneaux ouverts aux artistes")
pdf.ln(3)

pdf.sous_titre("Melomanes (gratuit)")
pdf.puce("Amateurs de musique live qui veulent suivre les evenements et les artistes locaux")
pdf.puce("Consultent les profils de musiciens et d'etablissements")
pdf.puce("Decouvrent les evenements a proximite via la carte interactive")

# Section 4
pdf.add_page()
pdf.titre_section("4", "FONCTIONNALITES PRINCIPALES")

pdf.sous_titre("4.1 Authentification et inscription")
pdf.puce("Inscription par email avec choix du role (musicien, etablissement, melomane)")
pdf.puce("Verification d'email obligatoire via lien envoye par email (Resend API)")
pdf.puce("Connexion securisee par JWT (JSON Web Token) avec hashage bcrypt")
pdf.puce("Page dediee de verification d'email (/verify-email) avec gestion des tokens expires")
pdf.puce("Possibilite de renvoyer le lien de verification (limite a 3 par jour)")
pdf.ln(3)

pdf.sous_titre("4.2 Profil musicien")
pdf.puce("Pseudo, age, photo de profil, biographie")
pdf.puce("Instruments pratiques et styles musicaux")
pdf.puce("Liens reseaux sociaux (Facebook, Instagram, YouTube, site web)")
pdf.puce("Historique des concerts et participations")
pdf.puce("Badge PRO avec fonctionnalites avancees (comptabilite, analytics)")
pdf.puce("Statut GUSO pour les intermittents du spectacle")
pdf.puce("Systeme de gamification avec badges et leaderboard")
pdf.ln(3)

pdf.sous_titre("4.3 Profil de groupe (Band)")
pdf.puce("Creation de groupes avec nom, photo, description, liens")
pdf.puce("Systeme de codes d'invitation a 6 caracteres (validite 7 jours)")
pdf.puce("Partage du code pour inviter des membres")
pdf.puce("Modal de contact pour envoyer un message a l'administrateur du groupe")
pdf.puce("Gestion des membres et des permissions")
pdf.ln(3)

pdf.sous_titre("4.4 Profil etablissement")
pdf.puce("Informations detaillees : adresse, photo profil, photo couverture")
pdf.puce("Materiel disponible (sonorisation, instruments, scene)")
pdf.puce("Styles musicaux acceptes et jours de jam habituels")
pdf.puce("Liens reseaux sociaux et site web")
pdf.puce("Gestion des abonnements et facturation")
pdf.ln(3)

pdf.sous_titre("4.5 Carte interactive geolocalisee")
pdf.puce("Carte Leaflet avec geolocalisation GPS en temps reel")
pdf.puce("Recherche par ville avec rayon configurable (1 a 100 km)")
pdf.puce("Affichage des etablissements, musiciens et evenements sur la carte")
pdf.puce("Filtrage par type d'evenement et style musical")
pdf.ln(3)

pdf.sous_titre("4.6 Evenements et planning")
pdf.puce("Boeufs musicaux : date, heure, styles, reglement interieur, materiel disponible, sono")
pdf.puce("Concerts : date, groupes participants (avec liens), prix d'entree, cachets artistes")
pdf.puce("Options de cachet : Fixe, A definir avec l'etablissement")
pdf.puce("Mode Planning : dates ouvertes aux candidatures avec styles recherches")
pdf.puce("Systeme de candidatures : les musiciens postulent pour les dates ouvertes")
pdf.ln(3)

pdf.sous_titre("4.7 Systeme social et communication")
pdf.puce("Systeme d'amis : demande, acceptation, refus, liste d'amis")
pdf.puce("Messagerie privee entre utilisateurs")
pdf.puce("Notifications in-app (boeufs, concerts, demandes d'amis, candidatures)")
pdf.puce("Abonnement aux etablissements pour recevoir leurs actualites")
pdf.puce("Envoi d'emails transactionnels (bienvenue, verification, activation)")
pdf.ln(3)

pdf.sous_titre("4.8 Gamification")
pdf.puce("Systeme de badges avec attribution automatique selon l'activite")
pdf.puce("Leaderboard classant les utilisateurs les plus actifs")
pdf.puce("Badge PRO verifie pour les musiciens abonnes")
pdf.puce("Badge GUSO visible pour les intermittents")
pdf.ln(3)

pdf.sous_titre("4.9 Administration")
pdf.puce("Dashboard administrateur avec gestion des signalements")
pdf.puce("Analytics avances : statistiques d'utilisation, metriques cles")
pdf.puce("Historique des actions utilisateurs (audit trail)")
pdf.puce("Systeme de moderation des contenus")

# Section 5
pdf.add_page()
pdf.titre_section("5", "ARCHITECTURE TECHNIQUE")

pdf.sous_titre("5.1 Stack technologique")
pdf.puce_bold("Frontend", "React.js avec Tailwind CSS et composants Shadcn/UI")
pdf.puce_bold("Backend", "FastAPI (Python) avec serveur ASGI Uvicorn")
pdf.puce_bold("Base de donnees", "MongoDB Atlas (cloud) avec driver Motor (asynchrone)")
pdf.puce_bold("Cartographie", "Leaflet.js avec OpenStreetMap")
pdf.puce_bold("Emails", "Resend API pour les emails transactionnels")
pdf.puce_bold("Paiements", "Stripe pour les abonnements etablissements")
pdf.puce_bold("Deploiement", "Plateforme cloud avec HTTPS et domaine personnalise")
pdf.puce_bold("PWA", "Application Web Progressive avec Service Worker")
pdf.ln(3)

pdf.sous_titre("5.2 Structure du projet")
pdf.set_font("Courier", "", 9)
pdf.set_text_color(40, 40, 40)
arbo = """  /app
  +-- backend/
  |   +-- routes/        (auth, bands, musicians, venues, events, messages, ...)
  |   +-- models/        (user, musician, venue, event, badge, notification, ...)
  |   +-- utils/         (auth helpers, email templates, image utils)
  |   +-- middleware/     (rate limiting, cache headers)
  |   +-- server.py      (point d'entree FastAPI)
  +-- frontend/
  |   +-- src/
  |   |   +-- pages/     (Landing, Auth, MusicianDashboard, VenueDashboard, ...)
  |   |   +-- components/ (UI components Shadcn, notifications, chat, ...)
  |   |   +-- features/  (modules metier : profil, groupe, invitations)
  |   |   +-- context/   (AuthContext, BadgeContext)
  |   |   +-- utils/     (API helpers, image utils)
  |   +-- public/        (assets statiques, manifest PWA)
  +-- memory/
      +-- PRD.md         (document de specifications produit)"""
pdf.multi_cell(0, 4.5, arbo)
pdf.ln(5)

pdf.sous_titre("5.3 API REST")
pdf.paragraphe(
    "Le backend expose une API REST complete prefixee par /api, avec les groupes de routes suivants :"
)
pdf.puce_bold("/api/auth", "Inscription, connexion, verification email, renvoi de verification")
pdf.puce_bold("/api/musicians", "CRUD profils musiciens, groupes, candidatures, contact")
pdf.puce_bold("/api/venues", "CRUD profils etablissements, abonnements")
pdf.puce_bold("/api/events", "Gestion des boeufs, concerts, planning")
pdf.puce_bold("/api/bands", "Gestion des groupes, codes d'invitation")
pdf.puce_bold("/api/messages", "Messagerie privee")
pdf.puce_bold("/api/notifications", "Notifications in-app")
pdf.puce_bold("/api/friends", "Systeme d'amis")
pdf.puce_bold("/api/badges", "Gamification et badges")
pdf.puce_bold("/api/payments", "Integration Stripe, webhooks")
pdf.puce_bold("/api/reports", "Signalements et moderation")
pdf.puce_bold("/api/analytics", "Statistiques et metriques")

# Section 6
pdf.add_page()
pdf.titre_section("6", "MODELE ECONOMIQUE")

pdf.sous_titre("Musiciens et melomanes : gratuit")
pdf.paragraphe(
    "L'inscription et l'utilisation de la plateforme sont entierement gratuites pour les musiciens "
    "et les melomanes. Un abonnement PRO optionnel (6,99 euros/mois) offre des fonctionnalites avancees : "
    "badge PRO verifie, comptabilite et factures, analytics avances, badge GUSO visible."
)

pdf.sous_titre("Etablissements : abonnement payant")
pdf.paragraphe(
    "Les etablissements beneficient d'une periode d'essai gratuite de 2 mois (60 jours). "
    "Au-dela, un abonnement mensuel de 10 euros/mois est requis pour maintenir leur profil actif "
    "et continuer a publier des evenements. Le paiement est gere via Stripe avec annulation possible "
    "a tout moment, sans engagement."
)

pdf.sous_titre("Sources de revenus")
pdf.puce("Abonnements mensuels des etablissements (10 euros/mois)")
pdf.puce("Abonnements PRO optionnels des musiciens (6,99 euros/mois)")

# Section 7
pdf.titre_section("7", "BASE DE DONNEES ET COLLECTIONS")
pdf.paragraphe("La base de donnees MongoDB Atlas contient les collections principales suivantes :")
pdf.puce_bold("users", "Comptes utilisateurs (email, mot de passe hashe, role, statut verification email)")
pdf.puce_bold("musicians", "Profils musiciens (pseudo, instruments, styles, bio, abonnement)")
pdf.puce_bold("venues", "Profils etablissements (adresse, equipement, styles, abonnement)")
pdf.puce_bold("melomanes", "Profils melomanes (pseudo, styles favoris)")
pdf.puce_bold("events", "Evenements (boeufs, concerts, planning)")
pdf.puce_bold("bands", "Groupes musicaux (nom, membres, liens)")
pdf.puce_bold("band_invite_codes", "Codes d'invitation groupes (code 6 chars, expiration 7 jours)")
pdf.puce_bold("friends", "Relations d'amitie entre utilisateurs")
pdf.puce_bold("messages", "Messages prives entre utilisateurs")
pdf.puce_bold("notifications", "Notifications in-app")
pdf.puce_bold("applications", "Candidatures des musiciens aux dates ouvertes")
pdf.puce_bold("reviews", "Avis et notations")
pdf.puce_bold("reports", "Signalements de contenu")
pdf.puce_bold("payment_transactions", "Historique des paiements Stripe")

# Section 8
pdf.add_page()
pdf.titre_section("8", "INTERFACES UTILISATEUR")
pdf.paragraphe(
    "L'interface adopte un theme sombre avec des accents neon (violet, cyan, rose) "
    "evoquant l'univers de la scene musicale. Le design utilise des effets de glassmorphisme, "
    "des bordures neon et des degradees colores. L'interface est entierement responsive et "
    "compatible mobile via une approche PWA."
)
pdf.sous_titre("Pages principales")
pdf.puce_bold("Page d'accueil (Landing)", "Presentation du concept, appels a l'action, temoignages, FAQ")
pdf.puce_bold("Authentification (Auth)", "Formulaires connexion/inscription avec choix du role")
pdf.puce_bold("Verification email (VerifyEmail)", "Page de validation du token de verification")
pdf.puce_bold("Dashboard Musicien", "Carte interactive, profil, groupes, concerts, candidatures, amis, connexions")
pdf.puce_bold("Dashboard Etablissement", "Gestion profil, creation evenements, planning, candidatures recues")
pdf.puce_bold("Dashboard Melomane", "Decouverte de musiciens et evenements")
pdf.puce_bold("Profil public Musicien", "Page consultable par tous avec informations et concerts")
pdf.puce_bold("Profil public Etablissement", "Page consultable avec evenements et informations")
pdf.puce_bold("Carte (MapExplorer)", "Vue carte plein ecran avec filtres")
pdf.puce_bold("Messagerie", "Interface de chat entre utilisateurs")
pdf.puce_bold("Badges et Leaderboard", "Classement et badges de gamification")
pdf.puce_bold("Tarifs", "Presentation des offres d'abonnement")
pdf.puce_bold("Administration", "Dashboard de moderation et analytics (acces admin)")

# Section 9
pdf.titre_section("9", "INTEGRATIONS TIERCES")
pdf.puce_bold("MongoDB Atlas", "Base de donnees NoSQL cloud pour le stockage des donnees")
pdf.puce_bold("Stripe", "Passerelle de paiement pour les abonnements (checkout, webhooks)")
pdf.puce_bold("Resend", "Service d'envoi d'emails transactionnels (verification, bienvenue, activation)")
pdf.puce_bold("Leaflet / OpenStreetMap", "Cartographie interactive avec geolocalisation")
pdf.puce_bold("Cloudflare", "CDN, DNS et protection DDoS")

# Section 10
pdf.add_page()
pdf.titre_section("10", "SECURITE ET AUTHENTIFICATION")
pdf.puce("Hashage des mots de passe avec bcrypt (salt automatique)")
pdf.puce("Authentification par tokens JWT avec expiration configuree")
pdf.puce("Verification obligatoire de l'adresse email avant toute connexion")
pdf.puce("Rate limiting sur les endpoints sensibles (inscription, connexion, renvoi verification)")
pdf.puce("Protection CORS configuree pour le domaine de production")
pdf.puce("Variables d'environnement pour toutes les donnees sensibles (cles API, connexions DB)")
pdf.puce("HTTPS obligatoire en production via Cloudflare")
pdf.puce("Systeme de signalement et moderation des contenus")
pdf.puce("Audit trail des actions sensibles (inscription, connexion, modifications)")

# Section 11
pdf.titre_section("11", "PROPRIETE INTELLECTUELLE ET ORIGINALITE")
pdf.paragraphe(
    "Jam Connexion constitue une oeuvre originale de l'esprit au sens du Code de la propriete "
    "intellectuelle. Le projet se distingue par :"
)
pdf.puce("Un concept original de mise en relation specifique a l'ecosysteme de la musique live locale")
pdf.puce("Une architecture logicielle concue et developpee integralement par son createur")
pdf.puce("Un design d'interface unique avec un theme neon/musical distinctif")
pdf.puce("Des fonctionnalites metier specifiques : gestion de boeufs musicaux, codes d'invitation de groupes, systeme de candidatures pour dates ouvertes, gestion GUSO")
pdf.puce("Un modele economique adapte a la cible (gratuit musiciens, abonnement etablissements)")
pdf.puce("L'ensemble du code source (frontend React, backend FastAPI, schemas de base de donnees) est une creation originale")
pdf.ln(5)
pdf.paragraphe(
    "Le present document, accompagne de l'archive ZIP du code source complet, constitue la preuve "
    "d'anteriorite du projet Jam Connexion a la date de depot aupres de l'INPI via le service e-Soleau."
)
pdf.ln(10)
pdf.set_font("Helvetica", "I", 10)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 7, f"Document genere le {datetime.now().strftime('%d/03/2026')} - Jam Connexion - Tous droits reserves", align="C")

# Enregistrement
pdf.output("/app/JamConnexion_Description_INPI_2026-03-27.pdf")
print("PDF genere avec succes")
