import { useContext } from 'react';
import { ThemeContext } from '../theme';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-white"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
