import { defineStore } from 'pinia';

export const useScheduleStore = defineStore('schedule', {
    state: () => ({
        instructors: [
            {
                id: 1,
                name: 'Juan Pérez',
                color: '#A2C4EC', // azul pastel
                events: [
                    { id: 1, title: 'Clase Matemáticas', start: '2025-05-28T10:00:00', end: '2025-05-28T11:00:00', students: ['Ana', 'Luis'] },
                    { id: 2, title: 'Clase Física', start: '2025-05-28T14:00:00', end: '2025-05-28T15:30:00', students: ['Carlos'] },
                ],
            },
            {
                id: 2,
                name: 'María López',
                color: '#A8E6CF', // verde pastel
                events: [
                    { id: 3, title: 'Clase Química', start: '2025-05-29T09:00:00', end: '2025-05-29T10:30:00', students: ['Lucía', 'Pedro'] },
                ],
            },
            {
                id: 3,
                name: 'Ricardo Gómez',
                color: '#FFD3B6', // naranja pastel
                events: [
                    { id: 4, title: 'Clase Historia', start: '2025-05-30T11:00:00', end: '2025-05-30T12:30:00', students: ['María', 'José'] },
                ],
            },
            {
                id: 4,
                name: 'Laura Torres',
                color: '#FFB7B2', // rosa pastel
                events: [
                    { id: 5, title: 'Clase Arte', start: '2025-05-31T13:00:00', end: '2025-05-31T14:30:00', students: ['Elena', 'Miguel'] },
                ],
            },
            {
                id: 5,
                name: 'Carlos Ramírez',
                color: '#C9C9FF', // lila pastel
                events: [
                    { id: 6, title: 'Clase Música', start: '2025-05-27T15:00:00', end: '2025-05-27T16:30:00', students: ['Sofía', 'Andrés'] },
                ],
            },
        ],
    }),
    actions: {
        addEvent(instructorId: number, event: { id: number; title: string; start: string; end: string; students: string[]; }) {
            const instructor = this.instructors.find(i => i.id === instructorId);
            if (instructor) {
                instructor.events.push({ ...event });
            }
        },
        editEvent(instructorId: number, eventId: number, updatedEvent: { id: number; title: string; start: string; end: string; students: string[]; }) {
            const instructor = this.instructors.find(i => i.id === instructorId);
            if (instructor) {
                const index = instructor.events.findIndex(e => e.id === eventId);
                if (index !== -1) {
                    instructor.events[index] = { ...instructor.events[index], ...updatedEvent };
                }
            }
        },
        deleteEvent(instructorId: number, eventId: number) {
            const instructor = this.instructors.find(i => i.id === instructorId);
            if (instructor) {
                instructor.events = instructor.events.filter(e => e.id !== eventId);
            }
        },
    },
});


