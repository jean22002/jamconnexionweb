/**
 * BandSearchInput
 * 
 * Custom search input that prevents browser autocomplete on ALL browsers
 * including Safari macOS which is very aggressive with Contacts suggestions
 */
import { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function BandSearchInput({ 
  value, 
  onChange, 
  onFocus, 
  onBlur,
  placeholder = "Nom du groupe...",
  className = "",
  loading = false
}) {
  const inputRef = useRef(null);

  // Prevent all browser autocomplete behaviors
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // Disable browser autocomplete on focus
    const handleFocus = (e) => {
      // Force readonly briefly to prevent autocomplete popup
      input.setAttribute('readonly', 'readonly');
      setTimeout(() => {
        input.removeAttribute('readonly');
        input.focus();
      }, 10);
      
      if (onFocus) onFocus(e);
    };

    input.addEventListener('focus', handleFocus);
    
    return () => {
      input.removeEventListener('focus', handleFocus);
    };
  }, [onFocus]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-black/20 border border-white/10 rounded-md px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        data-form-type="other"
        data-lpignore="true"
        aria-autocomplete="list"
        role="combobox"
        aria-expanded={false}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
