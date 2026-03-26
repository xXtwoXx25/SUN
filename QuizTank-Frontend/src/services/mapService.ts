import api from './api';

export interface MapData {
    map_id: number;
    name: string;
    description?: string;
    image_url?: string;
    status: number; // 1 = active, 2 = inactive
    data?: number[];
    created_at?: string;
    updated_at?: string;
}

export const mapService = {
    getAllMaps: async () => {
        const response = await api.get('/maps');
        return response.data;
    },

    getMapById: async (id: number) => {
        const response = await api.get(`/maps/${id}`);
        return response.data;
    },

    createMap: async (mapData: Partial<MapData>) => {
        const response = await api.post('/maps', mapData);
        return response.data;
    },

    updateMap: async (id: number, mapData: Partial<MapData>) => {
        const response = await api.put(`/maps/${id}`, mapData);
        return response.data;
    },

    deleteMap: async (id: number) => {
        const response = await api.delete(`/maps/${id}`);
        return response.data;
    }
};
