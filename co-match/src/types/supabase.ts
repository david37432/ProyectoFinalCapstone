export interface Json {
  [key: string]: Json | string | number | boolean | null | Json[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          career: string | null
          experience: string | null
          availability_hours: number | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: string
          career?: string | null
          experience?: string | null
          availability_hours?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          career?: string | null
          experience?: string | null
          availability_hours?: number | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      candidate_profiles: {
        Row: {
          id: string
          user_id: string
          birth_date: string | null
          address: string | null
          city: string | null
          education_level: string | null
          years_experience: number | null
          professional_summary: string | null
          professional_network_url: string | null
          availability_hours_per_week: number | null
          preferred_modality: string | null
          preferred_contract_type: string | null
          expected_salary_range_min: number | null
          expected_salary_range_max: number | null
          is_available_for_pat: boolean | null
          pat_hours_completed: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          birth_date?: string | null
          address?: string | null
          city?: string | null
          education_level?: string | null
          years_experience?: number | null
          professional_summary?: string | null
          professional_network_url?: string | null
          availability_hours_per_week?: number | null
          preferred_modality?: string | null
          preferred_contract_type?: string | null
          expected_salary_range_min?: number | null
          expected_salary_range_max?: number | null
          is_available_for_pat?: boolean | null
          pat_hours_completed?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          birth_date?: string | null
          address?: string | null
          city?: string | null
          education_level?: string | null
          years_experience?: number | null
          professional_summary?: string | null
          professional_network_url?: string | null
          availability_hours_per_week?: number | null
          preferred_modality?: string | null
          preferred_contract_type?: string | null
          expected_salary_range_min?: number | null
          expected_salary_range_max?: number | null
          is_available_for_pat?: boolean | null
          pat_hours_completed?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      candidate_skills: {
        Row: {
          id: string
          candidate_profile_id: string
          skill_id: string
          proficiency_level: string
          years_experience: number
          created_at: string
        }
        Insert: {
          id?: string
          candidate_profile_id: string
          skill_id: string
          proficiency_level: string
          years_experience?: number
          created_at?: string
        }
        Update: {
          id?: string
          candidate_profile_id?: string
          skill_id?: string
          proficiency_level?: string
          years_experience?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_skills_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      work_experience: {
        Row: {
          id: string
          candidate_profile_id: string
          company_name: string
          position: string
          start_date: string
          end_date: string | null
          is_current: boolean
          description: string
          location: string | null
          modality: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_profile_id: string
          company_name: string
          position: string
          start_date: string
          end_date?: string | null
          is_current?: boolean
          description?: string
          location?: string | null
          modality?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_profile_id?: string
          company_name?: string
          position?: string
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          description?: string
          location?: string | null
          modality?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experience_candidate_profile_id_fkey"
            columns: ["candidate_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string | null
          description: string | null
          is_technical: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          description?: string | null
          is_technical?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          description?: string | null
          is_technical?: boolean
          created_at?: string
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          id: string
          title: string
          description: string
          requirements: string | null
          responsibilities: string | null
          contract_type: string
          modality: string
          location: string | null
          salary_range_min: number | null
          salary_range_max: number | null
          pat_hours_per_week: number | null
          department_id: string
          created_by: string
          available_slots: number
          filled_slots: number
          status: string
          publication_date: string | null
          closing_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          requirements?: string | null
          responsibilities?: string | null
          contract_type: string
          modality: string
          location?: string | null
          salary_range_min?: number | null
          salary_range_max?: number | null
          pat_hours_per_week?: number | null
          department_id: string
          created_by: string
          available_slots?: number
          filled_slots?: number
          status?: string
          publication_date?: string | null
          closing_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          requirements?: string | null
          responsibilities?: string | null
          contract_type?: string
          modality?: string
          location?: string | null
          salary_range_min?: number | null
          salary_range_max?: number | null
          pat_hours_per_week?: number | null
          department_id?: string
          created_by?: string
          available_slots?: number
          filled_slots?: number
          status?: string
          publication_date?: string | null
          closing_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      vacancy_skills: {
        Row: {
          id: string
          vacancy_id: string
          skill_id: string
          is_required: boolean
          weight: number
          created_at: string
        }
        Insert: {
          id?: string
          vacancy_id: string
          skill_id: string
          is_required?: boolean
          weight?: number
          created_at?: string
        }
        Update: {
          id?: string
          vacancy_id?: string
          skill_id?: string
          is_required?: boolean
          weight?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancy_skills_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancy_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      applications: {
        Row: {
          id: string
          vacancy_id: string
          candidate_id: string
          status: string
          match_score: number
          cover_letter: string | null
          applied_at: string
          updated_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          vacancy_id: string
          candidate_id: string
          status?: string
          match_score?: number
          cover_letter?: string | null
          applied_at?: string
          updated_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          vacancy_id?: string
          candidate_id?: string
          status?: string
          match_score?: number
          cover_letter?: string | null
          applied_at?: string
          updated_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          document_number: string | null
          role_id: string
          department_id: string | null
          is_active: boolean
          is_two_factor_enabled: boolean
          is_profile_complete: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          document_number?: string | null
          role_id: string
          department_id?: string | null
          is_active?: boolean
          is_two_factor_enabled?: boolean
          is_profile_complete?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          document_number?: string | null
          role_id?: string
          department_id?: string | null
          is_active?: boolean
          is_two_factor_enabled?: boolean
          is_profile_complete?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']