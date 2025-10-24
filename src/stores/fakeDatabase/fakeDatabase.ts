import type { Lead } from '@/stores/leads/leads'
import type { Instructor } from '@/stores/instructors/instructors'
import type { Student } from '@/stores/students/students'
import type { Program } from '@/stores/programs/programs'
import type { Source } from '@/stores/sources/sources'
import type { Location } from '@/stores/locations/locations'
import type { NotSoldReason } from '@/stores/notSoldReasons/notSoldReasons'
import type { Post } from '@/stores/post/post'
import type { Classroom } from '../rooms/rooms'

let eventGuid = 0;
const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const d = today.getDate();

export const fakeDatabase = {
    leads: [
        {
            id: 1,
            name: 'Daniel',
            lastName: 'Pérez',
            source: 'Facebook Ads',
            location: 'Mérida',
            age: 28,
            programsOffered: [{ id: 1, name: 'Starter Plan', price: 100 }],
            programsSold: [],
            notes: 'Requested info about payment plans.',
            reminder: '2025-05-15',
            phone: '+52 999 000 1111',
            email: 'daniel@example.com',
            language: 'Spanish',
            followUp: [],
            assignedTo: [],
            type: 'LEAD',
            notSoldReason: '',
            lost: false,
            dealWon: false
        },
        {
            /* DEAL OPEN */
            id: 2,
            name: 'María',
            lastName: 'López',
            source: 'Referral',
            location: 'Cancún',
            age: 35,
            programsOffered: [{ id: 2, name: 'Pro Plan', price: 300 }],
            programsSold: [{ id: 2, name: 'Pro Plan', price: 300 }],
            notes: 'Interested in upgrade.',
            reminder: '2025-06-01',
            phone: '+52 998 123 4567',
            email: 'maria@example.com',
            language: 'Spanish',
            followUp: [],
            assignedTo: [],
            type: 'DEAL',
            notSoldReason: '',
            lost: false,
            dealWon: false
        },
        {
            id: 3,
            name: 'Luis',
            lastName: 'Martínez',
            source: 'Google Ads',
            location: 'CDMX',
            age: 40,
            programsOffered: [{ id: 1, name: 'Starter Plan', price: 100 }],
            programsSold: [],
            notes: 'Did not follow up.',
            reminder: '',
            phone: '+52 555 987 6543',
            email: 'luis@example.com',
            language: 'English',
            followUp: [],
            assignedTo: [],
            type: 'LEAD',
            notSoldReason: 'No response',
            lost: true,
            dealWon: false
        },
        {
            id: 4,
            name: 'Ana',
            lastName: 'Ramírez',
            source: 'LinkedIn',
            location: 'Monterrey',
            age: 32,
            programsOffered: [{ id: 3, name: 'Enterprise Plan', price: 500 }],
            programsSold: [],
            notes: 'Follow-up scheduled.',
            reminder: '2025-05-20',
            phone: '+52 818 555 1122',
            email: 'ana@example.com',
            language: 'Spanish',
            followUp: [],
            assignedTo: [],
            type: 'CONTACT',
            notSoldReason: '',
            lost: false,
            dealWon: false
        },
        {
            /* DEAL LOST */
            id: 5,
            name: 'Pedro',
            lastName: 'Sánchez',
            source: 'Event',
            location: 'Guadalajara',
            age: 45,
            programsOffered: [{ id: 2, name: 'Pro Plan', price: 300 }],
            programsSold: [],
            notes: 'Budget issues.',
            reminder: '',
            phone: '+52 333 222 3344',
            email: 'carlos@example.com',
            language: 'Spanish',
            followUp: [],
            assignedTo: [],
            type: 'DEAL',
            notSoldReason: 'Budget too high',
            lost: true,
            dealWon: false
        },
        {
            id: 6,
            name: 'Daniel',
            lastName: 'Pérez',
            source: 'Facebook Ads',
            location: 'Mérida',
            age: 28,
            programsOffered: [
                { id: 1, name: 'Starter Plan', price: 100 },
                { id: 1, name: 'Starter Plan', price: 100 }
            ],
            programsSold: [
                { id: 2, name: 'Pro Plan', price: 300 },
                { id: 2, name: 'Pro Plan', price: 300 }
            ],
            notes: 'Requested info about payment plans.',
            reminder: '2025-05-15',
            phone: '+52 999 000 1111',
            phone2: '+52 999 222 3333',
            email: 'daniel@example.com',
            language: 'Spanish',
            otherLanguage: 'English',
            followUp: [
                {
                    date: '2025-05-10',
                    time: '15:30',
                    employee: {
                        name: 'Mario',
                        lastName: 'Gómez',
                        employeeNumber: 'EMP045'
                    }
                },
                {
                    date: '2025-05-12',
                    time: '10:00',
                    employee: {
                        name: 'Laura',
                        lastName: 'Flores',
                        employeeNumber: 'EMP046'
                    }
                }
            ],
            assignedTo: [
                {
                    name: 'Mario',
                    lastName: 'Gómez',
                    employeeNumber: 'EMP045'
                },
                {
                    name: 'Laura',
                    lastName: 'Flores',
                    employeeNumber: 'EMP046'
                }
            ],
            type: 'LEAD',
            notSoldReason: '',
            lost: false,
            dealWon: false
        },
        {
            /* DEAL OPEN */
            id: 7,
            name: 'Carlos',
            lastName: 'Sánchez',
            source: 'Event',
            location: 'Guadalajara',
            age: 45,
            programsOffered: [{ id: 2, name: 'Pro Plan', price: 300 }],
            programsSold: [],
            notes: 'Budget issues.',
            reminder: '',
            phone: '+52 333 222 3344',
            email: 'carlos@example.com',
            language: 'Spanish',
            followUp: [],
            assignedTo: [],
            type: 'DEAL',
            notSoldReason: 'Budget too high',
            lost: false,
            dealWon: false
        },
        {
            /* DEAL WON */
            id: 8,
            name: 'Laura',
            lastName: 'Torres',
            source: 'Instagram',
            location: 'Tijuana',
            age: 30,
            programsOffered: [{ id: 4, name: 'Custom Plan', price: 200 }],
            programsSold: [{ id: 4, name: 'Custom Plan', price: 200 }],
            notes: 'Closed the deal.',
            reminder: '',
            phone: '+52 664 111 2233',
            email: 'laura@example.com',
            language: 'Spanish',
            followUp: [],
            assignedTo: [],
            type: 'DEAL',
            notSoldReason: '',
            lost: false,
            dealWon: true
        },
        {
            id: 9,
            name: 'Cristina',
            lastName: 'Ramírez',
            source: 'LinkedIn',
            location: 'Monterrey',
            age: 32,
            programsOffered: [{ id: 3, name: 'Enterprise Plan', price: 500 }],
            programsSold: [],
            notes: 'Follow-up scheduled.',
            reminder: '2025-05-20',
            phone: '+52 818 555 1122',
            email: 'ana@example.com',
            language: 'Spanish',
            followUp: [],
            assignedTo: [],
            type: 'CONTACT',
            notSoldReason: '',
            lost: true,
            dealWon: false
        },
    ] as Lead[],

    instructors: [
        {
            id: 1,
            name: 'Carlos',
            lastName: 'López',
            expertise: 'Web Development',
            email: 'carlos.lopez@example.com',
            phone: '+52 999 123 4567',
            languages: ['Spanish', 'English'],
            assignedPrograms: [
                { id: 1, name: 'Starter Plan', price: 100 },
                { id: 2, name: 'Pro Plan', price: 300 }
            ]
        },
        {
            id: 2,
            name: 'Sofía',
            lastName: 'Martínez',
            expertise: 'Data Science',
            email: 'sofia.martinez@example.com',
            phone: '+52 999 987 6543',
            languages: ['Spanish'],
            assignedPrograms: [
                { id: 3, name: 'Enterprise Plan', price: 500 }
            ]
        }
    ] as Instructor[],

    students: [
        {
            id: 1,
            name: 'Ana',
            lastName: 'Pérez',
            email: 'ana.perez@example.com',
            phone: '+52 999 555 1111',
            enrolledPrograms: [
                { id: 1, name: 'Starter Plan', price: 100 },
                { id: 3, name: 'Enterprise Plan', price: 500 }
            ]
        },
        {
            id: 2,
            name: 'Luis',
            lastName: 'Ramírez',
            email: 'luis.ramirez@example.com',
            phone: '+52 999 444 2222',
            enrolledPrograms: [
                { id: 2, name: 'Pro Plan', price: 300 }
            ]
        }
    ] as Student[],

    programs: [
        { id: 1, name: 'Starter Plan', description: 'Basic access', price: 100, isActive: true },
        { id: 2, name: 'Pro Plan', description: 'Full access', price: 300, isActive: true },
        { id: 3, name: 'Enterprise', description: 'Custom pricing', price: 1000, isActive: false }
    ] as Program[],

    sources: [
        { id: 1, name: 'Facebook Ads' },
        { id: 2, name: 'LinkedIn' },
        { id: 3, name: 'Referral' },
        { id: 4, name: 'Website Form' }
    ] as Source[],

    locations: [
        { id: 1, name: 'Mérida' },
        { id: 2, name: 'CDMX' },
        { id: 3, name: 'Guadalajara' },
        { id: 4, name: 'Monterrey' }
    ] as Location[],

    notSoldReasons: [
        { id: 1, name: 'Price too high' },
        { id: 2, name: 'Not interested' },
        { id: 3, name: 'Competitor chosen' },
        { id: 4, name: 'Budget constraints' },
        { id: 5, name: 'Timing issue' }
    ] as NotSoldReason[],

    posts: [
        {
            id: 1,
            title: 'Post One',
            by: 'Author A',
            date: '2025-05-30',
            time: '10:00 AM',
            link: 'https://picsum.photos/600/400',
            status: 'approved'
        },
        {
            id: 2,
            title: 'Post Two',
            by: 'Author B',
            date: '2025-05-29',
            time: '2:30 PM',
            link: 'https://picsum.photos/600/400',
            status: 'not approved'
        },
        {
            id: 3,
            title: 'Post Three',
            by: 'Author C',
            date: '2025-05-28',
            time: '4:45 PM',
            link: 'https://picsum.photos/600/400',
            status: 'not approved'
        }
    ] as Post[],

    INITIAL_EVENTS: [
        // Silvia
        {
            id: createEventId(),
            title: "Evento 1 de Silvia",
            start: new Date(y, m, d + 1, 10),
            end: new Date(y, m, d + 1, 11),
            allDay: true,
            color: "#635BFF",
            person: "Silvia",
        },
        {
            id: createEventId(),
            title: "Evento 2 de Silvia",
            start: new Date(y, m, d + 2, 13),
            end: new Date(y, m, d + 2, 14),
            allDay: true,
            color: "#8e24aa",
            person: "Silvia",
        },
        {
            id: createEventId(),
            title: "Evento 3 de Silvia",
            start: new Date(y, m, d + 3, 9),
            end: new Date(y, m, d + 3, 10),
            allDay: true,
            color: "#5e35b1",
            person: "Silvia",
        },

        // Luis
        {
            id: createEventId(),
            title: "Evento 1 de Luis",
            start: new Date(y, m, d + 1, 14),
            end: new Date(y, m, d + 1, 15),
            allDay: true,
            color: "#13DEB9",
            person: "Luis",
        },
        {
            id: createEventId(),
            title: "Evento 2 de Luis",
            start: new Date(y, m, d + 3, 11),
            end: new Date(y, m, d + 3, 12),
            allDay: true,
            color: "#00bcd4",
            person: "Luis",
        },
        {
            id: createEventId(),
            title: "Evento 3 de Luis",
            start: new Date(y, m, d + 4, 16),
            end: new Date(y, m, d + 4, 17),
            allDay: true,
            color: "#4caf50",
            person: "Luis",
        },

        // Mónica
        {
            id: createEventId(),
            title: "Evento 1 de Mónica",
            start: new Date(y, m, d + 2, 8),
            end: new Date(y, m, d + 2, 9),
            allDay: true,
            color: "#1a97f5",
            person: "Mónica",
        },
        {
            id: createEventId(),
            title: "Evento 2 de Mónica",
            start: new Date(y, m, d + 4, 12),
            end: new Date(y, m, d + 4, 13),
            allDay: true,
            color: "#f44336",
            person: "Mónica",
        },
        {
            id: createEventId(),
            title: "Evento 3 de Mónica",
            start: new Date(y, m, d + 5, 15),
            end: new Date(y, m, d + 5, 16),
            allDay: true,
            color: "#ff9800",
            person: "Mónica",
        },

        // Carlos
        {
            id: createEventId(),
            title: "Evento 1 de Carlos",
            start: new Date(y, m, d + 1, 9),
            end: new Date(y, m, d + 1, 10),
            allDay: true,
            color: "#9c27b0",
            person: "Carlos",
        },
        {
            id: createEventId(),
            title: "Evento 2 de Carlos",
            start: new Date(y, m, d + 3, 10),
            end: new Date(y, m, d + 3, 11),
            allDay: true,
            color: "#3f51b5",
            person: "Carlos",
        },
        {
            id: createEventId(),
            title: "Evento 3 de Carlos",
            start: new Date(y, m, d + 5, 14),
            end: new Date(y, m, d + 5, 15),
            allDay: true,
            color: "#00acc1",
            person: "Carlos",
        },

        // Valeria
        {
            id: createEventId(),
            title: "Evento 1 de Valeria",
            start: new Date(y, m, d + 2, 13),
            end: new Date(y, m, d + 2, 14),
            allDay: true,
            color: "#e91e63",
            person: "Valeria",
        },
        {
            id: createEventId(),
            title: "Evento 2 de Valeria",
            start: new Date(y, m, d + 4, 9),
            end: new Date(y, m, d + 4, 10),
            allDay: true,
            color: "#795548",
            person: "Valeria",
        },
        {
            id: createEventId(),
            title: "Evento 3 de Valeria",
            start: new Date(y, m, d + 6, 11),
            end: new Date(y, m, d + 6, 12),
            allDay: true,
            color: "#607d8b",
            person: "Valeria",
        },
        {
            id: createEventId(),
            title: "Onboarding Silvia",
            start: new Date(y, m, d + 1, 9, 0),
            end: new Date(y, m, d + 1, 10, 30),
            color: "#6a1b9a",
            person: "Silvia",
        },

        {
            id: createEventId(),
            title: "Revisión de procesos",
            start: new Date(y, m, d + 2, 14, 0),
            end: new Date(y, m, d + 2, 15, 30),
            color: "#039be5",
            person: "Luis",
        },

        {
            id: createEventId(),
            title: "Jornada completa: Curso de liderazgo",
            start: new Date(y, m, d + 3),
            end: new Date(y, m, d + 4),
            allDay: true,
            color: "#ff7043",
            person: "Carlos",
        },

        {
            id: createEventId(),
            title: "Entrenamiento técnico",
            start: new Date(y, m, d + 5, 13, 0),
            end: new Date(y, m, d + 5, 17, 0),
            color: "#26a69a",
            person: "Mónica",
        },

        {
            id: createEventId(),
            title: "Capacitación: manejo de crisis",
            start: new Date(y, m, d + 6, 10, 0),
            end: new Date(y, m, d + 6, 12, 0),
            color: "#ab47bc",
            person: "Valeria",
        },

        {
            id: createEventId(),
            title: "Día libre",
            start: new Date(y, m, d + 7),
            end: new Date(y, m, d + 8),
            allDay: true,
            color: "#c62828",
            person: "Luis",
        },

        {
            id: createEventId(),
            title: "Reunión con cliente externo",
            start: new Date(y, m, d + 8, 15, 0),
            end: new Date(y, m, d + 8, 16, 30),
            color: "#5c6bc0",
            person: "Silvia",
        },

        {
            id: createEventId(),
            title: "Revisión de KPIs",
            start: new Date(y, m, d + 9, 9, 30),
            end: new Date(y, m, d + 9, 11, 0),
            color: "#00897b",
            person: "Carlos",
        },

        {
            id: createEventId(),
            title: "Auditoría interna",
            start: new Date(y, m, d + 10),
            end: new Date(y, m, d + 11),
            allDay: true,
            color: "#fdd835",
            person: "Mónica",
        },

        {
            id: createEventId(),
            title: "Desayuno con partners",
            start: new Date(y, m, d + 11, 8, 0),
            end: new Date(y, m, d + 11, 9, 30),
            color: "#ef6c00",
            person: "Valeria",
        },

        {
            id: createEventId(),
            title: "Taller de innovación",
            start: new Date(y, m, d + 12, 10, 0),
            end: new Date(y, m, d + 12, 13, 0),
            color: "#43a047",
            person: "Luis",
        },

        {
            id: createEventId(),
            title: "Visita de inspección",
            start: new Date(y, m, d + 13, 14, 0),
            end: new Date(y, m, d + 13, 16, 0),
            color: "#3949ab",
            person: "Carlos",
        },

        {
            id: createEventId(),
            title: "Conferencia internacional",
            start: new Date(y, m, d + 2),
            end: new Date(y, m, d + 5),
            allDay: true,
            color: "#00897b",
            person: "Carlos",
        },

        {
            id: createEventId(),
            title: "Viaje corporativo",
            start: new Date(y, m, d + 6),
            end: new Date(y, m, d + 9),
            allDay: true,
            color: "#f4511e",
            person: "Luis",
        },

        {
            id: createEventId(),
            title: "Entrenamiento intensivo de ventas",
            start: new Date(y, m, d + 3),
            end: new Date(y, m, d + 6),
            allDay: true,
            color: "#6a1b9a",
            person: "Silvia",
        },

        {
            id: createEventId(),
            title: "Taller de liderazgo",
            start: new Date(y, m, d + 10),
            end: new Date(y, m, d + 12),
            allDay: true,
            color: "#43a047",
            person: "Mónica",
        },

        {
            id: createEventId(),
            title: "Jornadas de evaluación",
            start: new Date(y, m, d + 7),
            end: new Date(y, m, d + 10),
            allDay: true,
            color: "#ffb300",
            person: "Valeria",
        },

        {
            id: createEventId(),
            title: "Evento de networking empresarial",
            start: new Date(y, m, d + 14),
            end: new Date(y, m, d + 16),
            allDay: true,
            color: "#1e88e5",
            person: "Silvia",
        },
        {
            id: createEventId(),
            title: "Reunión de equipo semanal",
            start: new Date(y, m, 27, 9, 0),
            end: new Date(y, m, 27, 10, 0),
            color: "#1976d2",
            person: "Silvia",
        },

        {
            id: createEventId(),
            title: "Llamada con cliente internacional",
            start: new Date(y, m, 27, 10, 30),
            end: new Date(y, m, 27, 11, 15),
            color: "#00acc1",
            person: "Luis",
        },

        {
            id: createEventId(),
            title: "Taller de innovación",
            start: new Date(y, m, 27, 13, 0),
            end: new Date(y, m, 27, 15, 0),
            color: "#43a047",
            person: "Mónica",
        },

        {
            id: createEventId(),
            title: "Almuerzo con directivos",
            start: new Date(y, m, 27, 12, 0),
            end: new Date(y, m, 27, 13, 0),
            color: "#fb8c00",
            person: "Carlos",
        },

        {
            id: createEventId(),
            title: "Evaluación de desempeño",
            start: new Date(y, m, 27, 15, 30),
            end: new Date(y, m, 27, 16, 30),
            color: "#8e24aa",
            person: "Valeria",
        },

        {
            id: createEventId(),
            title: "Actividad recreativa",
            start: new Date(y, m, 27, 17, 0),
            end: new Date(y, m, 27, 18, 30),
            color: "#6d4c41",
            person: "Luis",
        },

        {
            id: createEventId(),
            title: "Revisión mensual de métricas",
            start: new Date(y, m, 27, 8, 0),
            end: new Date(y, m, 27, 9, 0),
            color: "#f44336",
            person: "Silvia",
        },

        {
            id: createEventId(),
            title: "Webinar externo",
            start: new Date(y, m, 27, 19, 0),
            end: new Date(y, m, 27, 20, 0),
            color: "#5e35b1",
            person: "Carlos",
        },



    ] as any[],

    classrooms: [
        {
            id: 1,
            name: 'Salón A',
            location: 'Edificio Principal, Piso 1',
            capacity: 20,
            equipment: ['Proyector', 'Pizarra Blanca'],
            isAvailable: true,
            assignedPrograms: [
                { id: 1, name: 'Defensive Driving', price: 120 } as Program,
            ],
        },
        {
            id: 2,
            name: 'Salón B',
            location: 'Edificio Principal, Piso 2',
            capacity: 25,
            equipment: ['Computadoras', 'Pantalla Interactiva'],
            isAvailable: false,
            assignedPrograms: [
                { id: 2, name: 'Teen Driver Program', price: 350 } as Program,
            ],
        },
        {
            id: 3,
            name: 'Salón C',
            location: 'Sede Norte, Piso 3',
            capacity: 15,
            equipment: ['Proyector', 'Sistema de Sonido'],
            isAvailable: true,
            assignedPrograms: [
                { id: 3, name: 'Stick Shift Training', price: 180 } as Program,
            ],
        },
    ] as Classroom[],

}

function createEventId() {
    return String(eventGuid++);
}