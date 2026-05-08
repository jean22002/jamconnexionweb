/**
 * NoAutocompleteInput
 * 
 * Uses contenteditable div to completely bypass browser autocomplete
 * Works on ALL browsers including Safari macOS
 */
import { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function NoAutocompleteInput({ 
  value, 
  onChange, 
  placeholder = "",
  className = "",
  loading = false
}) {
  const divRef = useRef(null);

  // Sync value to div content
  useEffect(() => {
    if (divRef.current && divRef.current.textContent !== value) {
      divRef.current.textContent = value;
    }
  }, [value]);

  const handleInput = (e) => {
    const newValue = e.target.textContent;
    onChange({ target: { value: newValue } });
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <div
        ref={divRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={`w-full bg-black/20 border border-white/10 rounded-md px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] ${className}`}
        style={{
          whiteSpace: 'pre',
          overflowWrap: 'break-word',
        }}
        suppressContentEditableWarning
      />
      {!value && (
        <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
