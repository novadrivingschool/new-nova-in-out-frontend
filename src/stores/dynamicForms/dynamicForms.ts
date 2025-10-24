import { defineStore } from 'pinia';
import api, { type FormSchema } from '@/lib/formsApi';

export const useFormsStore = defineStore('forms', {
    state: () => ({
        current: null as FormSchema | null,
        loading: false,
    }),
    actions: {
        async fetchForm(id: string) {
            this.loading = true;
            try { this.current = await api.getForm(id); return this.current; }
            finally { this.loading = false; }
        },
        async save(form: FormSchema) {
            const saved = form.id ? await api.updateForm(form.id, form) : await api.createForm(form);
            this.current = saved;
            return saved;
        },
        async fetchPublic(token: string) {
            return api.getPublicForm(token);
        },
        async submit(formId: string, data: Record<string, any>) {
            return api.submitForm(formId, data);
        },
    },
});
