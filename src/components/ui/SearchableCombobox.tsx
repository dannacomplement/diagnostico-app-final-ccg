import { useState, useRef, useEffect, useCallback } from 'react';

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function SearchableCombobox({ value, onChange, options, placeholder }: SearchableComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync displayed text when value changes externally
  useEffect(() => {
    const match = options.find(o => o.value === value);
    setQuery(match ? match.label : value);
  }, [value, options]);

  const filtered = options.filter(o =>
    normalize(o.label).includes(normalize(query))
  );

  const handleInputChange = (text: string) => {
    setQuery(text);
    setIsOpen(true);
    setHighlightIndex(-1);
    onChange(text);
  };

  const handleSelect = useCallback((opt: { value: string; label: string }) => {
    setQuery(opt.label);
    onChange(opt.value);
    setIsOpen(false);
    setHighlightIndex(-1);
  }, [onChange]);

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setIsOpen(false), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          handleSelect(filtered[highlightIndex]);
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input-field"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />
      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="bg-white border border-border shadow-lg"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: '4px',
            borderRadius: '10px',
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '4px 0',
            listStyle: 'none',
          }}
          role="listbox"
        >
          {filtered.map((opt, i) => {
            const isHighlighted = i === highlightIndex;
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseDown={() => {
                  clearTimeout(blurTimeout.current);
                  handleSelect(opt);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-pale text-ink' : 'text-muted'
                } ${isSelected ? 'font-semibold text-accent' : ''}`}
                style={{
                  padding: '8px 14px',
                  fontSize: 'var(--fs-12)',
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
