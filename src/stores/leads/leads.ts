// src/stores/leads.ts
import { defineStore } from 'pinia'
import type { Program } from '@/stores/programs/programs'
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'

/* export interface Program {
  id: number
  name: string
} */

export interface EmployeeData {
  name: string
  lastName: string
  employeeNumber: string
}

export interface FollowUp {
  date: string
  time: string
  employee: EmployeeData
}

export interface Lead {
  id: number
  name: string
  lastName: string
  source: string
  location: string
  age: number
  programsOffered: Program[]
  programsSold: Program[]
  notes: string
  reminder: string
  phone: string
  phone2?: string
  email: string
  language: string
  otherLanguage?: string
  followUp: FollowUp[]
  assignedTo: EmployeeData[]
  type: string
  notSoldReason: string
  lost: boolean
  convertTo: string
  dealWon: boolean
}


export const useLeadsStore = defineStore('leads', {
  state: () => ({
    leads: [] as Lead[],
  }),
  actions: {
    loadMockData() {
      this.leads = fakeDatabase.leads;
    },
    /**
     * 
     * @param type Tipo de lead ('DEAL', 'LEAD', etc) o 'all' para todos
     * @param lost Estado lost: true, false, o 'all' para todos
     */
    fetchData(type: string | 'all', lost: boolean | 'all') {
      console.log('fetchData called with:', { type, lost });
      this.leads = fakeDatabase.leads.filter((item) => {
        const matchesType = type === 'all' || item.type === type;
        const matchesLost = lost === 'all' || item.lost === lost;

        console.log(`Evaluando item ID: ${item.id} - ${item.name} ${item.lastName}`);
        console.log(`  type: ${item.type} | matchesType: ${matchesType}`);
        console.log(`  lost: ${item.lost} | matchesLost: ${matchesLost}`);

        const accepted = matchesType && matchesLost;
        console.log(`  => ${accepted ? 'ACEPTADO' : 'DESCARTADO'}`);
        return accepted;
      });
      console.log(`Total items filtrados: ${this.leads.length}`);
    }

  }
})
