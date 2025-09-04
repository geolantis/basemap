module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    res.status(200).json({
        examples: [
            {
                id: 'nsw-streets',
                name: 'NSW Basemap Streets',
                url: 'https://portal.spatial.nsw.gov.au/vectortileservices/rest/services/Hosted/NSW_BaseMap_VectorTile_Streets/VectorTileServer/resources/styles/root.json?f=pjson',
                description: 'Street map of New South Wales, Australia',
                center: [151.2093, -33.8688],
                zoom: 10
            },
            {
                id: 'nsw-topo',
                name: 'NSW Topographic',
                url: 'https://portal.spatial.nsw.gov.au/vectortileservices/rest/services/Hosted/NSW_BaseMap_VectorTile_Topographic/VectorTileServer/resources/styles/root.json?f=pjson',
                description: 'Topographic map of New South Wales',
                center: [151.2093, -33.8688],
                zoom: 10
            }
        ]
    });
};