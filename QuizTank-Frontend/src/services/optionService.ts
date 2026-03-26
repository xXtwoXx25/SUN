import api from './api';

export const optionService = {
    getOptions: async () => {
        const response = await api.get('/options');
        return response.data;
    }
};
