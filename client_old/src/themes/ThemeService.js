import themeData from './theme-data.json';
import { themes as tailwindThemes } from './themes';

// Add type properties to the tailwind themes
tailwindThemes.dark.type = 'dark';
tailwindThemes.light.type = 'light';
tailwindThemes.highContrast.type = 'high-contrast';

const CUSTOM_THEME_KEY = 'custom-theme';
const CURRENT_THEME_KEY = 'theme-id';

class ThemeService {
  constructor() {
    this.themes = themeData.themes;
    this.tailwindThemes = tailwindThemes;
    this.currentThemeId = localStorage.getItem(CURRENT_THEME_KEY) || 'dark';
    
    // Load custom theme from localStorage if it exists
    const savedCustomTheme = localStorage.getItem(CUSTOM_THEME_KEY);
    if (savedCustomTheme) {
      try {
        this.customTheme = JSON.parse(savedCustomTheme);
      } catch (e) {
        console.error('Error parsing custom theme from localStorage:', e);
        this.customTheme = null;
      }
    }
  }

  /**
   * Get all available theme objects from JSON file
   */
  getAllThemes() {
    return this.themes;
  }

  /**
   * Get all available theme IDs including custom
   */
  getAllThemeIds() {
    const basicThemeIds = ['dark', 'light', 'high-contrast'];
    if (this.customTheme) {
      return [...basicThemeIds, 'custom'];
    }
    return basicThemeIds;
  }

  /**
   * Get a theme by its ID
   */
  getThemeById(id) {
    // Check for custom theme first
    if (id === 'custom' && this.customTheme) {
      return this.customTheme;
    }
    
    // Handle basic theme ids
    if (id === 'dark') return tailwindThemes.dark;
    if (id === 'light') return tailwindThemes.light;
    if (id === 'high-contrast') return tailwindThemes.highContrast;
    
    // For VSCode-style themes from theme-data.json
    return this.themes.find(theme => theme.id === id) || this.themes[0];
  }

  /**
   * Get the currently active theme
   */
  getCurrentTheme() {
    return this.getThemeById(this.currentThemeId);
  }

  /**
   * Get the current Tailwind CSS theme object
   */
  getCurrentTailwindTheme() {
    // If custom theme is active, return it
    if (this.currentThemeId === 'custom' && this.customTheme) {
      return this.customTheme;
    }
    
    // Otherwise return appropriate tailwind theme
    if (this.currentThemeId.includes('dark')) {
      return this.tailwindThemes.dark;
    } else if (this.currentThemeId.includes('light')) {
      return this.tailwindThemes.light;
    } else {
      return this.tailwindThemes.highContrast;
    }
  }

  /**
   * Set the current theme by ID or object
   */
  setTheme(themeIdOrObject) {
    // If an object is passed, it's a custom theme
    if (typeof themeIdOrObject === 'object') {
      this.saveCustomTheme(themeIdOrObject);
      this.currentThemeId = 'custom';
      localStorage.setItem(CURRENT_THEME_KEY, 'custom');
      return this.customTheme;
    }
    
    // Otherwise it's a theme ID
    this.currentThemeId = themeIdOrObject;
    localStorage.setItem(CURRENT_THEME_KEY, themeIdOrObject);
    return this.getThemeById(themeIdOrObject);
  }

  /**
   * Save a custom theme to localStorage
   */
  saveCustomTheme(themeObject) {
    // Ensure the theme has the necessary properties
    const customTheme = {
      id: 'custom',
      type: 'custom',
      ...themeObject
    };
    
    // Save to instance and localStorage
    this.customTheme = customTheme;
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(customTheme));
    return customTheme;
  }

  /**
   * Get the saved custom theme
   */
  getCustomTheme() {
    return this.customTheme;
  }

  /**
   * Toggle between themes
   */
  toggleTheme(themeIdOrObject) {
    // If specific theme is requested, set it
    if (themeIdOrObject) {
      return this.setTheme(themeIdOrObject);
    }
    
    // Otherwise cycle through themes
    if (this.currentThemeId.includes('dark')) {
      return this.setTheme('light');
    } else if (this.currentThemeId.includes('light')) {
      return this.setTheme('high-contrast');
    } else {
      return this.setTheme('dark');
    }
  }

  /**
   * Generate CSS variables from a theme
   */
  generateCssVariables(theme) {
    const colors = theme.colors;
    let cssVars = '';
    
    if (colors) {
      for (const [key, value] of Object.entries(colors)) {
        cssVars += `--${key.replace(/\./g, '-')}: ${value};\n`;
      }
    }
    
    return cssVars;
  }

  /**
   * Apply the current theme to the document
   */
  applyTheme() {
    const theme = this.getCurrentTheme();
    const cssVars = this.generateCssVariables(theme);
    
    // Create or update style element
    let styleElem = document.getElementById('theme-variables');
    if (!styleElem) {
      styleElem = document.createElement('style');
      styleElem.id = 'theme-variables';
      document.head.appendChild(styleElem);
    }
    
    styleElem.textContent = `:root {\n${cssVars}}`;
    
    // Update body class based on theme type
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-hc', 'theme-custom');
    document.body.classList.add(`theme-${theme.type || 'custom'}`);
  }
}

export default new ThemeService(); 