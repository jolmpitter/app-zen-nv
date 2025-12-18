'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, Phone, Mail, Loader2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                handleSearch();
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        setIsOpen(true);
        try {
            const res = await fetch(`/api/leads/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Buscar lead por nome, email ou tel..."
                    className="pl-9 h-11 bg-background/50 border-white/5 focus-visible:ring-primary/50 transition-all rounded-xl"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                )}
            </div>

            {isOpen && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-white/10 shadow-2xl bg-card/95 backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {results.length > 0 ? (
                            <div className="space-y-1">
                                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    Resultados Encontrados ({results.length})
                                </p>
                                {results.map((lead) => (
                                    <div
                                        key={lead.id}
                                        onClick={() => {
                                            router.push(`/crm/leads/${lead.id}`);
                                            setIsOpen(false);
                                            setQuery('');
                                        }}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 cursor-pointer group transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {lead.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{lead.name}</p>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Phone className="w-3 h-3" /> {lead.phone}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border">
                                                    {lead.step?.name || 'Sem funil'}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                ))}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="p-8 text-center space-y-2">
                                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                                <p className="text-sm text-muted-foreground">Nenhum lead encontrado para "{query}"</p>
                            </div>
                        ) : null}
                    </div>
                </Card>
            )}
        </div>
    );
}
