'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ThemeSettings {
    primaryColor: string;
    secondaryColor?: string;
    font?: string;
}

interface Company {
    name: string;
    logoUrl?: string;
    themeSettings?: string;
}

interface ThemeContextType {
    company: Company | null;
    loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ company: null, loading: true });

export function EnterpriseThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.companyId) {
            fetchCompanySettings();
        } else if (status !== 'loading') {
            setLoading(false);
        }
    }, [status, session]);

    const fetchCompanySettings = async () => {
        try {
            const res = await fetch('/api/company/settings');
            if (res.ok) {
                const data = await res.json();
                setCompany(data);
                applyTheme(data.themeSettings);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (settingsStr?: string) => {
        if (!settingsStr) return;
        try {
            const settings: ThemeSettings = JSON.parse(settingsStr);
            const root = document.documentElement;

            if (settings.primaryColor) {
                const hsl = hexToHsl(settings.primaryColor);
                if (hsl) {
                    root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
                    // Também injetar o ring do tailwind
                    root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
                }
            }

            if (settings.font) {
                root.style.setProperty('--font-main', settings.font);
                document.body.style.fontFamily = `${settings.font}, sans-serif`;
            }
        } catch (e) {
            console.error('Invalid theme settings JSON', e);
        }
    };

    function hexToHsl(hex: string) {
        // Remover # se existir
        hex = hex.replace(/^#/, '');

        // Converter para RGB
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16) / 255;
            g = parseInt(hex[1] + hex[1], 16) / 255;
            b = parseInt(hex[2] + hex[2], 16) / 255;
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
        } else {
            return null;
        }

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    return (
        <ThemeContext.Provider value={{ company, loading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
