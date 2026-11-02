import type { ExternalPluginConfig } from '@windy/interfaces';
const config: ExternalPluginConfig = {
 name: 'windy-plugin-route-du-rhum-2026', version: '0.1.0', icon: '⛵',
 title: 'Route du Rhum 2026',
 description: 'Suivi des voiliers Route du Rhum : positions, skippers, vitesse, trace historique (source JSON autorisée).',
 author: 'Gauthier Descolas',
 repository: 'https://github.com/8grd5f86gw-debug/LeG',
 homepage: 'https://carto.routedurhum.com/fr/index.html',
 desktopUI: 'embedded', mobileUI: 'small', routerPath: '/route-du-rhum', private: true
};
export default config;
