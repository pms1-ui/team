// Baserow API Configuration
const BASEROW_CONFIG = {
    apiUrl: 'https://baserow.childylab.com/api',
    token: 'Token 5Z9IZSqCKhcBDXf5B20RD1KTkIwqxvGy',
    tables: {
        divisions: 1940,
        teams: 1941,
        members: 1942,
        goals: 1943,
        keyResults: 1944,
        rnr: 1945
    }
};

// Helper function for API calls
async function baserowFetch(endpoint, options = {}) {
    const url = `${BASEROW_CONFIG.apiUrl}${endpoint}`;
    const headers = {
        'Authorization': BASEROW_CONFIG.token,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    console.log('Baserow API call:', url);
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        console.log('Baserow API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Baserow API error response:', errorText);
            throw new Error(`Baserow API error (${response.status}): ${response.statusText} - ${errorText}`);
        }
        
        // DELETE requests return 204 No Content with empty body
        if (response.status === 204 || options.method === 'DELETE') {
            console.log('Baserow API response: No content (DELETE successful)');
            return null;
        }
        
        const data = await response.json();
        console.log('Baserow API response data:', data);
        return data;
    } catch (error) {
        console.error('Baserow fetch error:', error);
        throw error;
    }
}

// Divisions API
const DivisionsAPI = {
    async list() {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.divisions}/?user_field_names=true`);
        return data.results;
    },
    
    async create(division) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.divisions}/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(division)
        });
    }
};

// Teams API
const TeamsAPI = {
    async list() {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.teams}/?user_field_names=true`);
        return data.results;
    },
    
    async create(team) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.teams}/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(team)
        });
    },
    
    async update(id, team) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.teams}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(team)
        });
    },
    
    async delete(id) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.teams}/${id}/`, {
            method: 'DELETE'
        });
    }
};

// Members API
const MembersAPI = {
    async list() {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.members}/?user_field_names=true&size=200`);
        return data.results;
    },
    
    async create(member) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.members}/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(member)
        });
    },
    
    async update(id, member) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.members}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(member)
        });
    },
    
    async delete(id) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.members}/${id}/`, {
            method: 'DELETE'
        });
    },
    
    async getByUserId(userId) {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.members}/?user_field_names=true&search=${userId}`);
        return data.results.find(m => m.user_id === userId);
    }
};

// Goals API
const GoalsAPI = {
    async list(filters = {}) {
        let url = `/database/rows/table/${BASEROW_CONFIG.tables.goals}/?user_field_names=true&size=200`;
        
        if (filters.user_id) {
            url += `&filter__user_id__equal=${filters.user_id}`;
        }
        if (filters.period_type) {
            url += `&filter__period_type__equal=${filters.period_type}`;
        }
        if (filters.period_value) {
            url += `&filter__period_value__equal=${filters.period_value}`;
        }
        
        const data = await baserowFetch(url);
        return data.results;
    },
    
    async get(id) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.goals}/${id}/?user_field_names=true`);
    },
    
    async create(goal) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.goals}/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(goal)
        });
    },
    
    async update(id, goal) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.goals}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(goal)
        });
    },
    
    async delete(id) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.goals}/${id}/`, {
            method: 'DELETE'
        });
    }
};

// Key Results API
const KeyResultsAPI = {
    async listByGoalId(goalId) {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.keyResults}/?user_field_names=true&filter__goal_id__equal=${goalId}&size=200`);
        return data.results;
    },
    
    async create(keyResult) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.keyResults}/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(keyResult)
        });
    },
    
    async update(id, keyResult) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.keyResults}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(keyResult)
        });
    },
    
    async delete(id) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.keyResults}/${id}/`, {
            method: 'DELETE'
        });
    }
};

// R&R API
const RnRAPI = {
    async list() {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.rnr}/?user_field_names=true&size=200`);
        return data.results;
    },
    
    async getByUserId(userId) {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.rnr}/?user_field_names=true&search=${userId}`);
        return data.results.find(r => r.user_id === userId);
    },
    
    async create(rnr) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.rnr}/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(rnr)
        });
    },
    
    async update(id, rnr) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.rnr}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(rnr)
        });
    },
    
    async delete(id) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.rnr}/${id}/`, {
            method: 'DELETE'
        });
    }
};
