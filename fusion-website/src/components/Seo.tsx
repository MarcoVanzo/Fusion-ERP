import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
    title: string;
    description: string;
    image?: string;
    pathname?: string;
    type?: 'website' | 'article';
}

export const Seo: React.FC<SeoProps> = ({ 
    title, 
    description, 
    image = 'https://www.fusionteamvolley.it/assets/logo.png', // Default meta image
    pathname = '', 
    type = 'website' 
}) => {
    const siteUrl = 'https://www.fusionteamvolley.it';
    const canonical = `${siteUrl}${pathname}`;
    const fullTitle = `${title} - Fusion Team Volley`;

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
        </Helmet>
    );
};
