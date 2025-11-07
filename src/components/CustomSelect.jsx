import { Volume2Icon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function CustomSelect({ value, height=48, onChange, options, placeholder = "Sélectionner une option", disabled = false, dropdownPosition = "bottom", isVocalChannel = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const filteredOptions = options.filter(option =>
        option?.label?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="custom-select-container" ref={selectRef}>
            <div 
                className={`custom-select-trigger ${`h-[${height}px]`} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-discord-text' : 'text-discord-textMuted'}>
                    <div className="flex items-center">
                        {isVocalChannel ? <Volume2Icon className="mr-2 w-4 h-4" /> : null}
                        <span>{selectedOption ? selectedOption.label : placeholder}</span>
                    </div>
                </span>
                <i className={`fas fa-chevron-down transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
            </div>

            {isOpen && !disabled && (
                <div className={`custom-select-dropdown ${dropdownPosition === 'top' ? 'dropdown-top' : ''}`}>
                    <div className="custom-select-search">
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="custom-select-search-input"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="custom-select-options">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.sort().map((option) => (
                                <div
                                    key={option.value}
                                    className={`custom-select-option group ${option.value === value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    <div className="flex items-center">
                                        {isVocalChannel ? <Volume2Icon className="mr-2 w-4 h-4" /> : null}
                                        <span className="text-white">{option.label}</span>
                                    </div>
                                    {option.value === value && (
                                        <i className="fas fa-check ml-auto"></i>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="custom-select-no-results">
                                Aucun résultat trouvé
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomSelect;
