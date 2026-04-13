import { Facebook, Instagram, Youtube, Globe } from 'lucide-react';

const SocialLinks = ({ facebook, instagram, youtube, website, bandcamp, className = "" }) => {
  const links = [
    { url: facebook, icon: Facebook, label: "Facebook", color: "text-blue-400" },
    { url: instagram, icon: Instagram, label: "Instagram", color: "text-pink-400" },
    { url: youtube, icon: Youtube, label: "YouTube", color: "text-red-400" },
    { url: website, icon: Globe, label: "Website", color: "text-green-400" },
    { url: bandcamp, icon: Globe, label: "Bandcamp", color: "text-cyan-400" }
  ];

  const validLinks = links.filter(link => link.url && link.url.trim() !== '');

  if (validLinks.length === 0) return null;

  return (
    <div className={`flex gap-3 ${className}`}>
      {validLinks.map((link, index) => {
        // S'assurer que l'URL commence par http:// ou https://
        let fullUrl = link.url;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          fullUrl = 'https://' + fullUrl;
        }

        return (
          <a
            key={`social-${link.label}`}
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link.color} hover:scale-110 transition-transform`}
            title={link.label}
          >
            <link.icon className="w-5 h-5" />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
