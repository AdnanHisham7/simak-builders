import { MagnifyingGlassIcon } from "@/assets/icons";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  className = "",
}) => (
  <div className={`relative ${className}`}>
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-5 w-5" />

    <input
      type="text"
      placeholder={placeholder}
      className="w-full h-[44px] pl-10 pr-4 border border-gray-300 rounded-md text-sm
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none 
             placeholder-gray-400 transition-all
             hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  </div>
);

export default SearchInput;
