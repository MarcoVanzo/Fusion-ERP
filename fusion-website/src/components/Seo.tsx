import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SeoProps {
    title: string;
    description: string;
    image?: string;
    pathname?: string;
    type?: 'website' | 'article';
    structuredData?: Record<string, unknown> | Record<string, unknown>[];
    children?: React.ReactNode;
}

export const Seo: React.FC<SeoProps> = ({ 
    title, 
    description, 
    image = 'https://www.fusionteamvolley.it/assets/logo-colorato.png', // Default meta image
    pathname, 
    type = 'website',
    structuredData,
    children
}) => {
    const location = useLocation();
    const currentPathname = pathname || location.pathname;
    const siteUrl = 'https://www.fusionteamvolley.it';
    const canonical = `${siteUrl}${currentPathname}`;
    const fullTitle = `${title} - Fusion Team Volley`;

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'SportsOrganization',
        'name': 'Fusion Team Volley',
        'url': siteUrl,
        'logo': `${siteUrl}/assets/logo.png`,
        'sameAs': [
            'https://www.facebook.com/fusionteamvolley',
            'https://www.instagram.com/fusionteamvolley/'
        ]
    };

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            
            {/* Canonical Link */}
            <link rel="canonical" href={canonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonical} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonical} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Organization Schema (Base) */}
            <script type="application/ld+json">
                {JSON.stringify(organizationSchema)}
            </script>

            {/* Custom Structured Data (if any) */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}

            {children}
        </Helmet>
    );
};
