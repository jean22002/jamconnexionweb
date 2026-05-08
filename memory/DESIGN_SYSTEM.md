# 🎨 Jam Connexion - Design System Mobile

**Version** : 1.0
**Plateforme** : iOS + Android (React Native)

---

## 🌈 PALETTE DE COULEURS

### Couleurs Principales
```javascript
const colors = {
  // Primary
  primary: '#9333ea',        // Purple
  primaryLight: '#a855f7',
  primaryDark: '#7e22ce',
  
  // Secondary
  secondary: '#ec4899',      // Pink
  secondaryLight: '#f472b6',
  secondaryDark: '#db2777',
  
  // Accent
  accent: '#06b6d4',         // Cyan
  accentLight: '#22d3ee',
  accentDark: '#0891b2',
  
  // Backgrounds
  background: '#0a0a0a',     // Almost black
  surface: '#1a1a1a',        // Dark gray
  card: 'rgba(26, 26, 26, 0.8)', // Semi-transparent
  
  // Text
  text: '#ffffff',           // White
  textMuted: '#9ca3af',      // Gray
  textDisabled: '#6b7280',
  
  // Status
  success: '#10b981',        // Green
  warning: '#f59e0b',        // Orange
  error: '#ef4444',          // Red
  info: '#3b82f6',           // Blue
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  glassmorphism: 'rgba(255, 255, 255, 0.05)',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderFocus: 'rgba(147, 51, 234, 0.5)',
}
```

### Gradients
```javascript
const gradients = {
  primary: ['#9333ea', '#ec4899'],         // Purple to Pink
  secondary: ['#06b6d4', '#3b82f6'],       // Cyan to Blue
  accent: ['#f59e0b', '#ef4444'],          // Orange to Red
  dark: ['#0a0a0a', '#1a1a1a'],           // Background gradient
  glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
}
```

---

## 📝 TYPOGRAPHIE

### Polices
```javascript
const fonts = {
  // Headings
  heading: {
    fontFamily: 'Poppins-Bold',
    fontWeight: '700',
  },
  
  // Body
  body: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
  },
  
  // Semibold
  semibold: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  
  // Medium
  medium: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
}
```

### Tailles de Texte
```javascript
const fontSizes = {
  xs: 12,     // Small labels
  sm: 14,     // Body small
  base: 16,   // Body default
  lg: 18,     // Subtitle
  xl: 20,     // Heading 3
  '2xl': 24,  // Heading 2
  '3xl': 30,  // Heading 1
  '4xl': 36,  // Large heading
  '5xl': 48,  // Hero
}
```

### Hauteurs de Ligne
```javascript
const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
}
```

---

## 📏 SPACING

```javascript
const spacing = {
  0: 0,
  1: 4,    // 4px
  2: 8,    // 8px
  3: 12,   // 12px
  4: 16,   // 16px
  5: 20,   // 20px
  6: 24,   // 24px
  8: 32,   // 32px
  10: 40,  // 40px
  12: 48,  // 48px
  16: 64,  // 64px
  20: 80,  // 80px
}
```

---

## 🔘 COMPOSANTS

### Button

#### Primary Button
```javascript
{
  background: 'linear-gradient(to right, #9333ea, #ec4899)',
  borderRadius: 24,
  paddingVertical: 12,
  paddingHorizontal: 24,
  shadowColor: '#9333ea',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
}
```

#### Secondary Button
```javascript
{
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: '#9333ea',
  borderRadius: 24,
  paddingVertical: 12,
  paddingHorizontal: 24,
}
```

#### Ghost Button
```javascript
{
  backgroundColor: 'transparent',
  paddingVertical: 8,
  paddingHorizontal: 16,
}
```

---

### Card

#### Glassmorphism Card
```javascript
{
  backgroundColor: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)', // iOS only
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 5,
}
```

---

### Input

```javascript
{
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  color: '#ffffff',
}

// Focus state
{
  borderColor: '#9333ea',
  borderWidth: 2,
}
```

---

### Chip (Filter Tag)

#### Default
```javascript
{
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 20,
  paddingVertical: 8,
  paddingHorizontal: 16,
}
```

#### Selected
```javascript
{
  background: 'linear-gradient(to right, #9333ea, #ec4899)',
  borderWidth: 0,
  borderRadius: 20,
  paddingVertical: 8,
  paddingHorizontal: 16,
  shadowColor: '#9333ea',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
}
```

---

### Tab Bar (Bottom Navigation)

```javascript
{
  backgroundColor: '#1a1a1a',
  borderTopWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.1)',
  height: 60,
  paddingBottom: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
}
```

---

## 🖼️ ICÔNES

### Bibliothèque
**React Native Vector Icons** - Lucide

### Tailles Standard
```javascript
const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
}
```

### Icônes Principales
- 🎸 Musicien : `Music`, `Guitar`, `Mic`
- 🏢 Établissement : `Building2`, `MapPin`, `Home`
- 🎭 Mélomane : `Heart`, `Star`, `Users`
- 🗺️ Carte : `Map`, `MapPin`, `Navigation`
- 📅 Planning : `Calendar`, `Clock`, `CalendarCheck`
- 🔔 Notifications : `Bell`, `BellRing`
- ⚙️ Paramètres : `Settings`, `User`, `LogOut`

---

## 📱 LAYOUTS

### Screen Container
```javascript
{
  flex: 1,
  backgroundColor: '#0a0a0a',
  paddingHorizontal: 16,
  paddingTop: SafeAreaTop,
}
```

### Spacing Constants
```javascript
const layout = {
  screenPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  headerHeight: 60,
  tabBarHeight: 60,
}
```

---

## 🎭 ANIMATIONS

### Timing
```javascript
const animations = {
  fast: 200,     // Quick transitions
  normal: 300,   // Default
  slow: 500,     // Emphasis
}
```

### Easing
```javascript
import { Easing } from 'react-native';

const easing = {
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
}
```

---

## 🖼️ ASSETS REQUIS

### Logo
- `logo.png` (1024x1024)
- `logo-white.png` (transparent background)
- `icon.png` (512x512) - App icon

### App Icons
- iOS : 1024x1024 (App Store)
- Android : 512x512 (Play Store)
- Splash screen : 2732x2732

### Placeholder Images
- `placeholder-venue.png` (400x400)
- `placeholder-musician.png` (400x400)
- `placeholder-avatar.png` (200x200)

---

## 📐 BREAKPOINTS (Responsive)

```javascript
const breakpoints = {
  sm: 360,   // Small phone
  md: 375,   // iPhone SE
  lg: 414,   // iPhone Pro Max
  xl: 768,   // Tablet
}
```

---

## ✨ EFFETS SPÉCIAUX

### Glassmorphism
```javascript
{
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  // iOS only:
  backdropFilter: 'blur(10px)',
}
```

### Shadow
```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  // Android:
  elevation: 5,
}
```

---

**Export pour React Native** :

```javascript
// theme.ts
export const theme = {
  colors,
  gradients,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  iconSizes,
  layout,
  animations,
  easing,
  breakpoints,
};
```

**Date** : 28 Mars 2026