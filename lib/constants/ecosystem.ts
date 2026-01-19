import React from 'react';

export interface EcosystemApp {
    id: string;
    label: string;
    description: string;
    subdomain: string;
    icon: string;
    color: string;
}

export const ECOSYSTEM_APPS: EcosystemApp[] = [
    {
        id: 'note',
        label: 'WhisperrNote',
        description: 'Advanced knowledge base & research',
        subdomain: 'note',
        icon: '📝',
        color: '#00F0FF'
    },
    {
        id: 'keep',
        label: 'WhisperrKeep',
        description: 'Military-grade vault & credentials',
        subdomain: 'keep',
        icon: '🛡️',
        color: '#FACC15'
    },
    {
        id: 'flow',
        label: 'WhisperrFlow',
        description: 'Task orchestration & orchestration',
        subdomain: 'flow',
        icon: '🌊',
        color: '#4ADE80'
    },
    {
        id: 'connect',
        label: 'WhisperrConnect',
        description: 'High-fidelity communication',
        subdomain: 'connect',
        icon: '📡',
        color: '#FF00F5'
    },
    {
        id: 'id',
        label: 'WhisperrID',
        description: 'Unified identity & security',
        subdomain: 'id',
        icon: '🆔',
        color: '#8B5CF6'
    }
];

export const getEcosystemUrl = (subdomain: string) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        const ports: Record<string, number> = {
            'note': 3000,
            'keep': 3001,
            'flow': 3002,
            'connect': 3003,
            'id': 3004
        };
        return `http://localhost:${ports[subdomain]}`;
    }
    return `https://${subdomain}.whisperrnote.space`;
};
