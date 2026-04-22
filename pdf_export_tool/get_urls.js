const fetch = require('node-fetch');

const BASE_URL = 'https://www.fusionteamvolley.it';
const ERP_API = `${BASE_URL}/ERP/api/router.php`;

const staticRoutes = [
    '/',
    '/club',
    '/news',
    '/teams',
    '/shop',
    '/results',
    '/outseason',
    '/foresteria',
    '/network',
    '/sponsors',
    '/proposal1',
    '/proposal2',
    '/proposal3',
    '/menu1',
    '/menu2',
    '/menu3',
    '/menu4',
    '/menu5'
];

async function getDynamicUrls() {
    const urls = [];

    try {
        // Fetch News
        console.log('Fetching news...');
        const newsRes = await fetch(`${ERP_API}?module=website&action=getPublicNews&limit=100`);
        const newsData = await newsRes.json();
        if (newsData.status === 'success' || newsData.success) {
            newsData.data.forEach(article => {
                urls.push(`/news/${article.slug}`);
            });
        }

        // Fetch Teams
        console.log('Fetching teams...');
        const teamsRes = await fetch(`${ERP_API}?module=athletes&action=getPublicTeams`);
        const teamsData = await teamsRes.json();
        if (teamsData.status === 'success' || teamsData.success) {
            teamsData.data.forEach(team => {
                // Roster logic for slug generation if slug is missing
                const slug = team.slug || team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                urls.push(`/teams/${slug}`);
            });
        }
    } catch (err) {
        console.error('Error fetching dynamic URLs:', err);
    }

    return urls;
}

async function main() {
    const dynamicRoutes = await getDynamicUrls();
    const allRoutes = [...new Set([...staticRoutes, ...dynamicRoutes])];
    
    const allUrls = allRoutes.map(route => `${BASE_URL}${route}`);
    console.log(JSON.stringify(allUrls, null, 2));
}

main();
