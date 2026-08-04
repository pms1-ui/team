// Baserow API Configuration
// Configuration is loaded from config.js (not committed to git)
// If config.js doesn't exist, it will use fallback values

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
    async listAll() {
        let allResults = [];
        let page = 1;
        let hasNext = true;
        while (hasNext) {
            const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.keyResults}/?user_field_names=true&size=200&page=${page}`);
            allResults = allResults.concat(data.results);
            hasNext = !!data.next;
            page++;
        }
        return allResults;
    },

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

// Poll API
const PollAPI = {
    async list() {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.poll}/?user_field_names=true&size=200`);
        return data.results;
    },
    
    async create(poll) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.poll}/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(poll)
        });
    },
    
    async update(id, poll) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.poll}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(poll)
        });
    },
    
    async delete(id) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.poll}/${id}/`, {
            method: 'DELETE'
        });
    }
};

// Assessment (Feedback) API
const AssessmentAPI = {
    async list() {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.assessment}/?user_field_names=true&size=200`);
        return data.results;
    },
    
    async listByTarget(targetId) {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.assessment}/?user_field_names=true&filter__target_id__equal=${targetId}&size=200`);
        return data.results;
    },
    
    async listByReviewer(reviewerId) {
        const data = await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.assessment}/?user_field_names=true&filter__reviewer_id__equal=${reviewerId}&size=200`);
        return data.results;
    },
    
    async create(assessment) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.assessment}/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(assessment)
        });
    },
    
    async update(id, assessment) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.assessment}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(assessment)
        });
    },
    
    async delete(id) {
        return await baserowFetch(`/database/rows/table/${BASEROW_CONFIG.tables.assessment}/${id}/`, {
            method: 'DELETE'
        });
    }
};

// Weekly Report API (table id: 2080)
const WeeklyReportAPI = {
    async list() {
        const data = await baserowFetch(`/database/rows/table/2080/?user_field_names=true&size=200`);
        return data.results;
    },

    async listByUserId(userId) {
        const data = await baserowFetch(`/database/rows/table/2080/?user_field_names=true&filter__user_id__equal=${encodeURIComponent(userId)}&size=200`);
        return data.results;
    },

    async create(report) {
        return await baserowFetch(`/database/rows/table/2080/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(report)
        });
    },

    async update(id, report) {
        return await baserowFetch(`/database/rows/table/2080/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(report)
        });
    },

    async delete(id) {
        return await baserowFetch(`/database/rows/table/2080/${id}/`, {
            method: 'DELETE'
        });
    }
};

// Period Settings API (table id: 2132)
const PeriodSettingsAPI = {
    async list() {
        const data = await baserowFetch(`/database/rows/table/2132/?user_field_names=true&size=200`);
        return data.results;
    },
    async update(id, row) {
        return await baserowFetch(`/database/rows/table/2132/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(row)
        });
    }
};

// Gantt Tasks API (table id: 2319)
const GanttAPI = {
    async listByTeam(team) {
        const data = await baserowFetch(`/database/rows/table/2319/?user_field_names=true&size=200&filter__team__equal=${team}`);
        return data.results;
    },
    async create(task) {
        return await baserowFetch(`/database/rows/table/2319/?user_field_names=true`, {
            method: 'POST',
            body: JSON.stringify(task)
        });
    },
    async update(id, task) {
        return await baserowFetch(`/database/rows/table/2319/${id}/?user_field_names=true`, {
            method: 'PATCH',
            body: JSON.stringify(task)
        });
    },
    async delete(id) {
        return await baserowFetch(`/database/rows/table/2319/${id}/`, {
            method: 'DELETE'
        });
    }
};
