import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000' });

export interface FormField {
    id: string;
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'email' | 'checkbox' | 'radio' | 'switch';
    required?: boolean;
    placeholder?: string;
    hint?: string;
    options?: string[];   // para select/radio
    multiple?: boolean;   // select multiple
    min?: number | null;
    max?: number | null;
    minLength?: number | null;
    maxLength?: number | null;
    pattern?: string | null;
    cols?: number;
    default?: any;
}

export interface FormSchema {
    id?: string;
    name: string;
    description?: string;
    isPublic: boolean;
    publicToken?: string;
    fields: FormField[];
    submit?: { btnText?: string; successMessage?: string };
}

export default {
    // Admin (privado)
    createForm(payload: FormSchema) {
        return api.post('/forms', payload).then(r => r.data);
    },
    getForm(id: string) {
        return api.get(`/forms/${id}`).then(r => r.data);
    },
    updateForm(id: string, payload: FormSchema) {
        return api.put(`/forms/${id}`, payload).then(r => r.data);
    },

    // Público
    getPublicForm(token: string) {
        return api.get(`/public/forms/${token}`).then(r => r.data);
    },

    // Submissions
    submitForm(formId: string, data: Record<string, any>) {
        return api.post(`/forms/${formId}/submissions`, { data }).then(r => r.data);
    },
};
